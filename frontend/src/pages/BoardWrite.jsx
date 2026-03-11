import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api";
import PageLayout from "../components/PageLayout";
import "../common.css";

/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │         BoardWrite.jsx - 게시글 작성 / 수정 페이지            │
 * ├──────────────────────────────────────────────────────────────┤
 * │ 경로:                                                        │
 * │   /board/write       → 새 게시글 작성                        │
 * │   /board/edit/:id    → 기존 게시글 수정                       │
 * │                                                              │
 * │ API:                                                          │
 * │   POST /api/board        - 새 게시글 작성                    │
 * │   PUT  /api/board/{id}   - 기존 게시글 수정                  │
 * │   GET  /api/board/{id}   - 수정 시 기존 내용 불러오기         │
 * │                                                              │
 * │ 공지사항 체크박스: ADMIN 권한일 때만 표시                     │
 * │ 공지 등록 시 notice=true 전송 → 게시판 최상단 고정            │
 * └──────────────────────────────────────────────────────────────┘
 */
const BoardWrite = () => {
  const { id }   = useParams();  // 수정 모드일 때 게시글 ID
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "";
  const role     = localStorage.getItem("role") || "USER";
  const isAdmin  = role === "ADMIN";
  const isEdit   = !!id; // id가 있으면 수정 모드

  const [title,    setTitle]    = useState("");
  const [content,  setContent]  = useState("");
  const [isNotice, setIsNotice] = useState(false);

  useEffect(() => {
    // 비로그인 접근 차단
    if (!username) { alert("로그인이 필요합니다."); navigate("/"); return; }
    // 수정 모드: 기존 게시글 내용 불러오기
    if (isEdit) {
      api.get(`/board/${id}`).then((res) => {
        setTitle(res.data.title);
        setContent(res.data.content);
        setIsNotice(res.data.notice);
      });
    }
  }, [id]);

  /**
   * 게시글 제출 처리
   * - 유효성: 제목, 내용 필수
   * - 공지 여부: ADMIN이고 isNotice 체크 시에만 notice:true 전송
   * - 작성 성공: 작성한 게시글 상세 페이지로 이동
   * - 수정 성공: 해당 게시글 상세 페이지로 이동
   */
  const handleSubmit = async () => {
    if (!title.trim())   { alert("제목을 입력해주세요."); return; }
    if (!content.trim()) { alert("내용을 입력해주세요."); return; }

    const body = {
      title,
      content,
      writer: username,
      notice: isAdmin && isNotice, // ADMIN이 아니면 공지 불가
    };

    if (isEdit) {
      await api.put(`/board/${id}`, body);
      alert("수정되었습니다.");
      navigate(`/board/${id}`);
    } else {
      const res = await api.post("/board", body);
      alert("등록되었습니다.");
      navigate(`/board/${res.data.id}`); // 새로 생성된 게시글 상세로 이동
    }
  };

  const S = {
    glass: { background:"rgba(255,255,255,0.05)", backdropFilter:"blur(10px)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"15px", padding:"30px", marginTop:"20px" },
    input: { width:"100%", padding:"12px", background:"#333", border:"1px solid #444", color:"#fff", borderRadius:"8px", boxSizing:"border-box", fontSize:"1rem" },
  };

  return (
    <PageLayout maxWidth="1200px">
      <Link to="/board" style={{ color:"#ccc", textDecoration:"none" }}>← 게시판으로</Link>

      <div style={S.glass}>
        <h2 style={{ margin:"0 0 24px", color:"#e67e22" }}>{isEdit ? "✏️ 게시글 수정" : "✏️ 글쓰기"}</h2>

        {/* 공지사항 체크박스: ADMIN만 표시 */}
        {isAdmin && (
          <div style={{ display:"flex", alignItems:"center", gap:"10px", marginBottom:"16px" }}>
            <input type="checkbox" id="notice" checked={isNotice} onChange={(e) => setIsNotice(e.target.checked)}
              style={{ width:"18px", height:"18px", cursor:"pointer" }} />
            <label htmlFor="notice" style={{ color:"#e67e22", cursor:"pointer", fontWeight:"bold" }}>
              📌 공지사항으로 등록
            </label>
          </div>
        )}

        {/* 제목 입력 */}
        <input style={{ ...S.input, marginBottom:"16px" }} placeholder="제목을 입력하세요"
          value={title} onChange={(e) => setTitle(e.target.value)} />

        {/* 내용 입력 (textarea, resize 가능) */}
        <textarea style={{ ...S.input, minHeight:"300px", resize:"vertical", lineHeight:"1.6" }}
          placeholder="내용을 입력하세요" value={content} onChange={(e) => setContent(e.target.value)} />

        {/* 취소 / 제출 버튼 */}
        <div style={{ display:"flex", gap:"10px", marginTop:"20px", justifyContent:"flex-end" }}>
          <button onClick={() => navigate("/board")}
            style={{ padding:"12px 24px", background:"transparent", color:"#aaa", border:"1px solid #555", borderRadius:"8px", cursor:"pointer" }}>
            취소
          </button>
          <button onClick={handleSubmit}
            style={{ padding:"12px 24px", background:"#e67e22", color:"#fff", border:"none", borderRadius:"8px", cursor:"pointer", fontWeight:"bold" }}>
            {isEdit ? "수정 완료" : "등록하기"}
          </button>
        </div>
      </div>
    </PageLayout>
  );
};

export default BoardWrite;
