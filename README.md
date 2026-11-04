# 리뉴얼 운빨

실제 회사의 제품 개발처럼 요구사항·설계·구현·검증을 진행하는 운세 앱 리뉴얼 프로젝트입니다. 기존 실무와 개인 프로젝트에서 얻은 개발 방식을 발전시키며, Kafka·Docker·MSA·Redis·Elasticsearch의 선택과 실험 근거를 남깁니다.

기존 방식을 참고하는 기준은 [학습 근거와 공개 범위](docs/learning/reference-policy.md)에 정리했습니다. 회사 원본·비공개 소스 상세 분석·개인 경로는 공개 저장소에 포함하지 않습니다. 이후 채용 사전과제에는 해당 기업의 명세에 맞는 방식을 선택해 적용합니다.

현재는 **개발 환경 초기 세팅**입니다. 운세 생성·회원가입·이벤트 처리·검색 기능은 아직 구현하지 않았습니다. 기존 운빨 소스 위치도 확인되지 않아 기능 이관은 진행하지 않았습니다.

개발 기준은 [CONVENTIONS.md](CONVENTIONS.md)를 따릅니다. AI가 작성·변경하는 모든 API·함수에 주석과 명세를 제공하고, DTO·모델을 필드별로 검토합니다. API 확인은 OpenAPI/Swagger UI와 Bruno, React 공유 상태 관리는 Zustand를 사용하기로 정했습니다. 현재 이 도구들의 의존성·컬렉션·스토어 구성은 아직 도입 전입니다.

## 시작하기

필수: JDK 21, Node.js 22.12 이상(현재 장비 22.16), Docker Desktop + WSL 2, Git. Gradle은 Wrapper가 다운로드합니다. Docker Desktop 설치는 [Windows 공식 안내](https://docs.docker.com/desktop/setup/install/windows-install/)를 따릅니다. 전체 앱과 ELK를 함께 실행할 때는 Docker에 8GB 정도의 메모리를 할당하는 것을 초기 예산으로 잡고 실제 사용량을 확인하세요.

PowerShell에서 저장소를 내려받고 프로젝트 루트로 이동합니다.

```powershell
git clone https://github.com/jooho1003/unppal-renewal.git
Set-Location unppal-renewal
.\scripts\init-env.ps1
.\scripts\doctor.ps1
```

init-env는 무작위 로컬 비밀번호가 들어간 .env를 만들며, 이미 있는 .env는 유지합니다. Docker가 설치되어 있지 않거나 실행되지 않았다면 doctor가 실패 원인을 표시합니다.

### 인프라는 Docker, 앱은 로컬 실행

```powershell
docker compose config --quiet
docker compose up -d
docker compose ps -a
```

kafka-init는 업무 토픽 세 개와 각 .DLT까지 총 여섯 개를 만든 뒤 `Exited (0)`이면 정상입니다. 나머지 인프라가 healthy인지 확인합니다. 서비스마다 별도 터미널을 열어 실행하세요.

```powershell
.\scripts\run-service.ps1 -Name fortune-service
```

```powershell
.\scripts\run-service.ps1 -Name interpretation-service
```

```powershell
.\scripts\run-service.ps1 -Name search-service
```

프런트 터미널:

```powershell
Set-Location apps/web
npm.cmd ci
npm.cmd run dev
```

브라우저에서 http://127.0.0.1:5173 에 접속합니다. `/api`와 `/actuator`는 Vite가 fortune-service로 프록시합니다. preview는 정적 번들 확인용이며 개발 프록시를 제공하지 않습니다.

### 백엔드까지 Docker로 실행

```powershell
docker compose --profile apps up -d --build
docker compose --profile apps ps -a
```

이 모드에서는 같은 포트의 로컬 bootRun 프로세스를 먼저 종료하세요. React는 위의 npm 명령으로 실행합니다. Linux에서 실행한다면 bind mount한 logs 디렉터리에 컨테이너 UID 10001이 쓸 수 있는 권한이 필요합니다.

### ELK 추가 실행

```powershell
docker compose --profile elk up -d
```

앱이 기록한 `logs/*.log`의 ECS JSON을 Logstash가 읽어 Elasticsearch에 저장합니다. Kibana http://127.0.0.1:5601 의 Stack Management → Data Views에서 `unppal-logs-*`, 시간 필드 `@timestamp`를 생성합니다. 실제 로그가 들어온 후 Discover에서 조회합니다. 현재 로그에는 요청 추적 필터가 없으며 correlationId 전파는 후속 구현입니다.

### 상태 확인과 종료

```powershell
Invoke-RestMethod http://127.0.0.1:8080/api/system
Invoke-RestMethod http://127.0.0.1:8080/actuator/health/readiness
Invoke-RestMethod http://127.0.0.1:8081/actuator/health/readiness
Invoke-RestMethod http://127.0.0.1:8082/actuator/health/readiness
docker compose --profile apps --profile elk down
```

`/api/system`은 프로세스 확인용입니다. readiness는 각 저장소 연결을 확인하며 Kafka 상태는 포함하지 않습니다. Kafka는 컨테이너 health와 토픽 조회로 별도 확인합니다. `down`은 볼륨을 보존합니다. 데이터 초기화가 필요한 경우에만 볼륨 삭제를 별도로 검토하세요.

## 기술별 역할

| 기술 | 맡길 역할 | 현재 상태 |
|---|---|---|
| Java 21 / Spring Boot 3.5.16 / Gradle 8.14.3 | 백엔드 3개 독립 빌드·실행 | 초기 앱 구성 |
| Spring Security | 인증·인가 | 로컬 Basic 경계만 구현, 회원/JWT 후속 |
| PostgreSQL / JPA / Flyway | 요청·회원·상태의 정합성 | 의존성·연결 설정, 엔티티/마이그레이션 후속 |
| Querydsl 7.7 (OpenFeign fork) | 동적 목록 조회 | 의존성·Jakarta annotation processor 설정, Q타입 생성 검증 후속 |
| Kafka 3.9.2 KRaft | 비동기 운세 처리·완료 이벤트 | 브로커·토픽 구성, producer/consumer 로직 후속 |
| MongoDB 8.0.14 | 유연한 운세 해석 결과 문서 | 연결 설정, 실제 저장 후속 |
| Redis 7.4.6 | 운세 결과 캐시 | 연결 설정, cache-aside와 무효화 후속 |
| Elasticsearch 8.18.8 | 공개 운세 콘텐츠 검색 | 연결 설정, mapping/검색/색인 후속 |
| Logstash / Kibana 8.18.8 | 로그 수집·조회 | 선택 프로필과 ECS 파일 파이프라인 구성 |
| Docker Compose | 환경 재현·서비스 격리 | 구성 검증과 런타임 검증은 별도 |
| React 19 / TypeScript / Vite 8 | 운세 앱 화면 | 시작 화면·빌드·개발 프록시 |

Spring Data Elasticsearch가 사용하는 클라이언트 8.18.8과 ELK 서버 버전을 맞췄습니다. Querydsl은 Jakarta 지원을 제공하는 [OpenFeign 유지보수 버전](https://github.com/OpenFeign/querydsl/blob/master/docs/migration.md)을 사용합니다. Boot 버전은 [Java·Gradle 호환 범위](https://docs.spring.io/spring-boot/3.5/system-requirements.html)와 현재 JDK에 맞춰 선택했으며, 최신 메이저라는 의미는 아닙니다.

## 서비스와 포트

| 대상 | 호스트 포트 | 책임 |
|---|---|---|
| React | 5173 | 사용자 화면 |
| fortune-service | 8080 | 요청·상태·캐시 |
| interpretation-service | 8081 | 비동기 해석·Mongo 결과 |
| search-service | 8082 | 검색 인덱스·공개 검색 |
| PostgreSQL / MongoDB / Redis | 5432 / 27017 / 6379 | 서비스별 소유 저장소 |
| Kafka | 9092 | 호스트 접속. 컨테이너에서는 kafka:29092 |
| Elasticsearch / Kibana | 9200 / 5601 | 검색·로그 저장 / 로그 UI |

로컬 학습 환경은 Basic 인증·ES 보안 비활성화 설정을 사용하며 호스트 포트는 loopback에 바인딩합니다. 서비스 계정은 `learner`, 비밀번호는 .env의 DEV_PASSWORD입니다. 운영 배포 전 인증·TLS·DB 최소 권한·비밀 관리를 별도로 설계해야 합니다.

## 검증

```powershell
.\gradlew.bat test bootJar --no-daemon
docker compose --profile apps --profile elk config --quiet
Set-Location apps/web
npm.cmd ci
npm.cmd run build
```

백엔드 테스트는 DB 없이 공개 API·미인증 거절·비밀번호 인증을 확인합니다. 서비스의 실제 저장·이벤트 처리를 검증하는 테스트가 아닙니다.

한글 경로의 Windows 환경에서 Gradle 8이 작성하는 JVM argfile 인코딩 문제를 피하기 위해 Gradle JVM은 `file.encoding=COMPAT`, Java 소스 컴파일은 UTF-8로 분리했습니다. 근거: [Gradle #30304](https://github.com/gradle/gradle/issues/30304).

## 다음 작업

첫 목표는 **운세 요청 저장 → Kafka 전달 → MongoDB 결과 저장 → 완료 상태 갱신 → 결과 조회** 흐름입니다. 처음에는 고정 규칙의 데모 해석을 사용하고, 사주 계산·AI 연동 요구가 정해진 뒤 확장합니다. 이후 멱등·DLQ·Outbox·캐시·검색을 한 번에 하나씩 실험합니다.

- [초기 구성 설계](docs/02-design/features/bootstrap.design.md)
- [학습·구현 로드맵](docs/learning/roadmap.md)
- [장애 실습과 면접 질문](docs/learning/labs-and-interview.md)
- [실험 기록 양식](docs/learning/evidence-template.md)
- [검증 결과](docs/04-report/bootstrap.report.md)
