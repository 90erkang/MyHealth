package com.myhealth.entity;

import jakarta.persistence.*;
import lombok.Data;

/**
 * 유저 엔티티 → DB 테이블: users
 *
 * 필드:
 *   id       : PK, 자동 증가
 *   username : 로그인 아이디 (고유)
 *   password : 비밀번호 (현재 평문 저장 - 운영 시 BCrypt 암호화 권장)
 *   email    : 이메일 (고유, 비밀번호 찾기에 사용)
 *   role     : 권한 ("USER" 또는 "ADMIN"), 기본값 "USER"
 *
 * 관련 기능:
 *   - AuthController: 로그인/회원가입/비밀번호 찾기
 *   - JwtUtil: username, role → JWT 클레임
 *   - GameController: user_id FK 참조 (GameStats)
 */
@Entity
@Data
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 로그인 아이디 (중복 불가) */
    private String username;

    /** 비밀번호 (평문 저장 - 실서비스 시 BCrypt 적용 권장) */
    private String password;

    /** 이메일 (중복 불가, 비밀번호 찾기 시 사용) */
    private String email;

    /** 역할: "USER" 또는 "ADMIN" (기본값: "USER") */
    @Column(nullable = false)
    private String role = "USER";
}
