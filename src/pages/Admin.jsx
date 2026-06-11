import { useState, useEffect, useRef } from 'react'
import { LockIcon, EyeIcon, EyeOffIcon, LogoutIcon, ChartBarIcon, MusicNoteIcon, UsersIcon, AddIcon, CheckCircleIcon, CancelIcon, DeleteIcon, UploadIcon, EditIcon, NotificationIcon, UserAddIcon } from '../lib/icons.jsx'
import {
  fetchAnalytics, fetchRecordings, addRecording, deleteRecording,
  fetchAllStudents, approveStudent, deleteStudent,
  fetchUnits, addUnit, updateUnit, deleteUnit,
  fetchCategories, addCategory, deleteCategory,
  fetchSubscribers, addNotification, formatDuration,
} from '../lib/api.js'
import { uploadToCloudinary } from '../lib/cloudinary.js'
import './Admin.css'

const ADMIN_USER = import.meta.env.VITE_ADMIN_USERNAME || 'admin'
const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASSWORD || 'rcffuta2024'
const LEVELS = ['100', '200', '300', '400', '500', '600']

// ── Login ─────────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = () => {
    setLoading(true)
    setTimeout(() => {
      if (username.trim() === ADMIN_USER && password === ADMIN_PASS) {
        onLogin()
      } else {
        setError('Invalid credentials')
        setLoading(false)
      }
    }, 500)
  }

  return (
    <div className="admin-login grid-bg">
      <div className="admin-login__card">
        <div className="admin-login__icon"><LockIcon size={24} /></div>
        <h1 className="heading-md">Admin Access</h1>
        <p>RCF FUTA Internal Dashboard</p>
        <div className="admin-login__form">
          <div className="field">
            <label>Username</label>
            <input className="input" type="text" placeholder="Username" value={username}
              onChange={e => { setUsername(e.target.value); setError('') }}
              onKeyDown={e => e.key === 'Enter' && submit()} />
          </div>
          <div className="field">
            <label>Password</label>
            <div className="admin-login__pass-wrap">
              <input className="input" type={showPass ? 'text' : 'password'} placeholder="Password" value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                onKeyDown={e => e.key === 'Enter' && submit()} />
              <button type="button" onClick={() => setShowPass(s => !s)}>
                {showPass ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
              </button>
            </div>
          </div>
          {error && <p className="form-error">{error}</p>}
          <button className="btn btn--primary" onClick={submit} disabled={loading || !username || !password}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, accent }) {
  return (
    <div className={`admin-stat ${accent ? 'admin-stat--accent' : ''}`}>
      <span className="admin-stat__val">{value ?? '—'}</span>
      <span className="admin-stat__label">{label}</span>
    </div>
  )
}

// ── Add Recording Modal ───────────────────────────────────────────────────────
function AddRecordingModal({ categories, onClose, onAdded }) {
  const [form, setForm] = useState({ title: '', speaker: '', category_id: '', description: '', transcript: '' })
  const [audioFile, setAudioFile] = useState(null)
  const [audioProgress, setAudioProgress] = useState(0)
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [coverProgress, setCoverProgress] = useState(0)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [stage, setStage] = useState('') // 'cover' | 'audio' | 'saving'
  const audioRef = useRef()
  const coverRef = useRef()

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })) }

  const handleAudio = (e) => {
    const f = e.target.files[0]
    if (!f) return
    if (!f.type.startsWith('audio/')) { setErrors(e => ({ ...e, audio: 'Must be an audio file (MP3, WAV, M4A, etc.)' })); return }
    if (f.size > 200 * 1024 * 1024) { setErrors(e => ({ ...e, audio: 'Max audio size is 200MB' })); return }
    setAudioFile(f)
    setErrors(e => ({ ...e, audio: '' }))
  }

  const handleCover = (e) => {
    const f = e.target.files[0]
    if (!f) return
    if (!f.type.startsWith('image/')) { setErrors(e => ({ ...e, cover: 'Must be an image file' })); return }
    setCoverFile(f)
    setCoverPreview(URL.createObjectURL(f))
    setErrors(e => ({ ...e, cover: '' }))
  }

  const validate = () => {
    const e = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (!form.speaker.trim()) e.speaker = 'Speaker name is required'
    if (!form.category_id) e.category_id = 'Select a category'
    if (!audioFile) e.audio = 'Upload an audio file'
    return e
  }

  const handleSave = async () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    setSaving(true)
    try {
      let cover_url = null, audio_url = null, audio_public_id = null, duration_seconds = 0

      if (coverFile) {
        setStage('cover')
        const res = await uploadToCloudinary(coverFile, 'image', setCoverProgress)
        cover_url = res.url
      }

      setStage('audio')
      const audioRes = await uploadToCloudinary(audioFile, 'video', setAudioProgress)
      audio_url = audioRes.url
      audio_public_id = audioRes.public_id
      duration_seconds = Math.round(audioRes.duration || 0)

      setStage('saving')
      const rec = await addRecording({
        ...form,
        audio_url,
        audio_public_id,
        cover_url,
        duration_seconds,
        transcript: form.transcript || null,
      })

      await addNotification({
        title: `New recording: "${rec.title}" by ${rec.speaker}`,
        recording_id: rec.id,
      })

      onAdded()
      onClose()
    } catch (err) {
      setErrors({ submit: err.message || 'Upload failed. Check your Cloudinary settings.' })
    } finally {
      setSaving(false)
      setStage('')
    }
  }

  const stageLabel = {
    cover: `Uploading cover… ${coverProgress}%`,
    audio: `Uploading audio… ${audioProgress}%`,
    saving: 'Saving to database…',
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && !saving && onClose()}>
      <div className="modal modal--lg" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2>Add Recording</h2>
          {!saving && <button className="modal__close" onClick={onClose}><CancelIcon size={16} /></button>}
        </div>
        <p className="modal__subtitle">Students will be notified after you save.</p>

        <div className="modal__body">
          <div className="form-row">
            <div className="field">
              <label>Title *</label>
              <input className={`input ${errors.title ? 'error' : ''}`} placeholder="e.g. Prayer as a Lifestyle" value={form.title} onChange={e => set('title', e.target.value)} />
              {errors.title && <p className="form-error">{errors.title}</p>}
            </div>
            <div className="field">
              <label>Speaker *</label>
              <input className={`input ${errors.speaker ? 'error' : ''}`} placeholder="e.g. Bro. Emmanuel Adeyemi" value={form.speaker} onChange={e => set('speaker', e.target.value)} />
              {errors.speaker && <p className="form-error">{errors.speaker}</p>}
            </div>
          </div>

          <div className="field">
            <label>Category *</label>
            <div className="select-wrap">
              <select className={errors.category_id ? 'error' : ''} value={form.category_id} onChange={e => set('category_id', e.target.value)}>
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <span className="select-icon">▾</span>
            </div>
            {errors.category_id && <p className="form-error">{errors.category_id}</p>}
          </div>

          <div className="field">
            <label>Description</label>
            <textarea className="input" rows={2} placeholder="Brief description of the session…" value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          <div className="field">
            <label>Transcript (optional)</label>
            <textarea className="input" rows={4}
              placeholder={"Paste the transcript here.\nEach paragraph is shown as a separate block — one per line.\nListeners can follow along and click to jump to that part."}
              value={form.transcript} onChange={e => set('transcript', e.target.value)} />
            <p className="form-hint">Each line = one transcript block. Shown in the expanded player.</p>
          </div>

          {/* Audio upload */}
          <div className="field">
            <label>Audio File * (MP3, WAV, M4A, OGG)</label>
            <div
              className={`file-drop ${audioFile ? 'file-drop--selected' : ''} ${errors.audio ? 'file-drop--error' : ''}`}
              onClick={() => audioRef.current?.click()}
            >
              <UploadIcon size={20} />
              {audioFile
                ? <><span className="file-drop__name">{audioFile.name}</span><span className="file-drop__size">({(audioFile.size / 1024 / 1024).toFixed(1)} MB)</span></>
                : <><span>Click to select audio file</span><span className="file-drop__hint">Max 200MB · MP3 recommended</span></>
              }
              {saving && stage === 'audio' && (
                <div className="file-drop__progress"><div style={{ width: `${audioProgress}%` }} /></div>
              )}
            </div>
            <input type="file" ref={audioRef} accept="audio/*" onChange={handleAudio} style={{ display: 'none' }} />
            {errors.audio && <p className="form-error">{errors.audio}</p>}
          </div>

          {/* Cover upload */}
          <div className="field">
            <label>Cover Image (optional)</label>
            <div
              className={`file-drop ${coverFile ? 'file-drop--selected' : ''}`}
              onClick={() => coverRef.current?.click()}
            >
              {coverPreview
                ? <img src={coverPreview} alt="Cover preview" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 4 }} />
                : <UploadIcon size={20} />
              }
              {coverFile
                ? <><span className="file-drop__name">{coverFile.name}</span></>
                : <><span>Click to select cover image</span><span className="file-drop__hint">JPG, PNG, WebP · Max 5MB</span></>
              }
              {saving && stage === 'cover' && (
                <div className="file-drop__progress"><div style={{ width: `${coverProgress}%` }} /></div>
              )}
            </div>
            <input type="file" ref={coverRef} accept="image/*" onChange={handleCover} style={{ display: 'none' }} />
          </div>

          {errors.submit && <p className="form-error">{errors.submit}</p>}
          {saving && stage && <p className="admin-saving-label">{stageLabel[stage]}</p>}
        </div>

        <div className="modal__footer">
          {!saving && <button className="btn btn--outline" onClick={onClose}>Cancel</button>}
          <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? stageLabel[stage] || 'Working…' : 'Upload & Add Recording'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Admin ────────────────────────────────────────────────────────────────
export default function Admin() {
  const [loggedIn, setLoggedIn] = useState(() => sessionStorage.getItem('rcf_admin') === '1')
  const [tab, setTab] = useState('analytics')

  // Data
  const [analytics, setAnalytics] = useState(null)
  const [recordings, setRecordings] = useState([])
  const [students, setStudents] = useState([])
  const [units, setUnits] = useState([])
  const [categories, setCategories] = useState([])
  const [subscribers, setSubscribers] = useState([])
  const [loading, setLoading] = useState(false)

  // Modals
  const [showAddRec, setShowAddRec] = useState(false)
  const [newUnitName, setNewUnitName] = useState('')
  const [newCatName, setNewCatName] = useState('')
  const [editUnit, setEditUnit] = useState(null)

  const login = () => { sessionStorage.setItem('rcf_admin', '1'); setLoggedIn(true) }
  const logout = () => { sessionStorage.removeItem('rcf_admin'); setLoggedIn(false) }

  const load = async () => {
    setLoading(true)
    try {
      const [ana, recs, studs, u, cats, subs] = await Promise.all([
        fetchAnalytics(),
        fetchRecordings(),
        fetchAllStudents(),
        fetchUnits(),
        fetchCategories(),
        fetchSubscribers(),
      ])
      setAnalytics(ana)
      setRecordings(recs)
      setStudents(studs)
      setUnits(u)
      setCategories(cats)
      setSubscribers(subs)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (loggedIn) load() }, [loggedIn])

  if (!loggedIn) return <LoginScreen onLogin={login} />

  const pending = students.filter(s => !s.approved)
  const approved = students.filter(s => s.approved)

  const handleApprove = async (id) => {
    await approveStudent(id)
    setStudents(s => s.map(st => st.id === id ? { ...st, approved: true } : st))
    setAnalytics(a => a ? { ...a, pendingStudents: a.pendingStudents - 1, totalStudents: a.totalStudents + 1 } : a)
  }

  const handleDeleteStudent = async (id) => {
    if (!window.confirm('Remove this student?')) return
    await deleteStudent(id)
    setStudents(s => s.filter(st => st.id !== id))
  }

  const handleDeleteRecording = async (id) => {
    if (!window.confirm('Delete this recording? This cannot be undone.')) return
    await deleteRecording(id)
    setRecordings(r => r.filter(rec => rec.id !== id))
  }

  const handleAddUnit = async () => {
    if (!newUnitName.trim()) return
    try {
      const u = await addUnit(newUnitName)
      setUnits(prev => [...prev, u].sort((a, b) => a.name.localeCompare(b.name)))
      setNewUnitName('')
    } catch (err) {
      alert(err.message)
    }
  }

  const handleUpdateUnit = async (id, name) => {
    try {
      const u = await updateUnit(id, { name })
      setUnits(prev => prev.map(x => x.id === id ? u : x))
      setEditUnit(null)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDeleteUnit = async (id) => {
    if (!window.confirm('Delete this unit? Students assigned to it will lose their unit.')) return
    await deleteUnit(id)
    setUnits(prev => prev.filter(u => u.id !== id))
  }

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return
    try {
      const c = await addCategory(newCatName)
      setCategories(prev => [...prev, c].sort((a, b) => a.name.localeCompare(b.name)))
      setNewCatName('')
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category?')) return
    await deleteCategory(id)
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  const TABS = [
    { id: 'analytics', label: 'Analytics' },
    { id: 'recordings', label: `Recordings (${recordings.length})` },
    { id: 'students', label: `Students${pending.length ? ` (${pending.length} pending)` : ''}` },
    { id: 'units', label: 'Units & Categories' },
    { id: 'subscribers', label: `Subscribers (${subscribers.length})` },
  ]

  return (
    <main className="admin">
      <div className="admin__header">
        <div className="container">
          <div className="admin__header-row">
            <div>
              <div className="eyebrow">Admin</div>
              <h1 className="heading-md">RCF FUTA Dashboard</h1>
            </div>
            <button className="btn btn--outline btn--sm" onClick={logout}>
              <LogoutIcon size={15} /> Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="admin__tabs">
          {TABS.map(t => (
            <button key={t.id} className={`admin__tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="admin__loading">Loading…</div>
        ) : (
          <>
            {/* ── Analytics ─────────────────────────────────────────── */}
            {tab === 'analytics' && (
              <div className="admin__section">
                <div className="admin__stats">
                  <StatCard label="Students in Gallery" value={analytics?.totalStudents} accent />
                  <StatCard label="Plays This Week" value={analytics?.weeklyPlays} />
                  <StatCard label="All-Time Plays" value={analytics?.totalPlays} />
                  <StatCard label="Total Recordings" value={analytics?.totalRecordings} />
                  <StatCard label="Email Subscribers" value={analytics?.subscribers} />
                  <StatCard label="Pending Approvals" value={analytics?.pendingStudents} accent={analytics?.pendingStudents > 0} />
                </div>
              </div>
            )}

            {/* ── Recordings ────────────────────────────────────────── */}
            {tab === 'recordings' && (
              <div className="admin__section">
                <div className="admin__section-top">
                  <h2 className="admin__section-title">Recordings</h2>
                  <button className="btn btn--primary btn--sm" onClick={() => setShowAddRec(true)}>
                    <AddIcon size={15} /> Add Recording
                  </button>
                </div>
                {recordings.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state__icon"><MusicNoteIcon size={22} /></div>
                    <p>No recordings yet</p>
                    <span>Add your first recording to get started</span>
                  </div>
                ) : (
                  <div className="admin__rec-list">
                    {recordings.map(r => (
                      <div key={r.id} className="admin__rec-row">
                        <div className="admin__rec-art">
                          {r.cover_url ? <img src={r.cover_url} alt="" /> : <span>{r.speaker?.split(' ').pop()?.[0] || 'R'}</span>}
                        </div>
                        <div className="admin__rec-info">
                          <p className="admin__rec-title">{r.title}</p>
                          <span className="admin__rec-meta">
                            {r.speaker} · {r.categories?.name} · {formatDuration(r.duration_seconds)} · {(r.play_count || 0).toLocaleString()} plays · {new Date(r.created_at).toLocaleDateString('en-GB')}
                          </span>
                        </div>
                        <span className={`tag ${r.audio_url ? 'tag--green' : 'tag--ghost'}`}>
                          {r.audio_url ? 'Live' : 'No Audio'}
                        </span>
                        <button className="admin__icon-btn admin__icon-btn--danger" onClick={() => handleDeleteRecording(r.id)}>
                          <DeleteIcon size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Students ──────────────────────────────────────────── */}
            {tab === 'students' && (
              <div className="admin__section">
                {/* Pending */}
                <div className="admin__section-top" style={{ marginBottom: 12 }}>
                  <h2 className="admin__section-title">Pending Approvals ({pending.length})</h2>
                </div>
                {pending.length === 0 ? (
                  <div className="admin__empty-small">
                    <CheckCircleIcon size={18} /> All caught up — no pending approvals
                  </div>
                ) : (
                  <div className="admin__student-list">
                    {pending.map(s => (
                      <StudentRow key={s.id} student={s} isPending
                        onApprove={() => handleApprove(s.id)}
                        onDelete={() => handleDeleteStudent(s.id)}
                      />
                    ))}
                  </div>
                )}

                <div className="admin__section-top" style={{ marginTop: 32, marginBottom: 12 }}>
                  <h2 className="admin__section-title">Approved ({approved.length})</h2>
                </div>
                {approved.length === 0 ? (
                  <div className="admin__empty-small">No approved students yet</div>
                ) : (
                  <div className="admin__student-list">
                    {approved.map(s => (
                      <StudentRow key={s.id} student={s}
                        onDelete={() => handleDeleteStudent(s.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Units & Categories ────────────────────────────────── */}
            {tab === 'units' && (
              <div className="admin__section">
                <div className="admin__two-col">
                  {/* Units */}
                  <div className="admin__list-card">
                    <div className="admin__section-top">
                      <h2 className="admin__section-title">Ministry Units</h2>
                    </div>
                    <div className="admin__add-row">
                      <input className="input" placeholder="New unit name…" value={newUnitName}
                        onChange={e => setNewUnitName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddUnit()} />
                      <button className="btn btn--primary btn--sm" onClick={handleAddUnit} disabled={!newUnitName.trim()}>
                        <AddIcon size={14} /> Add
                      </button>
                    </div>
                    <div className="admin__item-list">
                      {units.map(u => (
                        <div key={u.id} className="admin__item-row">
                          {editUnit === u.id
                            ? <EditUnitInline unit={u} onSave={name => handleUpdateUnit(u.id, name)} onCancel={() => setEditUnit(null)} />
                            : <>
                                <span className="admin__item-name">{u.name}</span>
                                <div className="admin__item-actions">
                                  <button className="admin__icon-btn" onClick={() => setEditUnit(u.id)}><EditIcon size={14} /></button>
                                  <button className="admin__icon-btn admin__icon-btn--danger" onClick={() => handleDeleteUnit(u.id)}><DeleteIcon size={14} /></button>
                                </div>
                              </>
                          }
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Categories */}
                  <div className="admin__list-card">
                    <div className="admin__section-top">
                      <h2 className="admin__section-title">Recording Categories</h2>
                    </div>
                    <div className="admin__add-row">
                      <input className="input" placeholder="New category name…" value={newCatName}
                        onChange={e => setNewCatName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAddCategory()} />
                      <button className="btn btn--primary btn--sm" onClick={handleAddCategory} disabled={!newCatName.trim()}>
                        <AddIcon size={14} /> Add
                      </button>
                    </div>
                    <div className="admin__item-list">
                      {categories.map(c => (
                        <div key={c.id} className="admin__item-row">
                          <span className="admin__item-name">{c.name}</span>
                          <button className="admin__icon-btn admin__icon-btn--danger" onClick={() => handleDeleteCategory(c.id)}>
                            <DeleteIcon size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Subscribers ───────────────────────────────────────── */}
            {tab === 'subscribers' && (
              <div className="admin__section">
                <div className="admin__section-top">
                  <h2 className="admin__section-title">Email Subscribers ({subscribers.length})</h2>
                </div>
                {subscribers.length === 0 ? (
                  <div className="admin__empty-small">No subscribers yet</div>
                ) : (
                  <div className="admin__email-grid">
                    {subscribers.map(s => (
                      <span key={s.id} className="admin__email-chip">{s.email}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div style={{ height: 80 }} />

      {showAddRec && (
        <AddRecordingModal
          categories={categories}
          onClose={() => setShowAddRec(false)}
          onAdded={load}
        />
      )}
    </main>
  )
}

// ── Student row ───────────────────────────────────────────────────────────────
function StudentRow({ student, isPending, onApprove, onDelete }) {
  const initials = student.name.split(' ').slice(0, 2).map(w => w[0]).join('')
  return (
    <div className={`admin__student-row ${isPending ? 'admin__student-row--pending' : ''}`}>
      <div className="admin__student-avatar">
        {student.image_url ? <img src={student.image_url} alt={student.name} /> : <span>{initials}</span>}
      </div>
      <div className="admin__student-info">
        <p className="admin__student-name">{student.name}</p>
        <span>{student.department} · {student.level}L · {student.units?.name || 'No unit'}</span>
        {student.hobbies && <span className="admin__student-hobbies">{student.hobbies}</span>}
      </div>
      <span className="admin__student-date">{new Date(student.created_at).toLocaleDateString('en-GB')}</span>
      <div className="admin__student-actions">
        {isPending && (
          <button className="admin__icon-btn admin__icon-btn--approve" onClick={onApprove} title="Approve">
            <CheckCircleIcon size={18} />
          </button>
        )}
        <button className="admin__icon-btn admin__icon-btn--danger" onClick={onDelete} title="Remove">
          <DeleteIcon size={16} />
        </button>
      </div>
    </div>
  )
}

// ── Inline unit edit ──────────────────────────────────────────────────────────
function EditUnitInline({ unit, onSave, onCancel }) {
  const [val, setVal] = useState(unit.name)
  return (
    <div className="admin__edit-inline">
      <input className="input" value={val} onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onSave(val); if (e.key === 'Escape') onCancel() }}
        autoFocus />
      <button className="admin__icon-btn admin__icon-btn--approve" onClick={() => onSave(val)}><CheckCircleIcon size={14} /></button>
      <button className="admin__icon-btn" onClick={onCancel}><CancelIcon size={14} /></button>
    </div>
  )
}
