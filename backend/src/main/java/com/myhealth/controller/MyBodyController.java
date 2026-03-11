package com.myhealth.controller;

import com.myhealth.entity.HealthRecord;
import com.myhealth.repository.HealthRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │            내 몸 기록 컨트롤러 /api/health/**                  │
 * ├──────────────────────────────────────────────────────────────┤
 * │ GET    /api/health/{username}           전체 기록 조회(날짜순) │
 * │ POST   /api/health/save                 기록 저장/수정(Upsert)│
 * │ DELETE /api/health/{username}/{date}    기록 삭제              │
 * │                                                              │
 * │ 기록 항목: 날짜, 체중, 키, 수축기혈압, 이완기혈압, 혈당        │
 * │ Upsert: 같은 username+date가 이미 있으면 update, 없으면 insert │
 * └──────────────────────────────────────────────────────────────┘
 */
@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
public class MyBodyController {

    private final HealthRepository healthRepository;

    /**
     * GET /api/health/{username}
     * 해당 유저의 전체 건강 기록 조회 (날짜 오름차순)
     * → Main.jsx의 체중·혈압 차트, MyBody.jsx 테이블에서 사용
     */
    @GetMapping("/{username}")
    public List<HealthRecord> getMyRecords(@PathVariable String username) {
        return healthRepository.findAllByUsernameOrderByDateAsc(username);
    }

    /**
     * POST /api/health/save
     * 건강 기록 저장 or 수정 (Upsert)
     *
     * Body:
     * {
     *   "username": "hong",
     *   "date": "2026-03-11",
     *   "weight": 72.5,
     *   "height": 175.0,
     *   "systolicBp": 120,
     *   "diastolicBp": 80,
     *   "bloodSugar": 95
     * }
     *
     * - 같은 날짜 기록이 있으면 해당 레코드 업데이트
     * - 없으면 신규 저장
     */
    @PostMapping("/save")
    public HealthRecord saveRecord(@RequestBody HealthRecord record) {
        HealthRecord existing = healthRepository
                .findByUsernameAndDate(record.getUsername(), record.getDate())
                .orElse(null);

        if (existing != null) {
            // 기존 기록 업데이트 (ID 유지)
            existing.setWeight(record.getWeight());
            existing.setHeight(record.getHeight());
            existing.setSystolicBp(record.getSystolicBp());     // 수축기 혈압
            existing.setDiastolicBp(record.getDiastolicBp());   // 이완기 혈압
            existing.setBloodSugar(record.getBloodSugar());     // 혈당
            return healthRepository.save(existing);
        }

        // 신규 저장
        return healthRepository.save(record);
    }

    /**
     * DELETE /api/health/{username}/{date}
     * 특정 날짜의 건강 기록 삭제
     * @param date 날짜 문자열 (ISO 형식: "2026-03-11")
     */
    @DeleteMapping("/{username}/{date}")
    public void deleteRecord(@PathVariable String username, @PathVariable String date) {
        LocalDate localDate = LocalDate.parse(date);
        healthRepository.findByUsernameAndDate(username, localDate)
                .ifPresent(healthRepository::delete);
    }
}
