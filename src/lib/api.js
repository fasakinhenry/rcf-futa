import { supabase } from './supabase.js'

// ── Recordings ────────────────────────────────────────────────────────────────

export async function fetchRecordings({ search = '', categoryId = '', sort = 'newest' } = {}) {
  let query = supabase
    .from('recordings')
    .select('*, categories(id, name)')

  if (search) {
    query = query.or(`title.ilike.%${search}%,speaker.ilike.%${search}%,description.ilike.%${search}%`)
  }
  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  switch (sort) {
    case 'oldest': query = query.order('created_at', { ascending: true }); break
    case 'popular': query = query.order('play_count', { ascending: false }); break
    case 'newest': default: query = query.order('created_at', { ascending: false }); break
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function fetchRecordingById(id) {
  const { data, error } = await supabase
    .from('recordings')
    .select('*, categories(id, name)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function addRecording(recording) {
  const { data, error } = await supabase
    .from('recordings')
    .insert(recording)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateRecording(id, updates) {
  const { data, error } = await supabase
    .from('recordings')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteRecording(id) {
  const { error } = await supabase.from('recordings').delete().eq('id', id)
  if (error) throw error
}

export async function logPlay(recordingId) {
  const { error } = await supabase
    .from('play_events')
    .insert({ recording_id: recordingId })
  if (error) console.warn('Failed to log play:', error.message)
}

// ── Students ──────────────────────────────────────────────────────────────────

export async function fetchApprovedStudents({ search = '', unitId = '', level = '' } = {}) {
  let query = supabase
    .from('students')
    .select('*, units(id, name)')
    .eq('approved', true)
    .order('created_at', { ascending: false })

  if (search) {
    query = query.or(`name.ilike.%${search}%,department.ilike.%${search}%,hobbies.ilike.%${search}%`)
  }
  if (unitId) query = query.eq('unit_id', unitId)
  if (level) query = query.eq('level', level)

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function fetchPendingStudents() {
  const { data, error } = await supabase
    .from('students')
    .select('*, units(id, name)')
    .eq('approved', false)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function fetchAllStudents() {
  const { data, error } = await supabase
    .from('students')
    .select('*, units(id, name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function submitStudent(student) {
  const { data, error } = await supabase
    .from('students')
    .insert({ ...student, approved: false })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function approveStudent(id) {
  const { error } = await supabase.from('students').update({ approved: true }).eq('id', id)
  if (error) throw error
}

export async function deleteStudent(id) {
  const { error } = await supabase.from('students').delete().eq('id', id)
  if (error) throw error
}

// ── Units ─────────────────────────────────────────────────────────────────────

export async function fetchUnits() {
  const { data, error } = await supabase.from('units').select('*').order('name')
  if (error) throw error
  return data || []
}

export async function addUnit(name, description = '') {
  const { data, error } = await supabase
    .from('units')
    .insert({ name: name.trim(), description })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateUnit(id, updates) {
  const { data, error } = await supabase
    .from('units')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteUnit(id) {
  const { error } = await supabase.from('units').delete().eq('id', id)
  if (error) throw error
}

// ── Categories ────────────────────────────────────────────────────────────────

export async function fetchCategories() {
  const { data, error } = await supabase.from('categories').select('*').order('name')
  if (error) throw error
  return data || []
}

export async function addCategory(name) {
  const { data, error } = await supabase
    .from('categories')
    .insert({ name: name.trim() })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCategory(id) {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

// ── Subscribers ───────────────────────────────────────────────────────────────

export async function subscribeEmail(email) {
  const { data, error } = await supabase
    .from('subscribers')
    .upsert(
      { email: email.toLowerCase().trim() },
      {
        onConflict: 'email',
        ignoreDuplicates: true
      }
    )

  if (error) throw error

  return data
}

export async function fetchSubscribers() {
  const { data, error } = await supabase
    .from('subscribers')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

// ── Notifications ─────────────────────────────────────────────────────────────

export async function addNotification(notif) {
  const { error } = await supabase.from('notifications').insert(notif)
  if (error) throw error
}

export async function invokeEmailAlert(payload) {
  const { data, error } = await supabase.functions.invoke('send-email-alerts', {
    body: payload,
  })

  if (error) throw error
  return data
}

export async function fetchNotifications() {
  const { data, error } = await supabase
    .from('notifications')
    .select('*, recordings(title)')
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) throw error
  return data || []
}

// ── Analytics ─────────────────────────────────────────────────────────────────

export async function fetchAnalytics() {
  const now = new Date()
  const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalStudents },
    { count: totalRecordings },
    { count: weeklyPlays },
    { count: totalPlays },
    { count: subscribers },
    { count: pendingStudents },
  ] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('approved', true),
    supabase.from('recordings').select('*', { count: 'exact', head: true }),
    supabase.from('play_events').select('*', { count: 'exact', head: true }).gte('played_at', weekAgo),
    supabase.from('play_events').select('*', { count: 'exact', head: true }),
    supabase.from('subscribers').select('*', { count: 'exact', head: true }),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('approved', false),
  ])

  return { totalStudents, totalRecordings, weeklyPlays, totalPlays, subscribers, pendingStudents }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function formatDuration(seconds) {
  if (!seconds) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export const LEVELS = ['100', '200', '300', '400', '500', '600']
