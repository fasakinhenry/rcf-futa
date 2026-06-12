import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'

type AlertPayload =
  | {
      type: 'recording_drop'
      recording: {
        id: string
        title: string
        speaker: string
      }
    }
  | {
      type: 'gallery_approved'
      student: {
        id: string
        name: string
        email?: string | null
        unit?: string
      }
    }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')
const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const resendApiKey = Deno.env.get('RESEND_API_KEY')
const resendFromEmail = Deno.env.get('RESEND_FROM_EMAIL')
const siteUrl = Deno.env.get('SITE_URL') || 'https://rcf-futa.vercel.app'

if (!supabaseUrl || !serviceRoleKey || !resendApiKey || !resendFromEmail) {
  console.error('Missing Supabase or Resend secrets for send-email-alerts')
}

const supabase = createClient(supabaseUrl ?? '', serviceRoleKey ?? '')

async function sendResendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string[]
  subject: string
  html: string
  text: string
}) {
  if (!to.length) return { skipped: true, sent: 0 }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: resendFromEmail,
      to,
      subject,
      html,
      text,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Resend request failed (${response.status}): ${body}`)
  }

  return await response.json()
}

function recordingMessage(recording: NonNullable<Extract<AlertPayload, { type: 'recording_drop' }>['recording']>) {
  const playlistUrl = `${siteUrl}/playlist`
  const subject = `New playlist drop: ${recording.title}`
  const text = [
    'A new RCF FUTA playlist has been dropped.',
    '',
    `Title: ${recording.title}`,
    `Speaker: ${recording.speaker}`,
    '',
    `Listen now: ${playlistUrl}`,
  ].join('\n')

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.6;">
      <p style="margin: 0 0 12px;">A new RCF FUTA playlist has been dropped.</p>
      <div style="border: 2px solid #0d0d0d; padding: 16px; background: #f7f7f7; margin: 0 0 16px;">
        <p style="margin: 0 0 8px;"><strong>Title:</strong> ${recording.title}</p>
        <p style="margin: 0;"><strong>Speaker:</strong> ${recording.speaker}</p>
      </div>
      <a href="${playlistUrl}" style="display: inline-block; background: #1a5c38; color: #fff; text-decoration: none; padding: 12px 18px; border: 2px solid #0d0d0d;">Listen in the playlist</a>
    </div>
  `

  return { subject, text, html }
}

function approvalMessage(student: NonNullable<Extract<AlertPayload, { type: 'gallery_approved' }>['student']>) {
  const galleryUrl = `${siteUrl}/gallery`
  const subject = 'Your gallery request was approved'
  const text = [
    `Hi ${student.name},`,
    '',
    'Your request to be added to the RCF FUTA gallery has been approved.',
    student.unit ? `Unit: ${student.unit}` : null,
    '',
    `View the gallery: ${galleryUrl}`,
  ].filter(Boolean).join('\n')

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111; line-height: 1.6;">
      <p style="margin: 0 0 12px;">Hi ${student.name},</p>
      <p style="margin: 0 0 12px;">Your request to be added to the RCF FUTA gallery has been approved.</p>
      ${student.unit ? `<p style="margin: 0 0 16px;"><strong>Unit:</strong> ${student.unit}</p>` : ''}
      <a href="${galleryUrl}" style="display: inline-block; background: #1a5c38; color: #fff; text-decoration: none; padding: 12px 18px; border: 2px solid #0d0d0d;">Open the gallery</a>
    </div>
  `

  return { subject, text, html }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const payload = (await req.json()) as AlertPayload

    if (payload.type === 'recording_drop') {
      const { data, error } = await supabase.from('subscribers').select('email')
      if (error) throw error

      const recipients = (data || [])
        .map((row) => row.email)
        .filter((email): email is string => Boolean(email))
      const message = recordingMessage(payload.recording)
      const result = await sendResendEmail({
        to: recipients,
        ...message,
      })

      return new Response(JSON.stringify({ ok: true, sent: recipients.length, result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (payload.type === 'gallery_approved') {
      if (!payload.student.email) {
        return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'missing-email' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const message = approvalMessage(payload.student)
      const result = await sendResendEmail({
        to: [payload.student.email],
        ...message,
      })

      return new Response(JSON.stringify({ ok: true, sent: 1, result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ ok: false, error: 'Unsupported alert type' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})