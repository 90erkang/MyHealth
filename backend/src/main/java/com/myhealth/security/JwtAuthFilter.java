package com.myhealth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │                    JWT 인증 필터                               │
 * ├──────────────────────────────────────────────────────────────┤
 * │ 요청마다 한 번만 실행 (OncePerRequestFilter)                   │
 * │                                                              │
 * │ 처리 흐름:                                                    │
 * │  1. Authorization 헤더에서 "Bearer {토큰}" 추출              │
 * │  2. JwtUtil.isValid() 로 토큰 검증                            │
 * │  3. username, role 파싱                                       │
 * │  4. SecurityContext에 Authentication 등록                     │
 * │  5. 다음 필터로 체인 전달                                      │
 * │                                                              │
 * │ ※ 토큰이 없거나 유효하지 않으면 SecurityContext를 비워두고    │
 * │   다음 필터로 넘김 (403 처리는 SecurityConfig에서)            │
 * └──────────────────────────────────────────────────────────────┘
 */
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    /** JWT 파싱·검증 유틸리티 */
    private final JwtUtil jwtUtil;

    /**
     * 요청당 한 번 실행되는 필터 메서드
     *
     * @param request     HTTP 요청 (Authorization 헤더 포함)
     * @param response    HTTP 응답
     * @param filterChain 다음 필터 체인
     */
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        // Authorization 헤더 추출 (없으면 null)
        String header = request.getHeader("Authorization");

        // "Bearer " 접두어가 있는 경우만 처리
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7); // "Bearer " 이후의 토큰 문자열

            if (jwtUtil.isValid(token)) {
                // 토큰에서 사용자 정보 파싱
                String username = jwtUtil.getUsername(token);
                String role = jwtUtil.getRole(token);

                // Spring Security Authentication 객체 생성
                // - principal: username
                // - credentials: null (JWT 방식이므로 비밀번호 불필요)
                // - authorities: ROLE_USER 또는 ROLE_ADMIN
                var auth = new UsernamePasswordAuthenticationToken(
                        username,
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + role))
                );

                // SecurityContext에 인증 정보 등록 → 이후 컨트롤러에서 Authentication 사용 가능
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }

        // 다음 필터(또는 서블릿)로 요청 전달
        filterChain.doFilter(request, response);
    }
}
