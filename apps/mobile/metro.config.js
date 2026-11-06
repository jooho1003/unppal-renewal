const { getDefaultConfig } = require('expo/metro-config');
const http = require('node:http');

const config = getDefaultConfig(__dirname);
const enhance = config.server.enhanceMiddleware;

/** 웹 미리보기의 system 요청만 로컬 API로 전달해 별도 CORS 공개를 피한다. */
config.server.enhanceMiddleware = (middleware, server) => {
  const nextMiddleware = enhance ? enhance(middleware, server) : middleware;
  /** 앱 번들 요청은 Metro로, 공개 상태 GET은 고정된 로컬 백엔드로 전달한다. */
  return (req, res, next) => {
    if (req.method !== 'GET' || req.url !== '/api/system') return nextMiddleware(req, res, next);
    const proxy = http.get('http://127.0.0.1:8080/api/system',
      /** 백엔드 상태 코드·콘텐츠 유형과 본문을 그대로 전달한다. */
      upstream => {
        res.writeHead(upstream.statusCode, { 'Content-Type': upstream.headers['content-type'] ?? 'application/json' });
        upstream.pipe(res);
      });
    proxy.setTimeout(5000, /** 무응답 연결을 종료한다. */ () => proxy.destroy());
    proxy.on('error', /** 서버 주소·스택을 노출하지 않고 연결 실패를 반환한다. */ () => {
      if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end('{"error":"API unavailable"}');
    });
  };
};

module.exports = config;
