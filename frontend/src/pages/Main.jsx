/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │           Main.jsx - 메인 대시보드 + Google Health 모달       │
 * ├──────────────────────────────────────────────────────────────┤
 * │ 경로: /main                                                  │
 * │                                                              │
 * │ 구성:                                                         │
 * │   1. 메뉴 카드 그리드 (7개 기능 + Google Health 카드)         │
 * │   2. GoogleHealthModal 컴포넌트 (모달 팝업)                   │
 * │                                                              │
 * │ GoogleHealthModal 처리 흐름:                                  │
 * │   1. 동기화 버튼 클릭 → Google OAuth 팝업 창 열기            │
 * │   2. 팝업에서 window.postMessage로 인가 코드 수신             │
 * │   3. POST /api/sync/google-fit { code } → 서버가 토큰 교환   │
 * │   4. 응답 데이터(걸음수/거리/심박수 등) → localStorage 저장  │
 * │   5. 모달에 수치 표시 (재방문 시 localStorage에서 복원)       │
 * │                                                              │
 * │ 모바일(≤430px): 2열 그리드, 카드 높이 100px                   │
 * │ 데스크탑: auto-fit 그리드 (minmax 280px)                      │
 * │                                                              │
 * │ Google OAuth 파라미터:                                        │
 * │   CLIENT_ID   : Google Cloud Console 클라이언트 ID           │
 * │   REDIRECT_URI: http://myhealth90.online/callback.html       │
 * │   SCOPES: fitness.activity, location, heart_rate, body, oxygen│
 * └──────────────────────────────────────────────────────────────┘
 */
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import PageLayout from '../components/PageLayout';
import '../common.css';

// ─────────────────────────────────────────────────────────────
// GoogleHealthModal: Main 페이지의 구글 연동 팝업
//   - Google OAuth 팝업 → postMessage → /api/sync/google-fit
//   - 결과를 localStorage(todaySteps 등)에 캐싱
// ─────────────────────────────────────────────────────────────
// ───────────── Google Health 모달 팝업 ─────────────
const GoogleHealthModal = ({ onClose }) => {
  const [googleData, setGoogleData] = useState({
    steps: 0, distance: 0, heartRate: 0, temp: 0, oxygen: 0
  });
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  const CLIENT_ID = "633364696564-uli3mc186vnaps06jn0fn3qokb24t27l.apps.googleusercontent.com";
  const REDIRECT_URI = "http://myhealth90.online/callback.html";

  useEffect(() => {
    setGoogleData({
      steps:     Number(localStorage.getItem('todaySteps')     || 0),
      distance:  Number(localStorage.getItem('todayDistance')  || 0),
      heartRate: Number(localStorage.getItem('todayHeartRate') || 0),
      temp:      Number(localStorage.getItem('todayTemp')      || 0),
      oxygen:    Number(localStorage.getItem('todayOxygen')    || 0),
    });

    const handleMessage = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'GOOGLE_AUTH_CODE') {
        if (pollRef.current) clearInterval(pollRef.current);
        handleCallbackCode(event.data.code);
      }
      if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
        setError('Google 인증이 취소되었습니다.');
        setSyncing(false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleCallbackCode = async (code) => {
    setSyncing(true);
    setError(null);
    try {
      const res = await api.post('/sync/google-fit', { code });
      const data = res.data;
      const newData = {
        steps:     data.steps     || 0,
        distance:  data.distance  || 0,
        heartRate: data.heartRate || 0,
        temp:      data.temp      || 0,
        oxygen:    data.oxygen    || 0,
      };
      setGoogleData(newData);
      localStorage.setItem('todaySteps',     newData.steps);
      localStorage.setItem('todayDistance',  newData.distance);
      localStorage.setItem('todayHeartRate', newData.heartRate);
      localStorage.setItem('todayTemp',      newData.temp);
      localStorage.setItem('todayOxygen',    newData.oxygen);
      setSynced(true);
    } catch (e) {
      setError('Google 데이터 동기화에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setSyncing(false);
    }
  };

  const handleGoogleSync = () => {
    setError(null);
    setSynced(false);

    const SCOPES = [
      "https://www.googleapis.com/auth/fitness.activity.read",
      "https://www.googleapis.com/auth/fitness.location.read",
      "https://www.googleapis.com/auth/fitness.heart_rate.read",
      "https://www.googleapis.com/auth/fitness.body.read",
      "https://www.googleapis.com/auth/fitness.oxygen_saturation.read"
    ].join(" ");

    const authUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `response_type=code&` +
      `scope=${encodeURIComponent(SCOPES)}&` +
      `access_type=offline&` +
      `prompt=consent`;

    const w = 500, h = 650;
    const left = window.screenX + (window.outerWidth - w) / 2;
    const top  = window.screenY + (window.outerHeight - h) / 2;

    const popup = window.open(
      authUrl,
      'GoogleAuth',
      `width=${w},height=${h},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes,resizable=yes`
    );

    if (!popup) {
      setError('팝업이 차단되었습니다. 브라우저에서 팝업을 허용한 후 다시 시도해주세요.');
      return;
    }

    setSyncing(true);

    pollRef.current = setInterval(() => {
      if (popup.closed) {
        clearInterval(pollRef.current);
        setSyncing((prev) => {
          if (prev) setError('Google 인증이 취소되었습니다.');
          return false;
        });
      }
    }, 500);
  };

  const hasSavedData = googleData.steps > 0 || googleData.distance > 0 || googleData.heartRate > 0;

  const metrics = [
    { key: 'steps',     label: '걸음 수',    value: googleData.steps.toLocaleString(),                        unit: '보',   color: '#4285F4', icon: 'fas fa-shoe-prints' },
    { key: 'distance',  label: '이동 거리',  value: (googleData.distance / 1000).toFixed(2),                  unit: 'km',  color: '#3498db', icon: 'fas fa-route' },
    { key: 'heartRate', label: '심박수',     value: googleData.heartRate || '--',                             unit: 'bpm', color: '#e74c3c', icon: 'fas fa-heartbeat' },
    { key: 'temp',      label: '체온',       value: googleData.temp > 0 ? googleData.temp.toFixed(1) : '--', unit: '°C',  color: '#f1c40f', icon: 'fas fa-thermometer-half' },
    { key: 'oxygen',    label: '산소포화도', value: googleData.oxygen || '--',                                unit: '%',   color: '#1abc9c', icon: 'fas fa-lungs' },
  ];

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', zIndex: 1000, animation: 'fadeIn 0.2s ease' }} />

      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'min(600px, 92vw)', maxHeight: '85vh', overflowY: 'auto', background: 'linear-gradient(145deg, #1a1a2e, #16213e)', border: '1px solid rgba(66,133,244,0.35)', borderRadius: '28px', padding: '32px', zIndex: 1001, animation: 'slideUp 0.25s ease', scrollbarWidth: 'none' }}>

        <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'rgba(255,255,255,0.08)', border: 'none', color: '#aaa', fontSize: '18px', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <i className="fas fa-times"></i>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(66,133,244,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#4285F4' }}>
            <i className="fab fa-google"></i>
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: '800', color: 'white' }}>Google Health</h2>
            <p style={{ margin: 0, color: '#888', fontSize: '0.82rem' }}>Google Fit 오늘의 건강 데이터</p>
          </div>
        </div>

        {syncing && (
          <div style={{ background: 'rgba(66,133,244,0.12)', border: '1px solid rgba(66,133,244,0.4)', borderRadius: '12px', padding: '12px 18px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px', color: '#4285F4', fontSize: '0.9rem' }}>
            <i className="fas fa-spinner fa-spin"></i>
            <span>새 창에서 Google 로그인을 완료해주세요...</span>
          </div>
        )}
        {synced && !syncing && (
          <div style={{ background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.4)', borderRadius: '12px', padding: '12px 18px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px', color: '#2ecc71', fontSize: '0.9rem' }}>
            <i className="fas fa-check-circle"></i> 동기화 완료!
          </div>
        )}
        {error && (
          <div style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.4)', borderRadius: '12px', padding: '12px 18px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px', color: '#e74c3c', fontSize: '0.9rem' }}>
            <i className="fas fa-exclamation-triangle"></i> {error}
          </div>
        )}

        <div style={{ background: 'rgba(66,133,244,0.08)', border: '1px solid rgba(66,133,244,0.2)', borderRadius: '16px', padding: '20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: '0 0 4px 0', color: 'white', fontWeight: '600', fontSize: '0.9rem' }}>Google 계정 연동</p>
            <p style={{ margin: 0, color: '#777', fontSize: '0.8rem' }}>클릭하면 새 창으로 Google 로그인이 열립니다.</p>
          </div>
          <button onClick={handleGoogleSync} disabled={syncing} style={{ background: syncing ? '#555' : '#4285F4', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: syncing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', whiteSpace: 'nowrap', transition: 'all 0.2s' }}>
            <i className={`fas ${syncing ? 'fa-spinner fa-spin' : 'fa-sync-alt'}`}></i>
            {syncing ? '인증 대기 중...' : '동기화'}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
          {metrics.map((m) => (
            <div key={m.key} style={{ background: `${m.color}11`, border: `1px solid ${m.color}33`, borderRadius: '16px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className={m.icon} style={{ color: m.color, fontSize: '14px' }}></i>
                <span style={{ color: '#999', fontSize: '0.78rem' }}>{m.label}</span>
              </div>
              <div>
                <span style={{ fontSize: '1.5rem', fontWeight: '800', color: m.color }}>{m.value}</span>
                <span style={{ fontSize: '0.8rem', color: '#aaa', marginLeft: '4px' }}>{m.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {!hasSavedData && !syncing && (
          <div style={{ marginTop: '20px', textAlign: 'center', padding: '24px', color: '#555', background: 'rgba(255,255,255,0.02)', borderRadius: '14px', border: '1px dashed rgba(255,255,255,0.08)' }}>
            <i className="fab fa-google" style={{ fontSize: '32px', color: '#4285F4', opacity: 0.35 }}></i>
            <p style={{ marginTop: '10px', fontSize: '0.85rem' }}>동기화된 데이터가 없습니다.<br />위 버튼으로 연동해보세요!</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translate(-50%, -45%) } to { opacity: 1; transform: translate(-50%, -50%) } }
      `}</style>
    </>
  );
};


// ─────────────────────────────────────────────────────────────
// Main: 대시보드 메인 페이지
//   - menuItems 배열로 카드 목록 렌더링
//   - Google Health 카드는 Link 대신 onClick으로 모달 토글
// ─────────────────────────────────────────────────────────────
// ───────────── Main 컴포넌트 ─────────────
const Main = () => {
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const isMobile = window.innerWidth <= 430;

  const styles = {
    cardGrid: { 
  display: 'grid', 
  gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(280px, 1fr))', 
  gap: isMobile ? '10px' : '20px', 
  marginBottom: '40px' 
},
    card: { background: 'linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))', backdropFilter: 'blur(15px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: isMobile ? '16px' : '24px', padding: isMobile ? '14px 12px' : '30px', minHeight: isMobile ? '90px' : 'auto', height: isMobile ? '100px' : 'auto', color: 'white', textDecoration: 'none', display: 'flex', flexDirection: 'column', transition: 'all 0.3s', position: 'relative', cursor: 'pointer' },
  };

  const menuItems = [
    { to: '/my-body',         icon: 'heartbeat',    title: '신체 데이터',    desc: 'BMI 및 체중 변화 분석' },
    { to: '/diet',            icon: 'utensils',     title: '식단 기록',      desc: '오늘 먹은 칼로리 체크' },
    { to: '/workout-library', icon: 'running',      title: '운동 도감',      desc: '전문가용 운동 가이드' },
    { to: '/ai-trainer',      icon: 'robot',        title: 'AI 코칭',        desc: 'Gemini의 정밀 식단 분석', badge: 'LIVE' },
    { to: '/routine',         icon: 'calendar-alt', title: '워크아웃 루틴',  desc: '나만의 운동 스케줄링' },
    { to: '/board',           icon: 'comments',     title: '커뮤니티',       desc: '헬창들의 정보 공유 공간' },
    { to: '/fitness-game',    icon: 'gamepad',      title: '득근 RPG',       desc: '근손실 괴물을 물리쳐라!', badge: 'GAME' },
  ];

  return (
    <PageLayout maxWidth="1200px">
      <div style={styles.cardGrid}>
        {menuItems.map((item, idx) => (
          <Link key={idx} to={item.to} className="main-card" style={styles.card}>
            {item.badge && <span className="hot-badge">{item.badge}</span>}
            <div style={{ width: isMobile ? '38px' : '50px', height: isMobile ? '38px' : '50px', borderRadius: '14px', background: 'rgba(230,126,34,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? '18px' : '24px', color: '#e67e22', marginBottom: isMobile ? '12px' : '20px' }}>
              <i className={`fas fa-${item.icon}`}></i>
            </div>
            <h3 style={{ fontSize: isMobile ? '0.95rem' : '1.2rem', fontWeight: '700', margin: '0 0 6px 0' }}>{item.title}</h3>
            {!isMobile && <p style={{ fontSize: '0.85rem', color: '#888', margin: 0 }}>{item.desc}</p>}
          </Link>
        ))}

        {/* Google Health 카드 → 클릭 시 모달 팝업 */}
        <div className="main-card" onClick={() => setShowGoogleModal(true)} style={{ ...styles.card, background: 'linear-gradient(145deg, rgba(66,133,244,0.12), rgba(66,133,244,0.05))', border: '1px solid rgba(66,133,244,0.3)' }}>
          <span className="hot-badge" style={{ background: '#4285F4' }}>SYNC</span>
          <div style={{ width: isMobile ? '38px' : '50px', height: isMobile ? '38px' : '50px', borderRadius: '14px', background: 'rgba(66,133,244,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? '18px' : '24px', color: '#4285F4', marginBottom: isMobile ? '12px' : '20px' }}>
            <i className="fab fa-google"></i>
          </div>
          <h3 style={{ fontSize: isMobile ? '0.95rem' : '1.2rem', fontWeight: '700', margin: '0 0 6px 0' }}>Google Health</h3>
          {!isMobile && <p style={{ fontSize: '0.85rem', color: '#888', margin: 0 }}>구글 피트니스 데이터 연동</p>}
        </div>
      </div>

      {showGoogleModal && <GoogleHealthModal onClose={() => setShowGoogleModal(false)} />}

      <style>{`
        .main-card:hover { transform: translateY(-6px); background: rgba(255,255,255,0.1) !important; border-color: #e67e22 !important; }
        .hot-badge { position: absolute; top: 10px; right: 10px; background: #e67e22; color: white; font-size: 9px; padding: 2px 6px; border-radius: 10px; font-weight: bold; }
      `}</style>
    </PageLayout>
  );
};

export default Main;