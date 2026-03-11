package com.myhealth.repository;

import com.myhealth.entity.Board;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BoardRepository extends JpaRepository<Board, Long> {

    Page<Board> findAllByOrderByNoticeDescCreatedAtDesc(Pageable pageable);
    Page<Board> findByTitleContainingOrderByNoticeDescCreatedAtDesc(String keyword, Pageable pageable);
}
