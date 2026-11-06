# 모바일 앱·API 도구 연동 Plan

> 2026-11-06 · bkit Plan · 기존 웹 보존, Expo Android·iOS 앱 추가(사용자 선택)

## Executive Summary

| 관점 | 내용 |
|---|---|
| Problem | 개발 기준만 있고 Swagger·Bruno·Zustand와 모바일 실행 경로가 없다. |
| Solution | 기존 system API를 세 도구와 Expo 앱에서 연결한다. |
| Function/UX Effect | 앱에서 연결·실패·재시도·초기화를 확인한다. |
| Core Value | 계약·상태 전이·실행 근거를 같은 기능으로 대조한다. |

## Context Anchor

| WHY | WHO | RISK | SUCCESS | SCOPE |
|---|---|---|---|---|
| 실제 연동 근거 확보 | 개발자·앱 사용자 | 외부 인프라·기기 부재 | 계약·상태 테스트/빌드와 실행 결과 기록 | system API와 모바일 시작 화면 |

## 1. 배경·목표

현재 리비전 `7929dcc`의 웹 시작 화면과 세 서비스 `/api/system`을 확인했다. 운세·회원 API와 기존 운빨 원본은 아직 없다. 기존 공개 HTTP 응답과 서비스별 DB 소유권을 유지한다. 관련 규칙은 `CONVENTIONS.md`, 초기 구성 설계를 따른다.

## 2. 범위

- 세 서비스 springdoc, 개발 실행에서 Swagger UI/OpenAPI 활성화.
- Bruno CLI 버전 고정, 서비스별 환경과 정상·실패 assertion.
- 별도 `apps/mobile`: Expo·TypeScript·React Native·Zustand, 서버 연결 확인 화면.
- 외부 저장소를 제외한 `api-smoke` 프로필로 HTTP 계약 실행 검증. 전체 readiness와 구분.
- 기존 웹은 보존하고 설치·빌드 검증.
- 운세 생성·인증 신규 기능·스토어 배포·EAS 유료 빌드·인프라 설치는 범위 밖.

## 3. 요구사항

| ID | 요구사항 | 검증 |
|---|---|---|
| FR-01 | 공개 system 응답 유지, OpenAPI operationId/필수 필드 명시 | Gradle 계약 테스트, 실제 HTTP |
| FR-02 | 문서 노출과 업무 API 접근 조건 구분 | 문서 활성화/비활성화, 미인증/잘못된 인증 |
| FR-03 | Bruno 세 환경 반복 실행 | CLI 정상·실패 assertion |
| FR-04 | 모바일 idle/loading/success/error, 재시도·reset | 상태 전이·중복 호출·늦은 응답 테스트 |
| FR-05 | 응답 런타임 검증, 타임아웃, 영구 저장 없음 | API 경계 테스트 |
| FR-06 | Android/iOS 대상 앱 생성 | 타입 검사·doctor·번들, 가능한 기기 실행 |

## 4. 완료 조건

실행한 명령과 결과를 기록하고 못 한 항목을 명시한다. 웹 `npm ci`, `npm run build`; 루트 `gradlew.bat test bootJar`; Bruno `npm run test:api -- --env ...`; 모바일 `npm ci`, `npm test`, `npm run typecheck`, `npm run export`, `npx expo-doctor`. Compose와 외부 DB readiness는 Docker가 있을 때 검증한다.

## 5. 위험·영향

기존 웹은 system API 링크를 사용한다. 응답 형식은 바꾸지 않는다. 백엔드 세 서비스의 보안 설정과 system DTO 주석·OpenAPI만 보강한다. 문서는 기본 비활성화하고 로컬 실행에서 명시적으로 켠다. 모바일은 DB에 직접 접근하지 않는다. Windows에서는 iOS 네이티브 실행을 검증할 수 없고 번들 검증과 구분한다.
