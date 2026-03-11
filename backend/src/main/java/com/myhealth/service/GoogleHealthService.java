package com.myhealth.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.time.*;
import java.util.*;

/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │                Google Fit 데이터 연동 서비스                   │
 * ├──────────────────────────────────────────────────────────────┤
 * │ Google Fitness REST API를 통해 오늘 하루 건강 데이터 수집     │
 * │                                                              │
 * │ 설정 (application.yaml):                                     │
 * │   google.client-id: GCP 콘솔에서 발급한 OAuth2 클라이언트 ID │
 * │   google.client-secret: 클라이언트 시크릿                    │
 * │   google.redirect-uri: 인가 코드를 받을 콜백 URL              │
 * │                                                              │
 * │ 처리 흐름:                                                    │
 * │   1. OAuth2 인가 코드 → 액세스 토큰 교환                      │
 * │   2. 오늘 00:00 ~ 현재까지 기간으로 버킷 1개 요청            │
 * │   3. 걸음수·거리·심박수 추출                                  │
 * │   4. 걸음수 → 운동시간(분) + 소모칼로리 환산                  │
 * └──────────────────────────────────────────────────────────────┘
 */
@Service
public class GoogleHealthService {

    @Value("${google.client-id}")     private String clientId;
    @Value("${google.client-secret}") private String clientSecret;
    @Value("${google.redirect-uri}")  private String redirectUri;

    /**
     * OAuth2 인가 코드로 Google Fitness API에서 오늘 건강 데이터 조회
     *
     * @param code Google OAuth2 인가 코드 (팝업 콜백에서 전달됨)
     * @return 건강 데이터 Map:
     *   {
     *     "steps"       : 8500,      ← 오늘 총 걸음수
     *     "distance"    : 6205.3,    ← 오늘 이동 거리 (m)
     *     "heartRate"   : 72,        ← 평균 심박수 (bpm)
     *     "temp"        : 0.0,       ← 체온 (Google Fit 미지원, 기본값)
     *     "oxygen"      : 0,         ← 혈중 산소 (Google Fit 미지원, 기본값)
     *     "stepsKcal"   : 420,       ← 걸음 소모 칼로리 (환산값)
     *     "walkMinutes" : 85         ← 환산 운동 시간 (분)
     *   }
     */
    public Map<String, Object> getTodayHealthData(String code) {
        RestTemplate restTemplate = new RestTemplate();

        // 기본 반환값 초기화 (API 오류 시에도 0으로 안전하게 반환)
        Map<String, Object> finalResult = new HashMap<>();
        finalResult.put("steps", 0);
        finalResult.put("distance", 0.0);
        finalResult.put("heartRate", 0);
        finalResult.put("temp", 0.0);
        finalResult.put("oxygen", 0);
        finalResult.put("stepsKcal", 0);
        finalResult.put("walkMinutes", 0);

        try {
            // ── Step 1: 인가 코드 → 액세스 토큰 교환 ──
            String tokenUrl = "https://oauth2.googleapis.com/token";
            Map<String, String> tokenParams = Map.of(
                    "code", code,
                    "client_id", clientId,
                    "client_secret", clientSecret,
                    "redirect_uri", redirectUri,
                    "grant_type", "authorization_code"
            );
            Map<String, Object> tokenRes = restTemplate.postForObject(tokenUrl, tokenParams, Map.class);
            String accessToken = (String) tokenRes.get("access_token");

            // ── Step 2: 오늘 하루 시간 범위 설정 (한국 시간 기준) ──
            ZoneId zone    = ZoneId.of("Asia/Seoul");
            long endTime   = Instant.now().toEpochMilli();                             // 현재 시각 (ms)
            long startTime = LocalDate.now(zone).atStartOfDay(zone).toInstant().toEpochMilli(); // 오늘 00:00 (ms)

            // ── Step 3: Google Fitness aggregate API 요청 ──
            // 오늘 하루를 버킷 1개로 집계 (걸음수 + 거리 + 심박수)
            Map<String, Object> requestBody = Map.of(
                    "aggregateBy", List.of(
                            Map.of("dataTypeName", "com.google.step_count.delta"),
                            Map.of("dataTypeName", "com.google.distance.delta"),
                            Map.of("dataTypeName", "com.google.heart_rate.bpm")
                    ),
                    "bucketByTime", Map.of("durationMillis", endTime - startTime), // 오늘 전체 = 1버킷
                    "startTimeMillis", startTime,
                    "endTimeMillis", endTime
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
                    entity, Map.class
            );

            // ── Step 4: 응답 파싱 ──
            if (response.getBody() != null) {
                List<Map<String, Object>> buckets = (List<Map<String, Object>>) response.getBody().get("bucket");
                if (buckets != null && !buckets.isEmpty()) {
                    List<Map<String, Object>> datasets = (List<Map<String, Object>>) buckets.get(0).get("dataset");

                    // 데이터셋 순서: [0]걸음수, [1]거리, [2]심박수
                    Object stepsObj    = extractVal(datasets, 0);
                    Object distanceObj = extractVal(datasets, 1);
                    Object heartObj    = extractVal(datasets, 2);

                    finalResult.put("steps",     stepsObj);
                    finalResult.put("distance",  distanceObj);
                    finalResult.put("heartRate", heartObj);

                    // ── Step 5: 걸음수 → 운동시간 + 칼로리 환산 ──
                    int steps = stepsObj instanceof Number ? ((Number) stepsObj).intValue() : 0;
                    double distanceM  = distanceObj instanceof Number ? ((Number) distanceObj).doubleValue() : 0.0;
                    double distanceKm = distanceM / 1000.0;

                    // 걸음수 / 100 ≈ 운동 시간(분) 근사값
                    int walkMinutes = steps > 0 ? Math.round(steps / 100.0f) : 0;

                    // 칼로리 계산 방식 1: MET 기반 (MET=3.5, 체중=65kg 가정)
                    int kcalByMet  = (int) Math.round(3.5 * 65 * (walkMinutes / 60.0));

                    // 칼로리 계산 방식 2: 거리 기반 (1km ≈ 60kcal)
                    int kcalByDist = (int) Math.round(distanceKm * 60);

                    // 둘 중 더 큰 값 사용 (거리 데이터가 없으면 MET 방식 사용)
                    int stepsKcal = distanceKm > 0 ? Math.max(kcalByDist, kcalByMet) : kcalByMet;

                    finalResult.put("walkMinutes", walkMinutes);
                    finalResult.put("stepsKcal", stepsKcal);
                }
            }
        } catch (Exception e) {
            System.err.println("❌ 데이터 연동 중 오류 발생: " + e.getMessage());
            // 오류 발생 시 기본값(0) 그대로 반환
        }
        return finalResult;
    }

    /**
     * 내부 유틸 - Google Fitness 데이터셋에서 값 추출
     * intVal (정수) 또는 fpVal (소수) 중 존재하는 값 반환
     *
     * @param datasets Google Fitness 버킷 내 데이터셋 목록
     * @param index    데이터 타입 순서 (0:걸음수, 1:거리, 2:심박수)
     * @return 추출된 값 (없으면 0)
     */
    private Object extractVal(List<Map<String, Object>> datasets, int index) {
        try {
            List<Map<String, Object>> points = (List<Map<String, Object>>) datasets.get(index).get("point");
            if (points == null || points.isEmpty()) return 0;
            List<Map<String, Object>> values = (List<Map<String, Object>>) points.get(0).get("value");
            Map<String, Object> valMap = values.get(0);
            // intVal이 있으면 정수값, 없으면 fpVal(소수) 반환
            return valMap.containsKey("intVal") ? valMap.get("intVal") : valMap.get("fpVal");
        } catch (Exception e) { return 0; }
    }
}
