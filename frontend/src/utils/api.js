const API_BASE = window.location.origin

export async function uploadVideo(file) {
  const fd = new FormData()
  fd.append("file", file)
  const res = await fetch(`${API_BASE}/api/upload`, {
    method: "POST",
    body: fd,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || "업로드 실패")
  }
  return res.json()
}

export async function downloadYoutube(url, resolution = "720p") {
  const res = await fetch(`${API_BASE}/api/youtube`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, res: resolution }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || "다운로드 실패")
  }
  return res.json()
}

export function getFrameUrl(videoPath, time = 0) {
  return `${API_BASE}/api/frame?video_path=${encodeURIComponent(videoPath)}&time=${time}`
}

export async function getVideoInfo(videoPath) {
  const res = await fetch(
    `${API_BASE}/api/video_info?video_path=${encodeURIComponent(videoPath)}`,
  )
  if (!res.ok) throw new Error("영상 정보를 가져올 수 없습니다")
  return res.json()
}

export async function generateFancam(options) {
  const res = await fetch(`${API_BASE}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || "생성 실패")
  }
  return res.json()
}

export function getOutputUrl(path) {
  if (path.startsWith("http")) return path
  return `${API_BASE}${path}`
}

export function getVideoStreamUrl(videoPath) {
  return `${API_BASE}/api/video?video_path=${encodeURIComponent(videoPath)}`
}

export async function recommendShortsMeta(targetDescription) {
  const res = await fetch(`${API_BASE}/api/youtube/recommend`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ target_description: targetDescription }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || "추천 생성 실패")
  }
  return res.json()
}

export async function uploadToYouTube({
  videoPath,
  title,
  description,
  privacy = "public",
}) {
  const res = await fetch(`${API_BASE}/api/youtube/upload`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      video_path: videoPath,
      title,
      description,
      privacy,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || "유튜브 업로드 실패")
  }
  return res.json()
}
