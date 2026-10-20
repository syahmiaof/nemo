import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import './index.css';
import { initializeWorkspace } from './db/workspace';

async function bootstrap() {
  const root = ReactDOM.createRoot(document.getElementById('root')!);
  try {
    await initializeWorkspace();
    root.render(<React.StrictMode><App /></React.StrictMode>);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown browser storage error.';
    root.render(
      <main role="alert" style={{ maxWidth: 640, margin: '15vh auto', padding: 32 }}>
        <h1>Workspace could not open</h1>
        <p>{message}</p>
        <p>Your existing records have not been replaced. Check browser storage access and reload.</p>
        <button onClick={() => window.location.reload()}>Try again</button>
      </main>,
    );
  }
}

void bootstrap();
