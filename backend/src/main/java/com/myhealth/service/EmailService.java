package com.myhealth.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │                   이메일 발송 서비스                           │
 * ├──────────────────────────────────────────────────────────────┤
 * │ Gmail SMTP를 통한 비밀번호 재설정 이메일 발송                 │
 * │                                                              │
 * │ 설정 (application.yaml):                                     │
 * │   spring.mail.host: smtp.gmail.com                           │
 * │   spring.mail.port: 587 (STARTTLS)                           │
 * │   spring.mail.username: Gmail 주소                           │
 * │   spring.mail.password: Google 앱 비밀번호 16자리            │
 * │                                                              │
 * │ ※ Google 계정 → 2단계 인증 활성화 → 앱 비밀번호 발급 필요    │
 * └──────────────────────────────────────────────────────────────┘
 */
@Service
@RequiredArgsConstructor
public class EmailService {

    /** Spring이 자동으로 JavaMailSender 빈 주입 (application.yaml 설정 기반) */
    private final JavaMailSender mailSender;

    /** 발신자 이메일 (application.yaml의 spring.mail.username) */
    @Value("${spring.mail.username}")
    private String fromEmail;

    /** 프론트엔드 URL (비밀번호 재설정 링크 생성에 사용) */
    @Value("${app.frontend-url}")
    private String frontendUrl;

    /**
     * 비밀번호 재설정 이메일 발송
     *
     * 발송 내용:
     *   - 제목: [MyHealth] 비밀번호 재설정 안내
     *   - 본문: 재설정 링크 (30분 유효)
     *   - 링크 형식: http://myhealth90.online/reset-pw?token={UUID}
     *
     * @param toEmail 수신자 이메일
     * @param token   UUID 형식의 재설정 토큰 (DB에 저장된 값과 동일)
     */
    public void sendPasswordResetEmail(String toEmail, String token) {
        // 재설정 링크 생성
        String resetLink = frontendUrl + "/reset-pw?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromEmail);
        message.setTo(toEmail);
        message.setSubject("[MyHealth] 비밀번호 재설정 안내");
        message.setText(
                "안녕하세요, MyHealth입니다.\n\n" +
                "아래 링크를 클릭하여 비밀번호를 재설정해 주세요.\n" +
                "링크는 30분 동안만 유효합니다.\n\n" +
                resetLink + "\n\n" +
                "본인이 요청하지 않으셨다면 이 메일을 무시하셔도 됩니다."
        );

        mailSender.send(message);
    }
}
