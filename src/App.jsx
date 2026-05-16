import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Admin from './pages/Admin'
import { useEffect, useState } from 'react'

function InstallPrompt({ onInstall }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const handler = () => setVisible(true)
    window.addEventListener('pwa-install-available', handler)
    return () => window.removeEventListener('pwa-install-available', handler)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-4 right-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-3">
      <span className="text-sm font-medium">Install HappyMoment?</span>
      <button onClick={async () => {
        const outcome = await window.installPWA()
        if (outcome === 'accepted') setVisible(false)
      }} className="bg-white text-pink-600 px-3 py-1 rounded-full text-sm font-semibold">
        Install
      </button>
      <button onClick={() => setVisible(false)} className="text-white/80 hover:text-white">
        ✕
      </button>
    </div>
  )
}

function App() {
  return (
    <Router>
      <InstallPrompt />
      <Routes>
        <Route path="/*" element={<Admin />} />
      </Routes>
    </Router>
  )
}

export default App
