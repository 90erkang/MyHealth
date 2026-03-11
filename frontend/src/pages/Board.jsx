import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import PageLayout from "../components/PageLayout";
import "../common.css";

/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │               Board.jsx - 커뮤니티 게시판 목록 페이지         │
 * ├──────────────────────────────────────────────────────────────┤
 * │ 경로: /board                                                 │
 * │ API: GET /api/board?page={p}&size=10&keyword={kw}            │
 * │                                                              │
 * │ 기능:                                                         │
 * │   - 게시글 목록 (페이징, 10개씩)                              │
 * │   - 제목 키워드 검색 (Enter키 또는 검색 버튼)                 │
 * │   - 공지사항 구분 표시 (주황 배경 + 공지 배지)               │
 * │   - 글쓰기 버튼 (로그인 시에만 표시)                          │
 * │   - 날짜: 오늘이면 HH:mm, 이전이면 YYYY.MM.DD               │
 * │                                                              │
 * │ 권한:                                                         │
 * │   - 목록 조회: 비로그인도 가능                                │
 * │   - 글쓰기: 로그인 필요 (username 확인)                       │
 * │   - 공지 작성/삭제: ADMIN만 (BoardWrite에서 처리)             │
 * └──────────────────────────────────────────────────────────────┘
 */
const Board = () => {
  const navigate  = useNavigate();
  const username  = localStorage.getItem("username") || "";
  const role      = localStorage.getItem("role") || "USER";
  const isAdmin   = role === "ADMIN";

  // ── 상태 ──────────────────────────────────────────────────────
  const [posts,      setPosts]      = useState([]);
  const [page,       setPage]       = useState(0);       // 현재 페이지 (0-based)
  const [totalPages, setTotalPages] = useState(1);
  const [keyword,    setKeyword]    = useState("");       // 입력 중인 검색어
  const [search,     setSearch]     = useState("");       // 실제 적용된 검색어

  /**
   * 게시글 목록 조회
   * @param {number} p  - 페이지 번호 (0-based)
   * @param {string} kw - 검색 키워드
   */
  const fetchPosts = async (p = 0, kw = "") => {
    try {
      const res = await api.get("/board", { params: { page: p, size: 10, keyword: kw } });
      setPosts(res.data.content);       // Spring Page 객체의 content 배열
      setTotalPages(res.data.totalPages);
      setPage(p);
    } catch (err) {
      console.error("게시글 조회 실패", err);
    }
  };

  // 최초 로드 시 1페이지 조회
  useEffect(() => { fetchPosts(0, ""); }, []);

  /** 검색 실행 (keyword state → search state 반영 후 1페이지부터 조회) */
  const handleSearch = () => {
    setSearch(keyword);
    fetchPosts(0, keyword);
  };

  /**
   * 날짜 포맷팅
   * - 오늘 작성: "HH:mm" 형식
   * - 이전 날짜: "YYYY.MM.DD" 형식
   */
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    return isToday
      ? `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`
      : `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")}`;
  };

  const S = {
    table:     { width:"100%", borderCollapse:"collapse" },
    th:        { padding:"12px 16px", borderBottom:"1px solid #333", color:"#e67e22", fontWeight:"bold", textAlign:"left", fontSize:"0.9rem" },
    td:        { padding:"12px 16px", borderBottom:"1px solid #222", fontSize:"0.9rem", color:"#ccc" },
    noticeRow: { background:"rgba(230,126,34,0.05)" }, // 공지글 배경 강조
    badge:     { background:"#e67e22", color:"#fff", borderRadius:"4px", padding:"2px 8px", fontSize:"0.75rem", fontWeight:"bold" },
    pageBtn:   (active) => ({ padding:"6px 12px", borderRadius:"5px", cursor:"pointer", border:"1px solid #444", background: active ? "#e67e22" : "transparent", color: active ? "#fff" : "#aaa" }),
  };

  return (
    <PageLayout maxWidth="1200px">
      <Link to="/main" style={{ color:"#ccc", textDecoration:"none" }}>← 메인으로</Link>

      <div style={{ background:"rgba(255,255,255,0.05)", backdropFilter:"blur(10px)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"15px", padding:"30px", marginTop:"20px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"24px" }}>
          <h2 style={{ margin:0 }}>💪 득근 게시판</h2>
          {/* 로그인 상태일 때만 글쓰기 버튼 표시 */}
          {username && (
            <button onClick={() => navigate("/board/write")}
              style={{ padding:"10px 20px", background:"#e67e22", color:"#fff", border:"none", borderRadius:"8px", cursor:"pointer", fontWeight:"bold" }}>
              ✏️ 글쓰기
            </button>
          )}
        </div>

        {/* 검색창 */}
        <div style={{ display:"flex", gap:"8px", marginBottom:"20px" }}>
          <input
            style={{ flex:1, padding:"10px", background:"#333", border:"1px solid #444", color:"#fff", borderRadius:"8px" }}
            placeholder="검색어를 입력하세요..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
          />
          <button onClick={handleSearch}
            style={{ padding:"10px 20px", background:"#444", color:"#fff", border:"1px solid #555", borderRadius:"8px", cursor:"pointer" }}>
            검색
          </button>
        </div>

        {/* 게시글 테이블 */}
        <table style={S.table}>
          <thead>
            <tr>
              <th style={{ ...S.th, width:"10%" }}>번호</th>
              <th style={{ ...S.th, width:"50%" }}>제목</th>
              <th style={{ ...S.th, width:"15%" }}>글쓴이</th>
              <th style={{ ...S.th, width:"15%" }}>날짜</th>
              <th style={{ ...S.th, width:"10%" }}>조회</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 && (
              <tr><td colSpan={5} style={{ ...S.td, textAlign:"center", color:"#555", padding:"40px" }}>게시글이 없습니다.</td></tr>
            )}
            {posts.map((post) => (
              <tr key={post.id} style={post.notice ? S.noticeRow : {}}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = post.notice ? "rgba(230,126,34,0.05)" : "transparent")}>
                {/* 공지글: 번호 대신 '공지' 배지, 일반글: ID 번호 */}
                <td style={S.td}>{post.notice ? <span style={S.badge}>공지</span> : post.id}</td>
                <td style={{ ...S.td, color: post.notice ? "#e67e22" : "#fff", cursor:"pointer" }}
                  onClick={() => navigate(`/board/${post.id}`)}>
                  {post.title}
                </td>
                <td style={S.td}>{post.writer}</td>
                <td style={S.td}>{formatDate(post.createdAt)}</td>
                <td style={S.td}>{post.views}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* 페이지네이션 */}
        <div style={{ display:"flex", justifyContent:"center", gap:"6px", marginTop:"24px" }}>
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} style={S.pageBtn(i === page)} onClick={() => fetchPosts(i, search)}>
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </PageLayout>
  );
};

export default Board;
