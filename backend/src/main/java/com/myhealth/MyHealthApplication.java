package com.myhealth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.web.config.EnableSpringDataWebSupport;

/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │                  MyHealth Application                        │
 * │              Spring Boot 메인 진입점 (Entry Point)            │
 * ├──────────────────────────────────────────────────────────────┤
 * │ @SpringBootApplication                                       │
 * │   └─ @Configuration + @EnableAutoConfiguration              │
 * │       + @ComponentScan 을 한꺼번에 처리                       │
 * │   └─ com.myhealth 패키지 하위 전체를 자동 빈 등록            │
 * │                                                              │
 * │ @EnableSpringDataWebSupport (VIA_DTO)                        │
 * │   └─ Page<T> 응답을 JSON 직렬화할 때 DTO 방식 사용          │
 * │   └─ BoardController의 페이징 API가 올바른 JSON을 반환하게 함│
 * └──────────────────────────────────────────────────────────────┘
 */
@SpringBootApplication
@EnableSpringDataWebSupport(pageSerializationMode = EnableSpringDataWebSupport.PageSerializationMode.VIA_DTO)
public class MyHealthApplication {

    /**
     * 애플리케이션 시작점
     * - 로컬: ./gradlew bootRun
     * - 운영(AWS EC2): nohup java -jar backend.jar &
     * - 기본 포트: 8080 (application.yaml 참고)
     */
    public static void main(String[] args) {
        SpringApplication.run(MyHealthApplication.class, args);
    }
}
