package com.myhealth.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │                      CORS 전역 설정                           │
 * ├──────────────────────────────────────────────────────────────┤
 * │ 개별 컨트롤러에 @CrossOrigin 대신 이 설정 하나로 전역 처리    │
 * │                                                              │
 * │ 허용 출처  : * (모든 도메인) - allowedOriginPatterns 사용    │
 * │   ※ allowCredentials=true 와 함께 쓰려면 반드시             │
 * │     setAllowedOrigins("*") 대신 setAllowedOriginPatterns 사용│
 * │                                                              │
 * │ 허용 메서드: GET, POST, PUT, DELETE, OPTIONS                  │
 * │ 허용 헤더  : 모든 헤더 (Authorization 포함)                   │
 * │ 인증 포함  : true (JWT 쿠키/헤더 허용)                        │
 * └──────────────────────────────────────────────────────────────┘
 */
@Configuration
public class CorsConfig {

    /**
     * SecurityConfig에서 cors().configurationSource(...)에 주입되는 Bean
     * 모든 경로("/**")에 동일한 CORS 정책 적용
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        // 모든 출처 허용 (패턴 방식 → allowCredentials=true와 호환됨)
        config.setAllowedOriginPatterns(List.of("*"));

        // 허용 HTTP 메서드
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        // 모든 요청 헤더 허용 (Authorization: Bearer {JWT} 포함)
        config.setAllowedHeaders(List.of("*"));

        // 쿠키 및 인증 헤더 포함 요청 허용
        config.setAllowCredentials(true);

        // 모든 API 경로에 위 설정 적용
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
