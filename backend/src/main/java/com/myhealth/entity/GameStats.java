package com.myhealth.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

/**
 * 득근 RPG 캐릭터 스탯 엔티티 → DB 테이블: fitness_game_stats
 *
 * 게임 시스템:
 *   - 운동/식단 기록 → XP 획득 → 레벨업 → STR 증가
 *   - HP: 운동 안 하면 감소, 운동하면 회복
 *   - stage: 현재 진행 중인 던전 스테이지 번호
 *   - lastExpDate: 당일 중복 XP 획득 방지용 날짜
 *   - title: 레벨에 따른 칭호 (헬린이 → 헬스왕 등)
 *
 * user_id는 users 테이블 FK (GameController에서 User 조회 후 설정)
 */
@Entity
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "fitness_game_stats")
public class GameStats {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** users 테이블 외래키 (GameController에서 User.getId()로 설정) */
    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** 로그인 아이디 (unique) */
    @Column(unique = true, nullable = false)
    private String username;

    private Integer level   = 1;       // 캐릭터 레벨 (기본: 1)
    private Integer xp      = 0;       // 현재 경험치
    private Integer str     = 0;       // 힘 스탯 (운동할수록 증가)
    private Integer hp      = 100;     // 현재 HP
    private Integer maxHp   = 100;     // 최대 HP
    private String  title   = "헬린이"; // 칭호
    private int     stage   = 0;       // 현재 던전 스테이지

    /** 오늘 XP 이미 받았는지 추적 (기본값: 1900-01-01 = 한번도 안 받음) */
    private LocalDate lastExpDate = LocalDate.of(1900, 1, 1);
}
