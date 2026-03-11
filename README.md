# 💪 MyHealth - 풀스택 건강 관리 플랫폼

> Spring Boot + React + MySQL + AWS EC2 기반 헬스케어 웹 애플리케이션

[![Java](https://img.shields.io/badge/Java-17-orange)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-4.0.2-green)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18.3.1-blue)](https://react.dev/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-blue)](https://www.mysql.com/)
[![AWS EC2](https://img.shields.io/badge/AWS-EC2-orange)](https://aws.amazon.com/ec2/)

---

## 🖥️ 서비스 URL

- **운영 서버**: http://myhealth90.online
- **백엔드 API**: http://3.36.94.22:8080/api

---

## 📋 목차

1. [프로젝트 개요](#-프로젝트-개요)
2. [주요 기능](#-주요-기능)
3. [기술 스택](#-기술-스택)
4. [시스템 아키텍처](#-시스템-아키텍처)
5. [디렉터리 구조](#-디렉터리-구조)
6. [API 명세](#-api-명세)
7. [데이터베이스 설계](#-데이터베이스-설계)
8. [설치 및 실행](#-설치-및-실행)
9. [환경변수 설정](#-환경변수-설정)
10. [외부 API 연동](#-외부-api-연동)

---

## 🎯 프로젝트 개요

MyHealth는 운동, 식단, 신체 기록을 통합 관리하는 헬스케어 웹 플랫폼입니다.

- **식단 관리**: 공공데이터 식품영양성분 DB 기반 음식 검색 + 칼로리 자동 계산
- **운동 루틴**: MET 기반 칼로리 소모 계산 + 운동 영상 라이브러리
- **신체 기록**: 체중·혈압·혈당 추세 차트
- **AI 트레이너**: Google Gemini 2.5 Flash 기반 PT 챗봇
- **Google Fit 연동**: OAuth2로 걸음수·거리·심박수 자동 동기화
- **득근 RPG**: 운동·식단 기록이 게임 캐릭터 성장으로 연결되는 gamification 시스템
- **커뮤니티 게시판**: 공지/일반 게시글 + 댓글 + 검색

---

## ✨ 주요 기능

### 🔐 인증 시스템
- JWT 기반 Stateless 인증 (24시간 유효)
- 회원가입 / 로그인 / 비밀번호 찾기
- Gmail SMTP 이메일 인증 (UUID 토큰, 30분 만료)
- ADMIN / USER 역할 기반 권한 제어

### 🥗 식단 관리
- 공공데이터포털 식품영양성분 DB 검색 (프록시)
- 아침/점심/저녁/간식 구분 기록
- 탄수화물·단백질·지방·칼로리 자동 입력
- 월간 캘린더 뷰 + 일별 상세 조회

### 🏃 운동 루틴
- 공공 MET 데이터 기반 운동 검색
- 칼로리 = MET × 체중 × 시간(h) 자동 계산
- Google Fit 걸음수 → 루틴 자동 채우기
- 보건소 모바일 헬스케어 운동 영상 라이브러리

### 📊 신체 기록 (MyBody)
- 날짜별 체중·키·혈압·혈당 기록
- Chart.js 기반 추세 그래프

### 🤖 AI 트레이너
- Google Gemini 2.5 Flash API 연동
- 10년차 PT 페르소나 시스템 프롬프트
- 유튜브 검색 링크 자동 추천

### 🎮 득근 RPG (FitnessGame)
- 식단 기록 → 칼로리 섭취 → 회복 아이템
- 운동 기록 → XP 획득 → 레벨업 → STR 증가
- HP 시스템: 운동 안 하면 감소
- 던전 스테이지 진행 + 칭호 시스템 (헬린이 → 헬스왕)
- 하루 1회 XP 제한 (lastExpDate 추적)

### 📌 커뮤니티 게시판
- 게시글 CRUD + 댓글
- 공지 고정 (ADMIN 전용, 서버사이드 권한 검증)
- 제목 검색 + 페이징

### 🫀 Google Fit 연동
- OAuth2 팝업 방식 인증
- 오늘 걸음수·이동거리·심박수 동기화
- 걸음수 → 운동시간(분) + 소모칼로리 환산

---

## 🛠 기술 스택

### Backend
| 분류 | 기술 |
|------|------|
| 언어 | Java 17 |
| 프레임워크 | Spring Boot 4.0.2 |
| 보안 | Spring Security + JWT (jjwt 0.12.3) |
| ORM | Spring Data JPA + Hibernate |
| DB | MySQL 8.0 |
| 이메일 | Spring Mail (Gmail SMTP) |
| HTTP 클라이언트 | RestTemplate |
| 빌드 | Gradle |

### Frontend
| 분류 | 기술 |
|------|------|
| 프레임워크 | React 18.3.1 (CRA) |
| 라우팅 | React Router DOM 6 |
| HTTP 클라이언트 | Axios 1.13.5 |
| 차트 | Chart.js 4 + react-chartjs-2 |

### Infrastructure
| 분류 | 기술 |
|------|------|
| 서버 | AWS EC2 (Ubuntu) |
| 웹서버 | Nginx (Reverse Proxy) |
| 프론트 서빙 | serve (npm) |
| 도메인 | myhealth90.online |

### 외부 API
| API | 용도 |
|-----|------|
| Google Gemini 2.5 Flash | AI 트레이너 챗봇 |
| Google Fitness API | 걸음수·거리·심박수 동기화 |
| 공공데이터포털 식품영양성분DB | 음식 검색 및 영양 정보 |
| 공공데이터포털 운동영상DB | 운동 영상 라이브러리 |
| ODCloud 운동 MET 데이터 | 운동 강도 및 칼로리 계산 |

---

## 🏗 시스템 아키텍처

```
사용자 브라우저
    ↓ HTTPS
Nginx (80/443)
    ↓ /api/** → :8080
    ├─ Spring Boot API Server (:8080)
    │     ├─ JWT 인증 필터
    │     ├─ REST Controllers
    │     ├─ JPA / Hibernate
    │     └─ MySQL DB
    │
    └─ React App (serve :3000)
          └─ Axios → /api/** → Nginx → Spring Boot
```

**요청 흐름 (인증 포함)**:
```
React → Axios (Authorization: Bearer JWT)
  → Nginx Reverse Proxy
  → Spring Boot
  → JwtAuthFilter (토큰 검증 → SecurityContext 등록)
  → Controller → Service → Repository → MySQL
```

---

## 📁 디렉터리 구조

```
MyHealth/
├── backend/                          # Spring Boot 백엔드
│   └── src/main/java/com/myhealth/
│       ├── MyHealthApplication.java  # 메인 진입점
│       ├── config/
│       │   ├── CorsConfig.java       # CORS 전역 설정
│       │   └── SecurityConfig.java   # Spring Security + JWT 필터 설정
│       ├── security/
│       │   ├── JwtUtil.java          # JWT 발급·검증·파싱
│       │   └── JwtAuthFilter.java    # 요청당 JWT 인증 필터
│       ├── entity/
│       │   ├── User.java             # 유저 (users 테이블)
│       │   ├── DietLog.java          # 식단 기록 (diet_log)
│       │   ├── Routine.java          # 운동 루틴 (routine_log)
│       │   ├── HealthRecord.java     # 신체 기록 (health_record)
│       │   ├── GameStats.java        # RPG 캐릭터 스탯 (fitness_game_stats)
│       │   ├── Board.java            # 게시글 (board)
│       │   ├── BoardComment.java     # 댓글 (board_comment)
│       │   └── PasswordResetToken.java  # 비밀번호 재설정 토큰
│       ├── repository/               # Spring Data JPA 인터페이스
│       │   ├── UserRepository.java
│       │   ├── DietRepository.java
│       │   ├── RoutineRepository.java
│       │   ├── HealthRepository.java
│       │   ├── GameRepository.java
│       │   ├── BoardRepository.java
│       │   ├── BoardCommentRepository.java
│       │   └── PasswordResetTokenRepository.java
│       ├── controller/
│       │   ├── AuthController.java       # /api/auth/** 로그인·회원가입·비번찾기
│       │   ├── AiController.java         # /api/ai/** Gemini AI 챗봇
│       │   ├── DietController.java       # /api/diet/** 식단 CRUD + 공공API 프록시
│       │   ├── RoutineController.java    # /api/routine/** 운동 루틴 + MET 검색
│       │   ├── MyBodyController.java     # /api/health/** 신체 기록
│       │   ├── GameController.java       # /api/game/** RPG 스탯
│       │   ├── BoardController.java      # /api/board/** 게시판
│       │   ├── WorkoutController.java    # /api/workout/** 운동 영상 검색
│       │   └── GoogleHealthController.java  # /api/sync/** Google Fit
│       └── service/
│           ├── EmailService.java         # Gmail SMTP 이메일 발송
│           └── GoogleHealthService.java  # Google Fitness API 연동
│
└── frontend/                         # React 프론트엔드
    └── src/
        ├── App.jsx                   # 라우터 설정
        ├── api.js                    # Axios 인스턴스 (JWT 인터셉터)
        ├── pages/
        │   ├── Login.jsx             # 로그인
        │   ├── Signup.jsx            # 회원가입
        │   ├── FindPw.jsx            # 비밀번호 찾기
        │   ├── ResetPw.jsx           # 비밀번호 재설정
        │   ├── Main.jsx              # 메인 대시보드 (건강 요약 차트)
        │   ├── Diet.jsx              # 식단 관리 (캘린더 + 음식 검색)
        │   ├── Routine.jsx           # 운동 루틴 (MET 계산)
        │   ├── MyBody.jsx            # 신체 기록 (혈압·체중·혈당)
        │   ├── AiTrainer.jsx         # AI PT 챗봇
        │   ├── FitnessGame.jsx       # 득근 RPG 게임
        │   ├── Board.jsx             # 게시판 목록
        │   ├── BoardDetail.jsx       # 게시글 상세 + 댓글
        │   ├── BoardWrite.jsx        # 게시글 작성/수정
        │   ├── WorkoutLibrary.jsx    # 운동 영상 라이브러리
        │   ├── GoogleHealthPage.jsx  # Google Fit 연동
        │   ├── GoogleCallback.jsx    # Google OAuth 콜백 처리
        │   └── Oauthcallback.jsx     # OAuth 콜백
        └── components/
            ├── Navbar.jsx            # 네비게이션 바
            ├── Footer.jsx            # 푸터
            ├── PageLayout.jsx        # 공통 레이아웃
            └── Footerfile/
                ├── Terms.jsx         # 이용약관
                ├── Privacy.jsx       # 개인정보처리방침
                └── Support.jsx       # 고객지원
```

---

## 📡 API 명세

### 인증 `/api/auth`
| Method | URL | 설명 | 인증 |
|--------|-----|------|------|
| POST | `/api/auth/login` | 로그인 → JWT 반환 | ❌ |
| POST | `/api/auth/signup` | 회원가입 | ❌ |
| POST | `/api/auth/find-pw` | 비밀번호 찾기 이메일 발송 | ❌ |
| POST | `/api/auth/reset-pw` | 비밀번호 재설정 | ❌ |

### 식단 `/api/diet`
| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/diet/search?query=닭가슴살` | 식품 영양성분 검색 |
| GET | `/api/diet/{username}?year=&month=` | 월간 식단 조회 |
| GET | `/api/diet/{username}/day?date=` | 일별 식단 조회 |
| POST | `/api/diet/{username}` | 날짜 식단 저장 (전체 교체) |
| DELETE | `/api/diet/{username}?date=` | 날짜 식단 삭제 |

### 운동 루틴 `/api/routine`
| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/routine/search?query=달리기` | MET 운동 검색 |
| GET | `/api/routine/{username}?year=&month=` | 월간 루틴 조회 |
| POST | `/api/routine/{username}` | 날짜 루틴 저장 |

### 신체 기록 `/api/health`
| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/health/{username}` | 전체 기록 조회 |
| POST | `/api/health/save` | 기록 저장/수정 (Upsert) |
| DELETE | `/api/health/{username}/{date}` | 기록 삭제 |

### 게시판 `/api/board`
| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/board?page=0&size=10&keyword=` | 게시글 목록 + 검색 |
| GET | `/api/board/{id}` | 게시글 상세 + 조회수 증가 |
| POST | `/api/board` | 게시글 작성 |
| PUT | `/api/board/{id}` | 게시글 수정 |
| DELETE | `/api/board/{id}` | 게시글 삭제 |
| GET | `/api/board/{id}/comments` | 댓글 목록 |
| POST | `/api/board/{id}/comments` | 댓글 작성 |
| DELETE | `/api/board/comments/{id}` | 댓글 삭제 |

### RPG 게임 `/api/game`
| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/game/{username}` | 캐릭터 스탯 조회 |
| POST | `/api/game/save` | 캐릭터 스탯 저장 |
| GET | `/api/game/daily-summary/{username}` | 오늘 식단/운동 요약 |

### AI 트레이너 `/api/ai`
| Method | URL | 설명 |
|--------|-----|------|
| POST | `/api/ai/chat` | Gemini AI 채팅 |

### 기타
| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/workout/search` | 운동 영상 검색 |
| POST | `/api/sync/google-fit` | Google Fit 동기화 |

---

## 🗄 데이터베이스 설계

```sql
-- 유저
users (id PK, username UNIQUE, password, email UNIQUE, role)

-- 식단 기록
diet_log (id PK, username, date, meal_type, menu, base_weight, weight, kcal, carbs, protein, fat)

-- 운동 루틴
routine_log (id PK, username, workout_date, name, met, time, kcal)

-- 신체 기록
health_record (id PK, username, date, weight, height, systolic_bp, diastolic_bp, blood_sugar)

-- RPG 스탯
fitness_game_stats (id PK, user_id FK, username UNIQUE, level, xp, str, hp, max_hp, title, stage, last_exp_date)

-- 게시판
board (id PK, title, content, writer, views, notice, created_at)
board_comment (id PK, board_id FK, writer, content, created_at)

-- 비밀번호 재설정 토큰
password_reset_tokens (id PK, user_id FK, token UNIQUE, expires_at, used)
```

---

## 🚀 설치 및 실행

### 사전 요구사항
- Java 17+
- Node.js 18+
- MySQL 8.0
- Gradle

### 1. MySQL 데이터베이스 설정

```sql
CREATE DATABASE myhealth
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

`backend/src/main/resources/static/init_db.sql` 실행으로 초기 테이블 생성

### 2. 백엔드 실행

```bash
cd backend
./gradlew bootRun
# 또는 빌드 후 실행
./gradlew build
java -jar build/libs/backend-0.0.1-SNAPSHOT.jar
```

### 3. 프론트엔드 실행

```bash
cd frontend
npm install
npm start           # 개발 서버 (localhost:3000)
# 또는 빌드 후 서빙
npm run build
npx serve -s build  # 정적 파일 서빙
```

### 4. AWS EC2 운영 배포

```bash
# 백엔드 (백그라운드 실행)
nohup java -jar backend-0.0.1-SNAPSHOT.jar &

# 프론트엔드 (Nginx가 3000 → 80 프록시)
npx serve -s build -l 3000 &
```

---

## ⚙️ 환경변수 설정

`backend/src/main/resources/application.yaml` 수정:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/myhealth?useSSL=false&serverTimezone=Asia/Seoul
    username: root
    password: YOUR_DB_PASSWORD

  mail:
    username: YOUR_GMAIL@gmail.com
    password: YOUR_APP_PASSWORD_16CHARS  # Google 앱 비밀번호

app:
  frontend-url: http://YOUR_DOMAIN

jwt:
  secret: YOUR_256BIT_SECRET_KEY
  expiration: 86400000

google:
  client-id: YOUR_GOOGLE_CLIENT_ID
  client-secret: YOUR_GOOGLE_CLIENT_SECRET
  redirect-uri: http://YOUR_DOMAIN/callback.html
```

---

## 🔌 외부 API 연동

### Google Gemini AI
- [Google AI Studio](https://aistudio.google.com/)에서 API 키 발급
- `AiController.java`의 `API_KEY` 상수에 설정

### Google Fitness API
- [Google Cloud Console](https://console.cloud.google.com/)에서 OAuth2 클라이언트 생성
- Fitness API 활성화 필요
- `application.yaml`의 `google.*` 항목에 설정

### 공공데이터포털
- [data.go.kr](https://www.data.go.kr/)에서 서비스 키 발급
- 식품영양성분 DB, 보건소 운동영상, ODCloud MET 데이터 신청
- `DietController`, `RoutineController`, `WorkoutController`의 `SERVICE_KEY` 상수에 설정

---

## 🔒 보안 주의사항

> ⚠️ 현재 코드에는 아래 민감 정보가 하드코딩되어 있습니다.  
> **실제 배포 전 반드시 환경변수 또는 Secret Manager로 분리하세요.**

- `application.yaml`: DB 비밀번호, Gmail 앱 비밀번호, JWT 시크릿
- `AiController.java`: Gemini API 키
- `DietController`, `RoutineController`, `WorkoutController`: 공공데이터 서비스 키
- 비밀번호가 평문으로 저장됨 → 운영 시 BCrypt 암호화 적용 권장

---

## 📝 개발 히스토리

| 기간 | 주요 작업 |
|------|-----------|
| 2026.01 | 프로젝트 초기 설정, 인증 시스템 구축 |
| 2026.01-02 | 식단·루틴·신체 기록 CRUD 개발 |
| 2026.02 | AI 트레이너, Google Fit 연동, 커뮤니티 게시판 |
| 2026.02-03 | 득근 RPG 시스템 개발 |
| 2026.03 | AWS EC2 배포, CORS 이슈 해결, 모바일 반응형 |

---

## 👨‍💻 개발자

- **강동윤** - Full-Stack Developer
