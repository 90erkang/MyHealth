import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │                  App.jsx - 최상위 라우터                      │
 * ├──────────────────────────────────────────────────────────────┤
 * │ React Router v6 기반 페이지 라우팅 설정                       │
 * │                                                              │
 * │ 페이지 목록:                                                  │
 * │   /              → Login (로그인)                             │
 * │   /signup        → Signup (회원가입)                          │
 * │   /find-pw       → FindPw (비밀번호 찾기)                     │
 * │   /reset-pw      → ResetPw (비밀번호 재설정)                  │
 * │   /main          → Main (메인 대시보드)                        │
 * │   /my-body       → MyBody (신체 기록·차트)                    │
 * │   /diet          → Diet (식단 관리)                           │
 * │   /routine       → Routine (운동 루틴)                        │
 * │   /ai-trainer    → AiTrainer (Gemini AI 챗봇)                 │
 * │   /workout-library → WorkoutLibrary (운동 영상 라이브러리)    │
 * │   /fitness-game  → FitnessGame (득근 RPG)                     │
 * │   /board         → Board (게시판 목록)                         │
 * │   /board/:id     → BoardDetail (게시글 상세)                   │
 * │   /board/write   → BoardWrite (게시글 작성)                    │
 * │   /board/edit/:id → BoardWrite (게시글 수정)                  │
 * │   /callback/google → GoogleCallback (Google OAuth 팝업용)     │
 * │   /callback/oauth  → Oauthcallback (OAuth 콜백 처리)          │
 * │   /google-health → GoogleHealthPage (Google Fit 연동 페이지)  │
 * │   /terms, /privacy, /support → 푸터 상세 페이지               │
 * │                                                              │
 * │ WorkoutLibrary는 Code Splitting (lazy loading) 적용          │
 * │   → 초기 번들 크기 절감, Suspense로 로딩 UI 표시             │
 * └──────────────────────────────────────────────────────────────┘
 */

// ── 페이지 임포트 (정적 로드) ──
import GoogleCallback from './pages/GoogleCallback';
import GoogleHealthPage from './pages/GoogleHealthPage';
import OAuthCallback from './pages/Oauthcallback';
import Login from './pages/Login';
import Signup from './pages/Signup';
import FindPw from './pages/FindPw';
import Main from './pages/Main';
import MyBody from './pages/MyBody';
import Diet from './pages/Diet';
import Routine from './pages/Routine';
import AiTrainer from './pages/AiTrainer';
import Board      from './pages/Board';
import BoardDetail from './pages/BoardDetail';
import BoardWrite  from './pages/BoardWrite';
import FitnessGame from './pages/FitnessGame';
import ResetPw from './pages/ResetPw';

// 푸터 상세 페이지
import Terms from './components/Footerfile/Terms';
import Privacy from './components/Footerfile/Privacy';
import Support from './components/Footerfile/Support';

// WorkoutLibrary는 lazy 로딩 (무거운 운동 영상 목록 → 필요 시에만 로드)
const WorkoutLibrary = lazy(() => import('./pages/WorkoutLibrary'));

function App() {
  return (
    <BrowserRouter>
      {/*
        PageLayout 내부에서 Footer를 렌더링하므로
        App 레벨에서는 Footer 별도 호출 불필요
      */}
      <Suspense fallback={
        <div style={{ color: 'white', textAlign: 'center', marginTop: '50px' }}>
          페이지 로딩 중...
        </div>
      }>
        <Routes>
          {/* ── 인증 ── */}
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/find-pw" element={<FindPw />} />
          <Route path="/reset-pw" element={<ResetPw />} />

          {/* ── 메인 기능 ── */}
          <Route path="/main" element={<Main />} />
          <Route path="/my-body" element={<MyBody />} />
          <Route path="/diet" element={<Diet />} />
          <Route path="/routine" element={<Routine />} />
          <Route path="/ai-trainer" element={<AiTrainer />} />
          <Route path="/workout-library" element={<WorkoutLibrary />} />
          <Route path="/fitness-game" element={<FitnessGame />} />

          {/* ── Google OAuth 콜백 ── */}
          <Route path="/callback/google" element={<GoogleCallback />} />
          <Route path="/callback/oauth" element={<OAuthCallback />} />
          <Route path="/google-health" element={<GoogleHealthPage />} />

          {/* ── 게시판 ── */}
          <Route path="/board" element={<Board />} />
          <Route path="/board/:id" element={<BoardDetail />} />
          <Route path="/board/write" element={<BoardWrite />} />
          <Route path="/board/edit/:id" element={<BoardWrite />} />

          {/* ── 푸터 페이지 (팝업) ── */}
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/support" element={<Support />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
