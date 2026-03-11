package com.myhealth.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.*;

/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │              AI 트레이너 컨트롤러 /api/ai/**                  │
 * ├──────────────────────────────────────────────────────────────┤
 * │ Google Gemini 2.5 Flash API를 활용한 AI PT 채팅 기능         │
 * │                                                              │
 * │ POST /api/ai/chat                                            │
 * │   Body : { "message": "사용자 질문" }                         │
 * │   Return: Gemini API 원본 JSON 응답 (프론트에서 파싱)         │
 * │                                                              │
 * │ 프롬프트 설정:                                                │
 * │   - 10년차 퍼스널 트레이너 페르소나                           │
 * │   - 3문장 내외 간결한 답변                                    │
 * │   - 영상 요청 시에만 유튜브 검색 URL 제공                     │
 * │   - 추천 채널: 피지컬갤러리, 김종국, 백종원 등                │
 * └──────────────────────────────────────────────────────────────┘
 */
@RestController
@RequestMapping("/api/ai")
public class AiController {

    /** Gemini API 키 (Google AI Studio에서 발급) */
    private static final String API_KEY = "AIzaSyAgj_iHXmQK_RW9Zv6MaWpD5UaW0IJpl3I";

    /** Gemini 2.5 Flash 모델 엔드포인트 */
    private static final String GEMINI_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + API_KEY;

    /**
     * POST /api/ai/chat
     *
     * 처리 흐름:
     *   1. 사용자 메시지 수신
     *   2. PT 프롬프트 + 메시지를 Gemini API 형식으로 조합
     *   3. RestTemplate으로 Gemini API 호출
     *   4. 응답 JSON을 그대로 프론트엔드로 전달
     *
     * 에러 처리:
     *   - Google API 4xx 에러 → error 메시지 반환
     *   - 서버 내부 에러 → 500 + 메시지 반환
     *
     * @param request { "message": "..." }
     * @return Gemini API 응답 JSON
     */
    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody Map<String, String> request) {
        try {
            String userMessage = request.getOrDefault("message", "");

            // ── 시스템 프롬프트 + 사용자 질문 조합 ──
            String prompt = "당신은 10년 차 전문 퍼스널 트레이너(PT)입니다.\n" +
                    "사용자를 '회원님'이라고 부르며, 정중하고 이해하기 쉬운 존댓말을 사용하세요.\n\n" +
                    "[답변 규칙]\n" +
                    "1. 질문에 대한 전문적인 답변을 3문장 내외로 간결하게 먼저 제시하세요.\n" +
                    "2. (중요) 사용자가 **영상이나 링크를 요청할 경우에만** 추천 링크를 제공하세요.\n" +
                    "3. (핵심) 재생되지 않는 링크를 방지하기 위해, 특정 영상 URL 대신 **'유튜브 검색 결과 URL'**을 제공하세요.\n" +
                    "   - 형식: https://www.youtube.com/results?search_query=검색어\n" +
                    "4. 추천 채널: 운동은 '피지컬갤러리', '김종국', '강하나', 식단은 '백종원', '성시경'\n\n" +
                    "사용자 질문: " + userMessage;

            // ── Gemini API 요청 바디 구성 ──
            // { "contents": [{ "parts": [{ "text": "..." }] }] }
            Map<String, Object> part = new HashMap<>();
            part.put("text", prompt);

            Map<String, Object> content = new HashMap<>();
            content.put("parts", Collections.singletonList(part));

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", Collections.singletonList(content));

            // ── Gemini API 호출 ──
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(GEMINI_URL, entity, String.class);
            return ResponseEntity.ok(response.getBody()); // 원본 JSON 그대로 반환

        } catch (HttpClientErrorException e) {
            // 4xx 에러: API 키 문제, 할당량 초과 등
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "구글 API 거절 사유: " + e.getResponseBodyAsString()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Collections.singletonMap("error", "서버 내부 에러: " + e.getMessage()));
        }
    }
}
