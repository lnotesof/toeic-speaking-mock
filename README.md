# FEL TOEIC Speaking Test

## 화면 이동 순서
1. FEL 로고 인트로 (3초)
2. 수강생 이름 입력 + 실제 마이크 테스트
3. 시험 목록 선택
4. TOEIC Speaking Test 선택 후 기존 Q1–Q11 시험 진행
5. 완료 화면

## 실행
1. `index.html`, `styles.css`, `app.js`를 같은 폴더에 둡니다.
2. 기존 FEL 로고 이미지 파일을 `fellogo.png`라는 이름으로 같은 폴더에 넣습니다.
3. VS Code에서 폴더를 열고 `index.html`을 Live Server로 실행합니다.
4. 마이크 권한은 localhost 또는 HTTPS 환경에서 허용해 주세요.

## 기존 기능 유지
- 기존 Q1–Q11 질문/타이머 로직 유지
- 실제 마이크 권한 확인 및 음량 미터 유지
- 기존 MediaRecorder 녹음 로직 유지
- 기존 Supabase 버킷, 업로드 경로, 업로드 방식 유지
- 마이크 테스트 뒤 바로 시험을 시작하지 않고, 시험 목록을 거쳐 시작하도록 화면 흐름만 변경

## 참고
현재 ZIP에 `fellogo.png` 이미지 파일은 포함되어 있지 않습니다. 기존 FEL 로고 파일을 `fellogo.png`로 저장해 같은 폴더에 넣어 주세요.
