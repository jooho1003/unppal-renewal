# 초기 환경 구현 기록

> 2026-11-04 · bkit Do · [Plan](../01-plan/features/bootstrap.plan.md) · [Design](../02-design/features/bootstrap.design.md)

## Context Anchor

WHY: 분산 시스템을 직접 실험한다. WHO: 운세 앱 개발자와 사용자. RISK: 설치를 실무 경험으로 과장하는 것. SUCCESS: 재현 가능한 빌드·구성·학습 계획. SCOPE: 초기 환경만 구성한다.

## Session Scope

Gradle·세 Spring Boot 서비스·React·Compose·ELK·실행 스크립트·학습 문서. 기존 운빨은 위치 미확인으로 수정하지 않았다. 외부 계정·유료 API·운영 배포 작업 없음.

## Upstream Context Chain

사용자 요구: 운세 앱 리뉴얼, 제시 스택, 핵심 기술 이해와 면접 대비. ELK 의미는 사용자 답변으로 확정. Plan의 초기 세팅 범위와 Design의 세 서비스 구조에 따라 구현했다. PRD는 제품 기능 확정 전이므로 작성하지 않았다.

## 구현 순서와 검증

1. 서비스별 application, system API, Security, MVC 보안 테스트. test와 bootJar 실행.
2. PostgreSQL/JPA/Flyway/Querydsl, Redis, Mongo, Elasticsearch 의존성과 연결 설정. 아직 엔티티/쿼리/캐시/메시지 처리 없음.
3. Compose의 KRaft 리스너·토픽 초기화·영속 볼륨·인프라 healthcheck·앱 빌드·ELK 프로필. 실제 Compose config 파서 검증.
4. .env 초기화·실행·사전 진단 스크립트. PowerShell 구문과 init-env 재실행 불변성 확인.
5. React 시작 화면, TypeScript, Vite 프록시, lockfile. npm ci 후 build 확인, Aside DOM 점검.
6. 학습 단계·장애 실험·면접 질문·근거 양식. 이번 세팅과 후속 기능을 구분.

## 발견과 수정

- Gradle 8이 UTF-8로 쓴 worker argfile을 Windows JVM이 MS949로 읽어 테스트 클래스를 못 찾았다. 임시 classpath probe로 파일 존재 여부와 코드포인트를 확인했다. Gradle JVM을 COMPAT로 바꾸고 Java 소스 UTF-8은 유지한 뒤 clean test로 확인했다.
- Basic 인증 테스트에서 BCrypt 해시의 알고리즘 접두사 누락을 발견했다. {bcrypt} 접두사를 추가한 뒤 정상/잘못된 비밀번호 테스트가 모두 통과했다.
- 독립 검토에서 Kafka 로그 볼륨 디렉터리의 최초 쓰기 권한 문제를 찾았다. 공식 이미지가 appuser 권한을 준비하는 /var/lib/kafka/data로 정렬했다. 실제 권한 동작은 Docker 설치 후 확인한다.
- 로컬 bootRun은 서비스 디렉터리에서 실행되므로 로그를 루트 logs로 보내도록 run-service의 LOG_FILE을 절대 경로로 지정했다.

최종 명령과 한계는 [Check](../03-analysis/bootstrap.analysis.md)에 기록한다.
