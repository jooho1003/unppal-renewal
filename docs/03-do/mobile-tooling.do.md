# 모바일·API 도구 구현 기록

> 2026-11-06 · bkit Do · [설계](../02-design/features/mobile-tooling.design.md)

| 순서 | 작업 | 확인 |
|---|---|---|
| 1 | 세 서비스 springdoc·smoke 프로필·보안 문서 경로 | 문서 401 실패 재현 후 공개 문서·필수 필드 검사 통과 |
| 2 | Expo 스캐폴드·Zustand·API 경계 | 6개 테스트 실패 → 구현 → 6개 통과 |
| 3 | 서버 연결 화면·Android/iOS/web 번들 | 타입·lint·doctor·export 통과 |
| 4 | Bruno 버전 고정·세 환경 | 서비스마다 5개 시나리오 통과 |
| 5 | 실제 HTTP·화면 호출 | Swagger 세 서비스 Execute 200, Android 성공·reset·실패·재시도 확인 |
| 6 | 독립 계약 검토·보완 | OpenAPI의 401 응답 누락 보완, Check 문서에 결과 기록 |

Metro 실행 중 npm ci를 겹쳐 Windows 파일 잠금과 의존성 누락이 발생했다. Metro를 종료하고 npm ci를 완료한 뒤 검사와 실행을 순서대로 진행해 해결했다. 이 실패를 앱 기능 결함이나 운영 장애 경험으로 표현하지 않는다.
