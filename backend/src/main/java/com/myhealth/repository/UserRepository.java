package com.myhealth.repository;

import com.myhealth.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    User findByUsername(String username);
    User findByEmail(String email);          // ← find-pw에서 사용
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
}