import axios from 'axios';

/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │                 api.js - Axios 공통 인스턴스                  │
 * ├──────────────────────────────────────────────────────────────┤
 * │ 모든 API 요청에서 import api from '../api' 로 사용            │
 * │                                                              │
 * │ baseURL: AWS EC2 백엔드 서버 직접 주소                        │
 * │   → http://3.36.94.22:8080/api                               │
 * │   ※ 로컬 개발 시 package.json의 proxy 설정과 충돌 주의       │
 * │                                                              │
 * │ 요청 인터셉터: JWT 자동 첨부                                  │
 * │   localStorage의 'token' 키에서 JWT를 꺼내                   │
 * │   Authorization: Bearer {token} 헤더로 자동 주입             │
 * │                                                              │
 * │ 응답 인터셉터: 401 자동 로그아웃                              │
 * │   인증 만료 시 localStorage 전체 삭제 후 로그인 페이지 이동  │
 * └──────────────────────────────────────────────────────────────┘
 */
const api = axios.create({
  baseURL: 'http://3.36.94.22:8080/api', // AWS EC2 백엔드 서버
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── 요청 인터셉터 ──────────────────────────────────────────────
// 모든 API 요청에 JWT 토큰을 Authorization 헤더로 자동 첨부
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // 로그인 시 저장된 JWT
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── 응답 인터셉터 ──────────────────────────────────────────────
// 성공 응답: 그대로 통과
// 401 에러: 토큰 만료 or 미인증 → 자동 로그아웃 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.clear();           // 토큰·사용자 정보 전부 삭제
      window.location.href = '/';     // 로그인 페이지로 강제 이동
    }
    return Promise.reject(error);
  }
);

export default api;
