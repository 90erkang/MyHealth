package com.myhealth.controller;

import com.myhealth.entity.GameStats;
import com.myhealth.entity.User;
import com.myhealth.repository.GameRepository;
import com.myhealth.repository.DietRepository;
import com.myhealth.repository.RoutineRepository;
import com.myhealth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │           득근 RPG 게임 컨트롤러 /api/game/**                 │
 * ├──────────────────────────────────────────────────────────────┤
 * │ GET  /api/game/{username}            캐릭터 스탯 조회         │
 * │ POST /api/game/save                  캐릭터 스탯 저장         │
 * │ GET  /api/game/daily-summary/{user}  오늘 식사/운동 요약      │
 * │                                                              │
 * │ 게임 시스템 개요:                                             │
 * │   - 레벨 / XP / STR / HP / MaxHP / 칭호 / 스테이지          │
 * │   - 식단 기록 → 칼로리 섭취량                                 │
 * │   - 운동 기록 → 칼로리 소모량 + 운동 시간                    │
 * │   - lastExpDate: 오늘 XP 이미 획득했는지 여부 추적           │
 * │                                                              │
 * │ 최초 조회 시 유저 확인 후 기본 스탯으로 자동 생성             │
 * └──────────────────────────────────────────────────────────────┘
 */
@RestController
@RequestMapping("/api/game")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // GameController는 개별 CrossOrigin 유지
public class GameController {

    private final GameRepository gameRepository;
    private final DietRepository dietRepository;
    private final RoutineRepository routineRepository;
    private final UserRepository userRepository;

    /**
     * GET /api/game/{username}
     * 캐릭터 스탯 조회
     * - DB에 없으면 기본 스탯(레벨1, 칭호 "헬린이")으로 자동 생성
     * - user_id FK 설정을 위해 UserRepository로 실제 유저 확인
     */
    @GetMapping("/{username}")
    public GameStats getStats(@PathVariable String username) {
        return gameRepository.findByUsername(username)
                .orElseGet(() -> {
                    // 신규 유저: User 테이블에서 user_id 조회 후 GameStats 생성
                    User user = userRepository.findByUsername(username);
                    if (user == null) {
                        throw new RuntimeException("해당 유저가 없습니다: " + username);
                    }

                    GameStats newEntity = new GameStats();
                    newEntity.setUserId(user.getId()); // FK 설정
                    newEntity.setUsername(username);
                    newEntity.setLevel(1);
                    newEntity.setXp(0);
                    newEntity.setStr(10);
                    newEntity.setHp(100);
                    newEntity.setMaxHp(100);
                    newEntity.setTitle("헬린이"); // 초기 칭호
                    return gameRepository.save(newEntity);
                });
    }

    /**
     * POST /api/game/save
     * 캐릭터 스탯 저장 (레벨업, XP 적립, 스테이지 진행 등)
     * Body: GameStats 전체 객체
     *
     * - 기존 레코드가 있으면 업데이트, 없으면 신규 생성
     * - stage: 현재 진행 중인 던전 스테이지 번호
     * - lastExpDate: 오늘 날짜 → 당일 중복 XP 방지
     */
    @PostMapping("/save")
    public GameStats saveStats(@RequestBody GameStats stats) {
        GameStats existing = gameRepository.findByUsername(stats.getUsername())
                .orElseGet(() -> {
                    // 존재하지 않으면 새로 생성 (user_id FK 필수)
                    User user = userRepository.findByUsername(stats.getUsername());
                    if (user == null) {
                        throw new RuntimeException("해당 유저가 없습니다: " + stats.getUsername());
                    }
                    GameStats newEntity = new GameStats();
                    newEntity.setUserId(user.getId());
                    return newEntity;
                });

        // 클라이언트에서 전송된 스탯으로 전부 덮어쓰기
        existing.setUsername(stats.getUsername());
        existing.setLevel(stats.getLevel());
        existing.setXp(stats.getXp());
        existing.setStr(stats.getStr());
        existing.setHp(stats.getHp());
        existing.setMaxHp(stats.getMaxHp());
        existing.setTitle(stats.getTitle());
        existing.setStage(stats.getStage());
        existing.setLastExpDate(stats.getLastExpDate()); // 당일 XP 획득 날짜 기록

        return gameRepository.save(existing);
    }

    /**
     * GET /api/game/daily-summary/{username}
     * 오늘 하루 식단·운동 요약 데이터 반환 (게임 HUD에서 사용)
     *
     * 응답:
     * {
     *   "eaten"          : 1850.0,   ← 오늘 섭취 칼로리 합계 (kcal)
     *   "burned"         : 320.0,    ← 오늘 운동 소모 칼로리 합계
     *   "burnedMinutes"  : 45,       ← 오늘 운동 총 시간 (분)
     *   "isExpGainedToday": false    ← 오늘 이미 XP를 받았는지 여부
     * }
     */
    @GetMapping("/daily-summary/{username}")
    public Map<String, Object> getDailySummary(@PathVariable String username) {
        LocalDate today = LocalDate.now();

        // 식단 기록에서 오늘 칼로리 합계 조회
        Double eaten = dietRepository.sumCaloriesByUsernameAndDate(username, today);

        // 운동 기록에서 오늘 소모 칼로리 합계 조회
        Integer burnedInt = routineRepository.sumCaloriesByUsernameAndDate(username, today);
        Double burned = (burnedInt != null) ? burnedInt.doubleValue() : 0.0;

        // 운동 기록에서 오늘 총 운동 시간(분) 조회
        Integer burnedMinutes = routineRepository.sumTimeByUsernameAndDate(username, today);
        if (burnedMinutes == null) burnedMinutes = 0;

        // 오늘 이미 XP를 받았는지 확인 (lastExpDate가 오늘인지)
        GameStats stats = gameRepository.findByUsername(username).orElse(new GameStats());
        boolean isExpGainedToday = today.equals(stats.getLastExpDate());

        Map<String, Object> summary = new HashMap<>();
        summary.put("eaten", eaten != null ? eaten : 0.0);
        summary.put("burned", burned);
        summary.put("burnedMinutes", burnedMinutes);
        summary.put("isExpGainedToday", isExpGainedToday);

        return summary;
    }
}
