package com.myhealth.repository;

import com.myhealth.entity.GameStats;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface GameRepository extends JpaRepository<GameStats, Long> {
    Optional<GameStats> findByUsername(String username);
}