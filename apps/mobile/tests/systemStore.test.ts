import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createSystemStore } from '../src/stores/systemStore';
import type { SystemInfo } from '../src/api/system';

const info: SystemInfo = { service: 'fortune-service', stage: 'bootstrap' };

/** 중복 요청을 막고 응답 완료 시점에 성공 상태로 전이한다. */
test('idle → loading → success, overlapping requests are ignored', async () => {
  let finish!: (value: SystemInfo) => void;
  let calls = 0;
  const store = createSystemStore(
    /** 지연된 서버 응답을 제어하고 실제 호출 수를 센다. */
    () => { calls++; return new Promise<SystemInfo>(/** 지연 응답의 완료 함수를 보관한다. */ resolve => { finish = resolve; }); },
  );
  const request = store.getState().checkConnection('http://localhost:8080');
  assert.equal(store.getState().status, 'loading');
  await store.getState().checkConnection('http://localhost:8080');
  assert.equal(calls, 1);
  finish(info);
  await request;
  assert.equal(store.getState().status, 'success');
  assert.deepEqual(store.getState().info, info);
  assert.equal(store.getState().error, null);
});

/** 실패 후 사용자가 다시 요청하면 이전 오류를 지우고 성공할 수 있다. */
test('error → retry → success clears old data and errors', async () => {
  let calls = 0;
  const store = createSystemStore(
    /** 첫 호출만 실패시켜 재시도 경로를 재현한다. */
    async () => { if (++calls === 1) throw new Error('network'); return info; },
  );
  await store.getState().checkConnection('');
  assert.equal(store.getState().status, 'error');
  assert.equal(store.getState().info, null);
  assert.ok(store.getState().error);
  await store.getState().checkConnection('');
  assert.equal(store.getState().status, 'success');
  assert.equal(store.getState().error, null);
  store.getState().reset();
  assert.equal(store.getState().status, 'idle');
  assert.equal(store.getState().info, null);
});

/** 초기화 후 도착한 이전 응답이 새 결과를 덮어쓰지 않는다. */
test('reset aborts request and ignores late completion after a new request', async () => {
  const finishes: ((value: SystemInfo) => void)[] = [];
  const signals: (AbortSignal | undefined)[] = [];
  const store = createSystemStore(
    /** 취소를 무시하고 늦게 응답하는 네트워크를 재현한다. */
    (_url, signal) => {
      signals.push(signal);
      return new Promise<SystemInfo>(/** 이전·새 요청을 각각 완료할 수 있게 보관한다. */ resolve => { finishes.push(resolve); });
    },
  );
  const old = store.getState().checkConnection('');
  store.getState().reset();
  assert.equal(signals[0]?.aborted, true);
  assert.equal(store.getState().status, 'idle');
  const fresh = store.getState().checkConnection('');
  finishes[1](info);
  await fresh;
  finishes[0]({ service: 'old', stage: 'old' });
  await old;
  assert.deepEqual(store.getState().info, info);
});
