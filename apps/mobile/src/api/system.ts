/** 서버가 공개하는 프로세스 정보이며 개인정보를 포함하지 않는다. */
export interface SystemInfo {
  service: string;
  stage: string;
}

/** fortune-service 응답을 검증하며 HTTP·JSON·네트워크 오류 또는 5초 초과 시 거절한다. */
export async function fetchSystemInfo(baseUrl: string, signal?: AbortSignal): Promise<SystemInfo> {
  const controller = new AbortController();
  /** 스토어의 초기화·취소 신호를 현재 HTTP 요청에 전달한다. */
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) controller.abort();
  const timeout = setTimeout(abort, 5000);
  let body: unknown;
  try {
    const response = await fetch(`${baseUrl.trim().replace(/\/+$/, '')}/api/system`, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error('HTTP 실패');
    body = await response.json();
  } catch {
    throw new Error('서버에 연결하지 못했어요. 주소와 실행 상태를 확인한 뒤 다시 시도해 주세요.');
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', abort);
  }
  if (!isSystemInfo(body)) throw new Error('서버 응답 형식이 맞지 않아요. API 버전을 확인해 주세요.');
  return body;
}

/** 다른 서비스나 null·누락 필드를 정상 연결로 표시하지 않도록 런타임에서 검사한다. */
function isSystemInfo(value: unknown): value is SystemInfo {
  return typeof value === 'object' && value !== null
    && 'service' in value && value.service === 'fortune-service'
    && 'stage' in value && typeof value.stage === 'string' && value.stage.trim().length > 0;
}
