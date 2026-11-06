# 실험 기록: 모바일 앱·API 도구 연결

- 상태: 로컬 연결·오류 복구 재현, 릴리스·전체 인프라 추가 확인 필요
- 날짜·환경·기준 커밋: 2026-11-06, Windows/PowerShell, Java 21.0.7, Node 22.16.0, npm 10.9.2, 기준 `7929dcc`의 작업 트리
- 관련 설계: [mobile-tooling Design](../02-design/features/mobile-tooling.design.md)
- 질문: 같은 공개 API를 OpenAPI·Bruno·React Native에서 확인하면서 실패·초기화·재요청도 계약대로 동작하는가?

## 가설·선택

기존 system 응답을 바꾸지 않고 세 도구를 연결하면 신규 업무 기능을 만들지 않고도 HTTP 계약과 앱 상태 전이를 검증할 수 있다. 웹 보존·별도 Expo 앱을 선택했다. WebView와 React Native CLI는 현재 목표에 비해 각각 화면 요구 불일치와 관리 비용이 있다. 공유 연결 상태는 Zustand에 두고 저장할 필요가 없어 persist는 사용하지 않았다.

## 재현 방법

1. 루트 `npm ci`, `gradlew.bat test bootJar --no-daemon`.
2. 터미널 세 개에서 `scripts/run-service.ps1 -Name <서비스명> -ApiOnly` 실행. 저장소를 제외한 HTTP 계약용이며 프로세스 readinessState만 포함한다.
3. `npm run test:api -- --env fortune-local` 및 interpretation-local/search-local 실행.
4. 각 서비스 Swagger UI에서 GET /api/system → Try it out → Execute.
5. `apps/mobile`에서 `npm ci`, `npm test`, `npm run typecheck`, `npm run lint`, `npx expo-doctor`, `npm run export`.
6. Android SDK API 35 에뮬레이터·SDK 58 Expo Go에서 `npm run android -- --localhost --port 8083`. API 기본 주소 10.0.2.2:8080. 연결 → 초기화 → fortune 서버 중단 → 연결 오류 → 서버 재시작 → 다시 연결.

전제 업무 데이터·실제 사용자·토큰은 필요 없다. Bruno의 invalid:invalid는 합성된 실패 입력이다. 상세 실행 안내는 [README](../../README.md#모바일-앱과-api-도구-실행)를 따른다.

## 관찰 결과

| 관찰 대상 | 변경 전 | 변경 후·실행 근거 |
|---|---|---|
| 백엔드 계약·보안 | springdoc 없음, 문서 GET은 인증 경계에서 실패 | Gradle 25개 테스트·세 bootJar 통과. 서비스별 계약 4개+기존 보안 4개, fortune 문서 비활성화 1개 |
| Swagger 실제 호출 | 미구성 | Aside에서 세 서비스 각각 Try it out → Execute. 실제 200, 서비스명·bootstrap 확인 |
| Bruno | 컬렉션·CLI 없음 | CLI 4.3.0, 5개 요청/테스트 × 3개 환경 통과. 200·필수 필드·문서·401·Basic challenge 확인 |
| OpenAPI 실패 응답 | 독립 검토에서 401 누락 발견 | 401/WWW-Authenticate/빈 content를 명세·계약 테스트·Bruno에 반영 |
| 모바일 API·상태 | 앱·스토어 없음 | 6개 테스트 실패 재현 후 통과. payload 검증·HTTP/JSON 실패·5초 타임아웃·중복·재시도·reset·늦은 응답 |
| 모바일 정적 검사 | 없음 | npm ci·typecheck·lint 통과, expo-doctor 20/20 |
| 플랫폼 번들 | 없음 | Android·iOS Hermes 번들, web 번들 생성 통과. APK/IPA 생성은 아님 |
| Android 실제 화면 | 없음 | Expo Go 실행. 연결 성공·초기화·서버 중단 오류·재시작 후 재연결 성공을 UI 계층과 화면 캡처로 확인 |
| 웹 미리보기 프록시 | 없음 | Metro /api/system이 서버 중단 시 502, 재시작 후 fortune-service/bootstrap 응답 |
| 기존 웹 | 시작 화면 | npm ci·npm run build 통과, 화면 코드 변경 없음 |
| 전체 인프라 | 미검증 | Docker 실행 파일 없음. Compose config·컨테이너 기동·DB/Kafka/readiness 미검증 |

성능·부하·사용자 수는 측정하지 않았다. 단일 로컬 연결 실험이며 운영 안정성 수치가 아니다. 화면 캡처·빌드·테스트 산출물·로그는 로컬 전용으로 보존하고 Git에 추가하지 않는다.

## 실패와 해결

- 초기 계약 테스트에서 Swagger 접근이 401로 실패 → 문서 GET 경로만 공개하고 기존 인증 경계는 테스트로 유지.
- 테스트 TypeScript의 Node 타입 누락 → 명시적인 타입 의존성과 tsconfig types로 해결.
- Metro와 npm ci를 겹쳐 Windows에서 dotslash 파일 잠금·의존성 누락 발생 → Metro 종료, npm ci 성공 후 검사·실행을 순서대로 진행. Expo Go의 이전 오류 화면은 완전 종료 후 다시 열어 정상 앱 실행 확인.
- 독립 Check에서 OpenAPI의 401 누락 발견 → 응답 헤더·빈 본문 계약과 regression assertion 추가.

## 해석과 한계

공개 system 계약과 연결 UI의 상태 전이를 확인했다. api-smoke는 실제 DB·Redis·MongoDB·Elasticsearch·Kafka를 검증하지 않는다. 운세 생성·회원/JWT·사용자 전환 reset은 미구현이다. Expo Go 실행은 서명된 독립 앱 설치를 대신하지 않는다. Windows에서 iOS 네이티브 실행을 하지 않았고 실제 휴대전화·오프라인 복원·스토어 배포도 미검증이다. Bruno GUI를 설치하지 않고 저장소 CLI로 검증했다.

## 면접 답변·질문

문제는 기준 문서만 있고 모바일에서 같은 API를 호출한 근거가 없다는 점이었다. 기존 응답을 유지하면서 springdoc·Bruno·Expo/Zustand를 연결했고 계약·보안·화면 상태를 각각 검증했다. 중복 요청은 loading에서 차단하고 reset은 요청 취소와 세대 식별자 무효화를 함께 수행해 늦은 응답도 무시한다. 서버 중단과 재시작을 Android에서 재현했으나 저장소 readiness나 운영 장애 복구까지 검증한 것은 아니다.

1. TypeScript 타입이 선언되어 있어도 HTTP 응답을 런타임에서 다시 검증해야 하는 이유는 무엇인가?
2. AbortController로 취소하는 것과 세대 식별자로 늦은 응답을 무시하는 것은 각각 어떤 문제를 해결하는가?

## 직접 해볼 다음 실험

앱에서 연결을 확인한 뒤 fortune 서버를 종료한다. 초기화 → 연결 확인으로 오류가 표시되는지 보고 서버 재시작 후 다시 연결한다. 서버가 응답하지 않는 경우 약 5초 타임아웃과 재시도 가능 상태를 관찰한다. 이미 이번에 재현한 실험이며, 다음에는 실제 휴대전화에서도 같은 조건을 비교한다.
