/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │        GoogleHealthPage.jsx - Google Fit 연동 전용 페이지     │
 * ├──────────────────────────────────────────────────────────────┤
 * │ 경로: /google-health                                         │
 * │ (Main.jsx의 GoogleHealthModal과 동일 기능, 독립 페이지 버전)  │
 * │                                                              │
 * │ API: POST /api/sync/google-fit { code }                      │
 * │                                                              │
 * │ 추가 기능 (Main 모달에는 없는 것):                             │
 * │   syncStepsToRoutine(): 구글 걷기 → 루틴 자동 저장           │
 * │     - 하루 1회만 동기화 (localStorage syncKey로 중복 방지)   │
 * │     - 걸음수 → 분(분당 100보), 거리 → kcal(km × 60) 환산    │
 * │     - POST /api/routine/{username}에 걷기 항목 추가          │
 * │                                                              │
 * │ Google OAuth 파라미터:                                        │
 * │   CLIENT_ID   : 633364696564-uli3mc186vnaps06jn0fn3qokb24t27l│
 * │   REDIRECT_URI: http://myhealth90.online/callback.html       │
 * └──────────────────────────────────────────────────────────────┘
 */
import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import PageLayout from '../components/PageLayout';

const GoogleHealthPage = () => {
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
    // 저장된 데이터 불러오기
    setGoogleData({
      steps:     Number(localStorage.getItem('todaySteps')     || 0),
      distance:  Number(localStorage.getItem('todayDistance')  || 0),
      heartRate: Number(localStorage.getItem('todayHeartRate') || 0),
      temp:      Number(localStorage.getItem('todayTemp')      || 0),
      oxygen:    Number(localStorage.getItem('todayOxygen')    || 0),
    });

    // ✅ 팝업 창에서 postMessage로 code 수신
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

  // ✅ 걸음수 + 거리 → 루틴 칼로리/시간 환산 후 오늘 루틴에 자동 저장 (하루 1회)
  const syncStepsToRoutine = async (steps, distanceM) => {
    const username = localStorage.getItem('username');
    if (!username || steps <= 0) return { synced: false, reason: 'no_data' };

    const today = new Date().toISOString().split('T')[0];
    const syncKey = `google_routine_synced_${today}`;
    if (localStorage.getItem(syncKey)) return { synced: false, reason: 'already_synced' };

    // 걸음수 → 운동 시간(분): 분당 100보 기준
    const walkMinutes = Math.round(steps / 100);
    if (walkMinutes < 1) return { synced: false, reason: 'too_short' };

    // 거리 기반 kcal 보완: km당 60kcal (평균 체중 65kg 기준)
    const distanceKm = distanceM / 1000;
    const kcalByDistance = Math.round(distanceKm * 60);

    // MET 기반 kcal: 걷기 MET 3.5
    const MET_WALK = 3.5;
    const kcalByMet = Math.round(MET_WALK * 65 * (walkMinutes / 60));

    // 둘 중 더 높은 값 사용 (거리 데이터가 있으면 우선)
    const kcal = distanceKm > 0 ? Math.max(kcalByDistance, kcalByMet) : kcalByMet;

    const workout = {
      name: `🚶 구글 걷기 (${steps.toLocaleString()}보 · ${distanceKm.toFixed(2)}km)`,
      met:  MET_WALK,
      time: walkMinutes,
      kcal,
    };

    try {
      // 기존 오늘 루틴 먼저 조회 (기존 항목 보존)
      const existing = await api.get(`/routine/${username}`, {
        params: { year: new Date().getFullYear(), month: new Date().getMonth() + 1 }
      });
      const todayWorkouts = (existing.data || [])
        .filter(w => w.workoutDate === today)
        .map(w => ({ name: w.name, met: w.met, time: w.time, kcal: w.kcal }));

      // 이미 구글 걷기 항목이 있으면 스킵
      const alreadyHasGoogle = todayWorkouts.some(w => w.name?.startsWith('🚶 구글 걷기'));
      if (alreadyHasGoogle) {
        localStorage.setItem(syncKey, '1');
        return { synced: false, reason: 'already_has_google_entry' };
      }

      // 기존 + 새 항목 합쳐서 저장
      await api.post(`/routine/${username}`, {
        date: today,
        workouts: [...todayWorkouts, workout],
      });

      localStorage.setItem(syncKey, '1');
      return { synced: true, kcal, walkMinutes, distanceKm };
    } catch (e) {
      console.error('루틴 자동 저장 실패:', e);
      return { synced: false, reason: 'api_error' };
    }
  };

  const [routineSyncResult, setRoutineSyncResult] = useState(null);

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

      // ✅ 걸음수 → 루틴 자동 저장
      const result = await syncStepsToRoutine(newData.steps, newData.distance);
      setRoutineSyncResult(result);
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

    // ✅ window.open으로 팝업 창 열기 (페이지 이동 없음!)
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

    // 팝업을 그냥 닫은 경우 감지
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
    { key: 'steps',     label: '걸음 수',    value: googleData.steps.toLocaleString(),                        unit: '보',   color: '#4285F4', icon: 'fas fa-shoe-prints',      desc: '오늘 걸은 총 걸음 수' },
    { key: 'distance',  label: '이동 거리',  value: (googleData.distance / 1000).toFixed(2),                  unit: 'km',  color: '#3498db', icon: 'fas fa-route',            desc: '오늘 이동한 총 거리' },
    { key: 'heartRate', label: '심박수',     value: googleData.heartRate || '--',                             unit: 'bpm', color: '#e74c3c', icon: 'fas fa-heartbeat',        desc: '최근 측정된 심박수' },
    { key: 'temp',      label: '체온',       value: googleData.temp > 0 ? googleData.temp.toFixed(1) : '--', unit: '°C',  color: '#f1c40f', icon: 'fas fa-thermometer-half', desc: '최근 측정된 체온' },
    { key: 'oxygen',    label: '산소포화도', value: googleData.oxygen || '--',                                unit: '%',   color: '#1abc9c', icon: 'fas fa-lungs',            desc: '혈중 산소 포화도' },
  ];

  return (
    <PageLayout maxWidth="900px">

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(66,133,244,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: '#4285F4' }}>
          <i className="fab fa-google"></i>
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '800', color: 'white' }}>Google Health</h1>
          <p style={{ margin: 0, color: '#888', fontSize: '0.9rem' }}>Google Fit에서 오늘의 건강 데이터를 가져옵니다</p>
        </div>
      </div>

      {/* 상태 배너 */}
      {syncing && (
        <div style={{ background: 'rgba(66,133,244,0.12)', border: '1px solid rgba(66,133,244,0.4)', borderRadius: '14px', padding: '16px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', color: '#4285F4' }}>
          <i className="fas fa-spinner fa-spin"></i>
          <span style={{ fontWeight: '600' }}>Google 로그인 팝업에서 인증을 완료해주세요...</span>
        </div>
      )}
      {synced && !syncing && (
        <div style={{ background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.4)', borderRadius: '14px', padding: '16px 24px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', color: '#2ecc71' }}>
          <i className="fas fa-check-circle"></i>
          <span style={{ fontWeight: '600' }}>동기화 완료! 최신 데이터가 반영되었습니다.</span>
        </div>
      )}

      {/* ✅ 루틴 자동 저장 결과 배너 */}
      {routineSyncResult?.synced && (
        <div style={{ background: 'rgba(52,152,219,0.1)', border: '1px solid rgba(52,152,219,0.4)', borderRadius: '14px', padding: '16px 24px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', color: '#3498db' }}>
          <i className="fas fa-running"></i>
          <div>
            <div style={{ fontWeight: '600' }}>💪 오늘 걷기 운동이 루틴에 자동 저장되었습니다!</div>
            <div style={{ fontSize: '0.85rem', color: '#aaa', marginTop: '4px' }}>
              {routineSyncResult.walkMinutes}분 · {routineSyncResult.distanceKm.toFixed(2)}km · {routineSyncResult.kcal} kcal 소모
            </div>
          </div>
        </div>
      )}
      {routineSyncResult?.synced === false && routineSyncResult?.reason === 'already_synced' && (
        <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '14px 24px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', color: '#888' }}>
          <i className="fas fa-info-circle"></i>
          <span style={{ fontSize: '0.9rem' }}>오늘 걷기 운동은 이미 루틴에 저장되어 있습니다. (하루 1회 자동 저장)</span>
        </div>
      )}
      {error && (
        <div style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.4)', borderRadius: '14px', padding: '16px 24px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px', color: '#e74c3c' }}>
          <i className="fas fa-exclamation-triangle"></i>
          <span>{error}</span>
        </div>
      )}

      {/* 동기화 버튼 영역 */}
      <div style={{ background: 'linear-gradient(145deg, rgba(66,133,244,0.1), rgba(66,133,244,0.04))', border: '1px solid rgba(66,133,244,0.25)', borderRadius: '20px', padding: '28px', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ margin: '0 0 6px 0', color: 'white', fontSize: '1.1rem', fontWeight: '700' }}>Google 계정 연동</h3>
          <p style={{ margin: 0, color: '#888', fontSize: '0.85rem' }}>
            버튼을 누르면 <b style={{ color: '#ccc' }}>팝업 창</b>으로 Google 로그인이 열립니다.<br />
            로그인 후 자동으로 이 페이지에 데이터가 불러와집니다.
          </p>
        </div>
        <button
          onClick={handleGoogleSync}
          disabled={syncing}
          style={{ background: syncing ? '#555' : '#4285F4', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '12px', fontWeight: 'bold', cursor: syncing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.95rem', transition: 'all 0.2s', whiteSpace: 'nowrap' }}
        >
          <i className={`fas ${syncing ? 'fa-spinner fa-spin' : 'fa-sync-alt'}`}></i>
          {syncing ? '인증 대기 중...' : 'Google Fit 동기화'}
        </button>
      </div>

      {/* 데이터 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        {metrics.map((m) => (
          <div key={m.key} className="gh-card" style={{ background: `${m.color}11`, border: `1px solid ${m.color}33`, borderRadius: '20px', padding: '28px', display: 'flex', flexDirection: 'column', gap: '12px', transition: 'transform 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${m.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: m.color }}>
                <i className={m.icon}></i>
              </div>
              <span style={{ color: '#aaa', fontSize: '0.85rem' }}>{m.label}</span>
            </div>
            <div>
              <span style={{ fontSize: '2rem', fontWeight: '800', color: m.color }}>{m.value}</span>
              <span style={{ fontSize: '0.9rem', color: '#aaa', marginLeft: '6px' }}>{m.unit}</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: '#666' }}>{m.desc}</p>
          </div>
        ))}
      </div>

      {!hasSavedData && !syncing && (
        <div style={{ marginTop: '28px', textAlign: 'center', padding: '40px', color: '#555', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.08)' }}>
          <i className="fab fa-google" style={{ fontSize: '40px', color: '#4285F4', opacity: 0.4 }}></i>
          <p style={{ marginTop: '16px', fontSize: '0.95rem' }}>아직 동기화된 데이터가 없습니다.<br />위 버튼을 눌러 Google Fit과 연동해보세요!</p>
        </div>
      )}

      <style>{`.gh-card:hover { transform: translateY(-4px); }`}</style>
    </PageLayout>
  );
};

export default GoogleHealthPage;
