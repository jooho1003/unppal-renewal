# 리뉴얼 운빨 초기 환경 Plan

> 2026-11-04 · 초기 세팅 범위 · bkit Plan → Design → Do → Check

## Executive Summary

| 관점 | 내용 |
|---|---|
| Problem | 기술을 나열한 프로젝트만으로 Kafka·Docker·MSA·Redis·Elasticsearch 경험을 설명하기 어렵다. |
| Solution | 운세 서비스의 요청·처리·검색 경계를 나누고 단계별 구현과 장애 실습을 진행한다. |
| Function/UX Effect | 이번에는 빌드 가능한 세 서비스와 React, 로컬 인프라 실행 구성을 만든다. |
| Core Value | 선택 이유·실패·측정 결과를 기록해 면접에서 검증 가능한 경험으로 만든다. |

## Context Anchor

| Key | Value |
|---|---|
| WHY | 분산 시스템의 동작과 트레이드오프를 직접 이해한다. |
| WHO | 운세 앱 사용자, 프로젝트 개발자 겸 면접 준비자 |
| RISK | 서비스 과분할, 데이터 중복, 설치만 하고 경험으로 착각하는 것 |
| SUCCESS | 세 서비스 빌드·보안 테스트, React 빌드, Compose 구성 검증, 실습 계획 |
| SCOPE | 초기 환경 구성. 운세 비즈니스 기능·기존 데이터 이관은 후속 작업 |

## 1. Overview

운세 앱 리뉴얼과 백엔드 역량 확장을 함께 달성한다. 기존 운빨 위치는 확인되지 않았으므로 새 저장소로 구성한다. 기존 기능·데이터·디자인을 추정해서 이관하지 않는다.

## 2. Scope

- 포함: Gradle Wrapper, Spring Boot 서비스 3개, React/TypeScript, Compose 인프라와 앱 이미지, ELK 선택 프로필, 개발 명령, 학습 로드맵.
- 후속: 회원가입/JWT, 운세 요청·조회, 실제 Kafka 발행·소비, 캐시, 검색 인덱싱, 재시도·DLQ·Outbox, 배포.
- 제외: 실제 사주 계산 정확성 보장, 결제, 외부 AI 유료 호출, Kubernetes, 운영 배포.

## 3. Requirements

| ID | 요구사항 | 검증 |
|---|---|---|
| FR-01 | 바이브코딩/리뉴얼 운빨에 독립 프로젝트 구성 | 경로·Git 루트 확인 |
| FR-02 | Java 21, Gradle, Boot, JPA, Querydsl, Security 준비 | Gradle test bootJar |
| FR-03 | PostgreSQL·Redis·Kafka·MongoDB·Elasticsearch·ELK | Compose config 및 런타임 가능한 경우 health |
| FR-04 | React 앱과 개발 프록시 | npm run build |
| FR-05 | 기술별 실험·면접 근거 기록 | docs/learning 검토 |

## 4. Success Criteria

- SC-1: 세 서비스가 독립 bootJar를 만들고 인프라 없는 보안 테스트를 통과한다.
- SC-2: React TypeScript 검사와 배포용 번들 빌드가 통과한다.
- SC-3: Compose 기본·apps·elk 프로필이 유효하다.
- SC-4: 실행 순서, 포트, 서비스 소유권, 미구현 영역이 문서에 명시된다.
- SC-5: 핵심 5개 기술의 장애/복구 실험과 면접 질문이 연결된다.
- Docker 데몬이 없는 장비에서는 컨테이너 실행 결과를 완료로 기록하지 않는다.

## 5. Risks and Mitigation

| 위험 | 대응 |
|---|---|
| 로컬 메모리 부족 | ELK는 선택 실행, Docker 메모리 예산 별도 안내 |
| 라이브러리 버전 불일치 | Boot BOM 사용, Elasticsearch 서버와 클라이언트 버전 정렬 |
| 민감 데이터 유출 | 이벤트·검색·로그에 생년월일 원문 금지, 초기화한 비밀번호는 .env로 분리 |
| 경험 과장 | 설치·계획·실행·측정을 구분하여 기록 |

## 6. Impact Analysis

새 형제 폴더만 생성한다. 면접용 저장소와 기존 프로젝트 파일의 변경은 없다. 기존 운빨 소스 경로와 재사용 범위는 후속 확인 사항이다.

## 7. Architecture Considerations

학습용 소규모 MSA: fortune-service / interpretation-service / search-service. 모노레포에서 빌드 편의를 공유하되 서비스 사이의 Java 의존성과 DB 직접 접근은 금지한다. 세부 비교는 Design 참고.

## 8. Convention Prerequisites

Java 패키지 com.unppal, 서비스 디렉터리 kebab-case, DB snake_case. 버전은 고정하며 종속 라이브러리는 BOM을 우선한다. 비밀은 .env에만 두고 커밋하지 않는다.

## 9. Next Steps

Design의 초기 구성 구현 → 빌드/구성 검증 → Docker 설치 후 런타임 점검 → 첫 운세 요청 세로 흐름 구현.
