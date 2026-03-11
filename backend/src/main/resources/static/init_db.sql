-- 1. 기존 DB 삭제 (깨끗하게 초기화)
DROP DATABASE IF EXISTS myhealth;
DROP DATABASE IF EXISTS orderdb;
DROP TABLE workout_log;
-- 2. DB 생성 및 설정
CREATE DATABASE myhealth DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE myhealth;

-- ==========================================
-- 3. 테이블 생성 (자바 엔티티와 완벽 매칭)
-- ==========================================

-- (1) 유저 테이블 (Users)
CREATE TABLE users (
                       id BIGINT AUTO_INCREMENT PRIMARY KEY,
                       username VARCHAR(50) NOT NULL UNIQUE,
                       password VARCHAR(255) NOT NULL,
                       email VARCHAR(100) NOT NULL UNIQUE
);

-- (2) 건강 기록 (Health) -> 자바: Health.java
CREATE TABLE health (
                        id BIGINT AUTO_INCREMENT PRIMARY KEY,
                        user_id BIGINT NOT NULL,   -- 자바의 @JoinColumn(name="user_id")와 일치시킴
                        weight DOUBLE,
                        height DOUBLE,
                        measure_date DATETIME DEFAULT CURRENT_TIMESTAMP, -- 자바: measureDate
                        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- (3) 식단 기록 (DietLog) -> 자바: DietLog.java
CREATE TABLE diet_log (
                          id BIGINT AUTO_INCREMENT PRIMARY KEY,
                          user_id BIGINT NOT NULL,
                          meal_name VARCHAR(100),    -- 자바: mealName
                          calories INT,
                          log_date DATETIME DEFAULT CURRENT_TIMESTAMP, -- 자바: logDate
                          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- (4) 운동 기록 (WorkoutLog) -> 자바: WorkoutLog.java

CREATE TABLE workout_log (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id      VARCHAR(50) NOT NULL,   -- BIGINT → VARCHAR
    name         VARCHAR(100) NOT NULL,
    met          DOUBLE,
    time         INT,
    kcal         INT,
    workout_date DATE NOT NULL
);
USE myhealth;

-- 게시글 테이블
CREATE TABLE board (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(200) NOT NULL,
    content     TEXT NOT NULL,
    writer      VARCHAR(50) NOT NULL,
    views       INT DEFAULT 0,
    is_notice   BOOLEAN DEFAULT FALSE,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 댓글 테이블
CREATE TABLE board_comment (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    board_id    BIGINT NOT NULL,
    writer      VARCHAR(50) NOT NULL,
    content     VARCHAR(500) NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (board_id) REFERENCES board(id) ON DELETE CASCADE
);

-- 더미 데이터

-- ==========================================
-- 4. 테스트용 더미 데이터
-- ==========================================

-- 1. 형님 계정 생성 (ID: boss / PW: 1234)
INSERT INTO users (username, password, email) VALUES ('boss', '1234', 'boss@gym.com');
ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'USER';
-- 관리자 계정 설정
UPDATE users SET role = 'ADMIN' WHERE username = 'root';
-- 2. 건강 기록 (user_id는 위에서 만든 boss의 id인 1번을 사용)
INSERT INTO health (user_id, weight, height, measure_date)
VALUES (1, 75.5, 175.0, NOW());

-- 3. 식단 기록
INSERT INTO diet_log (user_id, meal_name, calories, log_date)
VALUES (1, '닭가슴살 샐러드', 350, NOW());

-- 4. 운동 기록
INSERT INTO workout_log (user_id, exercise_name, duration, intensity, log_date)
VALUES (1, '웨이트 트레이닝', 60, 'High', NOW());
INSERT INTO workout_log (user_id, name, met, time, kcal, workout_date)
VALUES (1, '웨이트운동(보통으로) - 전신', 5.0, 60, 325, CURDATE());
INSERT INTO board (title, content, writer, views, is_notice) VALUES
('🔥 형님들, 욕설 및 비방은 강퇴입니다.', '커뮤니티 규칙을 지켜주세요.', '관리자', 999, TRUE),
('님들 프로틴 뭐 드세요? 초코맛 추천좀', '저는 요즘 초코맛 먹는데 맛있더라고요 ㅋㅋ', '헬린이1', 52, FALSE),
('오늘 데드 120kg 성공했습니다 ㅋㅋ (인증)', '드디어 120 달성했습니다 형님들', '3대500', 108, FALSE),
('[질문] 무릎에서 딱딱 소리 나는데 병원 가야됨?', '스쿼트할 때마다 소리가 나는데 괜찮은건가요?', '관절파괴자', 45, FALSE),
('형님들 2분할이 좋나요 3분할이 좋나요?', '요즘 루틴 고민중입니다 추천해주세요', '멸치탈출', 77, FALSE),
('가입 인사 드립니다! 잘 부탁드립니다.', '안녕하세요 잘 부탁드립니다!', '뉴비', 23, FALSE);
ALTER TABLE fitness_game_stats ADD COLUMN last_exp_date DATE DEFAULT '1900-01-01';
-- 결과 확인
SELECT * FROM users;
SELECT * FROM diet_log;
SELECT * FROM workout_log;
SELECT * FROM board;