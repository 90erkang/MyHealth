/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │             Routine.jsx - 워크아웃 루틴 기록 페이지           │
 * ├──────────────────────────────────────────────────────────────┤
 * │ 경로: /routine                                               │
 * │                                                              │
 * │ API:                                                          │
 * │   GET  /api/routine/{username}?year=&month=  - 월간 루틴 조회│
 * │   POST /api/routine/{username}               - 루틴 저장     │
 * │   GET  /api/routine/search?query=            - 운동 MET 검색 │
 * │     → ODCloud 보건소 운동 MET DB 프록시                      │
 * │                                                              │
 * │ 주요 기능:                                                    │
 * │   - 달력 UI: 날짜 클릭 → 운동 기록 모달                      │
 * │   - 운동 MET 검색: ODCloud API → 운동명·MET값 자동 입력      │
 * │   - kcal 자동 계산: MET × 체중(65kg) × 시간(시간)            │
 * │   - 구글 걷기 자동 주입: 오늘 날짜 + 구글 데이터 있으면      │
 * │     localStorage(todaySteps/todayDistance)에서 걷기 항목 생성│
 * │   - 월간 요약: 총 칼로리·총 시간·운동 일수·일 평균 kcal      │
 * │   - 사용 가이드 모달 (초록색 테마)                           │
 * │                                                              │
 * │ MET 칼로리 공식:                                              │
 * │   kcal = MET × 체중(kg) × 시간(h)                           │
 * │   calculateKcal(met, time, weight=65): time은 분 단위        │
 * │                                                              │
 * │ MET API 응답 필드:                                            │
 * │   trng_nm   : 운동명                                          │
 * │   met_value : MET 값                                          │
 * └──────────────────────────────────────────────────────────────┘
 */
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import PageLayout from "../components/PageLayout";
import "../common.css";

// ✅ 기존 칼로리 계산 로직 그대로 복구
const calculateKcal = (met, time, weight = 65) => {
  if (met > 0 && time > 0) return Math.round(met * weight * (time / 60));
  return 0;
};

const Routine = () => {
  // ✅ 백엔드 username 필드와 맞춤
  const username = localStorage.getItem("username") || "";

  // ── 달력 상태 ──────────────────────────────────────────────
  const [viewDate, setViewDate] = useState(new Date());
  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth() + 1;

  const changeMonth = (val) =>
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + val, 1));

  const daysInMonth    = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();

  // ── 월간 운동 데이터 ────────────────────────────────────────
  const [workoutData, setWorkoutData] = useState({});

  const fetchMonthly = useCallback(async () => {
    if (!username) return;
    try {
      // ✅ RoutineController 경로: /api/routine/{username}
      const res = await api.get(`/routine/${username}`, { params: { year, month } });
      const grouped = {};
      (res.data || []).forEach((w) => {
        const key = w.workoutDate;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(w);
      });
      setWorkoutData(grouped);
    } catch (err) {
      console.error("월간 데이터 조회 실패", err);
    }
  }, [username, year, month]);

  useEffect(() => { fetchMonthly(); }, [fetchMonthly]);

  // ── 모달 및 검색 상태 ────────────────────────────────────────
  const [modal,        setModal]        = useState({ isOpen: false, date: null });
  const [tempWorkouts, setTempWorkouts] = useState([]);
  const [hoverId,      setHoverId]      = useState(null);

  const [searchOpen,      setSearchOpen]      = useState(false);
  const [showGuide,       setShowGuide]       = useState(false);
  const [searchQuery,     setSearchQuery]     = useState("");
  const [searchResults,   setSearchResults]   = useState([]);
  const [searchTargetIdx, setSearchTargetIdx] = useState(null);
  const [isSearching,     setIsSearching]     = useState(false);
  const [searchPage,      setSearchPage]      = useState(1);
  const [searchTotal,     setSearchTotal]     = useState(0);
  const PER_PAGE = 10;

  // ── 월간 요약 ───────────────────────────────────────────────
  const monthSummary = useMemo(() => {
    let totalKcal = 0, totalTime = 0, count = 0;
    for (let i = 1; i <= daysInMonth; i++) {
      const key = `${year}-${String(month).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      if (workoutData[key]?.length) {
        totalKcal += workoutData[key].reduce((a, c) => a + Number(c.kcal || 0), 0);
        totalTime += workoutData[key].reduce((a, c) => a + Number(c.time || 0), 0);
        count++;
      }
    }
    return {
      totalKcal,
      totalTime,
      days: count,
      avgKcal: count > 0 ? Math.round(totalKcal / count) : 0,
    };
  }, [workoutData, year, month, daysInMonth]);

  // ── 구글 걷기 데이터 → 루틴 항목 변환 ─────────────────────────
  const buildGoogleWalkEntry = () => {
    const steps    = Number(localStorage.getItem("todaySteps")    || 0);
    const distanceM = Number(localStorage.getItem("todayDistance") || 0);
    if (steps <= 0) return null;

    const distanceKm  = distanceM / 1000;
    const walkMinutes = Math.max(1, Math.round(steps / 100));
    const MET_WALK    = 3.5;
    const kcalByMet   = Math.round(MET_WALK * 65 * (walkMinutes / 60));
    const kcalByDist  = Math.round(distanceKm * 60);
    const kcal        = distanceKm > 0 ? Math.max(kcalByDist, kcalByMet) : kcalByMet;

    return {
      name: `🚶 구글 걷기 (${steps.toLocaleString()}보 · ${distanceKm.toFixed(2)}km)`,
      met:  MET_WALK,
      time: walkMinutes,
      kcal,
    };
  };

  // ── 모달 제어 ────────────────────────────────────────────────
  const openModal = (day) => {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const today   = new Date().toISOString().split("T")[0];
    const isToday = dateStr === today;

    if (workoutData[dateStr]?.length) {
      // ── 기존 기록 있음: 그대로 열기 ──────────────────────────
      setTempWorkouts(workoutData[dateStr].map((w) => ({ ...w })));
    } else if (isToday) {
      // ── 오늘 & 기록 없음: 구글 걷기 데이터 자동 주입 ─────────
      const googleEntry = buildGoogleWalkEntry();
      setTempWorkouts(googleEntry
        ? [googleEntry, { name: "", met: 0, time: "", kcal: 0 }]
        : [{ name: "", met: 0, time: "", kcal: 0 }]
      );
    } else {
      // ── 과거/미래 날짜 & 기록 없음: 빈 항목 ─────────────────
      setTempWorkouts([{ name: "", met: 0, time: "", kcal: 0 }]);
    }

    setModal({ isOpen: true, date: dateStr });
  };

  const updateWorkout = (idx, field, value) => {
    const next = [...tempWorkouts];
    next[idx][field] = value;
    // ✅ 시간 또는 MET 변경 시 kcal 자동 재계산 로직 유지
    if (field === "time" || field === "met") {
      const met  = field === "met"  ? Number(value) : Number(next[idx].met);
      const time = field === "time" ? Number(value) : Number(next[idx].time);
      next[idx].kcal = calculateKcal(met, time);
    }
    setTempWorkouts(next);
  };

  const addWorkoutRow    = () => setTempWorkouts([...tempWorkouts, { name: "", met: 0, time: "", kcal: 0 }]);
  const removeWorkoutRow = (idx) => setTempWorkouts(tempWorkouts.filter((_, i) => i !== idx));

  // ── 저장 ────────────────────────────────────────────────────
  const saveWorkout = async () => {
    const valid = tempWorkouts.filter((w) => w.name && Number(w.time) > 0);
    try {
      // ✅ RoutineController 경로: /api/routine/{username}
      await api.post(`/routine/${username}`, { date: modal.date, workouts: valid });
      await fetchMonthly();
      setModal({ isOpen: false, date: null });
      if (valid.length > 0) alert("오늘도 고생하셨습니다! 득근 완료! 💪");
    } catch (err) {
      console.error("저장 실패", err);
      alert("저장에 실패했습니다.");
    }
  };

  // ── 운동 MET DB 검색 (백엔드 /api/routine/search 호출) ───────
  const searchExerciseApi = async (page = 1) => {
    if (!searchQuery.trim()) { alert("검색어를 입력해주세요."); return; }
    setIsSearching(true);
    setSearchResults([]);
    setSearchPage(page);
    try {
      // ✅ 루틴 전용 MET 검색 엔드포인트 호출
      const res = await api.get("/routine/search", {
        params: { query: searchQuery.trim() }
      });
      const data = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
      const body = data?.response?.body || data?.body;
      const raw  = body?.items?.item;
      const items = raw ? (Array.isArray(raw) ? raw : [raw]) : [];
      setSearchResults(items);
      setSearchTotal(items.length); // ODCloud는 보통 전체를 주므로 길이로 처리
    } catch (err) {
      console.error("API Error:", err);
      alert("운동 데이터를 불러오는 데 실패했습니다.");
    } finally {
      setIsSearching(false);
    }
  };

  const openSearch = (idx) => {
    setSearchTargetIdx(idx);
    setSearchQuery("");
    setSearchResults([]);
    setSearchOpen(true);
  };

  const selectExercise = (item) => {
    // ✅ 정규화된 필드명(trng_nm, met_value) 사용
    const name = item.trng_nm || item["운동명"] || "";
    const met  = Number(item.met_value || item["단위체중당에너지소비량"] || 0);
    const next = [...tempWorkouts];
    next[searchTargetIdx] = {
      ...next[searchTargetIdx],
      name,
      met,
      kcal: calculateKcal(met, Number(next[searchTargetIdx].time)),
    };
    setTempWorkouts(next);
    setSearchOpen(false);
  };

  const currentTotalKcal = tempWorkouts.reduce((a, c) => a + Number(c.kcal || 0), 0);
  const currentTotalTime = tempWorkouts.reduce((a, c) => a + Number(c.time || 0), 0);
  const totalPages       = Math.ceil(searchTotal / PER_PAGE);

  // ── 스타일 (기존 디자인 유지) ────────────────────────────────
  const S = {
    glass: { background: "rgba(255,255,255,0.05)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "15px", padding: "30px", marginBottom: "25px" },
    day: (isToday, isHover, hasData) => ({
      background: isHover ? "rgba(255,255,255,0.1)" : isToday ? "rgba(230,126,34,0.1)" : "rgba(0,0,0,0.3)",
      borderRadius: "10px", minHeight: "110px", padding: "10px", cursor: "pointer", transition: "0.3s", position: "relative",
      border: isHover || isToday ? "1px solid #e67e22" : hasData ? "1px solid rgba(46,204,113,0.4)" : "1px solid transparent",
    }),
    navBtn: { background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: "8px", padding: "6px 16px", cursor: "pointer", fontSize: "1.1rem", fontWeight: "bold" },
    input: { padding: "12px", background: "#333", border: "1px solid #444", color: "#fff", borderRadius: "5px", boxSizing: "border-box" },
    searchBtn: { width: "38px", height: "38px", display: "flex", justifyContent: "center", alignItems: "center", background: "#444", border: "1px solid #555", color: "#fff", borderRadius: "5px", cursor: "pointer", flexShrink: 0 },
    deleteBtn: { width: "30px", height: "38px", display: "flex", justifyContent: "center", alignItems: "center", background: "transparent", border: "none", color: "#e74c3c", cursor: "pointer", flexShrink: 0 },
    badge: (color) => ({ display: "inline-block", background: color, borderRadius: "3px", padding: "1px 6px", fontSize: "0.7rem", marginRight: "4px", color: "#fff" }),
    pageBtn: (active) => ({ padding: "4px 10px", borderRadius: "4px", cursor: "pointer", background: active ? "#e67e22" : "#444", border: "1px solid #555", color: "#fff", fontWeight: active ? "bold" : "normal" }),
    guideBtn: { background: "rgba(46,204,113,0.2)", border: "1px solid rgba(46,204,113,0.5)", color: "#fff", padding: "6px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold", whiteSpace: "nowrap" },
  };

  return (
    <PageLayout maxWidth="1200px">

      {/* ══ 사용 가이드 팝업 ══ */}
      {showGuide && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}
          onClick={() => setShowGuide(false)}>
          <div style={{ background: "#1a1a1a", padding: "30px", borderRadius: "20px", maxWidth: "520px", width: "90%", border: "1px solid rgba(46,204,113,0.4)", color: "#eee", lineHeight: "1.8", maxHeight: "85vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ color: "#2ecc71", marginTop: 0, textAlign: "center" }}>💪 운동 루틴 사용 가이드</h2>
            <ul style={{ paddingLeft: "20px", fontSize: "0.93rem" }}>
              <li><strong>달력 클릭:</strong> 날짜를 클릭하면 해당 날의 운동 기록 창이 열립니다. 여러 종목을 한 번에 입력할 수 있습니다.</li>
              <li><strong>🔍 운동 검색:</strong> 운동명 입력란을 클릭하거나 돋보기를 누르면 <b>운동 MET 라이브러리</b>에서 종목을 검색할 수 있습니다. 예: "런닝", "스쿼트", "수영"</li>
              <li><strong>MET 기반 자동 계산:</strong> 운동 종목을 선택하면 <b>MET 수치</b>가 자동 입력됩니다. 운동 시간(분)만 입력하면 소모 칼로리가 자동 계산됩니다.</li>
              <li><strong>월간 요약:</strong> 상단 카드에서 이번 달 <b>총 소모 칼로리 · 총 운동 시간 · 운동 일수 · 일평균 소모 칼로리</b>를 확인할 수 있습니다.</li>
              <li><strong>구글 연동:</strong> 구글 연동을 통해 수집된 걸음 수와 이동 거리에 <b>MET 수치</b>를 반영하여, 별도의 입력 없이도 소모 칼로리를 정밀하게 자동 산출하고 기록합니다.</li>
            </ul>
            <div style={{ marginTop: "18px", padding: "10px 14px", background: "rgba(46,204,113,0.1)", borderRadius: "10px", fontSize: "0.85rem", color: "#ffcc00", textAlign: "center" }}>
              마지막 3~4회 반복이 근육을 성장시킨다. 이 고통의 영역이 챔피언과 비챔피언을 가르는 기준이다. - 아놀드 슈워제네거 -
            </div>
            <button style={{ width: "100%", marginTop: "15px", height: "45px", background: "#2ecc71", border: "none", color: "#fff", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "1rem" }}
              onClick={() => setShowGuide(false)}>확인했습니다!</button>
          </div>
        </div>
      )}

      {/* ══ 헤더: [← 메인] [타이틀 + 달 네비] [가이드 버튼] ══ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", marginBottom: "20px", gap: "12px" }}>
        <div>
          <Link to="/main" style={{ color: "#ccc", textDecoration: "none", fontSize: "0.95rem" }}>← 메인으로</Link>
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}>
            <button style={S.navBtn} onClick={() => changeMonth(-1)}>◀</button>
            <span style={{ color: "#e67e22", fontWeight: "bold", fontSize: "1rem", minWidth: "110px", textAlign: "center" }}>{year}년 {month}월</span>
            <button style={S.navBtn} onClick={() => changeMonth(1)}>▶</button>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button style={S.guideBtn} onClick={() => setShowGuide(true)}>운동 가이드 ⓘ</button>
        </div>
      </div>

      {/* 월간 요약 */}
      <div style={S.glass}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <h2 style={{ margin: 0 }}>💪 이달의 운동 일지</h2>
            <p style={{ margin: "5px 0 0", color: "#ccc" }}>총 <strong style={{ color: "#2ecc71", fontSize: "1.2rem" }}>{monthSummary.days}</strong>일 운동</p>
          </div>
          <div style={{ display: "flex", gap: "20px", textAlign: "center" }}>
            <div><div style={{ fontSize: "1.6rem", fontWeight: "bold", color: "#e67e22" }}>{monthSummary.totalKcal.toLocaleString()}</div><div style={{ fontSize: "0.8rem", color: "#aaa", marginTop: "4px" }}>총 소모 칼로리 (kcal)</div></div>
            <div><div style={{ fontSize: "1.6rem", fontWeight: "bold", color: "#3498db" }}>{monthSummary.totalTime}</div><div style={{ fontSize: "0.8rem", color: "#aaa", marginTop: "4px" }}>총 운동 시간 (분)</div></div>
            <div><div style={{ fontSize: "1.6rem", fontWeight: "bold", color: "#9b59b6" }}>{monthSummary.avgKcal}</div><div style={{ fontSize: "0.8rem", color: "#aaa", marginTop: "4px" }}>평균 소모 칼로리 (kcal)</div></div>
          </div>
        </div>
      </div>

      {/* 달력 */}
      <div style={S.glass}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "10px", textAlign: "center" }}>
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
            <div key={d} style={{ fontWeight: "bold", color: "#e67e22", paddingBottom: "10px" }}>{d}</div>
          ))}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const data    = workoutData[dateStr];
            const hasData = data?.length > 0;
            const isToday = new Date().toDateString() === new Date(year, month - 1, day).toDateString();
            const dayKcal = hasData ? data.reduce((a, c) => a + Number(c.kcal), 0) : 0;
            const dayTime = hasData ? data.reduce((a, c) => a + Number(c.time), 0) : 0;
            // ✅ 오늘 & 기록 없음 & 구글 걷기 데이터 있음 → 구글 아이콘 표시
            const hasGoogleData = isToday && !hasData && Number(localStorage.getItem("todaySteps") || 0) > 0;
            return (
              <div key={day} onClick={() => openModal(day)}
                onMouseEnter={() => setHoverId(day)} onMouseLeave={() => setHoverId(null)}
                style={S.day(isToday, hoverId === day, hasData)}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.8rem", color: "#aaa" }}>{day}</span>
                  {hasData && <span style={{ fontSize: "0.7rem", color: "#2ecc71" }}>{dayKcal.toLocaleString()}k</span>}
                  {hasGoogleData && !hasData && <span style={{ fontSize: "0.7rem", color: "#4285F4" }}>G↓</span>}
                </div>
                {hasData ? (
                  <div style={{ fontSize: "0.7rem", textAlign: "left", marginTop: "5px", lineHeight: "1.4" }}>
                    <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#fff" }}>{data[0].name}</div>
                    <div style={{ color: "#aaa", marginTop: "2px" }}>{dayTime}분</div>
                    {data.length > 1 && <div style={{ color: "#777" }}>외 {data.length - 1}건</div>}
                    <i className="fas fa-check-circle" style={{ position: "absolute", bottom: "8px", right: "8px", fontSize: "1.1rem", color: "#2ecc71", opacity: 0.8 }} />
                  </div>
                ) : hasGoogleData ? (
                  <div style={{ fontSize: "0.7rem", textAlign: "left", marginTop: "5px", lineHeight: "1.4", color: "#4285F4" }}>
                    <div>🚶 {Number(localStorage.getItem("todaySteps")).toLocaleString()}보</div>
                    <div style={{ color: "#555", marginTop: "2px" }}>클릭해서 저장</div>
                  </div>
                ) : (
                  <div style={{ position: "absolute", top: "55%", left: "50%", transform: "translate(-50%,-50%)", opacity: hoverId === day ? 1 : 0.1, fontSize: "1.4rem", color: "#fff" }}>+</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 운동 기록 모달 */}
      {modal.isOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center" }} onClick={() => setModal({ isOpen: false, date: null })}>
          <div style={{ background: "#222", width: "660px", padding: "35px", borderRadius: "20px", border: "1px solid #e67e22", maxHeight: "80vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: "#e67e22", marginTop: 0, marginBottom: "20px" }}>{modal.date} 운동 기록</h2>

            {/* ✅ 구글 걷기 자동 입력 안내 배너 */}
            {modal.date === new Date().toISOString().split("T")[0] &&
             tempWorkouts.some(w => w.name?.startsWith("🚶 구글 걷기")) &&
             !workoutData[modal.date]?.length && (
              <div style={{ background: "rgba(66,133,244,0.1)", border: "1px solid rgba(66,133,244,0.35)", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "1.2rem" }}>🚶</span>
                <div>
                  <div style={{ color: "#4285F4", fontWeight: "bold", fontSize: "0.9rem" }}>Google Fit 걷기 데이터가 자동으로 입력됐습니다!</div>
                  <div style={{ color: "#888", fontSize: "0.8rem", marginTop: "2px" }}>수정 후 저장하거나, 필요 없으면 삭제하세요.</div>
                </div>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              {tempWorkouts.map((workout, idx) => (
                <div key={idx} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input style={{ ...S.input, flex: 2, minWidth: 0, cursor: "pointer" }} placeholder="운동을 검색해서 선택하세요"
                    value={workout.name} readOnly onClick={() => openSearch(idx)} />
                  <button style={S.searchBtn} onClick={() => openSearch(idx)} title="운동 DB 검색">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                    </svg>
                  </button>
                  <input type="number" placeholder="분" value={workout.time}
                    style={{ ...S.input, width: "75px", textAlign: "center" }}
                    onChange={(e) => updateWorkout(idx, "time", e.target.value)} />
                  <span style={{ color: "#777", fontSize: "0.8rem", flexShrink: 0 }}>분</span>
                  <input type="number" placeholder="kcal" value={workout.kcal}
                    style={{ ...S.input, width: "90px", textAlign: "right", color: "#e67e22" }}
                    onChange={(e) => updateWorkout(idx, "kcal", e.target.value)} />
                  <span style={{ color: "#777", fontSize: "0.8rem", flexShrink: 0 }}>kcal</span>
                  <button onClick={() => removeWorkoutRow(idx)} style={S.deleteBtn}>✕</button>
                </div>
              ))}
            </div>
            <button onClick={addWorkoutRow}
              style={{ width: "100%", padding: "10px", background: "transparent", border: "1px dashed #777", color: "#ccc", borderRadius: "5px", cursor: "pointer", marginBottom: "15px" }}>
              + 운동 추가하기
            </button>
            <div style={{ textAlign: "right", color: "#fff", marginBottom: "20px", padding: "10px", borderTop: "1px solid #333" }}>
              <span style={{ marginRight: "20px", color: "#aaa" }}>총 운동 시간: <strong style={{ color: "#3498db", fontSize: "1.1rem" }}>{currentTotalTime}</strong> 분</span>
              총 소모 칼로리: <strong style={{ color: "#e67e22", fontSize: "1.2rem" }}>{currentTotalKcal.toLocaleString()}</strong> kcal
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button onClick={saveWorkout}
                style={{ padding: "15px", background: "#e67e22", color: "#fff", border: "none", borderRadius: "5px", fontWeight: "bold", cursor: "pointer", fontSize: "1rem" }}>
                저장 💪
              </button>
              <button onClick={() => setModal({ isOpen: false, date: null })}
                style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer" }}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* 운동 검색 모달 */}
      {searchOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.90)", zIndex: 2000, display: "flex", justifyContent: "center", alignItems: "center" }} onClick={() => setSearchOpen(false)}>
          <div style={{ background: "#333", width: "500px", padding: "24px", borderRadius: "15px", border: "1px solid #777" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: "#fff", marginTop: 0 }}>🏃 운동 라이브러리 검색</h3>
            <div style={{ display: "flex", gap: "8px", marginBottom: "15px" }}>
              <input style={{ ...S.input, flex: 1 }} value={searchQuery} autoFocus
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && searchExerciseApi(1)}
                placeholder="예: 런닝, 스쿼트, 수영, 요가" />
              <button
                onClick={() => searchExerciseApi(1)}
                style={{
                  ...S.searchBtn,
                  background: "#e67e22",
                  border: "none",
                  width: "auto",
                  padding: "0 16px",
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
            <div style={{ height: "360px", overflowY: "auto", background: "#222", borderRadius: "5px", border: "1px solid #444" }}>
              {isSearching && <div style={{ color: "#ccc", padding: "20px", textAlign: "center" }}>검색 중...</div>}
              {!isSearching && searchResults.length === 0 && (
                <div style={{ padding: "20px", textAlign: "center", color: "#555" }}>검색어를 입력하고 검색 버튼을 눌러주세요.</div>
              )}
              {searchResults.map((item, idx) => {
                // ✅ 백엔드에서 내려주는 정규화된 met_value와 trng_nm 사용
                const met  = Number(item.met_value || 0);
                const name = item.trng_nm || "";
                return (
                  <div key={idx} onClick={() => selectExercise(item)}
                    style={{ padding: "14px", borderBottom: "1px solid #333", cursor: "pointer", transition: "0.2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#3a3a3a")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                      <span style={{ fontWeight: "bold", color: "#fff" }}>{name}</span>
                      {met > 0 && <span style={S.badge("#555")}>MET {met}</span>}
                    </div>
                    {met > 0 && (
                      <div>
                        <span style={S.badge("#e67e22")}>30분 · {calculateKcal(met, 30)} kcal</span>
                        <span style={S.badge("#3498db")}>60분 · {calculateKcal(met, 60)} kcal</span>
                        <span style={S.badge("#2ecc71")}>90분 · {calculateKcal(met, 90)} kcal</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <button onClick={() => setSearchOpen(false)}
              style={{ width: "100%", marginTop: "12px", padding: "10px", background: "transparent", color: "#aaa", border: "1px solid #555", borderRadius: "5px", cursor: "pointer" }}>
              닫기
            </button>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default Routine;