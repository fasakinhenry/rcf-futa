import { useState, useEffect, useCallback } from 'react'
import { SearchIcon, CancelIcon, HeadphonesIcon, PlayIcon, PauseIcon, TimeIcon, CalendarIcon } from '../lib/icons.jsx'
import { fetchRecordings, fetchCategories, formatDuration } from '../lib/api.js'
import './Playlist.css'

function RecordingRow({ recording, isActive, isPlaying, onPlay, index }) {
  const initials = recording.speaker?.split(' ').slice(-2).map(w => w[0]).join('') || 'RC'

  return (
    <div
      className={`rec-row ${isActive ? 'rec-row--active' : ''}`}
      onClick={() => onPlay(recording)}
    >
      <div className="rec-row__num">
        {isActive && isPlaying
          ? <span className="rec-row__eq"><span /><span /><span /></span>
          : <span className="rec-row__index">{index + 1}</span>
        }
      </div>

      <div className="rec-row__art">
        {recording.cover_url
          ? <img src={recording.cover_url} alt="" />
          : <span>{initials}</span>
        }
      </div>

      <div className="rec-row__info">
        <h3 className="rec-row__title">{recording.title}</h3>
        <div className="rec-row__meta">
          <span className="rec-row__speaker">{recording.speaker}</span>
          <span className="rec-row__sep">·</span>
          <span className="rec-row__cat tag tag--green">{recording.categories?.name}</span>
        </div>
        {recording.description && (
          <p className="rec-row__desc">{recording.description}</p>
        )}
      </div>

      <div className="rec-row__stats">
        <span className="rec-row__stat">
          <HeadphonesIcon size={12} />
          {(recording.play_count || 0).toLocaleString()}
        </span>
        <span className="rec-row__stat">
          <CalendarIcon size={12} />
          {new Date(recording.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
        <span className="rec-row__stat">
          <TimeIcon size={12} />
          {formatDuration(recording.duration_seconds)}
        </span>
      </div>

      <button
        className={`rec-row__play-btn ${isActive && isPlaying ? 'rec-row__play-btn--pause' : ''}`}
        onClick={e => { e.stopPropagation(); onPlay(recording) }}
        aria-label={isActive && isPlaying ? 'Pause' : 'Play'}
      >
        {isActive && isPlaying ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
      </button>
    </div>
  )
}

export default function Playlist({ player }) {
  const { currentTrack, isPlaying, loadTrack, togglePlay } = player
  const [recordings, setRecordings] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [sort, setSort] = useState('newest')
  const [searchInput, setSearchInput] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [recs, cats] = await Promise.all([
        fetchRecordings({ search, categoryId: filterCat, sort }),
        fetchCategories(),
      ])
      setRecordings(recs)
      setCategories(cats)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [search, filterCat, sort])

  useEffect(() => { load() }, [load])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const handlePlay = (recording) => {
    if (currentTrack?.id === recording.id) {
      togglePlay()
    } else {
      loadTrack(recording, recordings, recordings.indexOf(recording))
    }
  }

  const totalDuration = recordings.reduce((sum, r) => sum + (r.duration_seconds || 0), 0)
  const totalPlays = recordings.reduce((sum, r) => sum + (r.play_count || 0), 0)
  const hasFilters = searchInput || filterCat

  return (
    <main className="playlist">
      {/* Header */}
      <div className="playlist__header grid-bg">
        <div className="container">
          <div className="eyebrow">RCF FUTA</div>
          <h1 className="playlist__title heading-lg">Class Recordings</h1>
          <p className="playlist__sub">Every WIT session, recorded and ready. Listen, revisit, go deeper.</p>
          <div className="playlist__meta-row">
            <span className="playlist__meta-chip">
              <PlayIcon size={11} />
              {recordings.length} recordings
            </span>
            <span className="playlist__meta-chip">
              <TimeIcon size={11} />
              {formatDuration(totalDuration)}
            </span>
            <span className="playlist__meta-chip">
              <HeadphonesIcon size={11} />
              {totalPlays.toLocaleString()} total plays
            </span>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Controls */}
        <div className="playlist__controls">
          <div className="playlist__search">
            <SearchIcon size={15} />
            <input
              placeholder="Search recordings, speakers..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
            {searchInput && <button onClick={() => { setSearchInput(''); setSearch('') }}><CancelIcon size={13} /></button>}
          </div>

          <div className="playlist__filters">
            <div className="select-wrap select-wrap--sm">
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                <option value="">All Categories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <span className="select-icon">▾</span>
            </div>
            <div className="select-wrap select-wrap--sm">
              <select value={sort} onChange={e => setSort(e.target.value)}>
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="popular">Most Played</option>
              </select>
              <span className="select-icon">▾</span>
            </div>
            {hasFilters && (
              <button className="btn btn--outline btn--sm" onClick={() => { setSearchInput(''); setSearch(''); setFilterCat('') }}>
                <CancelIcon size={12} /> Clear
              </button>
            )}
          </div>
        </div>

        <div className="playlist__count label">{loading ? 'Loading…' : `${recordings.length} result${recordings.length !== 1 ? 's' : ''}`}</div>

        {/* List */}
        {loading ? (
          <div className="playlist__skeleton">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="rec-skeleton" />)}
          </div>
        ) : recordings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state__icon"><HeadphonesIcon size={24} /></div>
            <p>No recordings found</p>
            <span>{hasFilters ? 'Try a different search or filter' : 'No recordings have been added yet'}</span>
          </div>
        ) : (
          <div className="playlist__list">
            {recordings.map((rec, i) => (
              <RecordingRow
                key={rec.id}
                recording={rec}
                index={i}
                isActive={currentTrack?.id === rec.id}
                isPlaying={currentTrack?.id === rec.id && isPlaying}
                onPlay={handlePlay}
              />
            ))}
          </div>
        )}
      </div>

      <div style={{ height: 120 }} />
    </main>
  )
}
