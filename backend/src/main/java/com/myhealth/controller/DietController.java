package com.myhealth.controller;

import com.myhealth.entity.DietLog;
import com.myhealth.repository.DietRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │              식단 컨트롤러 /api/diet/**                        │
 * ├──────────────────────────────────────────────────────────────┤
 * │ GET  /api/diet/search?query=닭가슴살  공공 식품 영양성분 검색  │
 * │ GET  /api/diet/{username}?year=&month= 월간 식단 조회         │
 * │ GET  /api/diet/{username}/day?date=    일별 식단 조회         │
 * │ POST /api/diet/{username}              날짜 식단 저장(전체교체)│
 * │ DEL  /api/diet/{username}?date=        날짜 식단 삭제          │
 * │                                                              │
 * │ 공공 API: 공공데이터포털 식품영양성분 DB                       │
 * │   (https://apis.data.go.kr/1471000/FoodNtrCpntDbInq02)       │
 * │   → CORS 이슈로 백엔드에서 프록시 처리                        │
 * └──────────────────────────────────────────────────────────────┘
 */
@RestController
@RequestMapping("/api/diet")
@RequiredArgsConstructor
public class DietController {

    private final DietRepository dietRepository;

    /** 공공데이터포털 서비스 키 */
    private static final String SERVICE_KEY =
        "c35a7bc960f15f7576e7cbe6c1bb010bd94ece7b1c18950f40525c57a205e163";

    /** 식품 영양성분 DB API 기본 URL */
    private static final String FOOD_API_URL =
        "https://apis.data.go.kr/1471000/FoodNtrCpntDbInfo02/getFoodNtrCpntDbInq02";

    // ═══════════════════════════════════════
    // 공공 식품 영양성분 DB 검색 (프록시)
    // ═══════════════════════════════════════

    /**
     * GET /api/diet/search?query=닭가슴살&pageNo=1&numOfRows=20
     * 공공 식품 영양성분 DB에서 음식명으로 검색
     *
     * - 브라우저에서 직접 공공 API 호출 시 CORS 차단됨
     * - 백엔드에서 프록시 역할: 프론트 → 백엔드 → 공공API → 백엔드 → 프론트
     * - 응답: 공공 API JSON 원본 그대로 전달
     */
    @GetMapping("/search")
    public ResponseEntity<String> searchFood(
            @RequestParam String query,
            @RequestParam(defaultValue = "1")  int pageNo,
            @RequestParam(defaultValue = "20") int numOfRows
    ) {
        try {
            // 서비스 키와 검색어는 URL 인코딩 처리 (한글 깨짐 방지)
            String encodedKey   = URLEncoder.encode(SERVICE_KEY, StandardCharsets.UTF_8);
            String encodedQuery = URLEncoder.encode(query.trim(), StandardCharsets.UTF_8);

            String urlStr = FOOD_API_URL
                    + "?serviceKey=" + encodedKey
                    + "&FOOD_NM_KR=" + encodedQuery
                    + "&pageNo="     + pageNo
                    + "&numOfRows="  + numOfRows
                    + "&type=json";

            URI uri = new java.net.URL(urlStr).toURI();
            System.out.println("[DietController] 식품 API 호출: " + uri);

            RestTemplate restTemplate = new RestTemplate();
            String response = restTemplate.getForObject(uri, String.class);

            if (response == null) {
                return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                        .body("{\"error\":\"공공데이터 API 응답 없음\"}");
            }
            return ResponseEntity.ok(response);

        } catch (HttpServerErrorException | HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body("{\"error\":\"서버 에러: " + e.getMessage() + "\"}");
        }
    }

    // ═══════════════════════════════════════
    // 식단 CRUD
    // ═══════════════════════════════════════

    /**
     * GET /api/diet/{username}?year=2026&month=3
     * 월간 식단 조회 (캘린더 표시용)
     */
    @GetMapping("/{username}")
    public ResponseEntity<List<DietLog>> getMonthlyDiet(
            @PathVariable String username,
            @RequestParam int year,
            @RequestParam int month
    ) {
        LocalDate start = YearMonth.of(year, month).atDay(1);         // 월의 첫날
        LocalDate end   = YearMonth.of(year, month).atEndOfMonth();   // 월의 마지막날
        return ResponseEntity.ok(dietRepository.findByUsernameAndDateBetween(username, start, end));
    }

    /**
     * GET /api/diet/{username}/day?date=2026-03-11
     * 특정 날짜의 식단 전체 조회 (아침/점심/저녁/간식 목록)
     */
    @GetMapping("/{username}/day")
    public ResponseEntity<List<DietLog>> getDailyDiet(
            @PathVariable String username,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return ResponseEntity.ok(dietRepository.findByUsernameAndDate(username, date));
    }

    /**
     * POST /api/diet/{username}
     * 날짜 식단 저장 (전체 교체 방식 - Upsert)
     *
     * Body:
     * {
     *   "date": "2026-03-11",
     *   "meals": [
     *     { "mealType": "아침", "menu": "닭가슴살", "weight": 200, "kcal": 330, ... },
     *     ...
     *   ]
     * }
     *
     * 처리: 해당 날짜의 기존 데이터 전부 삭제 → 새 데이터로 재저장
     * (음식명이 비어있는 항목은 필터링)
     */
    @PostMapping("/{username}")
    @Transactional
    public ResponseEntity<List<DietLog>> saveDiet(
            @PathVariable String username,
            @RequestBody DietSaveRequest request
    ) {
        LocalDate date = request.getDate();

        // 해당 날짜 기존 식단 전부 삭제
        dietRepository.deleteByUsernameAndDate(username, date);

        // 음식명이 있는 항목만 저장
        List<DietLog> toSave = request.getMeals().stream()
                .filter(m -> m.getMenu() != null && !m.getMenu().isBlank())
                .map(m -> {
                    DietLog log = new DietLog();
                    log.setUsername(username);
                    log.setDate(date);
                    log.setMealType(m.getMealType());    // 아침/점심/저녁/간식
                    log.setMenu(m.getMenu());            // 음식명
                    log.setBaseWeight(m.getBaseWeight()); // 기준 무게(g)
                    log.setWeight(m.getWeight());         // 섭취 무게(g)
                    log.setKcal(m.getKcal());             // 칼로리
                    log.setCarbs(m.getCarbs());           // 탄수화물
                    log.setProtein(m.getProtein());       // 단백질
                    log.setFat(m.getFat());               // 지방
                    return log;
                }).toList();

        return ResponseEntity.ok(dietRepository.saveAll(toSave));
    }

    /**
     * DELETE /api/diet/{username}?date=2026-03-11
     * 특정 날짜의 식단 전체 삭제
     */
    @DeleteMapping("/{username}")
    @Transactional
    public ResponseEntity<Void> deleteDiet(
            @PathVariable String username,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        dietRepository.deleteByUsernameAndDate(username, date);
        return ResponseEntity.noContent().build();
    }

    // ═══════════════════════════════════════
    // DTO (Data Transfer Object)
    // ═══════════════════════════════════════

    /** 식단 저장 요청 DTO: 날짜 + 식사 목록 */
    @lombok.Data
    public static class DietSaveRequest {
        private LocalDate date;
        private List<MealItem> meals;
    }

    /** 개별 식사 항목 DTO */
    @lombok.Data
    public static class MealItem {
        private String mealType;    // 아침/점심/저녁/간식
        private String menu;         // 음식명
        private Double baseWeight;   // 기준 무게 (g)
        private Double weight;        // 섭취 무게 (g)
        private Double kcal;          // 칼로리 (kcal)
        private Double carbs;         // 탄수화물 (g)
        private Double protein;       // 단백질 (g)
        private Double fat;           // 지방 (g)
    }
}
