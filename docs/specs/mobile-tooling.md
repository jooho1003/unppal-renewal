# 모바일·API 도구 함수 명세

> [필드 사전 검토](../02-design/features/mobile-tooling.design.md#2-dto상태-필드-검토생성-전-제시) · [HTTP 명세](../api/system.md)

## 백엔드(세 서비스 동일 책임)

| 파일·함수 | 입력 → 출력 | 전제·오류·상태 변경 |
|---|---|---|
| SystemController.system | 없음 → SystemInfo(service, stage) | 공개 상수 응답, 저장·외부 호출 없음 |
| SystemInfo record | 서비스 이름·개발 단계 → JSON | 필수·null 불가, OpenAPI 필수 필드와 일치 |
| SecurityConfig.securityFilterChain | HttpSecurity → SecurityFilterChain | GET system·health·문서 경로만 공개. 나머지 인증. 세션 비저장, 로컬 Basic 경계 |
| SecurityConfig.devUsers | DEV_PASSWORD → UserDetailsService | learner 계정의 비밀번호 해시, 운영 회원 관리 대체 아님 |

springdoc은 컨트롤러·record 애너테이션에서 문서를 생성한다. 새 수동 OpenAPI DTO나 서비스 간 엔티티 공유는 없다. 생성 콜백은 라이브러리가 소유한다. 테스트 클래스의 각 메서드는 이름과 한국어 Javadoc으로 해당 계약에 연결한다.

## 모바일 API 경계: src/api/system.ts

| 함수·모델 | 책임·입출력 | 실패·부수 효과 |
|---|---|---|
| SystemInfo | 검증된 서버 응답 service:string, stage:string | TS 필수/null 불가. Java/JSON 응답과 일치 |
| fetchSystemInfo | baseUrl:string, 선택 AbortSignal → Promise<SystemInfo> | URL 끝 slash 제거, GET /api/system, 5초 초과·취소·HTTP·JSON 오류는 안내 Error. 타이머·리스너 해제 |
| isSystemInfo | unknown → 타입 가드 boolean | fortune-service와 비어 있지 않은 stage 검사. 다른 서비스·누락·null 거절 |
| 내부 abort 콜백 | 외부 취소·시간 초과 → HTTP abort | API 소유 요청만 중단 |

서버 DTO를 검증한 뒤 그대로 표시하므로 별도 화면 모델 변환은 없다. 날짜·ID·단위·개인정보 필드는 현재 없다.

## Zustand: src/stores/systemStore.ts

`createSystemStore(loadInfo = fetchSystemInfo)`는 독립 vanilla store를 만든다. 앱은 모듈의 `systemStore` 한 개를 selector로 구독한다. loadInfo는 HTTP 경계를 분리해 지연·오류·취소를 테스트하는 주입점이다. 서버 응답 캐시나 영구 저장으로 사용하지 않는다.

| 필드·액션 | 초기값·전이·책임 |
|---|---|
| status | idle → loading → success/error |
| info | null → 검증 응답. 새 요청·실패·reset 시 null |
| error | null → 사용자 안내 문자열. 새 요청·성공·reset 시 null |
| checkConnection(baseUrl) | loading이면 중복 요청을 무시. 결과·오류를 비우고 호출. 최신 generation만 상태에 반영. 예외를 잡아 error로 전이 |
| reset() | generation 증가 → 진행 요청 abort → idle/null/null. 취소를 무시하는 늦은 응답·오류도 무시 |

스토어 생성 시, 주소 변경 시, 사용자가 초기화할 때 비운다. 로그인·사용자 전환은 아직 없으며 해당 기능 도입 때 reset을 연결한다. persist·AsyncStorage·토큰 저장 없음.

## 화면·설정

| 파일·함수 | 입력·상태·동작 |
|---|---|
| App.tsx App | props 없음. 로컬 apiUrl, 공유 status/info/error 및 액션 selector 사용. 안전 영역·스크롤·loading·실패 안내·버튼 제공 |
| changeApiUrl(value) | 기존 요청·결과 reset 후 주소 입력 갱신 |
| connect() | 현재 주소로 checkConnection. UI는 loading 중 버튼 비활성화 |
| 내부 selectors | 소유 App의 상태 필드·액션만 선택. 외부 부수 효과 없음 |
| metro.config.js enhanceMiddleware·내부 middleware | 웹 GET /api/system만 고정 localhost:8080에 프록시. 나머지는 기존 Metro에 위임. 연결 오류 502, 5초 무응답 종료 |
| index.ts registerRootComponent | Expo 생성 진입점. App을 네이티브·웹 root로 등록 |
| scripts/run-service.ps1 | Name은 세 서비스 중 하나. ApiOnly 선택 시 api-smoke. 로컬 문서 true, 종료 시 이전 문서·프로필 환경 복원 |

Expo 앱은 단일 화면으로 내비게이션이 없다. 후속 화면 전환은 하위 AGENTS.md에 따라 Expo Router로 구성한다. Android 기본 API 주소 10.0.2.2:8080, iOS 시뮬레이터 127.0.0.1:8080. 웹 기본 빈 주소는 Metro 프록시다. `EXPO_PUBLIC_API_URL`은 공개 설정이며 비밀번호를 넣지 않는다. 웹 export 결과만 정적 호스팅하면 Metro 프록시가 없으므로 별도 API 프록시가 필요하다.

## 검증 연결

- Gradle 계약 테스트: 공개 문서·필수 응답·기존 보안, fortune의 문서 비활성화.
- 모바일 테스트: 런타임 DTO 오류·HTTP/JSON 실패·5초 타임아웃·중복 호출·재시도·reset·늦은 응답.
- Swagger 실제 Execute와 Bruno 세 환경: 같은 API·응답 필드·보안 실패 조건.
- 모바일 타입/lint/플랫폼 번들·doctor·기기 실행 결과는 실험 기록에 명시한다. 번들 생성은 APK/IPA·스토어 배포 또는 iOS 네이티브 실행을 뜻하지 않는다.
