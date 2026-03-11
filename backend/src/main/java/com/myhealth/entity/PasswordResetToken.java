package com.myhealth.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "password_reset_tokens")
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 어떤 유저에게 발급된 토큰인지
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // UUID 토큰값
    @Column(nullable = false, unique = true)
    private String token;

    // 만료 시각 (발급 후 30분)
    @Column(nullable = false)
    private LocalDateTime expiresAt;

    // 이미 사용된 토큰인지
    @Column(nullable = false)
    private boolean used = false;
}
