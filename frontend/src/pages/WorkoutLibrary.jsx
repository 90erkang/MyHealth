/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │           WorkoutLibrary.jsx - 운동 영상 도감 페이지          │
 * ├──────────────────────────────────────────────────────────────┤
 * │ 경로: /workout-library (lazy loading 적용)                   │
 * │                                                              │
 * │ API: GET /api/workout/search?page=&query=&numOfRows=&aggrp_nm│
 * │   → 공공데이터포털 보건소 운동영상 DB 프록시                  │
 * │                                                              │
 * │ 주요 기능:                                                    │
 * │   - 연령대 필터 (공통/유소년/청소년/성인/어르신)              │
 * │   - 운동명 키워드 검색                                        │
 * │   - 12개씩 페이지네이션                                       │
 * │   - 카드 클릭 → 상세 모달 (동영상 임베드 + 운동 정보)         │
 * │                                                              │
 * │ 응답 필드 (공공데이터 표준):                                   │
 * │   response.body.items.item[]                                 │
 * │   각 항목: 운동명, 연령대, 동영상URL, 썸네일, 설명 등         │
 * └──────────────────────────────────────────────────────────────┘
 */
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import PageLayout from "../components/PageLayout";
import "../common.css";

// ✅ localhost:8080 하드코딩 제거, api.js 사용

const WorkoutLibrary = () => {
  const [exercises,   setExercises]   = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [search,      setSearch]      = useState("");
  const [ageGroup,    setAgeGroup]    = useState("");
  const [page,        setPage]        = useState(1);
  const [totalCount,  setTotalCount]  = useState(0);
  const [selected,    setSelected]    = useState(null);

  const NUM_OF_ROWS = 12;

  const fetchExercises = async (pageNum, query, aggrp) => {
    setLoading(true);
    setError(null);
    try {
      // ✅ api.js 사용
      const res = await api.get("/workout/search", {
        params: { page: pageNum, query, numOfRows: NUM_OF_ROWS, aggrp_nm: aggrp },
      });

      const data = typeof res.data === "string" ? JSON.parse(res.data) : res.data;
      const body = data?.response?.body || data?.body;
      const raw  = body?.items?.item;

      setExercises(raw ? (Array.isArray(raw) ? raw : [raw]) : []);
      setTotalCount(Number(body?.totalCount || 0));
    } catch (err) {
      console.error("Workout API Error:", err);
      setError("데이터를 불러오지 못했습니다. (잠시 후 다시 시도해주세요)");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises(page, search, ageGroup);
    // eslint-disable-next-line
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    fetchExercises(1, search, ageGroup);
  };

  const totalPages = Math.ceil(totalCount / NUM_OF_ROWS);

  return (
    <PageLayout maxWidth="1200px">
      <Link to="/main" style={{ color: "#fff", textDecoration: "none", display: "inline-block", marginBottom: "20px" }}>
        <i className="fas fa-arrow-left"></i> 메인으로
      </Link>

      <div style={{ marginBottom: "20px", display: "flex", gap: "10px" }}>
        <select value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)}
          style={{ padding: "15px 20px", borderRadius: "50px", background: "#1a1a1a", border: "1px solid #333", color: ageGroup ? "#e67e22" : "#aaa", cursor: "pointer", minWidth: "120px", outline: "none" }}>
          <option value="">전체</option>
          <option value="공통">공통</option>
          <option value="유소년">유소년</option>
          <option value="청소년">청소년</option>
          <option value="성인">성인</option>
          <option value="어르신">어르신</option>
        </select>

        <input type="text" placeholder="운동명 검색 (예: 스쿼트)" value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          style={{ flex: 1, padding: "15px 20px", borderRadius: "50px", background: "#1a1a1a", border: "1px solid #333", color: "#fff" }} />
        <button onClick={handleSearch}
          style={{ padding: "0 25px", borderRadius: "50px", background: "#e67e22", border: "none", color: "#fff", fontWeight: "bold", cursor: "pointer" }}>
          검색
        </button>
      </div>

      {!loading && !error && totalCount > 0 && (
        <div style={{ color: "#aaa", fontSize: "0.85rem", marginBottom: "15px" }}>
          총 <strong style={{ color: "#e67e22" }}>{totalCount.toLocaleString()}</strong>건
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "50px", color: "#e67e22" }}>
          <i className="fas fa-spinner fa-spin"></i> 운동 데이터 로딩 중...
        </div>
      ) : error ? (
        <div style={{ textAlign: "center", padding: "50px", color: "#e74c3c" }}>
          <i className="fas fa-exclamation-triangle"></i> {error}
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "20px" }}>
            {exercises.length > 0 ? exercises.map((ex, idx) => {
              const fullImgUrl = ex.img_file_url && ex.img_file_nm ? ex.img_file_url + ex.img_file_nm : null;
              return (
                <div key={idx} onClick={() => setSelected(ex)}
                  style={{ background: "rgba(255,255,255,0.05)", borderRadius: "15px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", transition: "0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.border = "1px solid #e67e22")}
                  onMouseLeave={(e) => (e.currentTarget.style.border = "1px solid rgba(255,255,255,0.1)")}>
                  <div style={{ height: "160px", background: "#000", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                    {fullImgUrl
                      ? <img src={fullImgUrl} alt={ex.trng_nm} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <i className="fas fa-dumbbell" style={{ fontSize: "3rem", color: "#555" }}></i>}
                  </div>
                  <div style={{ padding: "15px" }}>
                    <div style={{ fontWeight: "bold", color: "#fff", fontSize: "1rem", marginBottom: "5px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ex.trng_nm}</div>
                    <div style={{ fontSize: "0.8rem", color: "#aaa" }}>
                      <span style={{ color: "#e67e22", marginRight: "5px" }}>[{ex.aggrp_nm || "전체"}]</span>
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block" }}>{ex.vdo_ttl_nm}</span>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "50px", color: "#777" }}>검색 결과가 없습니다.</div>
            )}
          </div>

          {exercises.length > 0 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "20px", marginTop: "30px" }}>
              <button onClick={() => setPage((p) => p - 1)} disabled={page === 1}
                style={{ padding: "10px 20px", background: page === 1 ? "#333" : "#444", color: page === 1 ? "#777" : "#fff", border: "none", borderRadius: "5px", cursor: page === 1 ? "default" : "pointer" }}>
                <i className="fas fa-chevron-left"></i> 이전
              </button>
              <span style={{ color: "#fff", fontWeight: "bold" }}>{page} / {totalPages || "?"}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}
                style={{ padding: "10px 20px", background: page >= totalPages ? "#333" : "#444", color: page >= totalPages ? "#777" : "#fff", border: "none", borderRadius: "5px", cursor: page >= totalPages ? "default" : "pointer" }}>
                다음 <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </>
      )}

      {selected && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.9)", zIndex: 1000, display: "flex", justifyContent: "center", alignItems: "center" }}
          onClick={() => setSelected(null)}>
          <div style={{ background: "#222", width: "700px", maxWidth: "90vw", padding: "30px", borderRadius: "15px", border: "1px solid #e67e22", maxHeight: "90vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}>
            <h2 style={{ color: "#e67e22", marginTop: 0 }}>
              {selected.trng_nm}
              <span style={{ fontSize: "1rem", color: "#aaa", marginLeft: "8px" }}>({selected.aggrp_nm})</span>
            </h2>
            <div style={{ marginBottom: "20px", borderRadius: "10px", overflow: "hidden", border: "1px solid #444", background: "#000" }}>
              {selected.file_url && selected.file_nm ? (
                <video controls autoPlay referrerPolicy="no-referrer" style={{ width: "100%", maxHeight: "400px" }}>
                  <source src={(selected.file_url + selected.file_nm).replace("http://", "https://")} type="video/mp4" />
                  브라우저가 비디오를 지원하지 않습니다.
                </video>
              ) : (
                <div style={{ padding: "50px", textAlign: "center", color: "#555" }}>영상이 없습니다.</div>
              )}
            </div>
            <div style={{ color: "#ddd", lineHeight: "1.6", fontSize: "0.95rem" }}>
              <p><strong style={{ color: "#e67e22" }}>제목:</strong> {selected.vdo_ttl_nm}</p>
              <div style={{ marginTop: "20px", padding: "15px", background: "#333", borderRadius: "10px" }}>
                <strong style={{ color: "#e67e22", display: "block", marginBottom: "10px" }}>운동 설명</strong>
                {selected.vdo_desc || "설명이 없습니다."}
              </div>
            </div>
            <button onClick={() => setSelected(null)}
              style={{ width: "100%", padding: "15px", background: "#e67e22", border: "none", color: "#fff", borderRadius: "10px", marginTop: "20px", cursor: "pointer", fontWeight: "bold" }}>
              닫기
            </button>
          </div>
        </div>
      )}
    </PageLayout>
  );
};

export default WorkoutLibrary;
