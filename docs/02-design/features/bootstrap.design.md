# 리뉴얼 운빨 초기 환경 Design

> 2026-11-04 · [Plan](../../01-plan/features/bootstrap.plan.md)

## Context Anchor

| Key | Value |
|---|---|
| WHY | 분산 시스템의 동작과 트레이드오프를 직접 이해한다. |
| WHO | 운세 앱 사용자, 프로젝트 개발자 겸 면접 준비자 |
| RISK | 서비스 과분할, 데이터 중복, 설치만 하고 경험으로 착각하는 것 |
| SUCCESS | 세 서비스 빌드·보안 테스트, React 빌드, Compose 구성 검증, 실습 계획 |
| SCOPE | 초기 환경 구성. 운세 비즈니스 기능·기존 데이터 이관은 후속 작업 |

## 1. Overview

사용자 결정: 운세 앱, 요청한 기술 스택, Kafka·Docker·MSA·Elasticsearch·Redis 학습과 면접 준비, ELK 사용. 구현자 기본 선택: Java 21, Boot 3.5.16, Gradle 8.14.3, 세 서비스와 React/Vite 모노레포. 모두 초기 환경을 위한 선택이며 제품 상세 요구사항 확정과 구분한다.

## 2. Architecture Options

| 방식 | 장점 | 비용/위험 | 판단 |
|---|---|---|---|
| 모듈형 모놀리스 | 실행·트랜잭션 단순 | 프로세스 간 장애·통신 학습 부족 | 대안 |
| 여러 도메인별 대규모 MSA | 분리 폭넓음 | 혼자 운영·디버깅 부담 큼 | 보류 |
| 세 서비스 MSA | 비동기·검색 경계 실험 가능 | 최종 일관성과 재처리 필요 | 초기 기본값 |

```mermaid
flowchart LR
  R[React] --> F[fortune-service :8080]
  F --> P[(PostgreSQL: 요청 상태)]
  F --> C[(Redis: 캐시)]
  F -. fortune.requested.v1 .-> K[Kafka]
  K -.-> I[interpretation-service :8081]
  I --> M[(MongoDB: 해석 문서)]
  I -. fortune.completed.v1 .-> K
  K -. content.published.v1 .-> S[search-service :8082]
  S --> E[(Elasticsearch: 공개 콘텐츠 검색)]
  K -. 완료 상태 갱신 .-> F
  F & I & S --> L[JSON 로그]
  L --> LS[Logstash]
  LS --> E
  E --> KB[Kibana]
```

점선 이벤트 흐름과 도메인 저장은 **후속 구현 설계**이다. 이번 구현은 앱 상태 API·보안 경계·의존성·연결 설정·이미지·로그 수집 설정까지다. 앱 시작만으로 이벤트가 발행되거나 검색 결과가 생성되지는 않는다.

## 3. Data Model

| 서비스 | 소유 저장소 | 후속 데이터 |
|---|---|---|
| fortune-service | PostgreSQL, Redis | fortune_request, outbox_event, 결과 캐시 |
| interpretation-service | MongoDB | interpretation_document, 처리 이력 |
| search-service | Elasticsearch | 공개 콘텐츠 projection, 재색인 상태 |

타 서비스 DB 직접 조회 금지. 물리 DB 공유가 필요하면 서비스별 DB·계정으로 분리한다. MongoDB 원문 결과가 정본이며 Elasticsearch는 재생성 가능한 검색용 복제본이다. 개인 운세 원문 검색은 이번 설계에서 제외한다.

이벤트 후속 계약: eventId(UUID), eventType, schemaVersion, occurredAt(UTC), correlationId, payload. 운세 이벤트는 requestId를 추가하고 key=requestId, 공개 콘텐츠 이벤트는 contentId를 추가하고 key=contentId로 정한다. 생년월일·이름 원문을 이벤트/로그/검색 인덱스에 넣지 않는다. 조회 불가능한 식별자로만 최소 참조하고 서비스 간 민감 입력 전달 방식은 첫 도메인 설계에서 결정한다. 검색은 향후 공개 콘텐츠 발행 경로의 content.published.v1을 소비하며 개인 운세 완료 이벤트를 색인하지 않는다. 이번에는 토픽만 준비한다.

## 4. API Specification

- 각 서비스 `GET /api/system`: 200, `{ service, stage: "bootstrap" }`. 프로세스 확인용이며 의존 인프라 상태를 뜻하지 않는다.
- `GET /actuator/health/liveness`: 프로세스 생존 상태.
- `GET /actuator/health/readiness`: 해당 서비스 DB/캐시/검색 의존성 상태. Kafka는 별도 broker health와 후속 소비자 지표로 확인한다.
- 위 공개 GET 외 경로는 인증 필요. 로컬 학습용 HTTP Basic 계정은 .env에서 설정한다. 회원/JWT는 후속 구현.
- CSRF는 Authorization 헤더를 명시하는 개발용 stateless API 설정에서 비활성화한다. 세션·쿠키 인증 추가 시 재설계한다.

## 5. UI/UX Design

React 시작 화면은 프로젝트 이름·초기 구성 단계·개발 가이드 링크만 표시한다. 운세 입력/결과 화면은 후속 요구사항 확정 후 만든다. Vite 프록시 /api와 /actuator는 fortune-service로 전달한다.

## 6. Error Handling

미인증 401, 잘못된 인증 401. readiness 실패 503. 앱 상태 API의 성공을 DB 연결 성공으로 해석하지 않는다. Docker가 없으면 구성 검증과 실행 검증 결과를 분리한다.

## 7. Security Considerations

호스트 공개 포트는 127.0.0.1에 바인딩한다. 로컬 ES 보안 비활성화·비 TLS·Mongo 루트 계정은 개인 개발 환경에만 사용한다. 운영 전 TLS/권한 최소화/비밀 관리가 필요하다. 앱은 컨테이너 비 root 계정으로 실행한다.

## 8. Test Plan

서비스별 MVC slice 테스트로 공개 상태 API, 미인증·잘못된 비밀번호 거절, 올바른 Basic 인증을 확인한다. 인프라 없는 환경에서도 실행한다. 실제 데이터 기능이 없는 초기 세팅이므로 Kafka·캐시 동작을 모의 테스트로 완료 처리하지 않는다. 프런트는 tsc와 Vite build, Compose는 실제 파서의 모든 프로필 config 검증.

## 9. Clean Architecture

services/{service}/src/main/java/com/unppal/{fortune,interpretation,search}. 현재는 application/config/web만 둔다. 도메인 기능이 생길 때 해당 기능 패키지를 추가한다. 공통 엔티티·공통 DB·서비스 간 직접 Gradle 의존성 없음.

## 10. Coding Convention Reference

Java 21 record는 API 응답에 사용. 테스트는 JUnit 5·Spring MVC Test. 환경변수는 UPPER_SNAKE_CASE. 토픽 이름은 fortune.requested.v1 / fortune.completed.v1 / content.published.v1, 각 토픽의 .DLT를 함께 준비한다. 로그는 ECS JSON, 운세 입력 원문 기록 금지.

## 11. Implementation Guide

### 11.1 File Structure

루트 Gradle 설정과 Wrapper, services/ 세 앱, apps/web React, compose.yaml, infra/ Logstash, scripts/ 개발 명령, docs/ 학습과 PDCA 기록.

### 11.2 Implementation Order

1. Gradle/서비스/보안 테스트 구성 → test bootJar.
2. React 구성 → npm ci 및 build.
3. Compose·Dockerfile·환경 초기화 → 프로필별 config.
4. 실행·학습·면접 문서 → 실제 검증 결과와 대조.

### 11.3 Session Guide

| 세션 | 범위 | 결과 |
|---|---|---|
| 이번 | bootstrap | 빌드·개발환경·학습 계획 |
| 다음 | 첫 운세 요청 | 요청 저장→Kafka→문서 생성→완료 상태·조회 |
| 이후 | 신뢰성 | 재시도·DLQ·멱등·Outbox·캐시·검색·ELK 실험 |
