import { useState, useEffect, useRef, useCallback } from 'react'
import { logPlay } from '../lib/api.js'

export function useAudioPlayer() {
  const audioRef = useRef(null)
  const [currentTrack, setCurrentTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [queue, setQueue] = useState([])
  const [queueIndex, setQueueIndex] = useState(0)
  const [error, setError] = useState(null)
  const playCountedRef = useRef(false)
  const nextTrackRef = useRef(null)

  useEffect(() => {
    const audio = new Audio()
    audio.preload = 'metadata'
    audioRef.current = audio

    audio.addEventListener('timeupdate', () => {
      if (!audio.duration) return
      setCurrentTime(audio.currentTime)
      setProgress((audio.currentTime / audio.duration) * 100)
      if (audio.currentTime >= 10 && !playCountedRef.current) {
        playCountedRef.current = true
        if (nextTrackRef.current?.id) {
          logPlay(nextTrackRef.current.id)
        }
      }
    })

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration)
      setIsLoading(false)
      setError(null)
    })

    audio.addEventListener('waiting', () => setIsLoading(true))
    audio.addEventListener('canplay', () => setIsLoading(false))

    audio.addEventListener('error', () => {
      setIsLoading(false)
      setError('Failed to load audio. Check the URL or your connection.')
      setIsPlaying(false)
    })

    audio.addEventListener('ended', () => {
      setIsPlaying(false)
      // Auto-advance queue
      setQueueIndex(prev => {
        const next = prev + 1
        setQueue(q => {
          if (next < q.length) {
            _loadTrack(q[next], q, next)
          }
          return q
        })
        return next
      })
    })

    audio.addEventListener('play', () => setIsPlaying(true))
    audio.addEventListener('pause', () => setIsPlaying(false))

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [])

  const _loadTrack = useCallback((track, trackQueue = [], index = 0) => {
    const audio = audioRef.current
    if (!audio) return
    playCountedRef.current = false
    nextTrackRef.current = track
    setCurrentTrack(track)
    setError(null)
    setProgress(0)
    setCurrentTime(0)
    setDuration(track.duration_seconds || 0)

    if (trackQueue.length) {
      setQueue(trackQueue)
      setQueueIndex(index)
    }

    setIsLoading(true)
    audio.src = track.audio_url
    audio.load()
    audio.playbackRate = playbackRate
    audio.play().catch(e => {
      setError('Playback failed. Tap play to retry.')
      setIsPlaying(false)
      setIsLoading(false)
    })
  }, [playbackRate])

  const loadTrack = useCallback(_loadTrack, [_loadTrack])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return
    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch(() => setError('Playback failed.'))
    }
  }, [currentTrack, isPlaying])

  const seek = useCallback((percent) => {
    const audio = audioRef.current
    if (!audio || !audio.duration) return
    const time = (percent / 100) * audio.duration
    audio.currentTime = time
    setCurrentTime(time)
    setProgress(percent)
  }, [])

  const skip = useCallback((seconds) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.max(0, Math.min(audio.currentTime + seconds, audio.duration || 0))
  }, [])

  const handleNext = useCallback(() => {
    setQueue(q => {
      const nextIdx = queueIndex + 1
      if (nextIdx < q.length) {
        _loadTrack(q[nextIdx], q, nextIdx)
        setQueueIndex(nextIdx)
      }
      return q
    })
  }, [queueIndex, _loadTrack])

  const handlePrev = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.currentTime > 3) {
      audio.currentTime = 0
      return
    }
    setQueue(q => {
      const prevIdx = queueIndex - 1
      if (prevIdx >= 0) {
        _loadTrack(q[prevIdx], q, prevIdx)
        setQueueIndex(prevIdx)
      }
      return q
    })
  }, [queueIndex, _loadTrack])

  const changeRate = useCallback(() => {
    const rates = [1, 1.25, 1.5, 1.75, 2]
    const next = rates[(rates.indexOf(playbackRate) + 1) % rates.length]
    setPlaybackRate(next)
    if (audioRef.current) audioRef.current.playbackRate = next
  }, [playbackRate])

  const changeVolume = useCallback((v) => {
    setVolume(v)
    if (audioRef.current) audioRef.current.volume = v
  }, [])

  return {
    currentTrack, isPlaying, progress, currentTime,
    duration: duration || currentTrack?.duration_seconds || 0,
    volume, playbackRate, isLoading, error, queue, queueIndex,
    loadTrack, togglePlay, seek, skip, handleNext, handlePrev,
    changeRate, changeVolume,
  }
}
