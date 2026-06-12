import { invokeEmailAlert } from './api.js'

export async function notifyRecordingDrop(recording) {
  return invokeEmailAlert({
    type: 'recording_drop',
    recording: {
      id: recording.id,
      title: recording.title,
      speaker: recording.speaker,
    },
  })
}

export async function notifyGalleryApproval(student) {
  return invokeEmailAlert({
    type: 'gallery_approved',
    student: {
      id: student.id,
      name: student.name,
      email: student.email,
      unit: student.units?.name || student.unit_name || '',
    },
  })
}