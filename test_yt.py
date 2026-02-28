import os
import traceback
import imageio_ffmpeg
os.environ["PATH"] += os.pathsep + os.path.dirname(imageio_ffmpeg.get_ffmpeg_exe())

def download_youtube_video(url: str, res: str = "720p", out_dir: str = ".") -> str:
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
    
    ydl_opts = {
        'format': format_str,
        'outtmpl': out_tmpl,
        'merge_output_format': 'mp4',
        'quiet': False
    }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info_dict = ydl.extract_info(url, download=True)
        filename = ydl.prepare_filename(info_dict)
        if not os.path.exists(filename):
            base, _ = os.path.splitext(filename)
            if os.path.exists(base + '.mp4'):
                filename = base + '.mp4'
            elif os.path.exists(base + '.mkv'):
                filename = base + '.mkv'
            elif os.path.exists(base + '.webm'):
                filename = base + '.webm'
        return filename

if __name__ == "__main__":
    try:
        f = download_youtube_video("https://www.youtube.com/watch?v=ShWikZ_Kbnk", "720p", "test_out")
        print("Success:", f)
    except Exception as e:
        print("Error:")
        traceback.print_exc()
