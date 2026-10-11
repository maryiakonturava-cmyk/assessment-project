import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import './app/app.css'
import { startMockWorker } from './mocks/browser'

async function bootstrap() {
  if (import.meta.env.DEV) {
    await startMockWorker()
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
