import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │              Navbar.jsx - 상단 공통 네비게이션 바             │
 * ├──────────────────────────────────────────────────────────────┤
 * │ PageLayout에 포함되어 모든 내부 페이지 상단에 렌더링          │
 * │                                                              │
 * │ 표시 정보:                                                    │
 * │   - 실시간 시계 (1초 갱신)                                    │
 * │   - 날씨 (Open-Meteo API, 서울 기준, 20분마다 자동 갱신)     │
 * │   - 사용자명 + BMI 상태 (정상/과체중/비만/저체중)            │
 * │   - EXIT 버튼 (로그아웃 → localStorage 전체 삭제)            │
 * │                                                              │
 * │ 모바일(≤430px): 2행 레이아웃                                  │
 * │   1행: 시계 / 날씨 / EXIT 버튼                               │
 * │   2행: MY HEALTH 로고 / 사용자명                              │
 * │ 데스크탑: 3열 레이아웃 (좌: 시계+날씨 / 중: 로고 / 우: 유저) │
 * │                                                              │
 * │ 날씨 API: Open-Meteo (무료, 키 불필요)                        │
 * │   https://api.open-meteo.com/v1/forecast                    │
 * │   latitude=37.5665, longitude=126.9780 (서울 시청 기준)      │
 * └──────────────────────────────────────────────────────────────┘
 */

// WMO 날씨 코드 → FontAwesome 아이콘/색상 매핑 테이블
const weatherIconMap = {
  0:  { icon: "fa-sun",                 color: "#f1c40f" }, // 맑음
  1:  { icon: "fa-sun",                 color: "#f1c40f" }, // 주로 맑음
  2:  { icon: "fa-cloud-sun",           color: "#f1c40f" }, // 구름 조금
  3:  { icon: "fa-cloud",               color: "#bdc3c7" }, // 흐림
  45: { icon: "fa-smog",                color: "#bdc3c7" }, // 안개
  48: { icon: "fa-smog",                color: "#bdc3c7" }, // 상고대 안개
  51: { icon: "fa-cloud-rain",          color: "#74b9ff" }, // 이슬비(약)
  53: { icon: "fa-cloud-rain",          color: "#74b9ff" }, // 이슬비(중)
  55: { icon: "fa-cloud-rain",          color: "#74b9ff" }, // 이슬비(강)
  61: { icon: "fa-cloud-rain",          color: "#74b9ff" }, // 비(약)
  63: { icon: "fa-cloud-rain",          color: "#0984e3" }, // 비(중)
  65: { icon: "fa-cloud-showers-heavy", color: "#0984e3" }, // 비(강)
  71: { icon: "fa-snowflake",           color: "#dfe6e9" }, // 눈(약)
  73: { icon: "fa-snowflake",           color: "#dfe6e9" }, // 눈(중)
  75: { icon: "fa-snowflake",           color: "#dfe6e9" }, // 눈(강)
  80: { icon: "fa-cloud-rain",          color: "#74b9ff" }, // 소나기(약)
  81: { icon: "fa-cloud-rain",          color: "#0984e3" }, // 소나기(중)
  82: { icon: "fa-cloud-showers-heavy", color: "#0984e3" }, // 소나기(강)
  95: { icon: "fa-bolt",                color: "#fdcb6e" }, // 뇌우
  96: { icon: "fa-bolt",                color: "#fdcb6e" }, // 뇌우+약한 우박
  99: { icon: "fa-bolt",                color: "#fdcb6e" }, // 뇌우+강한 우박
};

/** WMO 코드로 아이콘 반환 (코드 테이블에 없으면 범위로 폴백) */
const getWeatherIcon = (code) => {
  if (weatherIconMap[code]) return weatherIconMap[code];
  if (code <= 2)  return { icon: "fa-sun",                 color: "#f1c40f" };
  if (code <= 49) return { icon: "fa-smog",                color: "#bdc3c7" };
  if (code <= 59) return { icon: "fa-cloud-rain",          color: "#74b9ff" };
  if (code <= 69) return { icon: "fa-cloud-rain",          color: "#0984e3" };
  if (code <= 79) return { icon: "fa-snowflake",           color: "#dfe6e9" };
  if (code <= 82) return { icon: "fa-cloud-showers-heavy", color: "#0984e3" };
  return { icon: "fa-bolt", color: "#fdcb6e" };
};

/** WMO 코드 → 한국어 날씨 텍스트 */
const getWeatherText = (code) => {
  if (code === 0)  return "맑음";
  if (code <= 2)   return "구름 조금";
  if (code === 3)  return "흐림";
  if (code <= 49)  return "안개";
  if (code <= 55)  return "이슬비";
  if (code <= 65)  return "비";
  if (code <= 77)  return "눈";
  if (code <= 82)  return "소나기";
  if (code <= 99)  return "뇌우";
  return "알 수 없음";
};

const Navbar = () => {
  const navigate = useNavigate();

  // ── 상태 ────────────────────────────────────────────────────
  const [time, setTime] = useState(
    new Date().toLocaleTimeString("ko-KR", { hour12: false, hour: "2-digit", minute: "2-digit" })
  );
  const [weather, setWeather]     = useState(null);  // { temp, text, code }
  const [statusMsg, setStatusMsg] = useState("날씨 연결 중");
  const [username, setUsername]   = useState("회원");
  const [healthData, setHealthData] = useState([]);   // 신체 기록 배열 (BMI 계산용)
  const isMobile = window.innerWidth <= 430;

  // ── 초기 로드: 시계 시작 + 유저명 + 신체 데이터 ─────────────
  useEffect(() => {
    // 1초마다 시계 갱신
    const timer = setInterval(
      () => setTime(new Date().toLocaleTimeString("ko-KR", { hour12: false, hour: "2-digit", minute: "2-digit" })),
      1000
    );

    // localStorage에서 로그인된 사용자명 가져오기
    const storedName = localStorage.getItem("username");
    if (storedName) {
      setUsername(storedName);
      // 신체 기록 조회 → Navbar의 BMI 상태 표시용
      api.get(`/health/${storedName}`)
        .then(res => setHealthData(res.data))
        .catch(err => console.error('데이터 로딩 에러:', err));
    }
    return () => clearInterval(timer);
  }, []);

  /** Open-Meteo API로 서울 날씨 조회 */
  const fetchWeather = async () => {
    setStatusMsg("갱신 중...");
    try {
      const res = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=37.5665&longitude=126.9780&current=temperature_2m,weathercode&timezone=Asia/Seoul"
      );
      if (!res.ok) { setStatusMsg("연결 오류"); return; }
      const data = await res.json();
      if (data?.current) {
        setWeather({
          temp: Math.round(data.current.temperature_2m),
          text: getWeatherText(data.current.weathercode),
          code: data.current.weathercode,
        });
        setStatusMsg("");
      } else {
        setStatusMsg("정보 없음");
      }
    } catch (e) {
      console.error(e);
      setStatusMsg("네트워크 에러");
    }
  };

  // 날씨: 최초 로드 + 20분마다 자동 갱신
  useEffect(() => {
    fetchWeather();
    const interval = setInterval(fetchWeather, 20 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  /**
   * BMI 기반 신체 상태 분석 (useMemo로 healthData 변경 시에만 재계산)
   * - 최신 기록 기준으로 BMI 계산
   * - 비만(≥25) / 과체중(≥23) / 저체중(<18.5) / 정상
   * - 목표 체중(BMI 22 기준)까지 차이(diff) 계산
   */
  const bodyAnalysis = useMemo(() => {
    if (!healthData || healthData.length === 0)
      return { status: '데이터 없음', diff: 0, color: '#aaa' };
    const sorted = [...healthData].sort((a, b) => new Date(a.date) - new Date(b.date));
    const latest = sorted[sorted.length - 1];
    const hM  = latest.height / 100;
    const bmi = (latest.weight / (hM * hM)).toFixed(1);
    const diff = ((22 * (hM * hM)) - latest.weight).toFixed(1);
    let status = '정상'; let color = '#2ecc71';
    if (bmi >= 25)       { status = '비만';   color = '#e74c3c'; }
    else if (bmi < 18.5) { status = '저체중'; color = '#3498db'; }
    return { status, diff, color };
  }, [healthData]);

  const weatherData = weather
    ? getWeatherIcon(weather.code)
    : { icon: "fa-spin fa-spinner", color: "#666" };

  // ── 로그아웃 처리 ────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.clear();          // JWT + 사용자 정보 전부 삭제
    alert("로그아웃 되었습니다.");
    navigate("/");
  };

  // ── 모바일 레이아웃 (≤430px) ────────────────────────────────
  if (isMobile) {
    return (
      <nav style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px 0', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        {/* 1행: 시계 + 날씨 + EXIT */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <span style={{ fontSize: '1.6rem', fontWeight: '800', color: '#fff', letterSpacing: '1px' }}>{time}</span>
          <div onClick={fetchWeather} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.08)', padding: '5px 10px', borderRadius: '10px', cursor: 'pointer' }}>
            {weather ? (
              <>
                <i className={`fas ${weatherData.icon}`} style={{ color: weatherData.color, fontSize: '1rem' }} />
                <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 'bold' }}>{weather.temp}°C</span>
                <span style={{ color: '#ddd', fontSize: '0.75rem' }}>{weather.text}</span>
              </>
            ) : (
              <span style={{ color: '#aaa', fontSize: '0.8rem' }}>{statusMsg}</span>
            )}
          </div>
          <button style={{ background: 'linear-gradient(135deg, #e74c3c, #c0392b)', border: 'none', color: '#fff', padding: '7px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
            onClick={handleLogout}>
            EXIT <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
        {/* 2행: 로고 + 사용자명 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <Link to="/main" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: '900', fontStyle: 'italic', background: 'linear-gradient(135deg, #e67e22 0%, #f1c40f 50%, #e67e22 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '3px' }}>
              MY HEALTH
            </span>
          </Link>
          <span style={{ color: '#fff', fontSize: '0.85rem' }}>
            <strong style={{ color: '#e67e22' }}>{username}</strong>님 💪
          </span>
        </div>
      </nav>
    );
  }

  // ── 데스크탑 레이아웃 ────────────────────────────────────────
  return (
    <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px 0", marginBottom: "40px", borderBottom: "1px solid rgba(255,255,255,0.1)", position: "relative", zIndex: 10, height: "80px" }}>

      {/* 좌측: 시계 + 날씨 */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "25px" }}>
        <div style={{ fontSize: "2.2rem", fontWeight: "800", color: "#fff", lineHeight: 1, letterSpacing: "1px", minWidth: "100px" }}>{time}</div>
        {/* 날씨 위젯: 클릭 시 수동 새로고침 */}
        <div onClick={fetchWeather} title="날씨 새로고침" style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(255,255,255,0.08)", padding: "8px 20px", borderRadius: "15px", cursor: "pointer", transition: "0.3s", minWidth: "160px", border: "1px solid rgba(255,255,255,0.05)" }}>
          {weather ? (
            <>
              <i className={`fas ${weatherData.icon}`} style={{ fontSize: "2rem", filter: "drop-shadow(0 0 8px rgba(255,255,255,0.3))", color: weatherData.color }} />
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <span style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#fff", lineHeight: "1.1" }}>{weather.temp}°C</span>
                <span style={{ fontSize: "0.8rem", color: "#ddd", marginTop: "2px" }}>{weather.text}</span>
              </div>
            </>
          ) : (
            <>
              <i className="fas fa-satellite-dish" style={{ color: "#bdc3c7", fontSize: "1.5rem" }}></i>
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <span style={{ color: "#ecf0f1", fontWeight: "bold", fontSize: "0.9rem" }}>{statusMsg}</span>
                <span style={{ color: "#95a5a6", fontSize: "0.7rem" }}>클릭하여 재시도</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 중앙: MY HEALTH 로고 */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
        <Link to="/main" style={{ display: "inline-flex", alignItems: "center", textDecoration: "none", cursor: "pointer" }}>
          <span style={{ fontSize: "36px", fontWeight: "900", fontStyle: "italic", background: "linear-gradient(135deg, #e67e22 0%, #f1c40f 50%, #e67e22 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: "4px", filter: "drop-shadow(3px 4px 6px rgba(230,126,34,0.4))", whiteSpace: "nowrap", padding: "0 10px" }}>
            MY HEALTH
          </span>
        </Link>
      </div>

      {/* 우측: BMI 상태 + 사용자명 + EXIT */}
      <div style={{ flex: 1, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "20px" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
          {/* BMI 상태 배지 (신체 데이터가 있을 때만 표시) */}
          {bodyAnalysis.status !== '데이터 없음' && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ padding: "3px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "bold", background: `${bodyAnalysis.color}22`, color: bodyAnalysis.color, border: `1px solid ${bodyAnalysis.color}55` }}>
                {bodyAnalysis.status} 상태
              </span>
              <span style={{ fontSize: "0.8rem", color: "#bdc3c7" }}>
                목표까지 <b style={{ color: "#fff" }}>{Math.abs(bodyAnalysis.diff)}kg</b> {Number(bodyAnalysis.diff) > 0 ? "남음" : "감량 필요"}
              </span>
            </div>
          )}
          <div style={{ color: "#fff", fontSize: "1rem", textAlign: "right" }}>
            <strong style={{ color: "#e67e22", fontSize: "1.1rem" }}>{username}</strong>님, 득근하십쇼! 💪
          </div>
        </div>
        <button style={{ background: "linear-gradient(135deg, #e74c3c, #c0392b)", border: "none", color: "#fff", padding: "10px 24px", borderRadius: "30px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold", boxShadow: "0 4px 15px rgba(231,76,60,0.3)", transition: "transform 0.2s", display: "flex", alignItems: "center", gap: "6px" }}
          onClick={handleLogout}>
          EXIT <i className="fas fa-sign-out-alt"></i>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
