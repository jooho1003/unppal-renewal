# 리뉴얼 운빨 초기 세팅 Report

> 2026-11-04 · bkit Plan → Design → Do → Check → Act → Report

## Executive Summary

| 관점 | 전달한 결과 |
|---|---|
| Problem | 나열된 기술을 어떤 책임과 학습 실험에 연결할지 정리했다. |
| Solution | 독립 Git 프로젝트에 백엔드 세 서비스, React, Compose, ELK 선택 프로필을 구성했다. |
| Function/UX Effect | Java 보안 테스트 12개와 실행 JAR 3개, React 타입검사·빌드, Compose 파서 검증을 통과했다. |
| Core Value | 기술별 장애 실습·면접 질문·증거 기록 양식으로 후속 경험을 축적할 기반을 마련했다. |

## 완료 범위

- Gradle Wrapper 8.14.3 / Java 21 / Boot 3.5.16, 독립 빌드 가능한 fortune·interpretation·search 서비스.
- JPA·Flyway·Querydsl·Spring Security·Kafka·각 저장소의 의존성/연결 설정.
- KRaft Kafka, PostgreSQL, MongoDB, Redis, Elasticsearch, 앱 Dockerfile, Logstash/Kibana 프로필.
- .env 무작위 비밀번호 초기화, 실행 스크립트, React/TypeScript/Vite 시작 앱.
- 학습 로드맵, 장애 실험, 면접 질문, 실험 근거 양식, 프로젝트 AGENTS.

## 검증 근거

`gradlew.bat clean test bootJar --no-daemon` 성공. 서비스별 4개, 총 12개 테스트 실패/오류 0. `npm ci`와 `npm run build` 성공. Compose 기본/전체 프로필 파서 검증 성공. 스크립트 구문·환경 초기화 불변성 확인. [상세 Check](../03-analysis/bootstrap.analysis.md).

독립 검토에서 Kafka 볼륨 경로 문제를 찾아 공식 이미지 쓰기 경로로 수정했다. Gradle Windows 경로 인코딩과 BCrypt 인증 설정은 실패를 재현한 테스트를 통과하도록 수정했다.

## 현재 한계

**Docker Desktop이 없어 컨테이너 기동은 미검증이다.** 실제 저장·메시지 처리·캐시·검색·로그 수집은 동작 완료로 취급하지 않는다. 초기 세팅이 끝난 상태이며 운세 제품 기능은 후속이다. 기존 운빨 소스는 경로 미확인으로 이관하지 않았다.

## 다음 단계

1. Docker Desktop + WSL 2 설치·기동 후 README의 인프라/앱/ELK 상태 확인.
2. 기존 운빨 코드 경로와 유지할 기능, 운세 유형·입력·계산 방식을 확정.
3. PostgreSQL 요청 저장 → Kafka → Mongo 결과 → 완료 상태 → React 조회의 첫 세로 흐름 구현.
4. Kafka 중복/실패와 Outbox → Redis 캐시 → 공개 콘텐츠 검색 → ELK 추적을 한 단계씩 실험·기록.
