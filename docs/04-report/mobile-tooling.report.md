# 모바일·API 도구 연동 결과

> 2026-11-06 · bkit Plan → Design → Do → Check → Act · 범위 구현·로컬 연동 검증 완료, 릴리스 검증 미완료

## Executive Summary

| 관점 | 결과 |
|---|---|
| Problem | 도구 기준만 있고 모바일 앱과 실제 연동 경로가 없었다. |
| Solution | 기존 웹을 보존하고 Expo Android·iOS 앱과 springdoc·Bruno CLI·Zustand를 구성했다. |
| Function/UX Effect | Android에서 연결·초기화·서버 중단 오류·재시작 후 재연결을 확인했다. |
| Core Value | 같은 API를 Swagger 실제 호출·Bruno·앱과 테스트로 대조하는 재현 경로를 만들었다. |

## 성공 기준과 검증

| 기준 | 결과·근거 |
|---|---|
| API 계약 유지·OpenAPI | 세 서비스 GET /api/system wire 유지, 필수 문자열·200·401·WWW-Authenticate 명시 |
| 보안 경계 | 기본 문서 비활성화, 로컬 실행에서 활성화, 기존 Basic 인증 경계와 문서 off 테스트 통과 |
| 서버 빌드·테스트 | `gradlew.bat test bootJar --no-daemon`: 25개 테스트·세 JAR 통과 |
| Swagger·Bruno | Aside에서 세 서비스 실제 Execute 200. CLI 4.3.0의 서비스별 5/5 시나리오 통과. 최종 JAR 재시작 후 401 계약도 재확인 |
| Zustand·모바일 API | 6개 테스트·타입·lint 통과, 중복·reset·늦은 응답·5초 타임아웃 검증 |
| Expo 플랫폼 | npm ci·doctor 20/20·Android/iOS/web export 통과, Android API 35 Expo Go에서 실제 동작 확인 |
| 기존 웹 | npm ci·npm run build 통과 |

## 주요 결정과 수정

사용자가 Expo Android·iOS 추가를 선택했다. 공유 상태는 앱에 구현하고 상태 기능이 없는 기존 웹에는 빈 스토어를 만들지 않았다. 개인정보·토큰·결과를 영구 저장하지 않았다. API-only 프로필은 외부 저장소 검증과 구분했다. 독립 Check가 찾은 OpenAPI 401 누락 1건은 실패 재현 → 애너테이션·계약 검사 보완 → Gradle·Bruno 통과로 닫았다. Metro와 npm ci의 파일 잠금은 프로세스 종료 후 순차 설치·검증으로 해결했다.

## 남은 범위

- Docker 부재로 Compose config·컨테이너 기동·외부 저장소 readiness·Kafka 미검증.
- iOS 네이티브 실행·실제 휴대전화·서명된 APK/IPA·스토어 제출 미검증. 번들 생성과 Android Expo Go 실행을 독립 앱 출시로 표현하지 않는다.
- 운세 생성·회원/JWT·이벤트 처리·검색·Outbox·멱등·DLQ는 이번 구현 범위가 아니다.
- Bruno GUI는 설치하지 않았고 저장소의 CLI로 검증했다. 성능·사용자 수·운영 복구 경험은 주장하지 않는다.

## 문서·직접 실험

- [Plan](../01-plan/features/mobile-tooling.plan.md) · [Design](../02-design/features/mobile-tooling.design.md) · [Do](../03-do/mobile-tooling.do.md) · [Check/Act](../03-analysis/mobile-tooling.analysis.md)
- [API 계약](../api/system.md) · [함수·DTO·상태 명세](../specs/mobile-tooling.md)
- [실행 근거와 서버 중단 실험·면접 질문 두 개](../learning/2026-11-06-mobile-tooling.md)
- [실행 안내](../../README.md#모바일-앱과-api-도구-실행)
