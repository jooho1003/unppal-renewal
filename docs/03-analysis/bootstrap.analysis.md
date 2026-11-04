# 초기 환경 Check 결과

> 2026-11-04 · bkit Check/Act · [Design](../02-design/features/bootstrap.design.md)

## Context Anchor와 전략 일치

운세 앱 리뉴얼의 출발점과 학습 실험 환경을 구성한다. 제품 기능을 구현한 것으로 취급하지 않는다. Docker 미설치 상태와 기존 소스 위치 미확인을 명시한다.

## 설계 대비 구현

| 기준 | 결과 | 근거 |
|---|---|---|
| SC-1 세 서비스 빌드·보안 테스트 | 통과 | clean test bootJar: 21 tasks, 테스트 12개 실패/오류 0, app.jar 3개 |
| SC-2 React 빌드 | 통과 | npm ci → tsc --noEmit → Vite 8.3.5 build 성공 |
| SC-3 Compose 프로필 검증 | 통과 | standalone Compose v5.7.0 기본/전체 프로필 config --quiet exit 0 |
| SC-4 실행·역할·미구현 문서 | 작성·검토 | README, Design, AGENTS, Do |
| SC-5 핵심 기술 학습과 면접 연결 | 작성·검토 | roadmap, labs-and-interview, evidence-template |

위 항목은 초기 구성의 검증 결과다. 컨테이너 기동, 실제 DB 연결, Kafka 이벤트 처리, Redis 캐시, 검색, ELK 수집의 성공률을 뜻하지 않는다.

## 추가 확인

- PowerShell 스크립트 3개의 Parser 검사 통과.
- init-env 재실행 후 .env 해시 불변, 네 비밀번호는 서로 다름, 미치환 placeholder 없음, Mongo URI 비밀번호 일치. 비밀 값은 출력하지 않았다.
- Kafka init 스크립트 bash -n 통과.
- Docker Hub의 PostgreSQL·Redis·Mongo·Kafka·Temurin 태그 manifest 존재 확인. 독립 검토에서 Elastic 이미지 3종의 8.18.8 manifest 존재 확인.
- readiness contributor db/redis/mongo/elasticsearch 이름을 실제 Boot 3.5.16 의존성 JAR에서 독립 검토자가 확인.
- Querydsl JPAQueryFactory의 Jakarta EntityManager 호환 확인. 실제 Q타입 생성·동적 쿼리는 아직 검증하지 않았다.
- .env는 git check-ignore로 제외 확인. Git main 브랜치 초기화, 원격 등록·커밋 없음.
- Aside에서 React 시작 화면의 제목·문구·링크를 DOM으로 확인했다. 390px/1280px에서 main·h1은 각각 하나이고 가로 overflow가 없었다. full-page 캡처는 도구 시간 초과로 신뢰할 수 없어 모바일 검증은 DOM 치수 기준이다. 검증용 탭과 preview 프로세스는 종료했다.

## 보안·아키텍처 검토

공개 시스템 확인 API와 보호 경로의 인증을 테스트했다. 각 서비스는 독립 패키지·bootJar이며 서로의 Gradle 프로젝트/DB에 의존하지 않는다. Kafka 데이터 경로 권한 문제는 공식 이미지 경로로 수정했다. Private 운세 결과를 검색 인덱스로 보내지 않도록 공개 콘텐츠 토픽을 분리했다.

## 미실행/후속 검증

- Docker Desktop 및 데몬이 없으므로 Dockerfile 이미지 빌드·컨테이너 실행·데이터 영속성·의존성 readiness를 검증하지 못했다.
- Logstash 파일 권한·로그 실제 수집·Kibana 조회도 미검증이다. Linux에서 logs bind mount 권한을 별도 확인해야 한다.
- 앱 테스트는 MVC slice이며 실제 저장소 통합 테스트가 아니다.
- 도메인 처리·Outbox·멱등·DLQ·cache-aside·검색 재색인은 계획이다.

런타임 검증은 Docker 설치 후 README 순서로 진행한다. 설치·기동을 완료로 기록하지 않으며, 초기 코드/구성 검증과 구분한다.
