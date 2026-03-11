package com.myhealth.controller;

import com.myhealth.entity.Routine;
import com.myhealth.repository.RoutineRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │              운동 루틴 컨트롤러 /api/routine/**               │
 * ├──────────────────────────────────────────────────────────────┤
 * │ GET  /api/routine/search?query=달리기  MET 기반 운동 검색     │
 * │ GET  /api/routine/{username}?year=&month=  월간 루틴 조회    │
 * │ POST /api/routine/{username}              날짜 루틴 저장      │
 * │                                                              │
 * │ 공공 API: 공공데이터포털 운동 MET 데이터 (ODCloud)            │
 * │   - MET(Metabolic Equivalent) 값으로 칼로리 계산             │
 * │   - 칼로리 = MET × 체중(kg) × 시간(h)                       │
 * │                                                              │
 * │ 응답 구조: Routine.jsx가 기다리는 중첩 JSON 형식으로 래핑     │
 * │   { response: { body: { items: { item: [] } } } }            │
 * └──────────────────────────────────────────────────────────────┘
 */
@RestController
@RequestMapping("/api/routine")
@RequiredArgsConstructor
public class RoutineController {

    private final RoutineRepository routineRepository;

    /** 공공데이터포털 서비스 키 */
    private static final String SERVICE_KEY = "c35a7bc960f15f7576e7cbe6c1bb010bd94ece7b1c18950f40525c57a205e163";

    /** 운동 MET 데이터 API (ODCloud) */
    private static final String MET_API_URL = "https://api.odcloud.kr/api/15068730/v1/uddi:ed8fd49d-2724-4acc-a62e-f655a9e9a96e";

    /**
     * GET /api/routine/search?query=달리기
     * 공공 운동 MET 데이터 검색 (프록시)
     *
     * - 전체 1000건 조회 후 운동명 기준 로컬 필터링
     * - 응답 형식: { response: { body: { items: { item: [{ trng_nm, met_value }] }, totalCount } } }
     *   → Routine.jsx에서 파싱하는 구조와 동일하게 래핑
     */
    @GetMapping("/search")
    public ResponseEntity<Map<String, Object>> searchRoutineExercise(@RequestParam String query) {
        try {
            String urlStr = MET_API_URL
                    + "?page=1&perPage=1000&returnType=JSON"
                    + "&serviceKey=" + SERVICE_KEY;

            URI uri = new URI(urlStr);
            RestTemplate restTemplate = new RestTemplate();

            @SuppressWarnings("unchecked")
            Map<String, Object> apiResponse = restTemplate.getForObject(uri, Map.class);

            if (apiResponse == null || !apiResponse.containsKey("data")) {
                return ResponseEntity.ok(new HashMap<>());
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> rawData = (List<Map<String, Object>>) apiResponse.get("data");

            // 검색어로 필터링 + 운동명/MET 값만 추출
            List<Map<String, Object>> filtered = rawData.stream()
                    .filter(item -> String.valueOf(item.get("운동명")).contains(query))
                    .map(item -> {
                        Map<String, Object> m = new HashMap<>();
                        m.put("trng_nm", item.get("운동명"));                         // 운동명
                        m.put("met_value", item.get("단위체중당에너지소비량"));      // MET 값
                        return m;
                    }).collect(Collectors.toList());

            // Routine.jsx에서 파싱하는 구조로 래핑
            Map<String, Object> itemWrap    = Collections.singletonMap("item", filtered);
            Map<String, Object> bodyWrap    = new HashMap<>();
            bodyWrap.put("items", itemWrap);
            bodyWrap.put("totalCount", filtered.size());
            Map<String, Object> responseWrap = Collections.singletonMap("body", bodyWrap);

            return ResponseEntity.ok(Collections.singletonMap("response", responseWrap));

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    /**
     * GET /api/routine/{username}?year=2026&month=3
     * 월간 운동 루틴 조회 (캘린더 표시용)
     */
    @GetMapping("/{username}")
    public ResponseEntity<List<Routine>> getMonthlyRoutine(
            @PathVariable String username,
            @RequestParam int year,
            @RequestParam int month
    ) {
        LocalDate start = YearMonth.of(year, month).atDay(1);
        LocalDate end   = YearMonth.of(year, month).atEndOfMonth();
        return ResponseEntity.ok(routineRepository.findByUsernameAndWorkoutDateBetween(username, start, end));
    }

    /**
     * POST /api/routine/{username}
     * 날짜 운동 루틴 저장 (전체 교체 방식)
     *
     * Body:
     * {
     *   "date": "2026-03-11",
     *   "workouts": [
     *     { "name": "달리기", "met": 8.0, "time": 30, "kcal": 280 },
     *     ...
     *   ]
     * }
     *
     * 처리: 해당 날짜 기존 루틴 전부 삭제 → 새 루틴으로 재저장
     */
    @PostMapping("/{username}")
    @Transactional
    public ResponseEntity<List<Routine>> saveRoutine(
            @PathVariable String username,
            @RequestBody RoutineSaveRequest request
    ) {
        // 해당 날짜 기존 루틴 전부 삭제
        routineRepository.deleteByUsernameAndWorkoutDate(username, request.getDate());

        // 새 루틴 목록 저장
        List<Routine> toSave = request.getWorkouts().stream()
                .map(w -> Routine.builder()
                        .username(username)
                        .workoutDate(request.getDate())
                        .name(w.getName())       // 운동명
                        .met(w.getMet())         // MET 강도
                        .time(w.getTime())       // 운동 시간 (분)
                        .kcal(w.getKcal())       // 소모 칼로리
                        .build())
                .toList();

        return ResponseEntity.ok(routineRepository.saveAll(toSave));
    }

    // ═══════════════════════════════════════
    // DTO
    // ═══════════════════════════════════════

    /** 루틴 저장 요청 DTO: 날짜 + 운동 목록 */
    @lombok.Data
    public static class RoutineSaveRequest {
        private LocalDate date;
        private List<WorkoutItem> workouts;
    }

    /** 개별 운동 항목 DTO */
    @lombok.Data
    public static class WorkoutItem {
        private String name;   // 운동명
        private Double met;    // MET 강도 (에너지 소비량)
        private Integer time;  // 운동 시간 (분)
        private Integer kcal;  // 소모 칼로리 (kcal)
    }
}
