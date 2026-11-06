import { createStore } from 'zustand/vanilla';
import { fetchSystemInfo, type SystemInfo } from '../api/system';

/** 연결 결과와 사용자 조작을 메모리에서만 공유한다. */
export interface SystemState {
  status: 'idle' | 'loading' | 'success' | 'error';
  info: SystemInfo | null;
  error: string | null;
  checkConnection: (baseUrl: string) => Promise<void>;
  reset: () => void;
}

/** 독립적인 연결 스토어를 만든다. loadInfo는 네트워크 경계 검증에 사용한다. */
export function createSystemStore(loadInfo = fetchSystemInfo) {
  let active: AbortController | null = null;
  let generation = 0;
  return createStore<SystemState>()(/** 액션이 같은 스토어 상태를 읽고 갱신하도록 연결한다. */ (set, get) => ({
    status: 'idle', info: null, error: null,
    /** 요청 중 재호출을 무시하고 유효한 최신 요청의 결과만 반영한다. */
    checkConnection: async (baseUrl) => {
      if (get().status === 'loading') return;
      const current = ++generation;
      const controller = new AbortController();
      active = controller;
      set({ status: 'loading', info: null, error: null });
      try {
        const info = await loadInfo(baseUrl, controller.signal);
        if (current === generation) set({ status: 'success', info, error: null });
      } catch (error) {
        if (current === generation) set({
          status: 'error', info: null,
          error: error instanceof Error ? error.message : '연결을 확인한 뒤 다시 시도해 주세요.',
        });
      } finally {
        if (current === generation) active = null;
      }
    },
    /** 진행 요청을 취소하고 늦은 응답의 반영을 막은 뒤 메모리 상태를 비운다. */
    reset: () => {
      generation++;
      active?.abort();
      active = null;
      set({ status: 'idle', info: null, error: null });
    },
  }));
}

export const systemStore = createSystemStore();
