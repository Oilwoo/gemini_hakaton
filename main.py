import os
import re
import json
import math
import shutil
import tempfile
import subprocess
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Tuple, Any

import cv2
import numpy as np
import uuid
import io
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# 로컬(또는 서버) 환경의 .env 파일 로드
load_dotenv()

import traceback
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

import imageio_ffmpeg
# ffmpeg가 설치되어있지 않은 환경을 대비해 imageio_ffmpeg의 바이너리를 PATH에 추가합니다.
# 덕분에 로컬 시스템 환경변수 편집 없이도 FFmpeg 병합/편집 기능이 작동합니다.
os.environ["PATH"] += os.pathsep + os.path.dirname(imageio_ffmpeg.get_ffmpeg_exe())

# -----------------------------
# YouTube Downloader
# -----------------------------
def download_youtube_video(url: str, res: str = "720p", out_dir: str = ".", progress=None) -> str:
    if not url.strip():
        return ""
    import yt_dlp
    
    # 해상도 설정
    if res == "1080p":
        format_str = "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best"
    elif res == "720p":
        format_str = "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best"
    else:
        format_str = "best"

    out_tmpl = os.path.join(out_dir, "yt_downloaded_%(id)s.%(ext)s")
    
    def my_hook(d):
        if d['status'] == 'downloading':
            total = d.get('total_bytes') or d.get('total_bytes_estimate', 0)
            downloaded = d.get('downloaded_bytes', 0)
            if total > 0 and progress is not None:
                progress(downloaded / total, desc=f"다운로드 중... {downloaded/1024/1024:.1f}MB / {total/1024/1024:.1f}MB")
        elif d['status'] == 'finished':
            if progress is not None:
                progress(1.0, desc="다운로드 완료! 후처리(병합) 중...")

    ydl_opts = {
        'format': format_str,
        'outtmpl': out_tmpl,
        'merge_output_format': 'mp4',
        'ffmpeg_location': imageio_ffmpeg.get_ffmpeg_exe(),
        'quiet': True,
        'noprogress': True,
        'progress_hooks': [my_hook]
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info_dict = ydl.extract_info(url, download=True)
        filename = ydl.prepare_filename(info_dict)
        # yt-dlp가 mkv 등으로 병합한 뒤 mp4로 변환할 경우를 대비하여 확장자 확인
        if not os.path.exists(filename):
            base, _ = os.path.splitext(filename)
            if os.path.exists(base + '.mp4'):
                filename = base + '.mp4'
            elif os.path.exists(base + '.mkv'):
                filename = base + '.mkv'
            elif os.path.exists(base + '.webm'):
                filename = base + '.webm'
        return filename

# -----------------------------
# MoviePy for Cut Editing
# -----------------------------
try:
    from moviepy.editor import VideoFileClip, concatenate_videoclips
    HAS_MOVIEPY = True
except ImportError:
    HAS_MOVIEPY = False

# -----------------------------
# Models (Structured Output)
# -----------------------------
class TrackFrame(BaseModel):
    t: float = Field(description="Time in seconds for this frame.")
    box_2d: Optional[List[int]] = Field(
        default=None,
        description="Normalized bounding box [ymin,xmin,ymax,xmax] in integers 0..1000, or null.",
    )


class TrackResponse(BaseModel):
    frames: List[TrackFrame]


# -----------------------------
# Utility helpers
# -----------------------------
def _require_env():
    if not os.environ.get("GEMINI_API_KEY"):
        raise RuntimeError("GEMINI_API_KEY 환경 변수가 설정되지 않았습니다. 사용할 환경 공간에 API 키를 등록해주세요.")


def _run(cmd: List[str]) -> None:
    p = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    if p.returncode != 0:
        raise RuntimeError(f"Command failed:\n{' '.join(cmd)}\n\nSTDERR:\n{p.stderr}")


def get_ffmpeg_path() -> str:
    return imageio_ffmpeg.get_ffmpeg_exe()

def _ffmpeg_exists() -> bool:
    return os.path.exists(get_ffmpeg_path())


def clip_video(input_path: str, start_s: float, end_s: float, out_path: str) -> str:
    if not _ffmpeg_exists():
        raise RuntimeError(f"ffmpeg not found at {get_ffmpeg_path()}")
    if end_s <= start_s:
        raise ValueError("end_s must be > start_s")

    cmd = [
        get_ffmpeg_path(), "-y",
        "-ss", str(start_s),
        "-to", str(end_s),
        "-i", input_path,
        "-c:v", "libx264", "-preset", "veryfast", "-crf", "23",
        "-c:a", "aac", "-b:a", "128k",
        out_path
    ]
    _run(cmd)
    return out_path


def extract_frames(input_path: str, fps: float, out_dir: str) -> List[Tuple[float, bytes]]:
    if not _ffmpeg_exists():
        raise RuntimeError("ffmpeg not found.")
    out_pattern = str(Path(out_dir) / "frame_%05d.jpg")
    cmd = [
        get_ffmpeg_path(), "-y",
        "-i", input_path,
        "-vf", f"fps={fps}",
        "-q:v", "2",
        out_pattern
    ]
    _run(cmd)

    frame_files = sorted(Path(out_dir).glob("frame_*.jpg"))
    frames: List[Tuple[float, bytes]] = []
    for idx, fp in enumerate(frame_files):
        t = idx / fps
        frames.append((t, fp.read_bytes()))
    return frames


def _safe_json_from_text(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    m = re.search(r"[\{\[]", text)
    if not m:
        return text
    start = m.start()
    return text[start:]


# -----------------------------
# Gemini tracking with Retry
# -----------------------------
def gemini_track_frames(
    frames: List[Tuple[float, bytes]],
    target_description: str,
    first_click: Optional[Tuple[int, int]] = None,
    image_shape: Optional[Tuple[int, int]] = None,
    model: str = "gemini-3-flash-preview",
    max_retries: int = 2
) -> TrackResponse:
    _require_env()
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

    contents: List[Any] = []
    for (t, img_bytes) in frames:
        contents.append(f"FRAME t={t:.2f}s")
        contents.append(types.Part.from_bytes(data=img_bytes, mime_type="image/jpeg"))

    system_instruction = (
        "You are a precise vision tracking system. "
        "Return ONLY structured JSON that matches the provided schema. "
        "Bounding boxes must be integers in normalized 0..1000 coordinates."
    )

    prompt = f"""Task:
You will receive sequential video frames. Track exactly ONE target (person, animal, vehicle, ball, or any specified object) that matches this description:
- TARGET: {target_description}
"""

    if first_click and image_shape:
        # Give context about click
        cx, cy = first_click
        h, w = image_shape
        nx = int(cx / w * 1000)
        ny = int(cy / h * 1000)
        prompt += f"\n- POINT HINT: In the first frame, the user clicked near normalized coordinate (x: {nx}, y: {ny}) on the 0..1000 scale. Strongly prefer tracking the target located around this area.\n"

    prompt += """
For each frame:
- If the target is visible, return box_2d = [ymin, xmin, ymax, xmax] normalized to 0..1000 (integers).
- If not visible or ambiguous, return box_2d = null.

Important:
- Output must match the schema. No extra keys. No markdown. No commentary.
- Be consistent across time (track the identical target/object across frames).
"""

    schema = TrackResponse.model_json_schema()

    for attempt in range(max_retries):
        try:
            resp = client.models.generate_content(
                model=model,
                contents=contents + [prompt],
                config={
                    "system_instruction": system_instruction,
                    "response_mime_type": "application/json",
                    "response_json_schema": schema,
                },
            )

            raw = _safe_json_from_text(resp.text or "")
            return TrackResponse.model_validate_json(raw)
        except Exception as e:
            if attempt == max_retries - 1:
                try:
                    data = json.loads(raw)
                    return TrackResponse.model_validate(data)
                except:
                    raise e
            # Re-prompt on fail
            prompt += f"\n\nERROR on previous attempt: {str(e)}. Please correct your JSON structure."


# -----------------------------
# Kalman Filter
# -----------------------------
class Kalman1D:
    def __init__(self, init_val, process_noise=1e-3, measurement_noise=1e-1):
        self.kf = cv2.KalmanFilter(2, 1)
        self.kf.transitionMatrix = np.array([[1, 1], [0, 1]], np.float32)
        self.kf.measurementMatrix = np.array([[1, 0]], np.float32)
        self.kf.processNoiseCov = np.eye(2, dtype=np.float32) * process_noise
        self.kf.measurementNoiseCov = np.eye(1, dtype=np.float32) * measurement_noise
        self.kf.statePre = np.array([[init_val], [0]], np.float32)
        self.kf.statePost = np.array([[init_val], [0]], np.float32)

    def update(self, measurement):
        self.kf.predict()
        self.kf.correct(np.array([[np.float32(measurement)]]))
        return float(self.kf.statePost[0, 0])


# -----------------------------
# Crop rendering (CPU)
# -----------------------------
@dataclass
class CropConfig:
    out_w: int = 720
    out_h: int = 1280
    margin: float = 1.5
    smooth_alpha: float = 0.75
    use_kalman: bool = False
    ab_compare: bool = False


def _interp_box(frames: List[TrackFrame], t: float) -> Optional[List[int]]:
    if not frames: return None
    
    # Identify exact segment
    if t < frames[0].t: return frames[0].box_2d
    if t > frames[-1].t: return frames[-1].box_2d
    
    for i in range(len(frames) - 1):
        a = frames[i]
        b = frames[i+1]
        if a.t <= t <= b.t:
             # 타겟이 일시적으로 사라진 구간 (null)
             # 보간하지 않고, 바로 `None`을 리턴하여 렌더러가 "놓침(Missing)" 상태로 인지하게 합니다.
             if a.box_2d is None or b.box_2d is None:
                 return None
             
             if b.t == a.t: return a.box_2d
             r = (t - a.t) / (b.t - a.t)
             return [int(round((1 - r) * a.box_2d[j] + r * b.box_2d[j])) for j in range(4)]
    return None


def render_fancam(
    input_path: str,
    track: TrackResponse,
    out_path_noaudio: str,
    cfg: CropConfig,
) -> str:
    cap = cv2.VideoCapture(input_path)
    if not cap.isOpened():
        raise RuntimeError("Cannot open video for rendering.")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    in_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    in_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    # Support AB Compare (Double width)
    actual_out_w = cfg.out_w * 2 if cfg.ab_compare else cfg.out_w

    writer = cv2.VideoWriter(
        out_path_noaudio,
        cv2.VideoWriter_fourcc(*"mp4v"),
        fps,
        (actual_out_w, cfg.out_h),
    )

    ema_cx, ema_cy, ema_cw, ema_ch = None, None, None, None
    k_cx, k_cy, k_cw, k_ch = None, None, None, None
    
    target_aspect = cfg.out_w / cfg.out_h
    idx = 0
    
    while True:
        ok, frame = cap.read()
        if not ok: break
        t = idx / fps

        box = _interp_box(track.frames, t)

        if box is None:
            # 인물이 프레임에서 벗어났거나 가려져서 Gemini가 null을 반환한 경우 (Missing)
            # 기본 동작: 점진적으로 원본 전체 화면을 잡도록(Center Crop) 목표 좌표를 설정합니다.
            # (EMA나 Kalman 필터를 거쳐 부드럽게 줌아웃 됩니다)
            cx, cy = in_w / 2, in_h / 2
            ch = in_h
            cw = ch * target_aspect
            if cw > in_w:
                cw = in_w
                ch = cw / target_aspect
        else:
            ymin, xmin, ymax, xmax = [max(0, min(1000, v)) for v in box]
            y1, x1 = int(ymin / 1000 * in_h), int(xmin / 1000 * in_w)
            y2, x2 = int(ymax / 1000 * in_h), int(xmax / 1000 * in_w)

            if x2 <= x1 or y2 <= y1:
                cx, cy = in_w / 2, in_h / 2
                ch = in_h; cw = ch * target_aspect
            else:
                bx, by = (x1 + x2) / 2, (y1 + y2) / 2
                bw, bh = (x2 - x1) * cfg.margin, (y2 - y1) * cfg.margin
                ch = max(bh, bw / target_aspect)
                cw = ch * target_aspect
                cx, cy = bx, by

        # Smoothing & Constraints
        if cfg.use_kalman:
            if k_cx is None:
                k_cx = Kalman1D(cx)
                k_cy = Kalman1D(cy)
                k_cw = Kalman1D(cw)
                k_ch = Kalman1D(ch)
            else:
                # Limit zoom speed
                max_zoom = in_w * 0.05
                cw = np.clip(cw, k_cw.kf.statePost[0, 0] - max_zoom, k_cw.kf.statePost[0, 0] + max_zoom)
                ch = np.clip(ch, k_ch.kf.statePost[0, 0] - max_zoom, k_ch.kf.statePost[0, 0] + max_zoom)
                
            cx = k_cx.update(cx)
            cy = k_cy.update(cy)
            cw = k_cw.update(cw)
            ch = k_ch.update(ch)
        else:
            if ema_cx is None:
                ema_cx, ema_cy, ema_cw, ema_ch = cx, cy, cw, ch
            else:
                 # Zoom limit even for EMA
                max_zoom = in_w * 0.05
                cw = np.clip(cw, ema_cw - max_zoom, ema_cw + max_zoom)
                ch = np.clip(ch, ema_ch - max_zoom, ema_ch + max_zoom)

                a = cfg.smooth_alpha
                ema_cx = a * ema_cx + (1 - a) * cx
                ema_cy = a * ema_cy + (1 - a) * cy
                ema_cw = a * ema_cw + (1 - a) * cw
                ema_ch = a * ema_ch + (1 - a) * ch
                cx, cy, cw, ch = ema_cx, ema_cy, ema_cw, ema_ch

        # Validate bounds
        cw = max(32.0, min(float(in_w), float(cw)))
        ch = max(32.0, min(float(in_h), float(ch)))

        left = int(round(cx - cw / 2))
        top = int(round(cy - ch / 2))
        left = max(0, min(in_w - int(round(cw)), left))
        top = max(0, min(in_h - int(round(ch)), top))
        right, bottom = left + int(round(cw)), top + int(round(ch))

        crop = frame[top:bottom, left:right]
        if crop.size == 0: crop = frame
        fancam_frame = cv2.resize(crop, (cfg.out_w, cfg.out_h), interpolation=cv2.INTER_AREA)

        # Assemble Out Frame
        if cfg.ab_compare:
            # Draw box on original frame for clarity
            orig_annotated = frame.copy()
            if box is not None:
                cv2.rectangle(orig_annotated, (left, top), (right, bottom), (0, 0, 255), 3)
            # Create letterbox/padded square or just resize
            orig_resized = cv2.resize(orig_annotated, (cfg.out_w, cfg.out_h), interpolation=cv2.INTER_AREA)
            final_frame = np.hstack((orig_resized, fancam_frame))
        else:
            final_frame = fancam_frame

        writer.write(final_frame)
        idx += 1

    cap.release()
    writer.release()
    return out_path_noaudio


def mux_audio(original_with_audio: str, video_noaudio: str, out_path: str) -> str:
    if not _ffmpeg_exists():
        shutil.copy(video_noaudio, out_path)
        return out_path

    cmd = [
        get_ffmpeg_path(), "-y",
        "-i", video_noaudio,
        "-i", original_with_audio,
        "-map", "0:v:0",
        "-map", "1:a:0?",
        "-c:v", "libx264",      # 브라우저 재생을 위한 H.264 인코딩
        "-preset", "veryfast",  # 빠른 렌더링
        "-pix_fmt", "yuv420p",  # 필수: Chrome/Safari 등에서 색상 깨짐 및 블랙 스크린 방지
        "-c:a", "aac",
        "-shortest",
        out_path
    ]
    _run(cmd)
    return out_path


def apply_cut_editing(full_video: str, track: TrackResponse, out_path: str):
    """Uses MoviePy to concatenate valid tracking segments."""
    if not HAS_MOVIEPY:
         shutil.copy(full_video, out_path)
         return out_path

    clip = VideoFileClip(full_video)
    fps = clip.fps
    valid_mask = []
    frames_count = int(clip.duration * fps)

    for i in range(frames_count):
        t = i / fps
        box = _interp_box(track.frames, t)
        valid_mask.append(box is not None)

    segments = []
    start = None
    for i, v in enumerate(valid_mask):
        if v and start is None:
            start = i
        elif not v and start is not None:
            # Drop very short segments
            if (i - start) > 5:
                segments.append((start/fps, i/fps))
            start = None
    if start is not None and (len(valid_mask) - start) > 5:
        segments.append((start/fps, clip.duration))

    if not segments:
        # Revert to full video if target never found properly
        shutil.copy(full_video, out_path)
        return out_path

    subclips = [clip.subclip(s, e) for s, e in segments]
    final_clip = concatenate_videoclips(subclips)
    final_clip.write_videofile(out_path, logger=None, audio_codec="aac")
    clip.close()
    return out_path

# -----------------------------
# Main pipeline
# -----------------------------
def make_fancam(
    video_path: str,
    target_description: str,
    click_coords: Optional[Tuple[int, int]] = None,
    image_shape: Optional[Tuple[int, int]] = None,
    start_s: float = 0.0,
    end_s: float = 15.0,
    sample_fps: float = 1.0,
    out_ratio: str = "9:16",
    margin: float = 1.5,
    smooth_alpha: float = 0.75,
    use_kalman: bool = False,
    ab_compare: bool = False,
    auto_cut: bool = False,
    model: str = "gemini-3-flash-preview",
    progress=None
) -> Tuple[str, dict]:

    if out_ratio == "9:16": out_w, out_h = 720, 1280
    elif out_ratio == "16:9": out_w, out_h = 1280, 720
    elif out_ratio == "1:1": out_w, out_h = 1080, 1080

    with tempfile.TemporaryDirectory() as td:
        td = Path(td)
        clip_path = str(td / "clip.mp4")
        frames_dir = str(td / "frames")
        Path(frames_dir).mkdir(parents=True, exist_ok=True)

        if progress: progress(0.0, desc="1/5: 원본 영상 구간 자르기 중...")
        clip_video(video_path, start_s, end_s, clip_path)
        
        if progress: progress(0.1, desc="2/5: 영상 프레임 추출 중...")
        frames = extract_frames(clip_path, fps=sample_fps, out_dir=frames_dir)

        if progress: progress(0.3, desc="3/5: Gemini AI 공간/인물 추론 중 (약 10~30초 소요)...")
        track = gemini_track_frames(
            frames, 
            target_description=target_description,
            first_click=click_coords,
            image_shape=image_shape,
            model=model
        )

        noaudio_path = str(td / "out_noaudio.mp4")
        final_path = str(td / "out_final.mp4")
        cut_path = str(td / "out_cut.mp4")

        cfg = CropConfig(
            out_w=out_w, out_h=out_h, margin=margin, 
            smooth_alpha=smooth_alpha, use_kalman=use_kalman, ab_compare=ab_compare
        )
        
        if progress: progress(0.8, desc="4/5: 자연스러운 직캠 카메라 워킹 렌더링 중...")
        render_fancam(clip_path, track, noaudio_path, cfg)
        
        if progress: progress(0.9, desc="5/5: 오디오 병합 중...")
        mux_audio(clip_path, noaudio_path, final_path)

        # Apply Cut Editing
        if auto_cut and HAS_MOVIEPY:
            if progress: progress(0.95, desc="컷 편집(안보이는 구간 삭제) 진행 중...")
            apply_cut_editing(final_path, track, cut_path)
            export_path = cut_path
        else:
            export_path = final_path

        if progress: progress(0.98, desc="결과물 저장 중...")

        # 프로젝트 로컬 폴더 대신, OS의 임시 폴더(System Temp)를 사용하여 
        # 직캠 결과물이 프로젝트 디렉토리에 끝없이 쌓이지 않도록 방지합니다.
        out_store = Path(tempfile.gettempdir()) / "gemini_fancam_outputs"
        out_store.mkdir(exist_ok=True)
        out_file = out_store / f"fancam_{next(tempfile._get_candidate_names())}.mp4"
        shutil.copy(export_path, out_file)

    return str(out_file), track.model_dump()


# -----------------------------
# FastAPI (REST API for Frontend)
# -----------------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 폴더 설정
api_temp_dir = Path(tempfile.gettempdir()) / "gemini_fancam_api"
api_temp_dir.mkdir(exist_ok=True)
UPLOADS_DIR = api_temp_dir / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)
OUTPUTS_DIR = api_temp_dir / "outputs"
OUTPUTS_DIR.mkdir(exist_ok=True)

# 프론트엔드 폴더 (현재 파일 기준으로 동적 탐색, Mac 호환)
BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR / "frontend"
FRONTEND_DIR.mkdir(parents=True, exist_ok=True)

# 정적 파일 서빙
app.mount("/outputs", StaticFiles(directory=str(OUTPUTS_DIR)), name="outputs")

class YtRequest(BaseModel):
    url: str
    res: str = "720p"

class GenerateRequest(BaseModel):
    video_path: str
    target_description: str = ""
    start_s: float = 0.0
    end_s: float = 15.0
    click_x: Optional[int] = None
    click_y: Optional[int] = None
    image_w: Optional[int] = None
    image_h: Optional[int] = None
    sample_fps: float = 1.0
    out_ratio: str = "9:16"
    margin: float = 1.5
    smooth_alpha: float = 0.75
    use_kalman: bool = False
    ab_compare: bool = False
    auto_cut: bool = False
    model: str = "gemini-3-flash-preview"

@app.post("/api/upload")
async def api_upload(file: UploadFile = File(...)):
    ext = Path(file.filename).suffix
    out_path = UPLOADS_DIR / f"upload_{uuid.uuid4().hex}{ext}"
    with open(out_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return {"video_path": str(out_path)}

@app.post("/api/youtube")
async def api_youtube(req: YtRequest):
    try:
        out_path = download_youtube_video(req.url, req.res, str(UPLOADS_DIR))
        return {"video_path": out_path}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/frame")
async def api_frame(video_path: str, time: float = 0.0):
    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video not found.")
    
    cap = cv2.VideoCapture(video_path)
    cap.set(cv2.CAP_PROP_POS_MSEC, time * 1000)
    ret, frame = cap.read()
    cap.release()
    
    if not ret:
        raise HTTPException(status_code=400, detail="Cannot extract frame.")
        
    _, buffer = cv2.imencode('.jpg', frame)
    return StreamingResponse(io.BytesIO(buffer), media_type="image/jpeg")

@app.get("/api/video_info")
async def api_video_info(video_path: str):
    if not os.path.exists(video_path):
        raise HTTPException(status_code=404, detail="Video not found.")
        
    cap = cv2.VideoCapture(video_path)
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frames = cap.get(cv2.CAP_PROP_FRAME_COUNT)
    duration = frames / fps if fps > 0 else 0
    cap.release()
    
    return {"duration": duration, "fps": fps}

@app.post("/api/generate")
async def api_generate(req: GenerateRequest):
    try:
        click_coords = (req.click_x, req.click_y) if req.click_x is not None and req.click_y is not None else None
        image_shape = (req.image_h, req.image_w) if req.image_w is not None and req.image_h is not None else None
        
        td = req.target_description
        if not td:
             td = "The person clearly marked by the user click coordinate" if click_coords else "A main character"

        out_path, track_json = make_fancam(
            video_path=req.video_path,
            target_description=td,
            click_coords=click_coords,
            image_shape=image_shape,
            start_s=req.start_s,
            end_s=req.end_s,
            sample_fps=req.sample_fps,
            out_ratio=req.out_ratio,
            margin=req.margin,
            smooth_alpha=req.smooth_alpha,
            use_kalman=req.use_kalman,
            ab_compare=req.ab_compare,
            auto_cut=req.auto_cut,
            model=req.model
        )
        
        # 결과를 outputs 폴더로 이동하여 브라우저에서 접근 가능하게 처리
        new_out_path = OUTPUTS_DIR / Path(out_path).name
        shutil.copy(out_path, new_out_path)
        
        json_path = OUTPUTS_DIR / f"{Path(new_out_path).stem}.json"
        with open(json_path, "w") as f:
            json.dump(track_json, f)
            
        return {
            "video_url": f"/outputs/{new_out_path.name}",
            "json_url": f"/outputs/{json_path.name}"
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# 루트 경로 접속 시 index.html 서빙
@app.get("/")
def read_index():
    index_path = FRONTEND_DIR / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    return HTMLResponse("<h1>API is running. Welcome!</h1><p>index.html was not found in frontend directory.</p>")

# 기타 프론트엔드 정적 파일 서빙
app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
