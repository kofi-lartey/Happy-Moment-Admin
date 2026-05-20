import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import InstallButton from './components/InstallButton.jsx'
import './index.css'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.log('SW registration failed:', err)
    })
  })
}

let deferredPrompt = null
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferredPrompt = e
  window.dispatchEvent(new CustomEvent('pwa-install-available'))
})

window.installPWA = async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    deferredPrompt = null
    return outcome
  }
  return 'dismissed'
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <InstallButton />
  </React.StrictMode>,
)
