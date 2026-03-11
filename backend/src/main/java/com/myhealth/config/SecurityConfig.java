package com.myhealth.config;

import com.myhealth.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │                  Spring Security 설정                         │
 * ├──────────────────────────────────────────────────────────────┤
 * │ 인증 방식: JWT Stateless (세션 미사용)                         │
 * │ 필터 순서: JwtAuthFilter → UsernamePasswordAuthenticationFilter│
 * │                                                              │
 * │ 요청 권한:                                                    │
 * │   /api/**  → 전체 허용 (컨트롤러 레벨에서 세밀하게 제어)      │
 * │   /error   → 에러 페이지 허용                                  │
 * │   나머지   → 인증 필요                                         │
 * │                                                              │
 * │ CSRF 비활성화 → REST API에서는 불필요                          │
 * │ CORS 설정 → CorsConfig Bean 주입                               │
 * └──────────────────────────────────────────────────────────────┘
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    /** JWT 검증 필터 (JwtAuthFilter.java 참고) */
    private final JwtAuthFilter jwtAuthFilter;

    /** CORS 전역 설정 (CorsConfig.java 참고) */
    private final CorsConfigurationSource corsConfigurationSource;

    /**
     * 보안 필터 체인 구성
     *
     * 처리 흐름:
     *   HTTP 요청
     *     → CORS 처리 (preflight OPTIONS 포함)
     *     → JwtAuthFilter (토큰 파싱 → SecurityContext 등록)
     *     → 권한 확인
     *     → 컨트롤러 실행
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // REST API이므로 CSRF 보호 비활성화
            .csrf(AbstractHttpConfigurer::disable)

            // CorsConfig에서 등록한 전역 CORS 설정 사용
            .cors(cors -> cors.configurationSource(corsConfigurationSource))

            // JWT 기반 → 세션 사용 안 함 (STATELESS)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

            // 엔드포인트별 권한 설정
            .authorizeHttpRequests(auth -> auth
                // /api/** 전체 허용 (ADMIN 검증은 BoardController 등 컨트롤러에서 직접 처리)
                .requestMatchers("/api/**", "/error").permitAll()
                .anyRequest().authenticated()
            )

            // JWT 필터를 기본 인증 필터 앞에 삽입
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
