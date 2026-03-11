package com.myhealth.repository;

import com.myhealth.entity.PasswordResetToken;
import com.myhealth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByToken(String token);

    // 같은 유저의 기존 토큰 삭제 (중복 발급 방지)
    void deleteByUser(User user);
}
