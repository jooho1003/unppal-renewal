import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

function App() {
  return (
    <main>
      <p className="eyebrow">UNPPAL · NEW CHAPTER</p>
      <h1>오늘의 운을,<br />새롭게 만나다.</h1>
      <p className="description">
        리뉴얼 운빨의 첫 페이지입니다.<br />
        나를 알아가는 운세 서비스를 준비하고 있어요.
      </p>
      <p className="status">개발 환경 구성 단계</p>
      <a href="/api/system" target="_blank" rel="noreferrer">개발용 API 상태 확인 ↗</a>
      <p className="note">API를 먼저 실행하면 상태를 확인할 수 있습니다.</p>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
);
