import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import AudioPlayer from './components/AudioPlayer.jsx'
import Home from './pages/Home.jsx'
import Gallery from './pages/Gallery.jsx'
import Playlist from './pages/Playlist.jsx'
import Admin from './pages/Admin.jsx'
import { useAudioPlayer } from './hooks/useAudioPlayer.js'

function AppInner() {
  const location = useLocation()
  const player = useAudioPlayer()
  const isAdmin = location.pathname === '/admin'

  return (
    <>
      {!isAdmin && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/playlist" element={<Playlist player={player} />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
      {!isAdmin && <AudioPlayer player={player} />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  )
}
