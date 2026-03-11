package com.myhealth.entity;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "routine_log")
public class Routine {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private LocalDate workoutDate;

    /** 운동명 */
    private String name;

    /** 운동 강도 (MET) */
    private Double met;

    /** 운동 시간 (분) */
    private Integer time;

    /** 소모 칼로리 (kcal) */
    private Integer kcal;
}