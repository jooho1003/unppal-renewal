# SYSTEM-01 공개 프로세스 정보

## HTTP 계약

| 서비스 | 메서드·경로 | 로컬 주소 | OpenAPI operationId |
|---|---|---|---|
| fortune-service | GET /api/system | http://127.0.0.1:8080 | getSystemInfo |
| interpretation-service | GET /api/system | http://127.0.0.1:8081 | getSystemInfo |
| search-service | GET /api/system | http://127.0.0.1:8082 | getSystemInfo |

인증·소유권·역할 제한 없음. path/query/body 입력 없음. `Accept: application/json` 권장. DB·이벤트·사용자 상태를 바꾸지 않는다. 외부 저장소와 Kafka의 준비 상태를 보장하지 않는다. 외부 저장소 readiness는 별도 `/actuator/health/readiness`에서 검사한다.

## 응답

200, `Content-Type: application/json`. 두 필드는 필수·null 불가·기본값 없음. 현재 구현이 상수를 반환하며 클라이언트 입력으로 결정하지 않는다.

| 필드 | Java / TypeScript / JSON | 검증·단위·개인정보 |
|---|---|---|
| service | String / string / string | 해당 서비스 이름, 단위 없음, 공개 기술 정보 |
| stage | String / string / string | 현재 bootstrap, 단위 없음, 공개 개발 단계 |

```json
{"service":"fortune-service","stage":"bootstrap"}
```

잘못된 Basic 인증 헤더를 보내면 공개 API도 인증 필터에서 401로 거절하며 `WWW-Authenticate: Basic ...`을 반환한다. 본문·Content-Type이 없으며 OpenAPI 401도 content 없이 헤더만 명시한다. 안정된 업무 오류 코드·JSON 스키마는 정의하지 않았다. 없는 경로 `/api/not-implemented`도 미인증에서는 401이다. 새 입력 DTO나 인증 성공용 업무 API를 만들지 않았다. 같은 입력을 반복해도 저장 상태는 바뀌지 않으며 서버의 별도 재시도·타임아웃 정책은 없다. 앱 클라이언트는 5초 타임아웃과 사용자 재시도를 사용한다.

## 문서 접근과 검증

- 기본 설정은 `API_DOCS_ENABLED=false`; `scripts/run-service.ps1`는 로컬 개발 실행에서 true로 설정한다. 로컬 Compose는 환경값으로 조절하며 기본 true다.
- `/v3/api-docs`, `/v3/api-docs/swagger-config`, `/swagger-ui/index.html`은 문서 생성이 켜진 경우 인증 없이 GET으로 접근한다. 다른 API의 인증 요구는 유지한다.
- Swagger UI에서 GET 펼치기 → Try it out → Execute로 실제 200과 service/stage를 대조한다.
- `bruno/01-system.bru`~`05-invalid-credentials.bru`: 응답 200·계약·문서 화면·401 두 종류. `fortune-local`, `interpretation-local`, `search-local` 환경을 사용한다. 전제 데이터·실제 비밀번호·초기화가 필요 없다.
- 각 서비스 `SystemController`, `SecurityConfig`, `OpenApiContractTest`와 [함수·상태 명세](../specs/mobile-tooling.md)를 함께 관리한다.
- 실행 결과와 외부 인프라 검증 한계는 [실험 기록](../learning/2026-11-06-mobile-tooling.md)에 남긴다.
