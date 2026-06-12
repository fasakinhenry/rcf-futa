# RCF FUTA — Workers in Training

Official website for the Redeemed Christian Fellowship Workers in Training (WIT) program at the Federal University of Technology, Akure (FUTA).

---

## Stack

| Layer        | Technology                      |
| ------------ | ------------------------------- |
| Frontend     | React 18 + Vite                 |
| Routing      | React Router v6                 |
| Database     | Supabase (PostgreSQL)           |
| File storage | Cloudinary                      |
| Icons        | HugeIcons                       |
| Fonts        | Oswald (headers) + Geist (body) |
| Deployment   | Vercel (frontend)               |

---

## Pages

| Route       | Description                                                    |
| ----------- | -------------------------------------------------------------- |
| `/`         | Home — program overview, CTA                                   |
| `/gallery`  | Student gallery — search, filter by unit/level, submit profile |
| `/playlist` | Class recordings — Spotify-style player, search, filter, sort  |
| `/admin`    | Admin dashboard — protected by env credentials                 |

---

## Features

**Playlist / Audio Player**

- Full Spotify-style player: play/pause, seek, skip ±15s, prev/next, playback speed (1×–2×), volume
- Expandable panel with artwork, description, transcript (if provided), and queue view
- EQ animation bars when playing
- Auto-advances to next track in queue
- Real play count tracking — logs after 10 seconds of listening
- All play data stored in Supabase

**Gallery**

- Students submit profiles with photo, name, department, level, unit, hobbies
- Photos uploaded directly to Cloudinary (with upload progress bar)
- Profiles require admin approval before appearing
- Search by name, department, hobbies; filter by unit and level

**Notifications**

- Bell icon in navbar shows unread count
- Visitors enter their email to subscribe
- When admin adds a recording, a notification is queued automatically
- Resend emails notify subscribers when a new playlist drops and notify students when their gallery request is approved
- Emails stored in Supabase `subscribers` table

**Admin Dashboard** (`/admin`)

- Protected login (username + password from env)
- Analytics: students, weekly plays, all-time plays, recordings count, subscribers, pending approvals
- Add recordings: upload audio file + cover image to Cloudinary, auto-detects duration
- Transcript support: paste transcript — shown in expanded player with real-time sync
- Approve / reject student gallery submissions
- Manage ministry units (add, rename, delete)
- Manage recording categories (add, delete)
- View email subscriber list

---

## Setup

### 1. Clone and install

```bash
unzip rcf-futa.zip
cd rcf-futa
npm install
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor → New Query**
3. Paste the contents of `supabase-schema.sql` and run it
4. Go to **Project Settings → API** and copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`

### 3. Set up Cloudinary

1. Create a free account at [cloudinary.com](https://cloudinary.com) (25GB free)
2. From your dashboard, copy the **Cloud Name** → `VITE_CLOUDINARY_CLOUD_NAME`
3. Go to **Settings → Upload → Upload presets**
4. Click **Add upload preset**, set signing mode to **Unsigned**, save
5. Copy the preset name → `VITE_CLOUDINARY_UPLOAD_PRESET`

### 4. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=rcf_futa_unsigned
VITE_ADMIN_USERNAME=admin
VITE_ADMIN_PASSWORD=your_secure_password
VITE_SITE_URL=https://rcf-futa.vercel.app

# Used by the Supabase Edge Function that sends emails through Resend
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=RCF FUTA <updates@yourdomain.com>
SITE_URL=https://rcf-futa.vercel.app
```

### 5. Run locally

```bash
npm run dev
```

### 6. Deploy to Vercel

1. Push the project to a GitHub repository
2. Import into [vercel.com](https://vercel.com)
3. In Vercel project settings → **Environment Variables**, add all the variables from your `.env`
4. Deploy

---

## Adding Recordings (Admin)

1. Navigate to `/admin` on your deployed site
2. Sign in with your credentials
3. Go to **Recordings → Add Recording**
4. Fill in title, speaker, category, and optional description/transcript
5. Upload the audio file (MP3 recommended, max 200MB)
6. Optionally upload a cover image
7. Click **Upload & Add Recording**
   - Audio is uploaded to Cloudinary (duration auto-detected)
   - Recording is saved to Supabase
   - A notification is pushed to all subscribers
   - An email alert is sent to every subscribed address through Resend

---

## Transcript Format

In the admin "Add Recording" form, paste the transcript in the **Transcript** field.

- Each **line** = one block shown in the player
- Blocks are highlighted in sync with playback (every 30 seconds)
- Listeners can **click a block** to jump to that timestamp

Example:

```
Welcome to this session on prayer as a lifestyle.
Today we'll be looking at three key principles from the life of Daniel.
The first principle is consistency — Daniel prayed three times a day regardless of circumstances.
...
```

---

## Database Schema

```
recordings      — title, speaker, category, audio URL, duration, play count, transcript
play_events     — one row per confirmed play (after 10s), triggers play_count increment
students        — name, dept, level, unit, image, approved flag
units           — ministry units (editable from admin)
categories      — recording categories (editable from admin)
subscribers     — email addresses
notifications   — new recording alerts
```

---

## Environment Variables Reference

| Variable                        | Description                                          |
| ------------------------------- | ---------------------------------------------------- |
| `VITE_SUPABASE_URL`             | Your Supabase project URL                            |
| `VITE_SUPABASE_ANON_KEY`        | Supabase anonymous/public key                        |
| `VITE_CLOUDINARY_CLOUD_NAME`    | Cloudinary cloud name                                |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | Cloudinary unsigned upload preset name               |
| `VITE_ADMIN_USERNAME`           | Admin dashboard username                             |
| `VITE_ADMIN_PASSWORD`           | Admin dashboard password                             |
| `VITE_SITE_URL`                 | Deployed site URL (used in notification links)       |
| `SUPABASE_URL`                  | Supabase project URL used by the email edge function |
| `SUPABASE_SERVICE_ROLE_KEY`     | Service-role key used by the email edge function     |
| `RESEND_API_KEY`                | Resend API key for sending emails                    |
| `RESEND_FROM_EMAIL`             | Verified sender address for Resend                   |
| `SITE_URL`                      | Public site URL used by the email edge function      |
