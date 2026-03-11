import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │        Oauthcallback.jsx - OAuth 팝업 콜백 (범용)            │
 * ├──────────────────────────────────────────────────────────────┤
 * │ 경로: /callback/oauth                                        │
 * │ GoogleCallback.jsx와 역할 동일, React Router useLocation 사용│
 * │                                                              │
 * │ GoogleCallback과 차이점:                                      │
 * │   - useLocation 훅으로 쿼리파라미터 파싱 (React Router 방식)  │
 * │   - window.close() 전 300ms 딜레이 (postMessage 전달 보장)   │
 * └──────────────────────────────────────────────────────────────┘
 */
const Oauthcallback = () => {
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code  = params.get('code');
    const error = params.get('error');

    if (window.opener) {
      if (code) {
        // 인가 코드 → 부모 창으로 전달
        window.opener.postMessage(
          { type: 'GOOGLE_AUTH_CODE', code },
          window.location.origin
        );
      } else {
        // 에러 → 부모 창으로 전달
        window.opener.postMessage(
          { type: 'GOOGLE_AUTH_ERROR', error: error || 'unknown' },
          window.location.origin
        );
      }
    }

    // postMessage가 부모 창에 도달할 시간을 주고 팝업 닫기
    const timer = setTimeout(() => window.close(), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0f0f1a', color: 'white', fontFamily: 'sans-serif', gap: '12px' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(66,133,244,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#4285F4' }}>
        <i className="fab fa-google"></i>
      </div>
      <p style={{ margin: 0, color: '#aaa', fontSize: '0.95rem' }}>인증 완료! 창이 자동으로 닫힙니다...</p>
    </div>
  );
};

export default Oauthcallback;
