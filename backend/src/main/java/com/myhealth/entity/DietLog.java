package com.myhealth.entity;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

/**
 * ✅ 식단 기록 엔티티
 * - 기존 calories → kcal 로 통일
 * - 탄수화물/단백질/지방/기준무게 필드 추가
 */
@Entity
@Data
@Table(name = "diet_log")
public class DietLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private LocalDate date;

    /** 식사 구분: 아침/점심/저녁/간식 */
    private String mealType;

    /** 음식명 */
    private String menu;

    /** 기준 무게 (g) */
    private Double baseWeight;

    /** 섭취 무게 (g) */
    private Double weight;

    /** 칼로리 (kcal) */
    private Double kcal;

    /** 탄수화물 (g) */
    private Double carbs;

    /** 단백질 (g) */
    private Double protein;

    /** 지방 (g) */
    private Double fat;
}
