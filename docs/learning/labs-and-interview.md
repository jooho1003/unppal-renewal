# 장애 실습과 면접 질문

실습은 로컬 합성 데이터만 사용한다. **현재 가능한 인프라 실습**과 **도메인 구현 후 가능한 실습**을 구분한다. 현재 장비에는 Docker가 없어 아래 컨테이너 실습을 실행하지 않았다.

## 1. Docker: 이름과 데이터 수명

Docker 설치 후 기본 Compose를 올리고 실행한다.

```powershell
docker compose ps -a
docker compose exec kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server kafka:29092 --list
docker compose restart redis
docker compose exec redis redis-cli ping
```

설명할 것: 호스트에서 Kafka는 localhost:9092, 컨테이너에서는 kafka:29092인 이유. Redis 재시작 후 데이터가 남는 이유(AOF와 볼륨). 컨테이너 내부 localhost가 다른 서비스 주소가 될 수 없는 이유.

면접 질문: 이미지와 컨테이너와 볼륨의 차이는? depends_on의 시작 순서와 애플리케이션의 지속적인 가용성은 어떻게 다른가?

## 2. Kafka: 소비와 재생

브로커 실습은 도메인 앱 없이도 가능하다. 전용 `lab.*` 토픽을 만들어 업무 토픽과 분리한다.

```powershell
docker compose exec kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server kafka:29092 --create --if-not-exists --topic lab.fortune.v1 --partitions 3 --replication-factor 1
'request-1:{"eventId":"lab-event-1","requestId":"request-1"}' | docker compose exec -T kafka /opt/kafka/bin/kafka-console-producer.sh --bootstrap-server kafka:29092 --topic lab.fortune.v1 --property parse.key=true --property key.separator=:
docker compose exec kafka /opt/kafka/bin/kafka-console-consumer.sh --bootstrap-server kafka:29092 --topic lab.fortune.v1 --group lab-observer --from-beginning --max-messages 1 --timeout-ms 10000 --property print.key=true --property print.partition=true --property print.offset=true
```

동일 key로 여러 번 보내 파티션을 기록한다. **새 그룹** `lab-replay`로 과거 메시지를 다시 읽고, 기존 그룹의 committed offset과 비교한다. 같은 그룹에 from-beginning을 붙여도 유효한 committed offset이 있다면 처음으로 돌아가지 않는다는 점을 확인한다. 콘솔 소비자가 종료할 때의 commit 여부도 describe 명령으로 확인한다.

```powershell
docker compose exec kafka /opt/kafka/bin/kafka-consumer-groups.sh --bootstrap-server kafka:29092 --describe --group lab-observer
```

도메인 구현 후: interpretation-service 중지 → 요청 접수 → lag 관찰 → 재시작 → 처리 완료. 같은 eventId 중복 수신과 처리 후 offset commit 전 종료를 재현한다. DB 유니크 제약과 소비자 처리 경계를 검증한다.

면접 질문: 순서는 어느 범위에서 보장되는가? 소비자 수가 파티션보다 많으면? producer idempotence만으로 DB 중복 저장이 사라지는가? acks=all인 단일 브로커가 장애에 안전한가?

## 3. Redis: 캐시의 정체

직접 키·TTL 실습은 인프라만으로 가능하다.

```powershell
docker compose exec redis redis-cli SET lab:fortune:request-1 demo EX 30
docker compose exec redis redis-cli TTL lab:fortune:request-1
docker compose exec redis redis-cli GET lab:fortune:request-1
```

30초 이후 GET 결과와 TTL을 비교한다. 이 실습은 캐시 구현 완료를 의미하지 않는다.

cache-aside 구현 후: 동일 데이터·동일 부하로 cold/warm 측정 → Redis 중지 → DB fallback 검증 → Redis 재기동 후 stale 값 여부 확인. 본인 결과 캐시는 사용자 권한 범위와 key를 함께 검토한다. Redis 중지 실험 중 다른 서비스 영향도 기록한다.

면접 질문: TTL이 있는데 왜 무효화가 필요한가? cache stampede가 언제 생기는가? Redis 장애가 전체 API 장애로 번지지 않게 하려면? 캐시와 분산락을 같은 목적으로 봐도 되는가?

## 4. Elasticsearch: text와 keyword

인프라 실습은 ASCII 합성 콘텐츠로 먼저 진행한다. PowerShell 5.1의 한글 요청 본문 인코딩 영향을 피하고, 한글 분석기 실험은 이후 UTF-8 전송과 함께 진행한다.

```powershell
$mapping = '{"mappings":{"properties":{"title":{"type":"text"},"category":{"type":"keyword"}}}}'
Invoke-RestMethod -Method Put -Uri 'http://127.0.0.1:9200/lab-unppal-content-v1' -ContentType 'application/json' -Body $mapping
Invoke-RestMethod -Method Put -Uri 'http://127.0.0.1:9200/lab-unppal-content-v1/_doc/1?refresh=wait_for' -ContentType 'application/json' -Body '{"title":"daily fortune guide","category":"daily"}'
Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:9200/lab-unppal-content-v1/_search' -ContentType 'application/json' -Body '{"query":{"match":{"title":"fortune"}}}'
Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:9200/lab-unppal-content-v1/_search' -ContentType 'application/json' -Body '{"query":{"term":{"category":"daily"}}}'
```

처음 한 번만 index 생성 명령을 실행한다. 같은 이름으로 다시 만들면 이미 존재한다는 오류가 난다. refresh=wait_for를 빼고 색인 직후 검색하면 어떤 차이가 있는지 반복 관찰한다. 한 번 검색에 성공했다고 즉시 일관성을 보장한다고 결론 내리지 않는다.

검색 구현 후: 같은 원본 문서로 새 버전 인덱스를 만들고 재색인 → 검증 → alias 전환 → 지연 이벤트 재처리 전략까지 확인한다. 개인 운세 결과는 실습 인덱스에 넣지 않는다.

면접 질문: DB LIKE와 역색인 검색의 차이는? text와 keyword는 언제 쓰는가? 저장 성공 후 검색에 안 보이는 이유는? Elasticsearch를 정본 DB로 쓰면 어떤 비용이 생기는가?

## 5. MSA: 장애의 경계

도메인 구현 후 수행한다. 현재 /api/system 응답만으로 아래 실험이 성공했다고 말하지 않는다.

| 장애 | 기대할 사용자 경험 | 관찰할 것 |
|---|---|---|
| interpretation 중지 | 접수 후 처리 중 표시, 복구 후 완료 | Kafka lag·상태 전이 |
| search 중지 | 검색 오류 표시, 운세 접수는 동작 | 서비스별 readiness·요청 결과 |
| Redis 중지 | 조회 fallback 또는 명시한 성능 저하 정책 | DB 부하·타임아웃 |
| 이벤트 중복 | 하나의 요청에 결과 중복 없음 | eventId·DB 제약·처리 이력 |
| DB commit 후 발행 실패 | Outbox 재전송으로 누락 복구 | outbox 상태·발행 기록 |

면접 질문: 왜 이 세 경계를 선택했는가? 모놀리스보다 복잡해진 점은? 분산 트랜잭션 없이 요청과 결과를 어떻게 맞추는가? 사용자는 최종 일관성을 어떻게 경험하는가?

## 6. ELK: 원인 찾기

먼저 앱 시작 로그가 unppal-logs-*에 수집되는지 확인한다. 이후 correlationId 구현 후 하나의 합성 요청을 서비스 간 추적한다. 소비자 예외를 한 번 발생시키고 해당 eventId·예외·재시도·DLQ 흐름을 찾는다. 로그가 없을 때는 파일 생성 → bind mount → Logstash 입력 → Elasticsearch index → Kibana data view 순서로 확인한다.

면접 질문: Elasticsearch 검색 데이터와 운영 로그를 어떻게 구분하는가? correlationId와 eventId는 왜 둘 다 필요한가? ELK 수집 장애 때문에 요청 처리까지 실패해야 하는가?
