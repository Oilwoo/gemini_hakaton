# AI 직캠 메이커 API (백엔드)

이 프로젝트는 지정된 사람의 이미지를 파싱하여 추적하고 자동으로 "직캠"을 만들어주는 AI 백엔드 서버입니다 (가벼운 HTML 프론트엔드도 포함).

프론트엔드 개발자는 `frontend/` 경로 안의 `index.html` 파일을 참고하거나, 원하는 방식대로 폴더를 수정하여 프로젝트를 고도화할 수 있습니다. 

## 백엔드 실행 방법 (로컬)
1. 파이썬 3 환경을 준비합니다.
2. 아래 명령어로 필요 패키지를 설치합니다:
   ```bash
   pip install -r requirements.txt
   ```
3. 백엔드 서버를 띄웁니다:
   ```bash
   python main.py
   ```
4. `http://localhost:7860` 에 접속하면 `frontend/index.html` 기반의 임시 UI가 뜹니다.

---

## 프론트엔드 연동을 위한 REST API 가이드

백엔드는 `localhost:7860` 포트로 띄워지며 `CORS` 처리가 되어있어, 다른 포트(예: 3000) 의 프론트엔드 서버(React / Next.js 등)에서도 바로 호출 가능합니다!

### 1. `POST /api/upload`
비디오 파일을 시스템 임시 폴더에 업로드합니다.
- **Request (FormData):**
  - `file`: 비디오 파일
- **Response (JSON):**
  - `video_path`: 서버상 저장 경로. (추후 API 호출시 계속 사용합니다.)

### 2. `POST /api/youtube`
유튜브 링크에서 영상을 임시 저장소에 다운로드합니다.
- **Request (JSON):**
  - `url`: `https://~`
  - `res`: (Optional) "720p", "1080p", "best"
- **Response (JSON):**
  - `video_path`: 로컬 다운로드 완료된 파일 경로

### 3. `GET /api/frame`
특정 시각(초)의 썸네일(프레임 이미지)를 리턴합니다. (프론트엔드에서 캔버스에 그릴 때 사용)
- **Parameters:**
  - `video_path`: `/api/upload` 등에서 획득한 비디오 파일 경로
  - `time`: 가져올 시점 (초 단위, 예: 0.0)
- **Response:**
  - `image/jpeg` 포맷 이미지 바이너리

### 4. `GET /api/video_info`
영상의 전체 길이와 FPS를 가져옵니다.
- **Parameters:**
  - `video_path`: 획득한 비디오 파일 경로
- **Response (JSON):**
  - `duration`: 영상 전체 길이 (초)
  - `fps`: 영상 프레임 레이트

### 5. `POST /api/generate`
본격적으로 영상을 추론하고 결과물(MP4)과 JSON을 뱉어냅니다.
- **Request (JSON):**
  ```json
  {
      "video_path": "c:/...",
      "target_description": "추가 지정어 예: 파란 모자 (옵션)",
      "start_s": 0.0,
      "end_s": 15.0,
      "click_x": 300, 
      "click_y": 150, 
      "image_w": 1280, 
      "image_h": 720
  }
  ```
- **Response (JSON):**
  - `video_url`: `/outputs/...mp4` 형식으로 완성된 직캠 영상 주소 리턴
  - `json_url`: `/outputs/...json` 형식으로 결과 JSON 주소 리턴
  > 참고: 백엔드 `localhost:7860/outputs/~`에서 해당 파일을 바로 Serve 합니다.

모든 과정은 `frontend/index.html` 의 Javascript 로직에서 완벽하게 예시로 구현되어 있으니 그 코드를 복사하시거나 참고하세요!
