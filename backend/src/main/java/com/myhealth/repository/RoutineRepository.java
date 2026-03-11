package com.myhealth.repository;

import com.myhealth.entity.Routine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RoutineRepository extends JpaRepository<Routine, Long> {

    List<Routine> findByUsername(String username);
    List<Routine> findByUsernameAndWorkoutDate(String username, LocalDate date);
    List<Routine> findByUsernameAndWorkoutDateBetween(String username, LocalDate start, LocalDate end);
    void deleteByUsernameAndWorkoutDate(String username, LocalDate date);

    @Query("SELECT COALESCE(SUM(r.kcal), 0) FROM Routine r WHERE r.username = :username AND r.workoutDate = :date")
    Integer sumCaloriesByUsernameAndDate(@Param("username") String username, @Param("date") LocalDate date);

    @Query("SELECT COALESCE(SUM(r.time), 0) FROM Routine r WHERE r.username = :username AND r.workoutDate = :date")
    Integer sumTimeByUsernameAndDate(@Param("username") String username, @Param("date") LocalDate date);
}