package com.myhealth.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "health_record") // DB 테이블 이름과 매칭
public class HealthRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username; // 유저 아이디

    private LocalDate date;  // 날짜 (Main.jsx에서 .date로 씀)

    private Double weight;   // 몸무게
    private Double height;   // 키
    private Integer systolicBp;  // 수축기 혈압
    private Integer diastolicBp; // 이완기 혈압
    private Integer bloodSugar;  // 혈당
}