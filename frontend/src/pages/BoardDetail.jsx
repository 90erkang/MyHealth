import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../api";
import PageLayout from "../components/PageLayout";
import "../common.css";

/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │            BoardDetail.jsx - 게시글 상세 + 댓글 페이지        │
 * ├──────────────────────────────────────────────────────────────┤
 * │ 경로: /board/:id                                             │
 * │                                                              │
 * │ API:                                                          │
 * │   GET    /api/board/{id}              - 게시글 조회 (조회수↑)│
 * │   DELETE /api/board/{id}              - 게시글 삭제          │
 * │   PUT    /api/board/{id}              - 게시글 수정          │
 * │   GET    /api/board/{id}/comments    - 댓글 목록 조회        │
 * │   POST   /api/board/{id}/comments    - 댓글 작성            │
 * │   DELETE /api/board/comments/{cid}   - 댓글 삭제            │
 * │                                                              │
 * │ 권한:                                                         │
 * │   수정/삭제: ADMIN 또는 본인(writer === username)            │
 * │   댓글 작성: 로그인 필요                                      │
 * │   댓글 삭제: ADMIN 또는 본인                                  │
 * └──────────────────────────────────────────────────────────────┘
 */
const BoardDetail = () => {
  const { id }   = useParams();   // URL의 게시글 ID
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "";
  const role     = localStorage.getItem("role") || "USER";
  const isAdmin  = role === "ADMIN";

  const [post,       setPost]       = useState(null);
  const [comments,   setComments]   = useState([]);
  const [newComment, setNewComment] = useState("");

  // 컴포넌트 마운트 or ID 변경 시 게시글·댓글 조회
  useEffect(() => { fetchPost(); fetchComments(); }, [id]);

  /** 게시글 조회 (조회수 자동 증가는 서버에서 처리) */
  const fetchPost = async () => {
    try {
      const res = await api.get(`/board/${id}`);
      setPost(res.data);
    } catch (err) {
      alert("게시글을 불러올 수 없습니다.");
      navigate("/board");
    }
  };

  /** 댓글 목록 조회 */
  const fetchComments = async () => {
    try {
      const res = await api.get(`/board/${id}/comments`);
      setComments(res.data);
    } catch (err) {
      console.error("댓글 조회 실패", err);
    }
  };

  /** 게시글 삭제 (confirm 후 삭제 → 게시판 목록으로 이동) */
  const handleDelete = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    await api.delete(`/board/${id}`);
    alert("삭제되었습니다.");
    navigate("/board");
  };

  /** 댓글 작성 (writer: localStorage username, content: 입력값) */
  const handleCommentSubmit = async () => {
    if (!newComment.trim()) { alert("댓글을 입력해주세요."); return; }
    await api.post(`/board/${id}/comments`, { writer: username, content: newComment });
    setNewComment("");
    fetchComments(); // 댓글 목록 새로고침
  };

  /** 댓글 삭제 */
  const handleCommentDelete = async (commentId) => {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
    await api.delete(`/board/comments/${commentId}`);
    fetchComments();
  };

  /** 날짜 포맷: "YYYY.MM.DD HH:mm" */
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,"0")}.${String(d.getDate()).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  };

  if (!post) return null; // 로딩 중

  // 수정/삭제 가능 여부: ADMIN 또는 본인
  const canDelete = isAdmin || post.writer === username;
  const canEdit   = isAdmin || post.writer === username;

  const S = {
    glass: { background:"rgba(255,255,255,0.05)", backdropFilter:"blur(10px)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:"15px", padding:"30px", marginBottom:"20px" },
    input: { width:"100%", padding:"12px", background:"#333", border:"1px solid #444", color:"#fff", borderRadius:"8px", boxSizing:"border-box" },
  };

  return (
    <PageLayout maxWidth="1200px">
      <Link to="/board" style={{ color:"#ccc", textDecoration:"none" }}>← 게시판으로</Link>

      {/* 게시글 본문 */}
      <div style={{ ...S.glass, marginTop:"20px" }}>
        {/* 공지 배지 */}
        {post.notice && (
          <span style={{ background:"#e67e22", color:"#fff", borderRadius:"4px", padding:"2px 10px", fontSize:"0.8rem", marginBottom:"12px", display:"inline-block" }}>공지</span>
        )}
        <h2 style={{ color:"#fff", margin:"10px 0" }}>{post.title}</h2>

        {/* 메타 정보 + 수정/삭제 버튼 */}
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid #333", paddingBottom:"12px", marginBottom:"24px" }}>
          <div style={{ color:"#aaa", fontSize:"0.85rem" }}>
            <span style={{ marginRight:"16px" }}>✍️ {post.writer}</span>
            <span style={{ marginRight:"16px" }}>🕐 {formatDate(post.createdAt)}</span>
            <span>👁 {post.views}</span>
          </div>
          <div style={{ display:"flex", gap:"8px" }}>
            {canEdit && (
              <button onClick={() => navigate(`/board/edit/${post.id}`)}
                style={{ padding:"6px 14px", background:"#444", color:"#fff", border:"1px solid #555", borderRadius:"6px", cursor:"pointer" }}>
                수정
              </button>
            )}
            {canDelete && (
              <button onClick={handleDelete}
                style={{ padding:"6px 14px", background:"#c0392b", color:"#fff", border:"none", borderRadius:"6px", cursor:"pointer" }}>
                삭제
              </button>
            )}
          </div>
        </div>

        {/* 본문 내용 (pre-wrap으로 줄바꿈 보존) */}
        <div style={{ color:"#ddd", lineHeight:"1.8", minHeight:"200px", whiteSpace:"pre-wrap" }}>{post.content}</div>
      </div>

      {/* 댓글 섹션 */}
      <div style={S.glass}>
        <h3 style={{ margin:"0 0 20px", color:"#e67e22" }}>💬 댓글 {comments.length}개</h3>
        {comments.length === 0 && (
          <div style={{ color:"#555", textAlign:"center", padding:"20px" }}>첫 댓글을 남겨보세요!</div>
        )}
        {comments.map((c) => (
          <div key={c.id} style={{ borderBottom:"1px solid #2a2a2a", padding:"12px 0" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"6px" }}>
              <div style={{ display:"flex", gap:"12px", alignItems:"center" }}>
                <span style={{ color:"#e67e22", fontWeight:"bold", fontSize:"0.9rem" }}>{c.writer}</span>
                <span style={{ color:"#555", fontSize:"0.8rem" }}>{formatDate(c.createdAt)}</span>
              </div>
              {/* 본인 or ADMIN만 댓글 삭제 가능 */}
              {(isAdmin || c.writer === username) && (
                <button onClick={() => handleCommentDelete(c.id)}
                  style={{ background:"transparent", border:"none", color:"#e74c3c", cursor:"pointer", fontSize:"0.8rem" }}>
                  삭제
                </button>
              )}
            </div>
            <div style={{ color:"#ccc", fontSize:"0.9rem", lineHeight:"1.6" }}>{c.content}</div>
          </div>
        ))}

        {/* 댓글 입력창 (로그인 시에만) */}
        {username ? (
          <div style={{ marginTop:"20px", display:"flex", gap:"10px" }}>
            <input style={{ ...S.input, flex:1 }} placeholder="댓글을 입력하세요..."
              value={newComment} onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleCommentSubmit()} />
            <button onClick={handleCommentSubmit}
              style={{ padding:"12px 20px", background:"#e67e22", color:"#fff", border:"none", borderRadius:"8px", cursor:"pointer", fontWeight:"bold", whiteSpace:"nowrap" }}>
              등록
            </button>
          </div>
        ) : (
          <div style={{ marginTop:"20px", color:"#555", textAlign:"center" }}>
            댓글을 작성하려면 <Link to="/" style={{ color:"#e67e22" }}>로그인</Link>이 필요합니다.
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default BoardDetail;
