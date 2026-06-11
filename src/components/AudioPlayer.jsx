import { useState, useRef } from 'react'
import {
  PreviousIcon, NextIcon, PlayIcon, PauseIcon,
  Back15Icon, Forward15Icon,
  VolumeHighIcon, VolumeMuteIcon,
  ArrowUpIcon, ArrowDownIcon,
  QueueIcon, LoadingIcon, MicIcon,
} from '../lib/icons.jsx'
import { formatDuration } from '../lib/api.js'
import './AudioPlayer.css'

export default function AudioPlayer({ player }) {
  const {
    currentTrack, isPlaying, progress, currentTime, duration,
    volume, playbackRate, isLoading, error, queue, queueIndex,
    togglePlay, seek, skip, handleNext, handlePrev,
    changeRate, changeVolume,
  } = player

  const [expanded, setExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState('now')
  const progressRef = useRef(null)

  if (!currentTrack) return null

  const handleProgressClick = (e) => {
    const rect = progressRef.current.getBoundingClientRect()
    seek(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)))
  }

  const handleProgressTouch = (e) => {
    e.preventDefault()
    const rect = progressRef.current.getBoundingClientRect()
    seek(Math.max(0, Math.min(100, ((e.touches[0].clientX - rect.left) / rect.width) * 100)))
  }

  const initials = currentTrack.speaker?.split(' ').slice(-2).map(w => w[0]).join('') || 'RC'
  const hasTranscript = !!currentTrack.transcript

  return (
    <div className={`player ${expanded ? 'player--expanded' : ''}`}>

      {expanded && (
        <div className="player__panel">
          <div className="player__panel-inner">
            <div className="player__panel-header">
              <button className="player__panel-close" onClick={() => setExpanded(false)}>
                <ArrowDownIcon size={18} />
              </button>
              <span className="player__panel-now">Now Playing</span>
              <div style={{ width: 32 }} />
            </div>

            <div className="player__panel-top">
              <div className="player__artwork">
                {currentTrack.cover_url
                  ? <img src={currentTrack.cover_url} alt={currentTrack.title} />
                  : <div className="player__artwork-placeholder"><span>{initials}</span></div>
                }
              </div>
              <div className="player__panel-meta">
                <div className="player__panel-category">
                  {currentTrack.categories?.name || ''}
                </div>
                <h2 className="player__panel-title">{currentTrack.title}</h2>
                <p className="player__panel-speaker">{currentTrack.speaker}</p>
              </div>
            </div>

            {error && <div className="player__error">{error}</div>}

            <div className="player__progress-section">
              <div
                ref={progressRef}
                className="player__progress-bar player__progress-bar--lg"
                onClick={handleProgressClick}
                onTouchMove={handleProgressTouch}
              >
                <div className="player__progress-fill" style={{ width: `${progress}%` }}>
                  <div className="player__progress-thumb" />
                </div>
              </div>
              <div className="player__times">
                <span>{formatDuration(Math.floor(currentTime))}</span>
                <span>{formatDuration(Math.floor(duration))}</span>
              </div>
            </div>

            <div className="player__controls-lg">
              <button className="player__ctrl player__rate" onClick={changeRate}>
                {playbackRate}×
              </button>
              <button className="player__ctrl" onClick={() => skip(-15)} title="Back 15s">
                <Back15Icon size={26} />
              </button>
              <button className="player__ctrl" onClick={handlePrev}>
                <PreviousIcon size={22} />
              </button>
              <button className="player__play-btn player__play-btn--lg" onClick={togglePlay} disabled={isLoading}>
                {isLoading
                  ? <LoadingIcon size={28} className="spin" />
                  : isPlaying ? <PauseIcon size={28} /> : <PlayIcon size={28} />}
              </button>
              <button className="player__ctrl" onClick={handleNext}>
                <NextIcon size={22} />
              </button>
              <button className="player__ctrl" onClick={() => skip(15)} title="Forward 15s">
                <Forward15Icon size={26} />
              </button>
              <div />
            </div>

            <div className="player__volume">
              <button className="player__ctrl" onClick={() => changeVolume(volume === 0 ? 1 : 0)}>
                {volume === 0 ? <VolumeMuteIcon size={18} /> : <VolumeHighIcon size={18} />}
              </button>
              <input
                type="range"
                min={0} max={1} step={0.05}
                value={volume}
                onChange={e => changeVolume(parseFloat(e.target.value))}
                className="player__volume-slider"
                aria-label="Volume"
              />
            </div>

            {(hasTranscript || queue.length > 0) && (
              <div className="player__tabs">
                <button className={`player__tab ${activeTab === 'now' ? 'active' : ''}`} onClick={() => setActiveTab('now')}>
                  About
                </button>
                {queue.length > 0 && (
                  <button className={`player__tab ${activeTab === 'queue' ? 'active' : ''}`} onClick={() => setActiveTab('queue')}>
                    Queue ({queue.length})
                  </button>
                )}
                {hasTranscript && (
                  <button className={`player__tab ${activeTab === 'transcript' ? 'active' : ''}`} onClick={() => setActiveTab('transcript')}>
                    <MicIcon size={12} /> Transcript
                  </button>
                )}
              </div>
            )}

            {activeTab === 'now' && currentTrack.description && (
              <div className="player__about">
                <p>{currentTrack.description}</p>
              </div>
            )}

            {activeTab === 'queue' && (
              <div className="player__queue">
                {queue.map((track, idx) => (
                  <div key={track.id} className={`player__queue-item ${idx === queueIndex ? 'active' : ''}`}>
                    <span className="player__queue-num">
                      {idx === queueIndex ? <PlayIcon size={12} /> : idx + 1}
                    </span>
                    <div className="player__queue-info">
                      <p>{track.title}</p>
                      <span>{track.speaker}</span>
                    </div>
                    <span className="player__queue-dur">{formatDuration(track.duration_seconds)}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'transcript' && hasTranscript && (
              <div className="player__transcript">
                {currentTrack.transcript.split('\n').filter(Boolean).map((line, i) => {
                  const segStart = i * 30
                  const isActive = currentTime >= segStart && currentTime < segStart + 30
                  return (
                    <p key={i}
                      className={isActive ? 'active' : ''}
                      onClick={() => seek((segStart / (duration || 1)) * 100)}
                    >
                      {line}
                    </p>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mini bar */}
      <div className="player__bar">
        <div
          ref={!expanded ? progressRef : undefined}
          className="player__mini-progress"
          onClick={!expanded ? handleProgressClick : undefined}
        >
          <div className="player__mini-fill" style={{ width: `${progress}%` }} />
        </div>

        <div className="player__bar-inner">
          <div className="player__bar-track" onClick={() => setExpanded(e => !e)}>
            <div className="player__bar-art">
              {currentTrack.cover_url
                ? <img src={currentTrack.cover_url} alt="" />
                : <span>{initials}</span>}
              {isPlaying && (
                <div className="player__bar-eq">
                  <span /><span /><span />
                </div>
              )}
            </div>
            <div className="player__bar-meta">
              <p className="player__bar-title">{currentTrack.title}</p>
              <span className="player__bar-speaker">{currentTrack.speaker}</span>
            </div>
            <button className="player__bar-expand">
              {expanded ? <ArrowDownIcon size={16} /> : <ArrowUpIcon size={16} />}
            </button>
          </div>

          <div className="player__bar-controls">
            <button className="player__bar-btn" onClick={handlePrev}><PreviousIcon size={18} /></button>
            <button className="player__bar-play" onClick={togglePlay} disabled={isLoading}>
              {isLoading
                ? <LoadingIcon size={18} className="spin" />
                : isPlaying ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
            </button>
            <button className="player__bar-btn" onClick={handleNext}><NextIcon size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  )
}
