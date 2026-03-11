package com.myhealth.controller;

import com.myhealth.entity.PasswordResetToken;
import com.myhealth.entity.User;
import com.myhealth.repository.PasswordResetTokenRepository;
import com.myhealth.repository.UserRepository;
import com.myhealth.security.JwtUtil;
import com.myhealth.service.EmailService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │                  인증 컨트롤러 /api/auth/**                    │
 * ├──────────────────────────────────────────────────────────────┤
 * │ POST /api/auth/login    로그인 → JWT 발급                     │
 * │ POST /api/auth/signup   회원가입                               │
 * │ POST /api/auth/find-pw  비밀번호 재설정 이메일 발송            │
 * │ POST /api/auth/reset-pw 토큰 검증 후 비밀번호 변경             │
 * └──────────────────────────────────────────────────────────────┘
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    private final PasswordResetTokenRepository tokenRepository;

    /**
     * POST /api/auth/login
     * Body: { "username": "...", "password": "..." }
     *
     * 성공 시 응답:
     * {
     *   "token": "eyJ...",   ← JWT (24시간 유효)
     *   "id": 1,
     *   "username": "hong",
     *   "email": "hong@...",
     *   "role": "USER"
     * }
     *
     * ※ 현재 비밀번호는 평문 비교 (실제 서비스라면 BCrypt 권장)
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody User req) {
        User found = userRepository.findByUsername(req.getUsername());

        // 아이디가 없거나 비밀번호 불일치
        if (found == null || !found.getPassword().equals(req.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("message", "아이디 또는 비밀번호가 틀렸습니다."));
        }

        // JWT 생성 후 사용자 정보와 함께 반환
        String token = jwtUtil.generateToken(found.getUsername(), found.getRole());
        return ResponseEntity.ok(Map.of(
                "token",    token,
                "id",       found.getId(),
                "username", found.getUsername(),
                "email",    found.getEmail(),
                "role",     found.getRole()
        ));
    }

    /**
     * POST /api/auth/signup
     * Body: { "username": "...", "password": "...", "email": "...", "role": "USER" }
     *
     * - username, email 중복 체크
     * - role 미입력 시 기본값 "USER" 설정
     */
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody User req) {
        // 아이디 중복 확인
        if (userRepository.existsByUsername(req.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("message", "이미 사용 중인 아이디입니다."));
        }
        // 이메일 중복 확인
        if (userRepository.existsByEmail(req.getEmail())) {
            return ResponseEntity.badRequest().body(Map.of("message", "이미 사용 중인 이메일입니다."));
        }
        // role이 없으면 USER로 설정
        if (req.getRole() == null || req.getRole().isBlank()) {
            req.setRole("USER");
        }
        userRepository.save(req);
        return ResponseEntity.ok(Map.of("message", "회원가입이 완료되었습니다."));
    }

    /**
     * POST /api/auth/find-pw
     * Body: { "email": "hong@example.com" }
     *
     * 처리 흐름:
     *   1. 이메일로 유저 조회 (없으면 404)
     *   2. 기존 리셋 토큰 삭제 (중복 발급 방지)
     *   3. UUID 토큰 생성 + 30분 만료 설정
     *   4. DB 저장 후 이메일 발송
     */
    @Transactional
    @PostMapping("/find-pw")
    public ResponseEntity<?> findPw(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        User user = userRepository.findByEmail(email);

        if (user == null) {
            return ResponseEntity.status(404).body(Map.of("message", "해당 이메일로 가입된 정보가 없습니다."));
        }

        // 기존 토큰 삭제 후 새 UUID 토큰 발급
        tokenRepository.deleteByUser(user);

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUser(user);
        resetToken.setToken(UUID.randomUUID().toString()); // 보안 랜덤 UUID
        resetToken.setExpiresAt(LocalDateTime.now().plusMinutes(30)); // 30분 유효
        tokenRepository.save(resetToken);

        // Gmail SMTP로 비밀번호 재설정 링크 발송 (EmailService 참고)
        emailService.sendPasswordResetEmail(email, resetToken.getToken());

        return ResponseEntity.ok(Map.of("message", "비밀번호 재설정 링크를 전송했습니다."));
    }

    /**
     * POST /api/auth/reset-pw
     * Body: { "token": "uuid-...", "newPassword": "새비밀번호" }
     *
     * 처리 흐름:
     *   1. UUID 토큰으로 DB 조회
     *   2. 이미 사용된 토큰 or 존재하지 않으면 400
     *   3. 만료 시각 확인 (30분 초과 시 400)
     *   4. 비밀번호 변경 + 토큰 used=true 처리
     */
    @Transactional
    @PostMapping("/reset-pw")
    public ResponseEntity<?> resetPw(@RequestBody Map<String, String> body) {
        String tokenValue = body.get("token");
        String newPassword = body.get("newPassword");

        PasswordResetToken resetToken = tokenRepository.findByToken(tokenValue).orElse(null);

        // 토큰 없음 or 이미 사용됨
        if (resetToken == null || resetToken.isUsed()) {
            return ResponseEntity.status(400).body(Map.of("message", "유효하지 않은 링크입니다."));
        }
        // 토큰 만료 확인
        if (resetToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(400).body(Map.of("message", "링크가 만료되었습니다. 다시 요청해 주세요."));
        }

        // 비밀번호 변경 및 토큰 소비 처리
        User user = resetToken.getUser();
        user.setPassword(newPassword);
        userRepository.save(user);

        resetToken.setUsed(true); // 재사용 방지
        tokenRepository.save(resetToken);

        return ResponseEntity.ok(Map.of("message", "비밀번호가 성공적으로 변경되었습니다."));
    }
}
