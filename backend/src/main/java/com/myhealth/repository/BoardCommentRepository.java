package com.myhealth.repository;

import com.myhealth.entity.BoardComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BoardCommentRepository extends JpaRepository<BoardComment, Long> {
    List<BoardComment> findByBoardIdOrderByCreatedAtAsc(Long boardId);
    void deleteByBoardId(Long boardId);
}
