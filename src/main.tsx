import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { initTapFeedback } from './utils/feedback'

// 全局按钮点击反馈（震动 + CSS 按压效果）
initTapFeedback()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
