# 💪 MyHealth — 헬스 관리 통합 플랫폼

> 운동 · 식단 · AI 트레이너 · 커뮤니티를 한 곳에서 관리하는 풀스택 웹 애플리케이션

<br>

## 📌 프로젝트 기본 정보

| 항목 | 내용 |
|------|------|
| 프로젝트명 | MyHealth |
| 개발 기간 | 2025.01.22 ~ 2025.03.28 (약 6주) |
| 개발 유형 | 팀 프로젝트 (풀스택) |
| 서버 포트 | Backend: 8080 / Frontend: 3000 |
| DB | MySQL 8.x · myhealth 데이터베이스 |

### 프로젝트 소개

요즘 운동하는 사람은 많아졌지만 운동 기록, 식단 기록, 커뮤니티가 모두 다른 앱에 흩어져 있다는 불편함에서 출발했습니다.  
MyHealth는 운동 관리부터 식단 기록, Google Fit 실시간 연동, Gemini AI 기반 PT 상담, 피트니스 게이미피케이션, 헬스 커뮤니티까지 하나의 플랫폼에서 제공합니다.

### 주요 기능 요약

| 기능 | 설명 |
|------|------|
| 🔐 회원 인증 | JWT 기반 로그인 / 회원가입 / 이메일 비밀번호 재설정 |
| 📏 마이바디 | 체중·키 기록, BMI 자동 계산, Chart.js 변화 그래프 |
| 🥗 식단 관리 | 공공 식품영양성분 DB 검색, 날짜별 칼로리 기록, 월별 통계 차트 |
| 🏋️ 운동 라이브러리 | MET 기반 칼로리 자동 계산, 카테고리별 운동 검색, 기록 저장 |
| 📋 루틴 관리 | 커스텀 운동 루틴 생성 / 수정 / 삭제, DB 영구 저장 |
| 🤖 AI 트레이너 | Google Gemini 2.5 Flash 기반 PT 상담 챗봇, YouTube 검색 연동 |
| 🎮 피트니스 게임 | 레벨 / 경험치 / 칭호 시스템 (헬린이 → 헬스신) |
| 📋 커뮤니티 | 게시글·댓글 CRUD, 공지사항(ADMIN), 조회수 |
| 🩺 Google Health | Google Fit API OAuth 2.0 연동 — 걸음수·거리·심박수·산소포화도 |

<br>

---

## 🛠 개발 환경 (버전 명세)

### 필수 설치 프로그램

| 도구 | 버전 | 다운로드 |
|------|------|----------|
| Java (JDK) | **17 LTS** | https://adoptium.net |
| Node.js | **18.x 이상** | https://nodejs.org |
| MySQL | **8.0.x** | https://dev.mysql.com/downloads |
| Git | 최신 | https://git-scm.com |
| IDE | IntelliJ IDEA / VS Code 권장 | — |

> ⚠️ Java는 반드시 **17 버전**이어야 합니다. 11이나 21은 Spring Boot 4.x와 호환 문제가 생길 수 있습니다.

### Backend 의존성

| 라이브러리 | 버전 |
|-----------|------|
| Spring Boot | **4.0.2** |
| Spring Security | **6.x** (Spring Boot 내장) |
| Spring Data JPA | **4.0.2** (Spring Boot 내장) |
| JJWT API | **0.12.3** |
| JJWT Impl | **0.12.3** |
| JJWT Jackson | **0.12.3** |
| Spring Boot Mail | **4.0.2** (Spring Boot 내장) |
| Lombok | 최신 (Spring Boot 내장) |
| MySQL Connector/J | 최신 (Spring Boot 내장) |
| Gradle | **8.x** |

### Frontend 의존성

| 라이브러리 | 버전 |
|-----------|------|
| React | **18.3.1** |
| React DOM | **18.3.1** |
| React Router DOM | **6.30.3** |
| Axios | **1.13.5** |
| Chart.js | **4.5.1** |
| react-chartjs-2 | **5.3.1** |
| react-scripts | **5.0.1** |

### 외부 API

| API | 버전 / 방식 | 용도 |
|-----|-----------|------|
| Google Gemini | gemini-2.5-flash | AI 트레이너 챗봇 |
| Google Fit REST API | OAuth 2.0 | 실시간 건강 데이터 |
| 공공데이터포털 식품영양성분 DB | REST API | 식단 칼로리 검색 |
| 공공데이터포털 국민체력100 | REST API | 운동 동영상 검색 |
| 공공데이터포털 보건소 모바일 헬스케어 운동 | REST API | 운동 칼로리 검색 |
| Gmail SMTP | STARTTLS / 587 포트 | 비밀번호 재설정 메일 |

<br>

---

## ⚙️ 설치 및 실행 방법

> 아래 순서대로 따라하면 로컬에서 완전히 동작합니다.

### 0단계 — 저장소 클론

```bash
git clone https://github.com/[your-username]/myhealth.git
cd myhealth
```

---

### 1단계 — MySQL 데이터베이스 설정

**MySQL에 접속합니다.**

```bash
# 터미널에서 MySQL 접속
mysql -u root -p
# 비밀번호 입력 (설치 시 설정한 비밀번호)
```

**DB를 생성합니다.**

```sql
-- DB 생성
CREATE DATABASE myhealth DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 생성 확인
SHOW DATABASES;

-- 접속 종료
EXIT;
```

**init_db.sql 파일을 실행합니다.**

```bash
# 프로젝트 루트에서 실행
mysql -u root -p myhealth < backend/src/main/resources/static/init_db.sql
```

> init_db.sql 실행 후 users, health, diet_log, workout_log, board, board_comment, fitness_game_stats 테이블이 자동으로 생성됩니다.

**정상 생성 확인**

```bash
mysql -u root -p
```

```sql
USE myhealth;
SHOW TABLES;
-- 아래 7개 테이블이 보여야 정상
-- board / board_comment / diet_log / fitness_game_stats / health / users / workout_log
```

---

### 2단계 — 백엔드 설정 및 실행

**application.yaml 파일을 열어 본인 환경에 맞게 수정합니다.**

파일 위치: `backend/src/main/resources/application.yaml`

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/myhealth?useSSL=false&serverTimezone=Asia/Seoul&characterEncoding=UTF-8&allowPublicKeyRetrieval=true
    username:             # ← 본인 MySQL 사용자명으로 변경
    password: ''          # ← 본인 MySQL 비밀번호로 변경
    driver-class-name: com.mysql.cj.jdbc.Driver

  jpa:
    hibernate:
      ddl-auto: update        # 첫 실행 후 validate로 바꾸면 더 안전함
    show-sql: true

  mail:
    host: smtp.gmail.com
    port: 587
    username: your-email@gmail.com      # ← 본인 Gmail 주소로 변경
    password: 'xxxx xxxx xxxx xxxx'     # ← Gmail 앱 비밀번호 16자리 (아래 참고)
    properties:
      mail:
        smtp:
          auth: true
          starttls:
            enable: true

app:
  frontend-url: http://localhost:3000

server:
  port: 8080

jwt:
  secret: myHealthSuperSecretKeyForJWT2026MustBe256BitsLongAtLeast!!
  # 실제 배포 시 최소 32자 이상 랜덤 문자열로 교체 권장
  expiration: 86400000   # 24시간 (밀리초)

google:
  client-id: [Google Cloud Console에서 발급받은 OAuth 클라이언트 ID]
  client-secret: [클라이언트 시크릿]
  redirect-uri: http://localhost:3000/callback.html
```

**Gmail 앱 비밀번호 발급 방법**

```
1. Google 계정(myaccount.google.com) → 보안 탭
2. "2단계 인증" 활성화 (반드시 먼저 켜야 함)
3. 보안 탭 → "앱 비밀번호" 항목 클릭
4. 앱 선택: "메일" / 기기 선택: "Windows 컴퓨터" (아무거나 가능)
5. 생성된 16자리 비밀번호를 application.yaml의 password에 입력
   예: 'abcd efgh ijkl mnop'  (공백 포함해서 그대로 붙여넣기)
```

**백엔드 실행**

```bash
cd backend

# Windows
gradlew.bat bootRun

# Mac / Linux
./gradlew bootRun
```

정상 실행 시 터미널에 아래 메시지가 출력됩니다.

```
Started MyHealthApplication in X.XXX seconds (JVM running for X.XXX)
Tomcat started on port 8080 (http) with context path '/'
```

---

### 3단계 — 프론트엔드 설정 및 실행

```bash
cd frontend

# 패키지 설치 (최초 1회만)
npm install

# 개발 서버 실행
npm start
```

브라우저가 자동으로 `http://localhost:3000` 으로 열립니다.

> `package.json`에 `"proxy": "http://localhost:8080"` 이 설정되어 있어서, 프론트에서 `/api/...` 로 호출하면 자동으로 백엔드 8080 포트로 전달됩니다. 별도 CORS 처리 없이 바로 연동됩니다.

---

### 4단계 — 최초 로그인 확인

init_db.sql 실행 시 테스트 계정이 자동으로 생성됩니다.

| 구분 | 아이디 | 비밀번호 |
|------|--------|----------|
| 일반 사용자 | boss | 1234 |

관리자 계정이 필요하면 MySQL에서 직접 실행:

```sql
USE myhealth;
INSERT INTO users (username, password, email, role) VALUES ('admin', '1234', 'admin@myhealth.com', 'ADMIN');
```

<br>

---

## 🗄 DB 설계 (ERD)

```
┌─────────────────────────────────────────────────────┐
│  users                                              │
│  id(PK) | username(UNIQUE) | password | email      │
│  (UNIQUE) | role(DEFAULT: 'USER')                   │
└──────────┬──────────────────────────────────────────┘
           │ 1:N (ON DELETE CASCADE)
    ┌──────┴──────────────────────────────┐
    │                                     │
    ▼                                     ▼
┌───────────────────────┐   ┌─────────────────────────────────────┐
│  health               │   │  diet_log                           │
│  id(PK)               │   │  id(PK)                             │
│  user_id(FK)          │   │  user_id(FK)                        │
│  weight | height      │   │  meal_name | calories | log_date    │
│  measure_date         │   └─────────────────────────────────────┘
└───────────────────────┘

┌──────────────────────────────────────────────────────┐
│  workout_log                                         │
│  id(PK) | user_id | name | met | time | kcal        │
│  workout_date                                        │
└──────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐    ┌──────────────────────────────────┐
│  board                                      │    │  board_comment                   │
│  id(PK) | title | content | writer | views │───▶│  id(PK)                          │
│  is_notice | created_at                     │1:N │  board_id(FK) | writer | content │
└─────────────────────────────────────────────┘    │  created_at                      │
                                                    └──────────────────────────────────┘

┌───────────────────────────────────────────────────────────────────┐
│  fitness_game_stats                                               │
│  id(PK) | username(UNIQUE) | level | xp | str | hp | maxHp      │
│  title | lastExpDate                                              │
└───────────────────────────────────────────────────────────────────┘
```

> 모든 FK는 `ON DELETE CASCADE` 적용 — 유저 삭제 시 연관 데이터 자동 삭제

<br>

---

## 📁 프로젝트 구조

```
myhealth/
├── backend/
│   ├── build.gradle
│   └── src/main/java/com/myhealth/
│       ├── MyHealthApplication.java
│       ├── config/
│       │   ├── SecurityConfig.java       # Spring Security + JWT 필터 설정, 인증 경로 관리
│       │   └── CorsConfig.java           # CORS 전역 설정 (허용 Origin: localhost:3000)
│       ├── controller/
│       │   ├── AuthController.java       # 로그인 / 회원가입 / 비밀번호 재설정
│       │   ├── AiController.java         # Gemini AI 챗봇 (/api/ai/chat)
│       │   ├── DietController.java       # 식단 CRUD + 공공 식품 DB 검색
│       │   ├── BoardController.java      # 게시판 + 댓글 CRUD
│       │   ├── GameController.java       # 피트니스 게임 경험치 / 레벨
│       │   ├── WorkoutController.java    # 운동 기록 저장 / 조회
│       │   ├── RoutineController.java    # 루틴 생성 / 삭제
│       │   ├── MyBodyController.java     # 체중 · 키 기록
│       │   └── GoogleHealthController.java  # Google Fit 데이터 동기화
│       ├── security/
│       │   ├── JwtUtil.java              # JWT 생성 / 파싱 / 검증 (HMAC-SHA256)
│       │   └── JwtAuthFilter.java        # 매 요청 JWT 검증 → SecurityContext 등록
│       ├── entity/
│       │   ├── User.java
│       │   ├── HealthRecord.java
│       │   ├── DietLog.java
│       │   ├── Board.java
│       │   ├── BoardComment.java
│       │   ├── Routine.java
│       │   ├── GameStats.java
│       │   └── PasswordResetToken.java
│       ├── repository/                   # Spring Data JPA Repository 인터페이스
│       └── service/
│           ├── EmailService.java         # Gmail SMTP 메일 발송
│           └── GoogleHealthService.java  # Google Fit OAuth 토큰 교환 + 데이터 파싱
│
└── frontend/
    ├── package.json
    └── src/
        ├── App.jsx                       # React Router 전체 라우팅 정의
        ├── api.js                        # Axios 인스턴스 + JWT 자동 헤더 인터셉터
        ├── components/
        │   ├── Navbar.jsx
        │   ├── Footer.jsx
        │   └── PageLayout.jsx
        └── pages/
            ├── Login.jsx / Signup.jsx / FindPw.jsx / ResetPw.jsx
            ├── Main.jsx / MyBody.jsx / Diet.jsx / Routine.jsx
            ├── WorkoutLibrary.jsx / AiTrainer.jsx / FitnessGame.jsx
            ├── Board.jsx / BoardDetail.jsx / BoardWrite.jsx
            └── GoogleCallback.jsx / Oauthcallback.jsx / GoogleHealthPage.jsx
```

<br>

---

## 🔐 인증 흐름 (JWT)

```
[1] 클라이언트  →  POST /api/auth/login  { username, password }
[2] AuthController  →  DB 조회  →  비밀번호 일치 확인
[3] JwtUtil.generateToken(username, role)  →  JWT 발급 (유효기간 24h, HMAC-SHA256 서명)
[4] 응답: { token, id, username, role }
[5] 클라이언트  →  localStorage에 token, userId, username, role 저장
[6] 이후 API 요청 시: Authorization: Bearer <token>  헤더 자동 포함 (api.js 인터셉터)
[7] JwtAuthFilter  →  토큰 파싱  →  유효하면 SecurityContext 인증 등록
[8] Controller에서 인증된 사용자로 처리
```

**인증 없이 접근 가능한 API (permitAll)**

```
POST /api/auth/login, /api/auth/signup, /api/auth/find-pw, /api/auth/reset-pw
POST /api/sync/**
GET  /api/board/**, /api/workout/**, /api/diet/**, /api/routine/**, /api/game/**, /api/health/**
```

<br>

---

## 🌐 전체 API 엔드포인트

### 인증 `/api/auth`

| Method | URL | 설명 | 인증 |
|--------|-----|------|------|
| POST | `/api/auth/login` | 로그인 + JWT 발급 | ❌ |
| POST | `/api/auth/signup` | 회원가입 (중복 체크 포함) | ❌ |
| POST | `/api/auth/find-pw` | 비밀번호 재설정 이메일 발송 | ❌ |
| POST | `/api/auth/reset-pw` | 비밀번호 변경 (UUID 토큰 검증) | ❌ |

### 마이바디 / 식단 / 운동 / 루틴

| Method | URL | 설명 | 인증 |
|--------|-----|------|------|
| GET/POST | `/api/health/{username}` | 체중·키 기록 조회/저장 | GET❌ POST✅ |
| GET | `/api/diet/search?query=` | 공공 식품 DB 검색 | ❌ |
| GET/POST/DELETE | `/api/diet/{username}` | 식단 조회/저장/삭제 | GET❌ 나머지✅ |
| GET | `/api/workout/list` | 운동 목록 조회 | ❌ |
| POST | `/api/workout/log` | 운동 기록 저장 | ✅ |
| GET/POST/DELETE | `/api/routine/{username}` | 루틴 관리 | GET❌ 나머지✅ |

### 게시판 `/api/board`

| Method | URL | 설명 | 인증 |
|--------|-----|------|------|
| GET | `/api/board` | 게시글 목록 (공지 상단) | ❌ |
| GET | `/api/board/{id}` | 게시글 상세 + 댓글 + 조회수 증가 | ❌ |
| POST | `/api/board` | 게시글 작성 | ✅ |
| PUT | `/api/board/{id}` | 게시글 수정 | ✅ |
| DELETE | `/api/board/{id}` | 게시글 삭제 | ✅ |
| POST | `/api/board/{id}/comment` | 댓글 작성 | ✅ |
| DELETE | `/api/board/comment/{id}` | 댓글 삭제 | ✅ |

### AI / 게임 / Google Fit

| Method | URL | 설명 | 인증 |
|--------|-----|------|------|
| POST | `/api/ai/chat` | Gemini AI 챗봇 응답 | ✅ |
| GET | `/api/game/{username}` | 게임 스탯 조회 | ❌ |
| POST | `/api/game/save` | 게임 스탯 저장 | ✅ |
| POST | `/api/game/earn-exp` | 경험치 획득 (일 1회 제한) | ✅ |
| POST | `/api/sync/google-fit` | Google Fit 데이터 동기화 | ❌ |

<br>

---

## 🚨 에러 발생 시 처리 방법

---

### ❌ 에러 1 — DB 연결 실패

```
com.mysql.cj.jdbc.exceptions.CommunicationsException: Communications link failure
또는
Failed to obtain JDBC Connection
```

**원인:** MySQL이 실행되지 않았거나 application.yaml의 DB 정보가 틀린 경우

**해결 방법:**

```bash
# MySQL 실행 상태 확인 및 시작
# Windows
net start mysql80       # 또는 net start mysql

# Mac
brew services start mysql

# Linux
sudo systemctl start mysql
sudo systemctl status mysql   # Active: active (running) 이어야 정상
```

```bash
# DB 존재 여부 확인
mysql -u root -p -e "SHOW DATABASES;" | grep myhealth
# 결과에 myhealth가 없으면 1단계(DB 생성)부터 다시 실행
```

application.yaml에서 확인할 것:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/myhealth?...   # DB명 myhealth 맞는지 확인
    username:         # MySQL 계정명 확인 (대소문자 구분 없음)
    password:       # MySQL 비밀번호 확인 (따옴표 안에 정확히 입력)
```

---

### ❌ 에러 2 — 포트 8080 이미 사용 중

```
Web server failed to start. Port 8080 was already in use.
```

**해결 방법:**

```bash
# Windows — 8080 포트 사용 프로세스 확인 후 종료
netstat -ano | findstr :8080
taskkill /PID [위 명령어에서 나온 PID] /F

# Mac / Linux
lsof -i :8080
kill -9 [PID]
```

또는 application.yaml에서 포트 변경 후, package.json proxy도 함께 변경:

```yaml
# application.yaml
server:
  port: 8090
```

```json
// frontend/package.json
"proxy": "http://localhost:8090"
```

---

### ❌ 에러 3 — CORS 오류

```
Access to XMLHttpRequest at 'http://localhost:8080/api/...' has been blocked by CORS policy
```

**원인:** api.js에서 절대경로를 사용하거나, 백엔드가 실행 중이지 않은 경우

**해결 방법:**

```javascript
// frontend/src/api.js 확인
const api = axios.create({
  baseURL: '/api',   // ✅ 반드시 슬래시로 시작하는 상대경로
  // baseURL: 'http://localhost:8080/api'  ← ❌ 절대경로 사용 시 CORS 발생
});
```

그래도 안 되면 백엔드 CorsConfig.java 확인:

```java
// 프론트가 3000 포트인지 확인
config.setAllowedOrigins(List.of("http://localhost:3000"));
```

---

### ❌ 에러 4 — 401 Unauthorized (인증 실패)

```
HTTP 401 Unauthorized
```

**원인:** 토큰이 없거나 만료된 경우

**해결 방법:**

```javascript
// 브라우저 개발자 도구 콘솔(F12)에서 토큰 확인
console.log(localStorage.getItem('token'));
// null 이면 로그인 필요
// 값이 있는데 401이면 24시간 만료 → 재로그인
```

개발 중 만료 불편하면 application.yaml에서 기간 늘리기:

```yaml
jwt:
  expiration: 604800000   # 7일 (기본값 86400000 = 1일)
```

---

### ❌ 에러 5 — 이메일 발송 실패

```
Mail server connection failed
또는
535-5.7.8 Username and Password not accepted
```

**해결 방법:**

```
1. Google 계정(myaccount.google.com) → 보안 → 2단계 인증이 "사용 중" 확인 (필수)
2. 보안 → 앱 비밀번호 → 새 비밀번호 재발급
3. application.yaml의 mail.password를 새 16자리로 교체
   예) 'abcd efgh ijkl mnop'  ← 공백 포함 그대로 입력
4. 백엔드 재시작
```

---

### ❌ 에러 6 — npm install 실패

```
npm ERR! code ERESOLVE
또는
Cannot find module 'react-scripts'
```

**해결 방법:**

```bash
cd frontend
rm -rf node_modules
rm package-lock.json       # Windows: del package-lock.json
npm cache clean --force
npm install
```

Node.js 버전 확인 (18 이상 필요):

```bash
node -v   # v18.x.x 이상이어야 정상
```

---

### ❌ 에러 7 — Gradle 빌드 실패

```
Could not resolve ...
또는
Task :compileJava FAILED
```

**해결 방법:**

```bash
cd backend

# Gradle 캐시 초기화 후 재빌드
# Mac / Linux
./gradlew clean build

# Windows
gradlew.bat clean build

# Java 버전 확인 (반드시 17이어야 함)
java -version
# 출력: openjdk version "17.x.x" 이어야 정상
```

Java 17이 설치됐는데도 다른 버전이 나오면:

```bash
# Windows — 시스템 환경변수 JAVA_HOME 변경
# 제어판 → 시스템 → 고급 시스템 설정 → 환경 변수
# JAVA_HOME = C:\Program Files\Eclipse Adoptium\jdk-17.x.x  (본인 경로)
# Path에서 기존 Java 경로 제거 후 %JAVA_HOME%\bin 추가

# Mac
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
source ~/.zshrc
```

---

### ❌ 에러 8 — Google Fit 동기화 실패 (redirect_uri_mismatch)

```
redirect_uri_mismatch
또는
동기화 실패: 400 Bad Request
```

**해결 방법:**

```
1. Google Cloud Console(console.cloud.google.com) 접속
2. API 및 서비스 → 사용자 인증 정보
3. 해당 OAuth 2.0 클라이언트 ID 클릭
4. "승인된 리디렉션 URI" 항목에 아래 주소 정확히 추가:
   http://localhost:3000/callback.html
5. 저장 후 약 5분 대기 후 재시도
```

application.yaml의 redirect-uri가 위 주소와 완전히 동일한지 확인:

```yaml
google:
  redirect-uri: http://localhost:3000/callback.html   # 등록한 URI와 글자 하나도 다르면 안 됨
```

---

### ❌ 에러 9 — init_db.sql 실행 시 테이블 이미 존재

```
ERROR 1050 (42S01): Table 'xxx' already exists
```

**해결 방법:**

```bash
# DB 전체 초기화 후 재생성
mysql -u root -p
```

```sql
DROP DATABASE IF EXISTS myhealth;
CREATE DATABASE myhealth DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

```bash
# init_db.sql 다시 실행
mysql -u root -p myhealth < backend/src/main/resources/static/init_db.sql
```

---

### 에러 확인 체크리스트

문제가 생겼을 때 아래 순서로 확인하세요.

```
□ MySQL이 실행 중인가?
□ application.yaml DB 계정 정보(username / password)가 맞는가?
□ myhealth 데이터베이스가 존재하는가?
□ 백엔드(8080)가 터미널에서 정상 실행 중인가?
□ 프론트엔드(3000)가 정상 실행 중인가?
□ 브라우저 localStorage에 token이 저장되어 있는가?
□ Java 버전이 17인가? (java -version)
□ Node.js 버전이 18 이상인가? (node -v)
□ api.js의 baseURL이 '/api' (상대경로)인가?
```

<br>
