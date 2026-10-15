// Lightweight Google Calendar API client
// Avoids importing the full googleapis package (243MB)

const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3'

interface GoogleTokens {
  access_token: string
  refresh_token?: string | null
  expiry_date?: string | null
}

interface CalendarEvent {
  id?: string
  summary: string
  description?: string
  location?: string
  start: { dateTime: string; timeZone: string }
  end: { dateTime: string; timeZone: string }
  reminders?: {
    useDefault: boolean
    overrides: Array<{ method: string; minutes: number }>
  }
}

async function refreshAccessToken(refreshToken: string): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!res.ok) {
    throw new Error('Failed to refresh token')
  }

  const data = await res.json()
  return data.access_token
}

async function getValidAccessToken(tokens: GoogleTokens): Promise<string> {
  // Check if token is expired
  if (tokens.expiry_date && new Date(tokens.expiry_date) < new Date()) {
    if (!tokens.refresh_token) {
      throw new Error('Token expired and no refresh token available')
    }
    return refreshAccessToken(tokens.refresh_token)
  }
  return tokens.access_token
}

export async function listCalendars(tokens: GoogleTokens) {
  const accessToken = await getValidAccessToken(tokens)

  const res = await fetch(`${CALENDAR_API_BASE}/users/me/calendarList`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    throw new Error(`Calendar API error: ${res.status}`)
  }

  return res.json()
}

export async function createEvent(tokens: GoogleTokens, calendarId: string, event: CalendarEvent) {
  const accessToken = await getValidAccessToken(tokens)

  const res = await fetch(`${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  })

  if (!res.ok) {
    throw new Error(`Calendar API error: ${res.status}`)
  }

  return res.json()
}

export async function updateEvent(tokens: GoogleTokens, calendarId: string, eventId: string, event: Partial<CalendarEvent>) {
  const accessToken = await getValidAccessToken(tokens)

  const res = await fetch(`${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  })

  if (!res.ok) {
    throw new Error(`Calendar API error: ${res.status}`)
  }

  return res.json()
}

export async function deleteEvent(tokens: GoogleTokens, calendarId: string, eventId: string) {
  const accessToken = await getValidAccessToken(tokens)

  const res = await fetch(`${CALENDAR_API_BASE}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) {
    throw new Error(`Calendar API error: ${res.status}`)
  }
}

export function generateAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar.events',
    access_type: 'offline',
    prompt: 'consent',
    state,
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export async function exchangeCodeForTokens(code: string, redirectUri: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!res.ok) {
    throw new Error('Token exchange failed')
  }

  return res.json()
}
