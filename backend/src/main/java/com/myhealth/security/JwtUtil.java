package com.myhealth.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │                    JWT 유틸리티                               │
 * ├──────────────────────────────────────────────────────────────┤
 * │ JWT(JSON Web Token) 발급·검증·파싱 담당                       │
 * │                                                              │
 * │ 토큰 구조:                                                    │
 * │   Header  : {"alg":"HS256","typ":"JWT"}                      │
 * │   Payload : {"sub":"username","role":"USER","iat":...}       │
 * │   Signature: HMAC-SHA256(secret)                             │
 * │                                                              │
 * │ 설정값 (application.yaml):                                    │
 * │   jwt.secret     : 256비트 이상 시크릿 키                     │
 * │   jwt.expiration : 86400000ms = 24시간                        │
 * └──────────────────────────────────────────────────────────────┘
 */
@Component
public class JwtUtil {

    /** HMAC-SHA256 서명용 SecretKey (application.yaml의 jwt.secret로 생성) */
    private final SecretKey key;

    /** 토큰 유효기간 (밀리초, 기본 24시간) */
    private final long expiration;

    /**
     * 생성자 - application.yaml에서 jwt.secret, jwt.expiration 주입
     *
     * @param secret     최소 256비트(32자) 이상의 시크릿 문자열
     * @param expiration 만료 시간 (ms 단위)
     */
    public JwtUtil(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration}") long expiration
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expiration = expiration;
    }

    /**
     * JWT 토큰 발급
     *
     * @param username 사용자 아이디 (subject)
     * @param role     권한 (USER / ADMIN)
     * @return 서명된 JWT 문자열
     */
    public String generateToken(String username, String role) {
        return Jwts.builder()
                .subject(username)             // sub 클레임: 사용자 식별자
                .claim("role", role)           // 커스텀 클레임: 권한 정보
                .issuedAt(new Date())          // iat: 발급 시각
                .expiration(new Date(System.currentTimeMillis() + expiration)) // exp: 만료 시각
                .signWith(key)                 // HMAC-SHA256 서명
                .compact();                    // 문자열로 직렬화
    }

    /**
     * 토큰에서 사용자 아이디(username) 추출
     *
     * @param token JWT 문자열
     * @return username (subject)
     */
    public String getUsername(String token) {
        return getClaims(token).getSubject();
    }

    /**
     * 토큰에서 역할(role) 추출
     *
     * @param token JWT 문자열
     * @return "USER" 또는 "ADMIN"
     */
    public String getRole(String token) {
        return getClaims(token).get("role", String.class);
    }

    /**
     * 토큰 유효성 검증
     * - 서명 위조 여부
     * - 만료 여부
     *
     * @param token JWT 문자열
     * @return 유효하면 true, 아니면 false
     */
    public boolean isValid(String token) {
        try {
            getClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false; // 서명 불일치, 만료, 형식 오류 등
        }
    }

    /**
     * 내부용 - 토큰 파싱 후 Claims 반환
     * 유효하지 않으면 JwtException 발생
     */
    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
