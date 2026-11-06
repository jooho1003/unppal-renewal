# 운빨 백엔드 기능과 API 명세

> 설계안 v0.1 · 현재 업무 API는 미구현. 구현된 상태 API는 [system 명세](system.md)를 따른다.

## 기능 범위

| 기능 | 기존에서 확인한 동작 | 리뉴얼 순서 |
|---|---|---|
| 회원·인증 | 기본/소셜 가입·로그인, SMS, 계정 찾기·재설정 | 기본 인증·본인 프로필 먼저, 나머지는 후속 |
| 나의 사주 | 양/음력 생일·시간 구분으로 년·월·일·시주 조회 | 1차 |
| 오늘의 운빨 | 비장술 내용·캐릭터·카테고리·추천 목록 | 1차 |
| 카테고리 상세 | 관심·상세 항목과 좋은 날짜·시간 | 1차 |
| 추천별·열람 | 추천인·이용 가능/사용 횟수·초기화 | 정책 확정 후 |
| 푸시·결제 | FCM·배치와 이용 상태 필드 | 후속. 실제 결제 승인·정산 구현은 확인하지 못함 |

**기존 규칙·기준표 기반 운세를 유지한다. AI 생성·타로 같은 새 상품은 추가하지 않는다.**

## API 개요

`/api/v1` 신규 계약 제안이며 기존 `/luck/*.do`와 호환을 약속하지 않는다. 외부 API는 fortune-service가 담당하고 검색 도입 시 공개 검색만 search-service가 담당한다.

| 메서드·경로 | 요청 핵심 | 정상 응답·조건 |
|---|---|---|
| POST /auth/sign-up | loginId, password, nickname | 201 계정 생성. 가입 단계에는 사주 입력을 분리 |
| POST /auth/login | loginId, password | 200 accessToken·refreshToken·만료 정보 |
| POST /auth/refresh | refreshToken | 200 토큰 회전, 이전 토큰 재사용 거절 |
| POST /auth/logout | refreshToken | 204 갱신 세션 폐기. accessToken은 만료까지 유효한 정책 제안 |
| GET /me | 없음 | 200 본인 프로필. 인증 principal 사용 |
| PUT /me/birth-profile | birth, birthTimeCode | 200 정규화 날짜·사주 코드·profileVersion |
| PUT /me/interests | categoryCodes[] | 204 관심 항목 전체 교체, 중복 코드 거절 |
| GET /me/recommendations | limit=8, 허용 1~20 | 200 관심 카테고리 우선 추천. 항목 중복 제거 후 개수 제한 |
| GET /categories | 없음 | 200 활성 카테고리 목록 |
| GET /categories/{code}/activities | page=0, size=20 | 200 항목·페이지 정보, size 1~50, 안정적인 정렬 |
| POST /fortune-requests | type=TODAY 또는 ACTIVITY, ACTIVITY면 activityCode | 202 requestId·status. Idempotency-Key 필수 |
| GET /fortune-requests/{id} | path UUID | 200 상태·실패 코드·완료 시 결과 경로 |
| GET /fortune-requests/{id}/result | path UUID | 200 비장술 내용·캐릭터·좋은 날짜/시간 등 해당 유형 결과 |

인증·카테고리 목록 외 개인 경로는 Bearer 인증 필수다. 새 요청의 기준 날짜는 서버의 Asia/Seoul 오늘로 결정하며 클라이언트가 사주 조합·오늘 띠·소유자를 지정하지 않는다. 조회는 저장·차감을 수행하지 않는다. 오늘 화면의 프로필·카테고리·운세는 각 API 응답으로 조합한다.

초기 추천은 관심 카테고리 우선 후 sort_order/code로 안정적으로 정렬한다. 기존 광고·조회수 가중치는 운영 정책 확정 후 추가한다. 기존 핵심 조회 `/luck/main.do`, `/luck/cateDetailList.do`, `/luck/pureLuckMain.do`, `/luck/myPage.do`를 위 책임으로 나눴다.

## 입력·응답 검토 기준

| 필드·모델 | 타입·필수/null·검증 | 노출·변환 |
|---|---|---|
| birth | year/month/day 정수 + calendarType(SOLAR/LUNAR) 필수, leapMonth 기본 false | 개인정보. 달력 기준표로 검증·양력 정규화. 음력 날짜를 양력 LocalDate로 바로 검증하지 않음 |
| birthTimeCode | 문자열 또는 null, 서버의 유효 코드만 허용 | null=시간 미상. 알 수 없는 코드를 임의 시각으로 보정하지 않음 |
| requestId·user 내부 ID | Java UUID / JSON·TS string, 서버 발급 | 개인 응답은 소유권 확인 후 반환 |
| effectiveDate·timestamp | 날짜 YYYY-MM-DD / 시각 ISO-8601 UTC | 업무 날짜는 서울 기준, 저장 시각은 UTC |
| type·activityCode | 유형 필수, TODAY는 activityCode 생략·ACTIVITY는 활성 코드 필수 | 관련 없는 필드를 한 DTO에 무제한 허용하지 않음 |
| status·result | PENDING/SUCCEEDED/FAILED, 완료 전 결과 없음 | 실패 원문·스택·내부 식별 비밀 미노출 |

등록/교체 DTO는 필수 필드 누락·null을 별도로 검증한다. API·Java·TS·OpenAPI·Bruno의 상세 필드 표와 예시는 각 기능 구현 전에 확정한다. 사주·비장술 결과는 개인정보로 취급하며 본인에게만 노출한다.

## 오류·상태·중복

- 공통 오류 제안: `{code, message, traceId}`. 400 입력 오류, 401 인증 실패, 409 중복/상태 충돌, 422 계산 기준 데이터 범위 밖, 503 필수 저장소/기준 데이터 이용 불가.
- 요청·결과가 없거나 타인 소유라면 404. 결과 미완료·실패 상태에서 결과 GET은 409이며 상태 GET으로 실패 코드를 확인한다.
- 같은 사용자·같은 Idempotency-Key·같은 요청 본문은 기존 requestId와 접수 응답을 반환한다. 본문이 다르면 409. 프로필이 바뀐 뒤 새 계산을 원하면 새 키를 사용한다.
- 요청 시 프로필·계산 입력·규칙 버전을 고정한다. 이후 프로필 수정이 이전 결과를 바꾸지 않는다.
- 상태는 PENDING → SUCCEEDED 또는 FAILED. 상세 재시도·타임아웃·실패 복구 정책은 [아키텍처](../02-design/features/backend-renewal.design.md)를 따른다.

검증 시 정상·잘못된 생일/코드·시간 미상·미인증·타인 조회·없는 요청·중복/다른 본문·지연/실패·재조회 무차감을 Swagger와 Bruno·서버 테스트로 대조한다.
