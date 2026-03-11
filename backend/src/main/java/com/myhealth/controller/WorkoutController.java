package com.myhealth.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.http.ResponseEntity;

import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │          운동 영상 라이브러리 컨트롤러 /api/workout/**          │
 * ├──────────────────────────────────────────────────────────────┤
 * │ GET /api/workout/search?query=&aggrp_nm=&page=&numOfRows=    │
 * │                                                              │
 * │ 공공 API: 보건소 모바일 헬스케어 운동 영상 DB                  │
 * │   (https://apis.data.go.kr/B551014/SRVC_TODZ_VDO_PKG)        │
 * │   → CORS 이슈로 백엔드 프록시 처리                            │
 * │                                                              │
 * │ 파라미터:                                                     │
 * │   query      : 운동명 검색어 (trng_nm)                        │
 * │   aggrp_nm   : 연령 그룹 필터 (예: "청소년", "노인")           │
 * │   page       : 페이지 번호                                    │
 * │   numOfRows  : 페이지당 결과 수                                │
 * └──────────────────────────────────────────────────────────────┘
 */
@RestController
@RequestMapping("/api/workout")
public class WorkoutController {

    /** 공공데이터포털 서비스 키 */
    private static final String SERVICE_KEY =
            "c35a7bc960f15f7576e7cbe6c1bb010bd94ece7b1c18950f40525c57a205e163";

    /** 보건소 모바일 헬스케어 운동 영상 API 기본 URL */
    private static final String BASE_URL =
            "https://apis.data.go.kr/B551014/SRVC_TODZ_VDO_PKG/TODZ_VDO_VIEW_ALL_LIST_I";

    /**
     * GET /api/workout/search?query=스쿼트&aggrp_nm=&page=1&numOfRows=10
     * 운동 영상 DB 검색 (프록시)
     *
     * 응답: 공공 API JSON 원본 전달
     *   → WorkoutLibrary.jsx에서 파싱하여 영상 썸네일 + 링크 표시
     *
     * @param page      페이지 번호 (기본값: 1)
     * @param numOfRows 페이지당 결과 수 (기본값: 10)
     * @param query     운동명 검색어 (빈 문자열이면 전체 조회)
     * @param aggrp_nm  연령 그룹 필터 (빈 문자열이면 필터 없음)
     */
    @GetMapping("/search")
    public ResponseEntity<String> searchWorkout(
            @RequestParam(defaultValue = "1")  int page,
            @RequestParam(defaultValue = "10") int numOfRows,
            @RequestParam(defaultValue = "") String query,
            @RequestParam(defaultValue = "") String aggrp_nm
    ) {
        try {
            String encodedKey = URLEncoder.encode(SERVICE_KEY, StandardCharsets.UTF_8);

            // URL 조합
            StringBuilder urlStr = new StringBuilder(BASE_URL)
                    .append("?serviceKey=").append(encodedKey)
                    .append("&pageNo=").append(page)
                    .append("&numOfRows=").append(numOfRows)
                    .append("&resultType=json");

            // 검색어가 있으면 trng_nm 파라미터 추가
            if (!query.isBlank()) {
                urlStr.append("&trng_nm=")
                        .append(URLEncoder.encode(query.trim(), StandardCharsets.UTF_8));
            }

            // 연령 그룹 필터가 있으면 aggrp_nm 파라미터 추가
            if (!aggrp_nm.isBlank()) {
                urlStr.append("&aggrp_nm=")
                        .append(URLEncoder.encode(aggrp_nm.trim(), StandardCharsets.UTF_8));
            }

            var uri = new URL(urlStr.toString()).toURI();
            System.out.println("[WorkoutController] 호출 URL: " + uri);

            RestTemplate restTemplate = new RestTemplate();
            String response = restTemplate.getForObject(uri, String.class);

            if (response == null) {
                return ResponseEntity.status(502).body("{\"error\":\"API 응답 없음\"}");
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
}
