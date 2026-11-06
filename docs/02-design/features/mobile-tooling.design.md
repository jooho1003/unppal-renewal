# 모바일 앱·API 도구 연동 Design

> 2026-11-06 · bkit Design · [Plan](../../01-plan/features/mobile-tooling.plan.md)

## Context Anchor

기존 system API 계약을 유지하며 Expo Android·iOS 앱, Swagger·Bruno·Zustand 실행 근거를 만든다. 외부 저장소와 네이티브 기기의 검증 한계를 별도로 기록한다.

## 1. 목표와 선택

| 대안 | 비용·위험 | 판단 |
|---|---|---|
| 웹을 WebView로 감싸기 | 빠르지만 React Native 화면 요구와 맞지 않음 | 제외 |
| React Native CLI | 네이티브 프로젝트·빌드 환경 관리 필요 | 현재 요구보다 큼 |
| 별도 Expo 앱 | 기존 API 활용, 네이티브 화면과 플랫폼별 번들 | 사용자 선택 |

화면 → Zustand `checkConnection` → `fetchSystemInfo` → fortune-service `GET /api/system`. 결과는 네트워크 경계에서 검증 후 메모리에 보관한다. 현재 웹은 그대로 둔다. UI는 기본 React Native StyleSheet·안전 영역·스크롤·접근성 레이블을 사용한다.

## 2. DTO·상태 필드 검토(생성 전 제시)

| 필드 | Java / TS / JSON | 필수·null·기본값 | 검증·형식 | 노출·매핑 |
|---|---|---|---|---|
| service | String / string / string | 필수·null 불가 | 해당 서비스명, 앱은 fortune-service | 공개 이름 → 응답 표시 |
| stage | String / string / string | 필수·null 불가 | 현재 bootstrap | 공개 단계 → 응답 표시 |
| status | 해당 없음 / 문자열 union | 필수·idle | idle/loading/success/error | 메모리 UI 상태 |
| info | 해당 없음 / SystemInfo 또는 null | 필수·null | 검증된 응답만 | success에서 표시 |
| error | 해당 없음 / string 또는 null | 필수·null | 고정 사용자 안내, 서버 원문 미노출 | error에서 표시 |

기존 Java record의 wire 필드는 그대로다. 앱 상태와 DTO를 분리하고 토큰·개인정보·응답을 영구 저장하지 않는다.

## 3. API·보안

세 서비스에 동일한 operationId `getSystemInfo`(문서별 독립), 200 JSON, 필수 service/stage를 기술한다. 입력·인증·DB 변경 없음. 공개 프로세스 응답이며 readiness가 아니다. `/v3/api-docs`, `/swagger-ui/**`, `/swagger-ui.html`은 GET 허용하되 실제 문서 생성은 `API_DOCS_ENABLED` 기본 false다. run-service와 로컬 Compose에서 명시적으로 true. 다른 경로의 인증 요구는 유지한다.

없는 경로 미인증·잘못된 Basic 인증은 401과 WWW-Authenticate를 확인한다. 입력 없는 API에 가짜 400 시나리오를 추가하지 않는다. 인증 성공은 기존 보안 단위 테스트로 확인한다.

## 4. Zustand 전이

- `checkConnection`: loading이면 무시; 새 호출은 info/error 제거 → loading → success 또는 error.
- `reset`: 진행 요청 취소, 실행 식별자 무효화 → idle/null/null. 오래된 완료는 무시.
- 5초 타임아웃, HTTP 실패/JSON 형식 오류는 오류 안내, 사용자가 다시 누를 때 재시도.
- `SystemInfo`를 그대로 표시하므로 별도 화면 모델 mapper는 만들지 않는다. 입력은 로컬에도 영구 저장하지 않는다.
- 개별 selector 구독. 초기화 버튼과 서버 주소 변경 시 reset; 실제 로그인 기능이 생길 때 사용자 전환 reset을 연결한다.

## 5. 실행·검증 설계

`api-smoke`는 DB·캐시·검색 클라이언트 자동 구성을 제외하고 readinessState만 확인한다. API 계약 검증 전용이며 외부 DB·Kafka·전체 readiness 통과를 의미하지 않는다. 정상 실행은 기존 설정 유지. Android 에뮬레이터는 `10.0.2.2:8080`, iOS 시뮬레이터는 `127.0.0.1:8080`, 실기기는 PC LAN 주소 또는 adb reverse를 사용한다. 브라우저 미리보기는 Expo Metro의 `/api` 프록시를 사용해 임의 CORS 허용을 추가하지 않는다.

## 6. 구현 순서·검증

1. springdoc 의존성·smoke 설정 → 계약 테스트 실패 확인 → 주석·보안·문서 설정 → Gradle 통과.
2. Expo 스캐폴드·Zustand → API/상태 테스트 실패 확인 → 최소 구현 → 테스트·타입 검사.
3. Bruno 컬렉션 → 실제 서비스 실행 → 정상/실패 assertion 및 Swagger 실제 호출.
4. 모바일 화면·플랫폼 번들·가능한 기기 실행, 기존 웹 빌드, 결과·한계 기록.

관련 기존 개발 방식은 로컬 source-reference/experience-review의 A-06/A-07을 참고한다. API/화면 분리는 유지하고 불필요한 persist를 제외하며 중복·늦은 응답을 검증한다. 회사 원문은 복사하지 않는다.
