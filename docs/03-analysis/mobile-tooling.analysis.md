# 모바일·API 도구 Check

> 2026-11-06 · bkit Check/Act · [설계](../02-design/features/mobile-tooling.design.md)

## Context Anchor·검토 범위

공개 system 계약을 유지하고 실제 모바일 연결과 도구 연동을 확인한다. 전체 인프라·운세 업무 기능·스토어 배포는 이번 완료 범위가 아니다. PRD는 별도 생성하지 않고 사용자가 선택한 Expo Android·iOS 추가 요구와 Plan을 기준으로 했다.

## 설계 대비 구현

| 요구 | 구현·근거 | 판단 |
|---|---|---|
| FR-01 기존 응답/OpenAPI | 세 SystemController·Schema·계약 테스트, system 응답 유지 | 충족 |
| FR-02 문서·API 보안 구분 | 문서 기본 off, 로컬 on, 나머지 인증 유지·문서 off 테스트 | 충족 |
| FR-03 Bruno 반복 검증 | 5개 테스트와 서비스별 세 환경 | 충족 |
| FR-04 Zustand 전이 | 중복 차단·reset·늦은 응답 무시·Android 실패/재연결 | 충족 |
| FR-05 응답 경계 | 런타임 가드·5초 타임아웃·영구 저장 없음 | 충족 |
| FR-06 앱 생성·실행 | Expo Android/iOS/web 번들, Android Expo Go 실행 | 범위 충족, iOS 네이티브 실행 미검증 |

## 독립 검토·Act

읽기 전용 검토에서 Critical/High 결함은 발견하지 않았다. Medium 계약 간극 1건: Markdown·Bruno의 401/WWW-Authenticate가 OpenAPI에 누락되어 있었다. 새 assertion으로 실패를 확인한 뒤 세 컨트롤러에 200/401·헤더·빈 401 content를 명시했다. Gradle 테스트 25개와 bootJar가 통과했다. 세 서버를 새 JAR로 재시작한 뒤 업데이트된 Bruno 검사를 각각 5/5 통과했다. 최종 실행 결과는 [실험 기록](../learning/2026-11-06-mobile-tooling.md)에 연결한다.

수정 후 독립 재검토에서도 세 서비스 애너테이션·Gradle·Bruno 계약이 일치함을 확인했고 추가 지적 없이 401 간극을 닫았다. Zustand의 reset/늦은 응답 처리와 Metro의 고정 대상 프록시는 설계와 일치했다. 원본 회사 소스는 복사하지 않았다. 로컬 참고 재확인 범위는 Git에서 제외한 전용 노트에만 기록했다.

## QA 범위 점검

“어떤 구현이 Plan/Design의 작업 항목에서 요청되지 않았는가?”를 점검했다. 단일 화면에 필요 없는 라우터·인증·운세 생성·빈 웹 스토어·서버 상태 영구 저장을 추가하지 않았다. Expo 템플릿이 만든 별도 도구 플러그인 설정은 제거했다. smoke 프로필은 Docker 부재에서도 실제 HTTP 검증을 재현하기 위한 명시적 검증 범위이며 설계에 포함했다.

## 남은 검증

Docker Compose config·컨테이너 readiness·실제 DB/Kafka, iOS 네이티브 실행·실기기·APK/IPA·스토어 제출은 미검증이다. 이 항목을 구현 일치율이나 테스트 통과 수로 대신하지 않는다. GUI Bruno는 설치하지 않았고 CLI로 검증했다.
