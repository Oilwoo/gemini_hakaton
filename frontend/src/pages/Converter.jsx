import { useState, useRef, useCallback, useEffect } from "react"
import VideoComparison from "../components/VideoComparison"
import {
  uploadVideo,
  downloadYoutube,
  getFrameUrl,
  getVideoInfo,
  generateFancam,
  getOutputUrl,
  recommendShortsMeta,
  uploadToYouTube,
} from "../utils/api"

const TOTAL_STEPS = 4

/* ─── Tiny icons ─── */
const ArrowRight = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
)
const ArrowLeft = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 12H5M12 19l-7-7 7-7" />
  </svg>
)
const UploadIcon = () => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)
const YoutubeIcon = () => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="2" y="4" width="20" height="16" rx="4" />
    <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
  </svg>
)
const CheckCircle = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

export default function Converter() {
  const [step, setStep] = useState(0)

  /* ── Step 0: Video source ── */
  const [sourceMode, setSourceMode] = useState(null) // 'upload' | 'youtube'
  const [videoPath, setVideoPath] = useState("")
  const [videoInfo, setVideoInfo] = useState(null)
  const [loading, setLoading] = useState(false)
  const [loadMsg, setLoadMsg] = useState("")
  const fileRef = useRef(null)
  const [ytUrl, setYtUrl] = useState("")

  /* ── Step 1: Target selection ── */
  const [frameUrl, setFrameUrl] = useState("")
  const [startS, setStartS] = useState(0)
  const [endS, setEndS] = useState(15)
  const [clickCoords, setClickCoords] = useState(null)
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 })
  const imgRef = useRef(null)

  /* ── Step 2: Options ── */
  const [targetDesc, setTargetDesc] = useState("")
  const [outRatio, setOutRatio] = useState("9:16")
  const [margin, setMargin] = useState(1.5)

  /* ── Step 3 → Result ── */
  const [generating, setGenerating] = useState(false)
  const [genMsg, setGenMsg] = useState("")
  const [result, setResult] = useState(null)
  const [error, setError] = useState("")

  /* ── Shorts ── */
  const [shortsTitle, setShortsTitle] = useState("")
  const [shortsDesc, setShortsDesc] = useState("")
  const [shortsPrivacy, setShortsPrivacy] = useState("public")
  const [recommending, setRecommending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState(null)

  /* ─────── Handlers ─────── */
  const handleUpload = useCallback(async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    setLoading(true)
    setLoadMsg("Uploading video...")
    try {
      const data = await uploadVideo(file)
      setVideoPath(data.video_path)
      const info = await getVideoInfo(data.video_path)
      setVideoInfo(info)
      setEndS(Math.min(15, Math.floor(info.duration)))
      setFrameUrl(getFrameUrl(data.video_path, 0))
      setStep(1)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
    setLoadMsg("")
  }, [])

  const handleYoutube = useCallback(async () => {
    if (!ytUrl.trim()) return
    setLoading(true)
    setLoadMsg("Downloading YouTube video... (may take 1–3 minutes)")
    try {
      const data = await downloadYoutube(ytUrl.trim())
      setVideoPath(data.video_path)
      const info = await getVideoInfo(data.video_path)
      setVideoInfo(info)
      setEndS(Math.min(15, Math.floor(info.duration)))
      setFrameUrl(getFrameUrl(data.video_path, 0))
      setStep(1)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
    setLoadMsg("")
  }, [ytUrl])

  const handleFrameClick = useCallback((e) => {
    const rect = e.target.getBoundingClientRect()
    const scaleX = e.target.naturalWidth / rect.width
    const scaleY = e.target.naturalHeight / rect.height
    const x = Math.round((e.clientX - rect.left) * scaleX)
    const y = Math.round((e.clientY - rect.top) * scaleY)
    setClickCoords({
      x,
      y,
      displayX: e.clientX - rect.left,
      displayY: e.clientY - rect.top,
    })
    setImgNatural({ w: e.target.naturalWidth, h: e.target.naturalHeight })
  }, [])

  useEffect(() => {
    if (videoPath && step === 1) {
      setFrameUrl(getFrameUrl(videoPath, startS))
    }
  }, [startS, videoPath, step])

  const handleGenerate = useCallback(async () => {
    setGenerating(true)
    setGenMsg("AI is analyzing the video...")
    setError("")
    try {
      const payload = {
        video_path: videoPath,
        target_description: targetDesc,
        start_s: startS,
        end_s: endS,
        click_x: clickCoords?.x ?? null,
        click_y: clickCoords?.y ?? null,
        image_w: imgNatural.w || null,
        image_h: imgNatural.h || null,
        out_ratio: outRatio,
        margin,
      }
      setGenMsg("Gemini AI is tracking the target...")
      const data = await generateFancam(payload)
      setResult(data)
      setStep(3)
    } catch (e) {
      setError(e.message)
    }
    setGenerating(false)
    setGenMsg("")
  }, [
    videoPath,
    targetDesc,
    startS,
    endS,
    clickCoords,
    imgNatural,
    outRatio,
    margin,
  ])

  const handleRecommend = useCallback(async () => {
    setRecommending(true)
    setError("")
    try {
      const desc = targetDesc || "Fan cam target"
      const data = await recommendShortsMeta(desc)
      setShortsTitle(data.title || "")
      setShortsDesc(data.description || "")
    } catch (e) {
      setError(e.message)
    }
    setRecommending(false)
  }, [targetDesc])

  const handleShortsUpload = useCallback(async () => {
    if (!result?.video_url) return
    setUploading(true)
    setError("")
    try {
      const videoFileName = result.video_url.replace(/^\/outputs\//, "")
      const data = await uploadToYouTube({
        videoPath: videoFileName,
        title: shortsTitle || "Gemini Fancam Shorts",
        description: shortsDesc || "Generated by Gemini AI #Shorts",
        privacy: shortsPrivacy,
      })
      setUploadResult(data)
    } catch (e) {
      setError(e.message)
    }
    setUploading(false)
  }, [result, shortsTitle, shortsDesc, shortsPrivacy])

  const resetAll = () => {
    setStep(0)
    setSourceMode(null)
    setVideoPath("")
    setVideoInfo(null)
    setFrameUrl("")
    setStartS(0)
    setEndS(15)
    setShortsTitle("")
    setShortsDesc("")
    setShortsPrivacy("public")
    setRecommending(false)
    setUploading(false)
    setUploadResult(null)
    setOutRatio("9:16")
    setMargin(1.5)
    setResult(null)
    setError("")
    setShortsTitle("")
    setShortsDesc("")
  }

  /* ─────── Render steps ─────── */
  const renderStep0 = () => (
    <div className="conv-step fade-in">
      <div className="conv-step__header">
        <h2 className="conv-step__title">Select a Video</h2>
        <p className="conv-step__desc">
          Upload a video file or paste a YouTube URL to start your Fan-cam edit.
        </p>
      </div>

      <div className="source-cards">
        <div
          className={`source-card glass ${sourceMode === "upload" ? "source-card--active" : ""}`}
          onClick={() => setSourceMode("upload")}
        >
          <div className="source-card__icon">
            <UploadIcon />
          </div>
          <h3>File Upload</h3>
          <p>Upload a video file from your device</p>
        </div>
        <div
          className={`source-card glass ${sourceMode === "youtube" ? "source-card--active" : ""}`}
          onClick={() => setSourceMode("youtube")}
        >
          <div className="source-card__icon" style={{ color: "#ff4444" }}>
            <YoutubeIcon />
          </div>
          <h3>YouTube URL</h3>
          <p>Paste a YouTube video link</p>
        </div>
      </div>

      {sourceMode === "upload" && (
        <div className="source-input fade-in">
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            className="input"
            style={{ padding: "14px", cursor: "pointer" }}
          />
          <button
            className="btn btn-primary"
            onClick={handleUpload}
            disabled={loading}
            style={{ marginTop: 12, width: "100%" }}
          >
            {loading ? loadMsg : "Start Upload"}
          </button>
        </div>
      )}

      {sourceMode === "youtube" && (
        <div className="source-input fade-in">
          <input
            type="text"
            className="input"
            placeholder="https://www.youtube.com/watch?v=..."
            value={ytUrl}
            onChange={(e) => setYtUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleYoutube()}
          />
          <button
            className="btn btn-primary"
            onClick={handleYoutube}
            disabled={loading}
            style={{ marginTop: 12, width: "100%" }}
          >
            {loading ? loadMsg : "Start Download"}
          </button>
        </div>
      )}
    </div>
  )

  const renderStep1 = () => (
    <div className="conv-step fade-in">
      <div className="conv-step__header">
        <h2 className="conv-step__title">Select Your Target</h2>
        <p className="conv-step__desc">
          Click on the subject you want to track in the frame below, then set the time range.
        </p>
      </div>

      <div className="target-section">
        <div className="frame-preview">
          <div
            className="frame-preview__wrapper"
            style={{ cursor: "crosshair" }}
          >
            {frameUrl && (
              <img
                ref={imgRef}
                src={frameUrl}
                alt="Frame preview"
                className="frame-preview__img"
                onClick={handleFrameClick}
                draggable={false}
              />
            )}
            {clickCoords && (
              <div
                className="frame-preview__marker"
                style={{
                  left: clickCoords.displayX,
                  top: clickCoords.displayY,
                }}
              />
            )}
          </div>
          {clickCoords && (
            <div className="frame-preview__info">
              <CheckCircle />
              <span>
                Target selected (X: {clickCoords.x}, Y: {clickCoords.y})
              </span>
            </div>
          )}
        </div>

        <div className="time-range">
          <div className="time-range__group">
            <label className="label">Start Time (sec)</label>
            <input
              type="number"
              className="input"
              value={startS}
              min={0}
              max={videoInfo?.duration || 999}
              onChange={(e) => setStartS(Number(e.target.value))}
            />
          </div>
          <div className="time-range__group">
            <label className="label">End Time (sec)</label>
            <input
              type="number"
              className="input"
              value={endS}
              min={0}
              max={videoInfo?.duration || 999}
              onChange={(e) => setEndS(Number(e.target.value))}
            />
          </div>
          {videoInfo && (
            <div className="time-range__duration">
              Total duration: {videoInfo.duration.toFixed(1)}s
            </div>
          )}
        </div>

        <div className="target-desc-input">
          <label className="label">Additional Description (optional)</label>
          <input
            type="text"
            className="input"
            placeholder="e.g. The person wearing a white top in the center"
            value={targetDesc}
            onChange={(e) => setTargetDesc(e.target.value)}
          />
        </div>
      </div>

      <div className="conv-step__actions">
        <button
          className="btn btn-ghost"
          onClick={() => {
            setStep(0)
            setSourceMode(null)
          }}
        >
          <ArrowLeft /> Back
        </button>
        <button className="btn btn-primary" onClick={() => setStep(2)}>
          Next Step <ArrowRight />
        </button>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="conv-step fade-in">
      <div className="conv-step__header">
        <h2 className="conv-step__title">Output Options</h2>
        <p className="conv-step__desc">Set the output aspect ratio and crop margin.</p>
      </div>

      <div className="options-grid">
        <div className="option-group">
          <label className="label">Aspect Ratio</label>
          <div className="ratio-cards">
            {[
              { value: "9:16", label: "9:16", sub: "Vertical / Shorts" },
              { value: "16:9", label: "16:9", sub: "Landscape" },
              { value: "1:1", label: "1:1", sub: "Instagram" },
            ].map((r) => (
              <div
                key={r.value}
                className={`ratio-card glass ${outRatio === r.value ? "ratio-card--active" : ""}`}
                onClick={() => setOutRatio(r.value)}
              >
                <div
                  className={`ratio-card__preview ratio-card__preview--${r.value.replace(":", "x")}`}
                />
                <span className="ratio-card__label">{r.label}</span>
                <span className="ratio-card__sub">{r.sub}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="option-group">
          <label className="label">Crop Margin: {margin.toFixed(1)}</label>
          <input
            type="range"
            min="1.0"
            max="2.5"
            step="0.1"
            value={margin}
            onChange={(e) => setMargin(Number(e.target.value))}
            className="range-input"
          />
          <div className="range-labels">
            <span>Tight (1.0)</span>
            <span>Wide (2.5)</span>
          </div>
        </div>
      </div>

      <div className="conv-step__actions">
        <button className="btn btn-ghost" onClick={() => setStep(1)}>
          <ArrowLeft /> Back
        </button>
        <button
          className="btn btn-primary btn-lg"
          onClick={handleGenerate}
          disabled={generating}
          style={{ minWidth: 200 }}
        >
          {generating ? "Generating..." : "Start Fan Cam"}
          {!generating && <ArrowRight />}
        </button>
      </div>
    </div>
  )

  const renderGenerating = () => (
    <div className="conv-step generating-overlay fade-in">
      <div className="generating-content">
        <div className="generating-spinner">
          <div className="generating-spinner__ring" />
          <div className="generating-spinner__ring generating-spinner__ring--2" />
          <div className="generating-spinner__core" />
        </div>
        <h2>Generating AI Fan Cam</h2>
        <p className="generating-msg">{genMsg}</p>
        <div className="generating-tips">
          <div className="generating-tip glass">
            <span>
              Gemini AI is analyzing the target frame by frame.
              This may take 1–5 minutes depending on the video length.
            </span>
          </div>
        </div>
        <div className="generating-dots">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="conv-step fade-in">
      <div className="conv-step__header">
        <h2 className="conv-step__title gradient-text">Fan Cam Complete!</h2>
        <p className="conv-step__desc">
          Compare the result with the original video side by side.
        </p>
      </div>

      {result && (
        <>
          <VideoComparison
            originalVideoPath={videoPath}
            resultVideoUrl={getOutputUrl(result.video_url)}
            jsonUrl={getOutputUrl(result.json_url)}
            startS={startS}
          />

          <div className="shorts-section glass">
            <div className="shorts-section__header">
              <div className="shorts-section__header-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent-pink)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="4" />
                  <polygon points="10 8 16 12 10 16 10 8" fill="var(--accent-pink)" stroke="none" />
                </svg>
              </div>
              <div>
                <h3>Upload to YouTube Shorts</h3>
                <p>Share your Fan-cam edit directly to YouTube Shorts</p>
              </div>
            </div>

            {uploadResult ? (
              <div className="shorts-section__success">
                <div className="shorts-section__success-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <h3>Upload Complete!</h3>
                <p>Successfully uploaded to YouTube Shorts.</p>
                <a href={uploadResult.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
                  View on YouTube
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/></svg>
                </a>
              </div>
            ) : (
              <div className="shorts-section__form">
                <div className="shorts-section__field">
                  <label className="label">Title</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. [FanCam] Player Highlight — Game #Shorts"
                    value={shortsTitle}
                    onChange={(e) => setShortsTitle(e.target.value)}
                  />
                </div>
                <div className="shorts-section__field">
                  <label className="label">Description</label>
                  <textarea
                    className="input"
                    rows={3}
                    placeholder="Add a description and hashtags...&#10;e.g. #Shorts #FanCam #Highlights"
                    value={shortsDesc}
                    onChange={(e) => setShortsDesc(e.target.value)}
                    style={{ resize: "vertical", minHeight: 90 }}
                  />
                </div>
                <div className="shorts-section__row">
                  <div className="shorts-section__field">
                    <label className="label">Visibility</label>
                    <select className="select" value={shortsPrivacy} onChange={(e) => setShortsPrivacy(e.target.value)}>
                      <option value="public">Public</option>
                      <option value="unlisted">Unlisted</option>
                      <option value="private">Private</option>
                    </select>
                  </div>
                  <div className="shorts-section__field">
                    <label className="label">AI Auto-Fill</label>
                    <button
                      className="btn btn-secondary"
                      onClick={handleRecommend}
                      disabled={recommending}
                      style={{ width: '100%', height: '44px' }}
                    >
                      {recommending ? (
                        <><span className="btn-spinner" /> Generating...</>
                      ) : (
                        <>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                          AI Title & Description
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <button
                  className="btn btn-primary btn-lg"
                  onClick={handleShortsUpload}
                  disabled={uploading}
                  style={{ width: '100%' }}
                >
                  {uploading ? (
                    <><span className="btn-spinner" /> Uploading to YouTube...</>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                      Upload to YouTube Shorts
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="conv-step__actions" style={{ marginTop: 32 }}>
            <button className="btn btn-secondary" onClick={resetAll}>
              Create New Fan Cam
            </button>
            {result.json_url && (
              <a
                href={getOutputUrl(result.json_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost"
              >
                View Tracking JSON
              </a>
            )}
          </div>
        </>
      )}
    </div>
  )

  const currentStep = generating ? -1 : step

  return (
    <div className="converter">
      {/* Progress bar */}
      <div className="conv-progress">
        <div className="conv-progress__inner">
          {["Video", "Target", "Options", "Result"].map((label, i) => (
            <div
              key={i}
              className={`conv-progress__step ${i <= step ? "conv-progress__step--active" : ""} ${i === step ? "conv-progress__step--current" : ""}`}
            >
              <div className="conv-progress__dot">
                {i < step ? <CheckCircle /> : <span>{i + 1}</span>}
              </div>
              <span className="conv-progress__label">{label}</span>
            </div>
          ))}
          <div className="conv-progress__bar">
            <div
              className="conv-progress__fill"
              style={{ width: `${(step / (TOTAL_STEPS - 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div className="conv-error fade-in">
          <span>{error}</span>
          <button onClick={() => setError("")}>&times;</button>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="conv-loading fade-in">
          <div className="conv-loading__content glass-strong">
            <div className="conv-loading__spinner" />
            <p>{loadMsg}</p>
          </div>
        </div>
      )}

      {/* Generating overlay */}
      {generating && renderGenerating()}

      {/* Steps */}
      <div className="conv-body">
        {!generating && currentStep === 0 && renderStep0()}
        {!generating && currentStep === 1 && renderStep1()}
        {!generating && currentStep === 2 && renderStep2()}
        {!generating && currentStep === 3 && renderStep3()}
      </div>

      <style>{`
        .converter {
          min-height: 100vh;
          padding-top: 100px;
          padding-bottom: 60px;
          background: var(--gradient-bg);
          position: relative;
        }

        /* ── Progress ── */
        .conv-progress {
          max-width: 600px;
          margin: 0 auto 40px;
          padding: 0 24px;
        }
        .conv-progress__inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
        }
        .conv-progress__bar {
          position: absolute;
          top: 18px;
          left: 24px;
          right: 24px;
          height: 2px;
          background: var(--border-subtle);
          z-index: 0;
          border-radius: 1px;
        }
        .conv-progress__fill {
          height: 100%;
          background: var(--gradient-primary);
          border-radius: 1px;
          transition: width 0.5s var(--ease-out-expo);
        }
        .conv-progress__step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          z-index: 1;
        }
        .conv-progress__dot {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: 600;
          background: var(--bg-secondary);
          border: 2px solid var(--border-subtle);
          color: var(--text-muted);
          transition: all 0.3s ease;
        }
        .conv-progress__step--active .conv-progress__dot {
          border-color: var(--accent-purple);
          color: var(--accent-purple);
        }
        .conv-progress__step--current .conv-progress__dot {
          background: var(--gradient-primary);
          border-color: transparent;
          color: #fff;
          box-shadow: 0 0 16px rgba(139, 92, 246, 0.4);
        }
        .conv-progress__label {
          font-size: 0.72rem;
          color: var(--text-muted);
          font-weight: 500;
          transition: color 0.3s ease;
        }
        .conv-progress__step--active .conv-progress__label {
          color: var(--text-secondary);
        }
        .conv-progress__step--current .conv-progress__label {
          color: var(--text-primary);
        }

        /* ── Body ── */
        .conv-body {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* ── Step ── */
        .conv-step {
          animation: fadeInUp 0.5s var(--ease-out-expo);
        }
        .conv-step__header {
          text-align: center;
          margin-bottom: 36px;
        }
        .conv-step__title {
          font-family: var(--font-display);
          font-size: 1.8rem;
          font-weight: 800;
          margin-bottom: 8px;
        }
        .conv-step__desc {
          color: var(--text-secondary);
          font-size: 0.95rem;
        }
        .conv-step__actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 36px;
          gap: 16px;
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in { animation: fadeInUp 0.5s var(--ease-out-expo); }

        /* ── Source cards ── */
        .source-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 28px;
        }
        .source-card {
          padding: 32px 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s var(--ease-out-expo);
        }
        .source-card:hover {
          transform: translateY(-4px);
          border-color: var(--border-light);
        }
        .source-card--active {
          border-color: var(--accent-purple) !important;
          box-shadow: 0 0 24px rgba(139, 92, 246, 0.2);
        }
        .source-card__icon {
          color: var(--accent-purple);
          margin-bottom: 14px;
        }
        .source-card h3 {
          font-family: var(--font-display);
          font-weight: 700;
          margin-bottom: 4px;
        }
        .source-card p {
          font-size: 0.82rem;
          color: var(--text-muted);
        }
        .source-input {
          max-width: 500px;
          margin: 0 auto;
        }

        /* ── Frame preview ── */
        .target-section {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .frame-preview__wrapper {
          position: relative;
          border-radius: var(--radius-md);
          overflow: hidden;
          border: 1px solid var(--border-subtle);
          background: var(--bg-secondary);
        }
        .frame-preview__img {
          width: 100%;
          display: block;
          user-select: none;
        }
        .frame-preview__marker {
          position: absolute;
          width: 24px;
          height: 24px;
          border: 3px solid var(--accent-cyan);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          box-shadow: 0 0 12px rgba(6, 182, 212, 0.5);
          pointer-events: none;
          animation: pulse-glow 1.5s infinite;
        }
        .frame-preview__info {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          font-size: 0.85rem;
          color: var(--accent-green);
          background: rgba(16, 185, 129, 0.08);
          border-radius: 0 0 var(--radius-md) var(--radius-md);
          border: 1px solid rgba(16, 185, 129, 0.15);
          border-top: none;
        }
        .time-range {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          align-items: end;
        }
        .time-range__group {
          display: flex;
          flex-direction: column;
        }
        .time-range__duration {
          grid-column: 1 / -1;
          font-size: 0.82rem;
          color: var(--text-muted);
          text-align: center;
        }

        /* ── Options ── */
        .options-grid {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }
        .option-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .ratio-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .ratio-card {
          padding: 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }
        .ratio-card:hover { border-color: var(--border-light); }
        .ratio-card--active {
          border-color: var(--accent-purple) !important;
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.2);
        }
        .ratio-card__preview {
          border: 2px solid var(--accent-purple);
          border-radius: 4px;
          opacity: 0.5;
          margin-bottom: 4px;
        }
        .ratio-card--active .ratio-card__preview { opacity: 1; }
        .ratio-card__preview--9x16 { width: 28px; height: 50px; }
        .ratio-card__preview--16x9 { width: 50px; height: 28px; }
        .ratio-card__preview--1x1 { width: 36px; height: 36px; }
        .ratio-card__label {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1rem;
        }
        .ratio-card__sub {
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        /* Range input */
        .range-input {
          width: 100%;
          -webkit-appearance: none;
          height: 6px;
          border-radius: 3px;
          background: var(--border-subtle);
          outline: none;
        }
        .range-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--gradient-primary);
          cursor: pointer;
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.4);
        }
        .range-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        /* ── Generating ── */
        .generating-overlay {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 400px;
        }
        .generating-content {
          text-align: center;
        }
        .generating-content h2 {
          font-family: var(--font-display);
          font-size: 1.6rem;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .generating-msg {
          color: var(--text-secondary);
          margin-bottom: 24px;
        }
        .generating-spinner {
          position: relative;
          width: 80px;
          height: 80px;
          margin: 0 auto 28px;
        }
        .generating-spinner__ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 3px solid transparent;
          border-top-color: var(--accent-purple);
          animation: spin-slow 1.5s linear infinite;
        }
        .generating-spinner__ring--2 {
          inset: 8px;
          border-top-color: var(--accent-cyan);
          animation-duration: 2s;
          animation-direction: reverse;
        }
        .generating-spinner__core {
          position: absolute;
          inset: 18px;
          border-radius: 50%;
          background: var(--gradient-primary);
          opacity: 0.3;
          animation: pulse-glow 2s infinite;
        }
        .generating-tips {
          max-width: 400px;
          margin: 0 auto;
        }
        .generating-tip {
          padding: 16px 20px;
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.6;
        }
        .generating-dots {
          display: flex;
          gap: 8px;
          justify-content: center;
          margin-top: 20px;
        }
        .generating-dots span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent-purple);
          animation: dotPulse 1.2s ease-in-out infinite;
        }
        .generating-dots span:nth-child(2) { animation-delay: 0.15s; }
        .generating-dots span:nth-child(3) { animation-delay: 0.3s; }
        @keyframes dotPulse {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.3; }
          40% { transform: scale(1); opacity: 1; }
        }

        /* ── Shorts section ── */
        .shorts-section {
          margin-top: 32px;
          padding: 0;
          overflow: hidden;
          background: linear-gradient(135deg, rgba(236, 72, 153, 0.06), rgba(139, 92, 246, 0.06));
          border: 1px solid rgba(236, 72, 153, 0.15);
        }
        .shorts-section__header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 24px 28px;
          background: rgba(236, 72, 153, 0.06);
          border-bottom: 1px solid rgba(236, 72, 153, 0.1);
        }
        .shorts-section__header-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
          background: linear-gradient(135deg, rgba(236, 72, 153, 0.15), rgba(139, 92, 246, 0.15));
          border: 1px solid rgba(236, 72, 153, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .shorts-section__header h3 {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.1rem;
          margin-bottom: 2px;
        }
        .shorts-section__header p {
          font-size: 0.82rem;
          color: var(--text-muted);
        }
        .shorts-section__form {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 24px 28px;
        }
        .shorts-section__field {
          display: flex;
          flex-direction: column;
        }
        .shorts-section__field .label {
          font-weight: 600;
          margin-bottom: 8px;
        }
        .shorts-section__row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        .shorts-section__buttons {
          display: flex;
          gap: 12px;
          padding-top: 4px;
        }
        .shorts-section__success {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          padding: 40px 28px;
          text-align: center;
        }
        .shorts-section__success-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.12);
          border: 2px solid rgba(16, 185, 129, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-green);
        }
        .shorts-section__success h3 {
          font-family: var(--font-display);
          font-weight: 700;
          font-size: 1.2rem;
          color: var(--accent-green);
        }
        .shorts-section__success p {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        @media (max-width: 640px) {
          .shorts-section__row { grid-template-columns: 1fr; }
          .shorts-section__buttons { flex-direction: column; }
        }

        /* ── Error ── */
        .conv-error {
          max-width: 600px;
          margin: 0 auto 20px;
          padding: 14px 20px;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--radius-md);
          color: #f87171;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
        }
        .conv-error button {
          font-size: 1.3rem;
          color: #f87171;
          padding: 4px 8px;
        }

        /* ── Loading overlay ── */
        .conv-loading {
          position: fixed;
          inset: 0;
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(6, 6, 15, 0.8);
          backdrop-filter: blur(8px);
        }
        .conv-loading__content {
          padding: 40px 60px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }
        .conv-loading__spinner {
          width: 40px;
          height: 40px;
          border: 3px solid var(--border-subtle);
          border-top-color: var(--accent-purple);
          border-radius: 50%;
          animation: spin-slow 1s linear infinite;
        }
        .conv-loading__content p {
          color: var(--text-secondary);
          font-size: 0.95rem;
        }

        .btn-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin-slow 0.8s linear infinite;
        }
        .btn-secondary .btn-spinner {
          border-color: var(--border-light);
          border-top-color: var(--accent-purple);
        }

        @media (max-width: 640px) {
          .source-cards { grid-template-columns: 1fr; }
          .ratio-cards { grid-template-columns: 1fr; }
          .time-range { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
