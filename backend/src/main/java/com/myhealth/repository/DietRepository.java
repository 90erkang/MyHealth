package com.myhealth.repository;

import com.myhealth.entity.DietLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query; // 추가 필수
import org.springframework.data.repository.query.Param; // 추가 필수
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DietRepository extends JpaRepository<DietLog, Long> {

    List<DietLog> findByUsername(String username);
    List<DietLog> findByUsernameAndDate(String username, LocalDate date);
    List<DietLog> findByUsernameAndDateBetween(String username, LocalDate start, LocalDate end);
    void deleteByUsernameAndDate(String username, LocalDate date);

    /** ✅ 이 메서드가 있어야 Controller의 빨간 줄이 사라집니다 */
    @Query("SELECT COALESCE(SUM(d.kcal), 0.0) FROM DietLog d WHERE d.username = :username AND d.date = :date")
    Double sumCaloriesByUsernameAndDate(@Param("username") String username, @Param("date") LocalDate date);
}