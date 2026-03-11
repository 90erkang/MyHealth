package com.myhealth.controller;

import com.myhealth.service.GoogleHealthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │         Google Fit 연동 컨트롤러 /api/sync/**                  │
 * ├──────────────────────────────────────────────────────────────┤
 * │ POST /api/sync/google-fit                                    │
 * │   Body: { "code": "OAuth2 인가 코드" }                        │
 * │                                                              │
 * │ 처리 흐름:                                                    │
 * │   1. 프론트(GoogleHealthPage.jsx)에서 Google OAuth 팝업 실행  │
 * │   2. 팝업에서 callback.html이 인가 코드를 받아 postMessage 전달│
 * │   3. 프론트가 code를 이 API로 전송                            │
 * │   4. GoogleHealthService에서 code → 액세스 토큰 교환          │
 * │   5. Google Fitness API로 오늘 걸음수/거리/심박수 조회        │
 * │   6. 걸음수 → 운동시간·칼로리 환산 후 반환                   │
 * │                                                              │
 * │ 반환 데이터:                                                  │
 * │   steps, distance, heartRate, stepsKcal, walkMinutes 등       │
 * └──────────────────────────────────────────────────────────────┘
 */
@RestController
@RequestMapping("/api/sync")
@CrossOrigin(origins = "http://myhealth90.online") // Google Fit 연동은 운영 도메인에서만 허용
public class GoogleHealthController {

    @Autowired
    private GoogleHealthService googleHealthService;

    /**
     * POST /api/sync/google-fit
     * Body: { "code": "4/0AX4XfWg..." }
     *
     * @param request { "code": "인가 코드" }
     * @return 오늘 하루 건강 데이터 Map
     *         { steps, distance, heartRate, temp, oxygen, stepsKcal, walkMinutes }
     */
    @PostMapping("/google-fit")
    public ResponseEntity<?> syncGoogleFit(@RequestBody Map<String, String> request) {
        String code = request.get("code");
        try {
            // GoogleHealthService에서 OAuth 토큰 교환 + Google Fitness API 호출
            Map<String, Object> healthData = googleHealthService.getTodayHealthData(code);
            return ResponseEntity.ok(healthData);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("동기화 실패: " + e.getMessage());
        }
    }
}
