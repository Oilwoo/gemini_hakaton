import { useState, useRef, useEffect, useCallback } from 'react';

export default function VideoComparison({ originalVideoPath, resultVideoUrl, jsonUrl, startS = 0 }) {
  const originalRef = useRef(null);
  const resultRef = useRef(null);
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [trackingData, setTrackingData] = useState(null);

  useEffect(() => {
    if (!jsonUrl) return;
    fetch(jsonUrl)
      .then(r => r.json())
      .then(data => setTrackingData(data))
      .catch(() => {});
  }, [jsonUrl]);

  const syncVideos = useCallback(() => {
    const orig = originalRef.current;
    const res = resultRef.current;
    if (!res) return;

    setCurrentTime(res.currentTime);

    if (orig && !res.paused) {
      const targetOrigTime = res.currentTime + startS;
      if (Math.abs(orig.currentTime - targetOrigTime) > 0.3) {
        orig.currentTime = targetOrigTime;
      }
    }
  }, [startS]);

  const drawOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    const video = originalRef.current;
    if (!canvas || !video || !trackingData) {
      animRef.current = requestAnimationFrame(drawOverlay);
      return;
    }

    const ctx = canvas.getContext('2d');
    const rect = video.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const frames = trackingData.frames || trackingData.tracking_data || trackingData;
    if (!Array.isArray(frames) || frames.length === 0) {
      animRef.current = requestAnimationFrame(drawOverlay);
      return;
    }

    const time = video.currentTime;
    let box = null;

    if (frames[0]?.time !== undefined) {
      let closest = frames[0];
      let minDist = Infinity;
      for (const f of frames) {
        const d = Math.abs(f.time - time);
        if (d < minDist) { minDist = d; closest = f; }
      }
      box = closest.box || closest.bbox || closest;
    } else if (trackingData.fps) {
      const idx = Math.min(Math.floor(time * trackingData.fps), frames.length - 1);
      box = frames[Math.max(0, idx)]?.box || frames[Math.max(0, idx)]?.bbox || frames[Math.max(0, idx)];
    }

    if (box) {
      const vw = video.videoWidth || 1;
      const vh = video.videoHeight || 1;
      const scaleX = canvas.width / vw;
      const scaleY = canvas.height / vh;

      let x, y, w, h;
      if (box.x1 !== undefined) {
        x = (box.x1 / 1000) * vw * scaleX;
        y = (box.y1 / 1000) * vh * scaleY;
        w = ((box.x2 - box.x1) / 1000) * vw * scaleX;
        h = ((box.y2 - box.y1) / 1000) * vh * scaleY;
      } else if (box.cx !== undefined) {
        const bw = (box.w / 1000) * vw * scaleX;
        const bh = (box.h / 1000) * vh * scaleY;
        x = (box.cx / 1000) * vw * scaleX - bw / 2;
        y = (box.cy / 1000) * vh * scaleY - bh / 2;
        w = bw; h = bh;
      } else if (box.crop_x !== undefined) {
        x = box.crop_x * scaleX;
        y = box.crop_y * scaleY;
        w = box.crop_w * scaleX;
        h = box.crop_h * scaleY;
      } else {
        animRef.current = requestAnimationFrame(drawOverlay);
        return;
      }

      ctx.save();

      /* Dim area outside crop */
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.clearRect(x, y, w, h);

      /* Crop border */
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.5;
      ctx.shadowColor = 'rgba(6, 182, 212, 0.6)';
      ctx.shadowBlur = 12;
      ctx.strokeRect(x, y, w, h);

      /* Corner accents */
      const cornerLen = Math.min(w, h) * 0.12;
      ctx.shadowBlur = 0;
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#8b5cf6';
      const corners = [
        [x, y, 1, 1], [x + w, y, -1, 1],
        [x, y + h, 1, -1], [x + w, y + h, -1, -1],
      ];
      corners.forEach(([cx, cy, dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(cx + cornerLen * dx, cy);
        ctx.lineTo(cx, cy);
        ctx.lineTo(cx, cy + cornerLen * dy);
        ctx.stroke();
      });

      /* Label */
      ctx.fillStyle = 'rgba(139, 92, 246, 0.85)';
      const labelH = 22;
      const labelW = 80;
      ctx.fillRect(x, y - labelH - 4, labelW, labelH);
      ctx.fillStyle = '#fff';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText('Zoom Target', x + 6, y - 10);

      ctx.restore();
    }

    animRef.current = requestAnimationFrame(drawOverlay);
  }, [trackingData]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(drawOverlay);
    return () => cancelAnimationFrame(animRef.current);
  }, [drawOverlay]);

  const togglePlay = useCallback(() => {
    const orig = originalRef.current;
    const res = resultRef.current;
    if (!res) return;
    if (playing) {
      orig?.pause();
      res.pause();
      setPlaying(false);
    } else {
      if (res.ended) {
        res.currentTime = 0;
        if (orig) orig.currentTime = startS;
      } else if (orig) {
        orig.currentTime = res.currentTime + startS;
      }
      if (orig) orig.play().catch(() => {});
      res.play().catch(() => {});
      setPlaying(true);
    }
  }, [playing, startS]);

  const skip = useCallback((delta) => {
    const orig = originalRef.current;
    const res = resultRef.current;
    if (res) {
      res.currentTime = Math.max(0, Math.min(res.currentTime + delta, res.duration || 0));
      if (orig) orig.currentTime = res.currentTime + startS;
      setCurrentTime(res.currentTime);
    }
  }, [startS]);

  const handleSeek = useCallback((e) => {
    const val = Number(e.target.value);
    const res = resultRef.current;
    const orig = originalRef.current;
    if (res) {
      res.currentTime = val;
      if (orig) orig.currentTime = val + startS;
      setCurrentTime(val);
    }
  }, [startS]);

  const handleResultLoaded = useCallback(() => {
    const res = resultRef.current;
    if (res) {
      setDuration(res.duration);
      const orig = originalRef.current;
      if (orig) orig.currentTime = startS;
    }
  }, [startS]);

  const handleResultEnded = useCallback(() => {
    const orig = originalRef.current;
    if (orig) orig.pause();
    setPlaying(false);
  }, []);

  useEffect(() => {
    const interval = setInterval(syncVideos, 80);
    return () => clearInterval(interval);
  }, [syncVideos]);

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const API_BASE = window.location.origin;
  const originalSrc = originalVideoPath
    ? `${API_BASE}/api/video?video_path=${encodeURIComponent(originalVideoPath)}`
    : '';
  const showOriginal = !!originalVideoPath;

  return (
    <div className="vc">
      <div className="vc__videos">
        {showOriginal && (
          <div className="vc__panel">
            <div className="vc__label">Original Video</div>
            <div className="vc__video-wrapper">
              <video
                ref={originalRef}
                src={originalSrc}
                muted
                playsInline
                preload="auto"
                style={{ width: '100%', display: 'block', borderRadius: 'var(--radius-md)' }}
              />
              <canvas ref={canvasRef} className="vc__canvas" />
            </div>
          </div>
        )}
        <div className="vc__panel vc__panel--result">
          <div className="vc__label gradient-text">AI Follow Cam</div>
          <div className="vc__video-wrapper">
            <video
              ref={resultRef}
              src={resultVideoUrl}
              playsInline
              preload="auto"
              onLoadedMetadata={handleResultLoaded}
              onEnded={handleResultEnded}
              style={{ width: '100%', display: 'block', borderRadius: 'var(--radius-md)' }}
            />
          </div>
        </div>
      </div>

      <div className="vc__controls glass">
        <button className="vc__btn" onClick={() => skip(-5)} title="-5s">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 19 2 12 11 5 11 19"/><polygon points="22 19 13 12 22 5 22 19"/>
          </svg>
        </button>
        <button className="vc__btn vc__btn--play" onClick={togglePlay}>
          {playing ? (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>
            </svg>
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          )}
        </button>
        <button className="vc__btn" onClick={() => skip(5)} title="+5s">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="13 19 22 12 13 5 13 19"/><polygon points="2 19 11 12 2 5 2 19"/>
          </svg>
        </button>
        <div className="vc__time">{formatTime(currentTime)} / {formatTime(duration)}</div>
        <input
          type="range"
          className="vc__seek"
          min={0}
          max={duration || 1}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
        />
      </div>

      {resultVideoUrl && (
        <div className="vc__download">
          <a href={resultVideoUrl} download className="btn btn-secondary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
            Download Follow Cam
          </a>
        </div>
      )}

      <style>{`
        .vc {
          margin-bottom: 8px;
        }
        .vc__videos {
          display: grid;
          grid-template-columns: ${showOriginal ? '1.6fr 1fr' : '1fr'};
          gap: 20px;
          margin-bottom: 16px;
        }
        .vc__panel {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .vc__label {
          font-family: var(--font-display);
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .vc__video-wrapper {
          position: relative;
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 1px solid var(--border-subtle);
          background: #000;
        }
        .vc__canvas {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        .vc__controls {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 20px;
        }
        .vc__btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          color: var(--text-secondary);
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .vc__btn:hover {
          background: rgba(255,255,255,0.08);
          color: var(--text-primary);
        }
        .vc__btn--play {
          width: 48px;
          height: 48px;
          background: var(--gradient-primary);
          color: #fff !important;
          box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
        }
        .vc__btn--play:hover {
          transform: scale(1.08);
          box-shadow: 0 6px 24px rgba(139, 92, 246, 0.4);
        }
        .vc__time {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-variant-numeric: tabular-nums;
          min-width: 90px;
          flex-shrink: 0;
        }
        .vc__seek {
          flex: 1;
          -webkit-appearance: none;
          height: 4px;
          border-radius: 2px;
          background: var(--border-subtle);
          outline: none;
        }
        .vc__seek::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--accent-purple);
          cursor: pointer;
          box-shadow: 0 0 6px rgba(139, 92, 246, 0.4);
        }
        .vc__download {
          display: flex;
          justify-content: center;
          margin-top: 16px;
        }
        @media (max-width: 768px) {
          .vc__videos {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
