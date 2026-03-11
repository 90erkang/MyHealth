import React, { useEffect } from 'react';

/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │         GoogleCallback.jsx - Google OAuth 팝업 콜백          │
 * ├──────────────────────────────────────────────────────────────┤
 * │ 경로: /callback/google                                       │
 * │ 역할: Google OAuth 팝업 창의 최종 착지점                     │
 * │                                                              │
 * │ 처리 흐름:                                                    │
 * │   1. Google이 팝업 창을 이 URL로 리다이렉트                   │
 * │      → URL에 ?code=... 또는 ?error=... 파라미터 포함         │
 * │   2. URL에서 code 또는 error 추출                             │
 * │   3. window.opener(부모 창)로 postMessage 전송               │
 * │      - 성공: { type: 'GOOGLE_AUTH_CODE', code }              │
 * │      - 실패: { type: 'GOOGLE_AUTH_ERROR', error }            │
 * │   4. 팝업 창 자동으로 닫힘 (window.close())                  │
 * │                                                              │
 * │ 부모 창(Main.jsx or GoogleHealthPage.jsx)에서               │
 * │   window.addEventListener('message', ...) 로 code 수신       │
 * │   → api.post('/sync/google-fit', { code }) 로 서버 전달      │
 * └──────────────────────────────────────────────────────────────┘
 */
const GoogleCallback = () => {

  useEffect(() => {
    // URL에서 Google이 전달한 인가 코드(code) 또는 에러 추출
    const params = new URL(window.location.href).searchParams;
    const code  = params.get('code');
    const error = params.get('error');

    if (error) {
      // Google 인증 취소 or 에러 → 부모 창에 에러 알림 후 팝업 닫기
      if (window.opener) {
        window.opener.postMessage(
          { type: 'GOOGLE_AUTH_ERROR', error },
          window.location.origin
        );
      }
      window.close();
      return;
    }

    if (code) {
      console.log('✅ 구글 인증 코드 획득, 부모창으로 전달 중...');
      // 인가 코드를 부모 창으로 전달 (origin 검증으로 XSS 방지)
      if (window.opener) {
        window.opener.postMessage(
          { type: 'GOOGLE_AUTH_CODE', code },
          window.location.origin
        );
      }
      window.close(); // 팝업 닫기
    } else {
      console.error('❌ 인증 코드가 없습니다.');
      if (window.opener) {
        window.opener.postMessage(
          { type: 'GOOGLE_AUTH_ERROR', error: 'no_code' },
          window.location.origin
        );
      }
      window.close();
    }
  }, []);

  // 팝업 창 UI (닫히기 전 잠깐 보이는 화면)
  return (
    <div style={{
      background: '#0a0a0a',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontFamily: 'Pretendard, sans-serif'
    }}>
      <div style={{ position: 'relative', marginBottom: '30px' }}>
        <i className="fas fa-sync-alt fa-spin" style={{ fontSize: '4rem', color: '#4285F4' }}></i>
        <i className="fab fa-google" style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '1.2rem'
        }}></i>
      </div>
      <h2 style={{ fontWeight: '800', fontSize: '1.8rem', margin: '0 0 10px 0' }}>
        인증 완료 중...
      </h2>
      <p style={{ color: '#888', fontSize: '1.1rem', letterSpacing: '-0.5px' }}>
        잠시 후 이 창이 <span style={{ color: '#4285F4' }}>자동으로 닫힙니다</span>.
      </p>
    </div>
  );
};

export default GoogleCallback;
