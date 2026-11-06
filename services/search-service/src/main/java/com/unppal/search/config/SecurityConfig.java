package com.unppal.search.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {
    /** 문서·프로세스 GET만 공개하고 나머지 요청에는 로컬 Basic 인증을 요구한다. */
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // Design Ref: bootstrap §4 — temporary stateless local API authentication.
        return http
                .csrf(csrf -> csrf.disable()) // 세션 쿠키를 사용하지 않는 로컬 API이다.
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)) // 인증 상태를 저장하지 않는다.
                .authorizeHttpRequests(auth -> auth // 공개 문서 경로가 업무 API까지 공개하지 않도록 제한한다.
                        .requestMatchers(HttpMethod.GET, "/v3/api-docs", "/v3/api-docs/**",
                                "/swagger-ui.html", "/swagger-ui/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/system", "/actuator/health", "/actuator/health/**").permitAll()
                        .anyRequest().authenticated())
                .httpBasic(Customizer.withDefaults())
                .build();
    }

    /** 환경에서 받은 로컬 비밀번호를 해시해 학습용 계정을 구성한다. */
    @Bean
    UserDetailsService devUsers(@Value("${DEV_PASSWORD}") String password) {
        var encoder = new BCryptPasswordEncoder();
        var user = User.withUsername("learner")
                .password("{bcrypt}" + encoder.encode(password))
                .roles("LEARNER")
                .build();
        return new InMemoryUserDetailsManager(user);
    }
}
