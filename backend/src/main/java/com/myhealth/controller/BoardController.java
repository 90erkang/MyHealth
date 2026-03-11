package com.myhealth.controller;

import com.myhealth.entity.Board;
import com.myhealth.entity.BoardComment;
import com.myhealth.repository.BoardCommentRepository;
import com.myhealth.repository.BoardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │              커뮤니티 게시판 컨트롤러 /api/board/**            │
 * ├──────────────────────────────────────────────────────────────┤
 * │ GET    /api/board              게시글 목록 (페이징 + 검색)     │
 * │ GET    /api/board/{id}         게시글 상세 + 조회수 증가       │
 * │ POST   /api/board              게시글 작성                     │
 * │ PUT    /api/board/{id}         게시글 수정                     │
 * │ DELETE /api/board/{id}         게시글 삭제 (댓글 포함)         │
 * │ GET    /api/board/{id}/comments  댓글 목록                    │
 * │ POST   /api/board/{id}/comments  댓글 작성                    │
 * │ DELETE /api/board/comments/{id}  댓글 삭제                    │
 * │                                                              │
 * │ 공지 작성/수정은 서버 측에서도 ADMIN 권한 검증               │
 * │ (JWT의 Authentication 객체 활용)                             │
 * └──────────────────────────────────────────────────────────────┘
 */
@RestController
@RequestMapping("/api/board")
@RequiredArgsConstructor
public class BoardController {

    private final BoardRepository boardRepository;
    private final BoardCommentRepository commentRepository;

    /**
     * GET /api/board?page=0&size=10&keyword=검색어
     * 게시글 목록 - 페이징 + 제목 검색
     * 정렬: 공지(notice=true) 우선 → 최신순
     */
    @GetMapping
    public ResponseEntity<Page<Board>> getBoards(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "") String keyword
    ) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Board> result = keyword.isBlank()
                ? boardRepository.findAllByOrderByNoticeDescCreatedAtDesc(pageable)
                : boardRepository.findByTitleContainingOrderByNoticeDescCreatedAtDesc(keyword, pageable);
        return ResponseEntity.ok(result);
    }

    /**
     * GET /api/board/{id}
     * 게시글 상세 조회 + 조회수(views) 1 증가
     */
    @GetMapping("/{id}")
    public ResponseEntity<Board> getBoard(@PathVariable Long id) {
        return boardRepository.findById(id).map(board -> {
            board.setViews(board.getViews() + 1); // 조회수 증가
            boardRepository.save(board);
            return ResponseEntity.ok(board);
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /api/board
     * 게시글 작성
     * Body: { "title": "...", "content": "...", "writer": "...", "notice": false }
     *
     * ※ notice=true 는 ROLE_ADMIN 만 허용
     *    → 일반 유저가 notice=true로 전송해도 서버에서 false로 강제 변환
     *    → JWT에서 파싱된 Authentication 객체로 ADMIN 여부 확인
     */
    @PostMapping
    public ResponseEntity<Board> createBoard(
            @RequestBody Board board,
            Authentication auth  // JwtAuthFilter가 SecurityContext에 등록한 인증 정보
    ) {
        board.setViews(0); // 새 게시글 조회수 초기화

        // 공지 여부 서버 검증: ADMIN이 아니면 notice 강제 false
        if (Boolean.TRUE.equals(board.getNotice())) {
            boolean isAdmin = auth != null && auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            if (!isAdmin) {
                board.setNotice(false);
            }
        }
        return ResponseEntity.ok(boardRepository.save(board));
    }

    /**
     * PUT /api/board/{id}
     * 게시글 수정 (제목, 내용, 공지 여부)
     * ※ 공지 여부 변경은 ADMIN만 가능
     */
    @PutMapping("/{id}")
    public ResponseEntity<Board> updateBoard(
            @PathVariable Long id,
            @RequestBody Board updated,
            Authentication auth
    ) {
        return boardRepository.findById(id).map(board -> {
            board.setTitle(updated.getTitle());
            board.setContent(updated.getContent());

            // 공지 변경 권한 확인
            boolean isAdmin = auth != null && auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            if (isAdmin) {
                board.setNotice(updated.getNotice());
            }
            return ResponseEntity.ok(boardRepository.save(board));
        }).orElse(ResponseEntity.notFound().build());
    }

    /**
     * DELETE /api/board/{id}
     * 게시글 삭제 + 해당 게시글의 댓글 전부 삭제 (cascade)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBoard(@PathVariable Long id) {
        commentRepository.deleteByBoardId(id); // 댓글 먼저 삭제
        boardRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ═══════════════════════════════════════
    // 댓글 API
    // ═══════════════════════════════════════

    /**
     * GET /api/board/{id}/comments
     * 해당 게시글의 댓글 목록 (작성 시각 오름차순)
     */
    @GetMapping("/{id}/comments")
    public ResponseEntity<List<BoardComment>> getComments(@PathVariable Long id) {
        return ResponseEntity.ok(commentRepository.findByBoardIdOrderByCreatedAtAsc(id));
    }

    /**
     * POST /api/board/{id}/comments
     * 댓글 작성
     * Body: { "writer": "...", "content": "..." }
     */
    @PostMapping("/{id}/comments")
    public ResponseEntity<BoardComment> addComment(
            @PathVariable Long id,
            @RequestBody BoardComment comment
    ) {
        comment.setBoardId(id); // URL의 게시글 ID를 댓글에 주입
        return ResponseEntity.ok(commentRepository.save(comment));
    }

    /**
     * DELETE /api/board/comments/{commentId}
     * 댓글 삭제
     */
    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long commentId) {
        commentRepository.deleteById(commentId);
        return ResponseEntity.noContent().build();
    }
}
