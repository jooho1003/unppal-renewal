import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fetchSystemInfo } from '../src/api/system';

/** HTTP 성공이어도 다른 서비스·null·누락 필드는 거절한다. */
test('validates runtime payload and normalizes trailing slash', async (t) => {
  const info = { service: 'fortune-service', stage: 'bootstrap' };
  t.mock.method(globalThis, 'fetch',
    /** 호출 URL과 응답 검증에 사용할 JSON을 반환한다. */
    async (url: string | URL | Request) => {
      assert.equal(url, 'http://localhost:8080/api/system');
      return Response.json(info);
    });
  assert.deepEqual(await fetchSystemInfo('http://localhost:8080/'), info);
  for (const value of [null, {}, { service: 'search-service', stage: 'bootstrap' },
    { service: 'fortune-service', stage: null }, { service: 'fortune-service', stage: '' }]) {
    t.mock.method(globalThis, 'fetch', /** 잘못된 서버 응답을 주입한다. */ async () => Response.json(value));
    await assert.rejects(fetchSystemInfo(''), /응답 형식/);
  }
});

/** 서버 오류·깨진 JSON을 사용자 안내 오류로 변환한다. */
test('rejects HTTP failures and malformed JSON', async (t) => {
  t.mock.method(globalThis, 'fetch', /** HTTP 인증 실패를 재현한다. */ async () => new Response('', { status: 401 }));
  await assert.rejects(fetchSystemInfo(''), /서버에 연결/);
  t.mock.method(globalThis, 'fetch', /** JSON 파싱 오류를 재현한다. */ async () => new Response('invalid'));
  await assert.rejects(fetchSystemInfo(''), /서버에 연결/);
});

/** 응답이 없는 네트워크도 5초 후 종료되어 다시 시도할 수 있다. */
test('aborts an unresponsive request after five seconds', async (t) => {
  t.mock.method(globalThis, 'fetch',
    /** abort 신호를 실제 fetch처럼 거절로 연결한다. */
    async (_url: unknown, options?: RequestInit) => new Promise<Response>(/** 응답 없이 취소 신호만 기다린다. */ (_resolve, reject) => {
      options?.signal?.addEventListener('abort', /** 취소된 네트워크 요청을 거절한다. */ () => reject(new Error('aborted')), { once: true });
    }));
  await assert.rejects(fetchSystemInfo(''), /서버에 연결/);
});
