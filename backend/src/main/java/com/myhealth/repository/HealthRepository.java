package com.myhealth.repository;

import com.myhealth.entity.HealthRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.time.LocalDate;

public interface HealthRepository extends JpaRepository<HealthRecord, Long> {
    // 특정 유저의 모든 기록 가져오기 (날짜순 정렬)
    List<HealthRecord> findAllByUsernameOrderByDateAsc(String username);

    // 특정 유저의 특정 날짜 기록 찾기 (수정할 때 필요)
    Optional<HealthRecord> findByUsernameAndDate(String username, LocalDate date);


}