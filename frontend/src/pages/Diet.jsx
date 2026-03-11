/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │               Diet.jsx - 식단 기록 관리 페이지                │
 * ├──────────────────────────────────────────────────────────────┤
 * │ 경로: /diet                                                  │
 * │                                                              │
 * │ API:                                                          │
 * │   GET  /api/diet/{username}?year=&month=  - 월간 식단 조회   │
 * │   POST /api/diet/{username}               - 식단 저장(Upsert)│
 * │   GET  /api/diet/search?query=            - 식품 영양성분 검색│
 * │     → 공공데이터포털 식품안전처 영양성분DB 프록시            │
 * │                                                              │
 * │ 주요 기능:                                                    │
 * │   - 달력 UI: 날짜 클릭 → 식단 입력 모달                      │
 * │   - 식품 검색: 공공 영양성분 DB 검색 → 자동 영양 정보 입력   │
 * │   - 중량 연동: 섭취량(g) 변경 시 칼로리·탄단지 자동 비례 계산│
 * │   - 월간 요약: 평균 칼로리·탄수화물·단백질·지방              │
 * │   - 사용 가이드 모달 (빨간색 테마)                           │
 * │                                                              │
 * │ 식품 API 응답 필드:                                           │
 * │   FOOD_NM_KR  : 식품명                                       │
 * │   SERVING_SIZE: 1회 제공량(g)                                 │
 * │   AMT_NUM1    : 칼로리(kcal)                                  │
 * │   AMT_NUM3    : 단백질(g)                                     │
 * │   AMT_NUM4    : 지방(g)                                       │
 * │   AMT_NUM6    : 탄수화물(g)                                   │
 * └──────────────────────────────────────────────────────────────┘
 */
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import PageLayout from "../components/PageLayout";
import "../common.css";

const Diet = () => {
  const username = localStorage.getItem("username") || "";

  // ── 달력 상태 ──────────────────────────────────────────────
  const [viewDate, setViewDate] = useState(new Date());
  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth() + 1;

  const changeMonth = (val) =>
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + val, 1));

  const daysInMonth    = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();

  // ── 월간 식단 데이터 ────────────────────────────────────────
  const [dietData, setDietData] = useState({});

  const fetchMonthlyDiet = useCallback(async () => {
    if (!username) return;
    try {
      const res = await api.get(`/diet/${username}`, { params: { year, month } });
      const grouped = {};
      (res.data || []).forEach((log) => {
        const key = log.date;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(log);
      });
      setDietData(grouped);
    } catch (err) {
      console.error("식단 데이터 로드 실패", err);
    }
  }, [username, year, month]);

  useEffect(() => { fetchMonthlyDiet(); }, [fetchMonthlyDiet]);

  // ── 모달 및 검색 상태 ────────────────────────────────────────
  const [modal,     setModal]    = useState({ isOpen: false, date: null });
  const [tempMeals, setTempMeals] = useState([]);
  const [hoverId,   setHoverId]   = useState(null);

  const [showGuide, setShowGuide] = useState(false);

  const [searchOpen,        setSearchOpen]        = useState(false);
  const [searchQuery,       setSearchQuery]       = useState("");
  const [searchResults,     setSearchResults]     = useState([]);
  const [searchTargetIdx,   setSearchTargetIdx]   = useState(null);
  const [isSearching,       setIsSearching]       = useState(false);

  // ── 월간 요약 ───────────────────────────────────────────────
  const monthSummary = useMemo(() => {
    let totalKcal = 0, totalCarbs = 0, totalProtein = 0, totalFat = 0, count = 0;
    for (let i = 1; i <= daysInMonth; i++) {
      const key = `${year}-${String(month).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      if (dietData[key]?.length) {
        totalKcal    += dietData[key].reduce((a, c) => a + Number(c.kcal || 0), 0);
        totalCarbs   += dietData[key].reduce((a, c) => a + Number(c.carbs || 0), 0);
        totalProtein += dietData[key].reduce((a, c) => a + Number(c.protein || 0), 0);
        totalFat     += dietData[key].reduce((a, c) => a + Number(c.fat || 0), 0);
        count++;
      }
    }
    return {
      avg:        count > 0 ? Math.round(totalKcal / count) : 0,
      avgCarbs:   count > 0 ? Math.round(totalCarbs / count) : 0,
      avgProtein: count > 0 ? Math.round(totalProtein / count) : 0,
      avgFat:     count > 0 ? Math.round(totalFat / count) : 0,
      days:       count
    };
  }, [dietData, year, month, daysInMonth]);

  // ── 모달 제어 ────────────────────────────────────────────────
  const openModal = (day) => {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setTempMeals(
      dietData[dateStr]?.length
        ? dietData[dateStr].map((m) => ({
            ...m,
            baseWeight: m.baseWeight || 0, baseKcal: m.kcal || 0,
            baseCarbs: m.carbs || 0, baseProtein: m.protein || 0, baseFat: m.fat || 0,
          }))
        : [{ mealType: "아침", menu: "", weight: "", kcal: 0, carbs: 0, protein: 0, fat: 0, baseWeight: 0, baseKcal: 0, baseCarbs: 0, baseProtein: 0, baseFat: 0 }]
    );
    setModal({ isOpen: true, date: dateStr });
  };

  const updateMeal = (idx, field, value) => {
    const next = [...tempMeals];
    next[idx][field] = value;
    setTempMeals(next);
  };

  const updateWeight = (idx, value) => {
    const next = [...tempMeals];
    const meal = next[idx];
    const newW = Number(value);
    meal.weight = value;
    if (meal.baseWeight > 0 && newW > 0) {
      const r = newW / meal.baseWeight;
      meal.kcal    = Math.round(r * meal.baseKcal);
      meal.carbs   = Math.round(r * meal.baseCarbs);
      meal.protein = Math.round(r * meal.baseProtein);
      meal.fat     = Math.round(r * meal.baseFat);
    }
    setTempMeals(next);
  };

  const addMealRow    = () => setTempMeals([...tempMeals, { mealType: "아침", menu: "", weight: "", kcal: 0, carbs: 0, protein: 0, fat: 0, baseWeight: 0, baseKcal: 0, baseCarbs: 0, baseProtein: 0, baseFat: 0 }]);
  const removeMealRow = (idx) => setTempMeals(tempMeals.filter((_, i) => i !== idx));

  // ── 저장 ────────────────────────────────────────────────────
  const saveDiet = async () => {
    if (!username) return;
    const valid = tempMeals.filter((m) => m.menu && m.menu.trim() !== "");
    try {
      await api.post(`/diet/${username}`, { date: modal.date, meals: valid });
      await fetchMonthlyDiet();
      setModal({ isOpen: false, date: null });
      if (valid.length > 0) alert("식단 기록이 저장되었습니다. 오늘도 건강한 하루! 🍎");
    } catch (err) {
      console.error("저장 실패", err);
      alert("저장에 실패했습니다.");
    }
  };

  // ── 식품 API 검색 ───────────────────────────────────────────
  const searchFoodApi = async () => {
    if (!searchQuery.trim()) { alert("검색어를 입력해주세요."); return; }
    setIsSearching(true);
    setSearchResults([]);
    try {
      const res = await api.get("/diet/search", { params: { query: searchQuery.trim() } });
      const data = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
      const rawItems = data?.body?.items || data?.body?.item || data?.response?.body?.items?.item;
      const items = rawItems ? (Array.isArray(rawItems) ? rawItems : [rawItems]) : [];
      setSearchResults(items);
    } catch (err) {
      console.error("API Error:", err);
      alert("데이터를 불러오는 데 실패했습니다.");
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

  const selectFood = (item) => {
    const next = [...tempMeals];
    let baseWeight = 100;

    const extractNum = (val) => {
      if (val === undefined || val === null) return 0;
      const extracted = String(val).replace(/[^0-9.]/g, "");
      return extracted ? Number(extracted) : 0;
    };

    if (item.SERVING_SIZE) {
      baseWeight = extractNum(item.SERVING_SIZE) || 100;
    }

    const baseKcal    = extractNum(item.AMT_NUM1);
    const baseCarbs   = extractNum(item.AMT_NUM6);
    const baseProtein = extractNum(item.AMT_NUM3);
    const baseFat     = extractNum(item.AMT_NUM4);

    next[searchTargetIdx] = {
      ...next[searchTargetIdx],
      menu: item.FOOD_NM_KR, weight: baseWeight, kcal: baseKcal,
      carbs: baseCarbs, protein: baseProtein, fat: baseFat,
      baseWeight, baseKcal, baseCarbs, baseProtein, baseFat,
    };
    setTempMeals(next);
    setSearchOpen(false);
  };

  const currentTotalKcal = tempMeals.reduce((a, c) => a + Number(c.kcal || 0), 0);

  // ── 스타일 (Routine 기준 통일) ────────────────────────────────
  const S = {
    glass: { background: "rgba(255,255,255,0.05)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "15px", padding: "30px", marginBottom: "25px" },
    day: (isToday, isHover, hasData) => ({
      background: isHover ? "rgba(255,255,255,0.1)" : isToday ? "rgba(230,126,34,0.1)" : "rgba(0,0,0,0.3)",
      borderRadius: "10px", minHeight: "110px", padding: "10px", cursor: "pointer", transition: "0.3s", position: "relative",
      border: isHover || isToday ? "1px solid #e67e22" : hasData ? "1px solid rgba(46,204,113,0.4)" : "1px solid transparent",
    }),
    navBtn: { background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff", borderRadius: "8px", padding: "6px 16px", cursor: "pointer", fontSize: "1.1rem", fontWeight: "bold" },
    input: { padding: "12px", background: "#333", border: "1px solid #444", color: "#fff", borderRadius: "5px", boxSizing: "border-box" },
    select: { padding: "12px", background: "#333", border: "1px solid #444", color: "#fff", borderRadius: "5px" },
    searchBtn: { width: "38px", height: "38px", display: "flex", justifyContent: "center", alignItems: "center", background: "#444", border: "1px solid #555", color: "#fff", borderRadius: "5px", cursor: "pointer", flexShrink: 0 },
    deleteBtn: { width: "30px", height: "38px", display: "flex", justifyContent: "center", alignItems: "center", background: "transparent", border: "none", color: "#e74c3c", cursor: "pointer", flexShrink: 0 },
    badge: (color) => ({ display: "inline-block", background: color, borderRadius: "3px", padding: "1px 6px", fontSize: "0.7rem", marginRight: "4px", color: "#fff" }),
    guideBtn: { background: "rgba(231,76,60,0.2)", border: "1px solid rgba(231,76,60,0.5)", color: "#fff", padding: "6px 14px", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "bold", whiteSpace: "nowrap" },
  };

  return (
    <PageLayout maxWidth="1200px">

      {/* ══ 사용 가이드 팝업 ══ */}
      {showGuide && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.85)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}
          onClick={() => setShowGuide(false)}>
          <div style={{ background: "#1a1a1a", padding: "30px", borderRadius: "20px", maxWidth: "520px", width: "90%", border: "1px solid rgba(231,76,60,0.4)", color: "#eee", lineHeight: "1.8", maxHeight: "85vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}>
            <h2 style={{ color: "#e74c3c", marginTop: 0, textAlign: "center" }}>🍎 식단 기록 사용 가이드</h2>
            <ul style={{ paddingLeft: "20px", fontSize: "0.93rem" }}>
              <li><strong>달력 클릭:</strong> 날짜를 클릭하면 해당 날의 식단 기록 창이 열립니다. 아침·점심·저녁·간식을 자유롭게 입력할 수 있습니다.</li>
              <li><strong>🔍 식품 검색:</strong> 메뉴 입력란 옆 돋보기 버튼을 누르면 <b>공공 식품 영양성분 DB</b>에서 직접 검색할 수 있습니다. 예: "바나나", "삼겹살", "김치찌개"</li>
              <li><strong>섭취량(g) 자동 계산:</strong> 식품을 검색·선택하면 기준 중량 대비 칼로리·탄수화물·단백질·지방이 <b>자동 계산</b>됩니다. 섭취량(g)만 수정하면 됩니다.</li>
              <li><strong>월간 요약:</strong> 상단 카드에서 이번 달의 <b>평균 섭취 칼로리 · 평균 탄단지</b>를 한눈에 확인할 수 있습니다.</li>
            </ul>
            <div style={{ marginTop: "18px", padding: "10px 14px", background: "rgba(231,76,60,0.1)", borderRadius: "10px", fontSize: "0.85rem", color: "#ffcc00", textAlign: "center" }}>
              당신의 몸을 돌보세요. 그것은 당신이 살 수 있는 유일한 장소입니다. - 짐 론 (Jim Rohn) -
            </div>
            <button style={{ width: "100%", marginTop: "15px", height: "45px", background: "#e74c3c", border: "none", color: "#fff", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "1rem" }}
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
          <button style={S.guideBtn} onClick={() => setShowGuide(true)}>식단 가이드 ⓘ</button>
        </div>
      </div>

      {/* 월간 요약 */}
      <div style={S.glass}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <h2 style={{ margin: 0 }}>🥗 이달의 식단 요약</h2>
            <p style={{ margin: "5px 0 0", color: "#ccc" }}>기록된 식단: <strong style={{ color: "#2ecc71", fontSize: "1.2rem" }}>{monthSummary.days}</strong>일</p>
          </div>
          <div style={{ display: "flex", gap: "20px", textAlign: "center" }}>
            <div><div style={{ fontSize: "1.6rem", fontWeight: "bold", color: "#e67e22" }}>{monthSummary.avg.toLocaleString()}</div><div style={{ fontSize: "0.8rem", color: "#aaa", marginTop: "4px" }}>일 평균 칼로리</div></div>
            <div><div style={{ fontSize: "1.6rem", fontWeight: "bold", color: "#f1c40f" }}>{monthSummary.avgCarbs}g</div><div style={{ fontSize: "0.8rem", color: "#aaa", marginTop: "4px" }}>평균 탄수화물</div></div>
            <div><div style={{ fontSize: "1.6rem", fontWeight: "bold", color: "#3498db" }}>{monthSummary.avgProtein}g</div><div style={{ fontSize: "0.8rem", color: "#aaa", marginTop: "4px" }}>평균 단백질</div></div>
            <div><div style={{ fontSize: "1.6rem", fontWeight: "bold", color: "#e74c3c" }}>{monthSummary.avgFat}g</div><div style={{ fontSize: "0.8rem", color: "#aaa", marginTop: "4px" }}>평균 지방</div></div>
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
            const data    = dietData[dateStr];
            const hasData = data?.length > 0;
            const isToday = new Date().toDateString() === new Date(year, month - 1, day).toDateString();
            const dayKcal = hasData ? data.reduce((a, c) => a + Number(c.kcal), 0) : 0;

            return (
              <div key={day} onClick={() => openModal(day)}
                onMouseEnter={() => setHoverId(day)} onMouseLeave={() => setHoverId(null)}
                style={S.day(isToday, hoverId === day, hasData)}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.8rem", color: "#aaa" }}>{day}</span>
                  {hasData && <span style={{ fontSize: "0.7rem", color: dayKcal > 2500 ? "#e74c3c" : "#2ecc71" }}>{dayKcal.toLocaleString()}k</span>}
                </div>
                {hasData ? (
                  <div style={{ fontSize: "0.7rem", textAlign: "left", marginTop: "5px", lineHeight: "1.4" }}>
                    <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#fff" }}>{data[0].menu}</div>
                    <div style={{ color: "#aaa", marginTop: "2px" }}>{data.length}개 항목</div>
                    <i className="fas fa-utensils" style={{ position: "absolute", bottom: "8px", right: "8px", fontSize: "1.1rem", color: "#e67e22", opacity: 0.8 }} />
                  </div>
                ) : (
                  <div style={{ position: "absolute", top: "55%", left: "50%", transform: "translate(-50%,-50%)", opacity: hoverId === day ? 1 : 0.1, fontSize: "1.4rem", color: "#fff" }}>+</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 식단 기록 모달 */}
      {modal.isOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center" }} onClick={() => setModal({ isOpen: false, date: null })}>
          <div style={{ background: "#222", width: "660px", padding: "35px", borderRadius: "20px", border: "1px solid #e67e22", maxHeight: "80vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: "#e67e22", marginTop: 0, marginBottom: "20px" }}>{modal.date} 식단 기록</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              {tempMeals.map((meal, idx) => (
                <div key={idx} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <select style={{ ...S.select, width: "80px" }} value={meal.mealType} onChange={(e) => updateMeal(idx, "mealType", e.target.value)}>
                    <option>아침</option><option>점심</option><option>저녁</option><option>간식</option>
                  </select>
                  <input style={{ ...S.input, flex: 2, minWidth: 0, cursor: "pointer" }} placeholder="메뉴 검색"
                    value={meal.menu} readOnly onClick={() => openSearch(idx)} />
                  <button style={S.searchBtn} onClick={() => openSearch(idx)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z" />
                    </svg>
                  </button>
                  <input type="number" placeholder="g" value={meal.weight}
                    style={{ ...S.input, width: "70px", textAlign: "center" }}
                    onChange={(e) => updateWeight(idx, e.target.value)} />
                  <span style={{ color: "#777", fontSize: "0.8rem", flexShrink: 0 }}>g</span>
                  <input type="number" placeholder="kcal" value={meal.kcal}
                    style={{ ...S.input, width: "90px", textAlign: "right", color: "#e67e22" }}
                    onChange={(e) => updateMeal(idx, "kcal", e.target.value)} />
                  <span style={{ color: "#777", fontSize: "0.8rem", flexShrink: 0 }}>kcal</span>
                  <button onClick={() => removeMealRow(idx)} style={S.deleteBtn}>✕</button>
                </div>
              ))}
            </div>
            <button onClick={addMealRow}
              style={{ width: "100%", padding: "10px", background: "transparent", border: "1px dashed #777", color: "#ccc", borderRadius: "5px", cursor: "pointer", marginBottom: "15px" }}>
              + 메뉴 추가하기
            </button>
            <div style={{ textAlign: "right", color: "#fff", marginBottom: "20px", padding: "10px", borderTop: "1px solid #333" }}>
              총 섭취 칼로리: <strong style={{ color: "#e67e22", fontSize: "1.2rem" }}>{currentTotalKcal.toLocaleString()}</strong> kcal
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button onClick={saveDiet}
                style={{ padding: "15px", background: "#e67e22", color: "#fff", border: "none", borderRadius: "5px", fontWeight: "bold", cursor: "pointer", fontSize: "1rem" }}>
                저장 🥗
              </button>
              <button onClick={() => setModal({ isOpen: false, date: null })}
                style={{ background: "none", border: "none", color: "#aaa", cursor: "pointer" }}>닫기</button>
            </div>
          </div>
        </div>
      )}

      {/* 식품 검색 모달 */}
      {searchOpen && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.90)", zIndex: 2000, display: "flex", justifyContent: "center", alignItems: "center" }} onClick={() => setSearchOpen(false)}>
          <div style={{ background: "#333", width: "500px", padding: "24px", borderRadius: "15px", border: "1px solid #777" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: "#fff", marginTop: 0 }}>🔍 식품 영양성분 검색</h3>
            <div style={{ display: "flex", gap: "8px", marginBottom: "15px" }}>
              <input style={{ ...S.input, flex: 1 }} value={searchQuery} autoFocus
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && searchFoodApi()}
                placeholder="예: 바나나, 김치찌개, 삼겹살" />
              <button onClick={searchFoodApi} style={{ ...S.searchBtn, background: "#e67e22", border: "none", width: "auto", padding: "0 16px", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
            <div style={{ height: "360px", overflowY: "auto", background: "#222", borderRadius: "5px", border: "1px solid #444" }}>
              {isSearching && <div style={{ color: "#ccc", padding: "20px", textAlign: "center" }}>검색 중...</div>}
              {!isSearching && searchResults.length === 0 && <div style={{ padding: "20px", textAlign: "center", color: "#555" }}>검색어를 입력해주세요.</div>}
              {searchResults.map((item, idx) => (
                <div key={idx} onClick={() => selectFood(item)}
                  style={{ padding: "14px", borderBottom: "1px solid #333", cursor: "pointer", transition: "0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#3a3a3a")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                    <span style={{ fontWeight: "bold", color: "#fff" }}>{item.FOOD_NM_KR}</span>
                    <span style={{ fontSize: "0.7rem", color: "#888" }}>{item.SERVING_SIZE} 기준</span>
                  </div>
                  <div>
                    <span style={S.badge("#e67e22")}>{item.AMT_NUM1} kcal</span>
                    <span style={S.badge("#f1c40f")}>탄 {item.AMT_NUM6}g</span>
                    <span style={S.badge("#3498db")}>단 {item.AMT_NUM3}g</span>
                    <span style={S.badge("#e74c3c")}>지 {item.AMT_NUM4}g</span>
                  </div>
                </div>
              ))}
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

export default Diet;