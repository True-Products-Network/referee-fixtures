export interface ParsedFixture {
  uid: string
  summary: string
  description?: string
  start: Date
  end: Date
  location?: string
  status?: string
  raw: string
}

function parseDateTime(value: string, tzid?: string): Date {
  // Handle VALUE=DATE:20250915
  const dateMatch = value.match(/VALUE=DATE:(\d{8})/)
  if (dateMatch) {
    const y = dateMatch[1].slice(0, 4)
    const m = dateMatch[1].slice(4, 6)
    const d = dateMatch[1].slice(6, 8)
    return new Date(`${y}-${m}-${d}T00:00:00`)
  }

  // Handle TZID=America/Chicago:20260913T090000
  const tzMatch = value.match(/TZID=([^:]+):(\d{8}T\d{6})/)
  if (tzMatch) {
    return new Date(tzMatch[2].slice(0, 4) + '-' + tzMatch[2].slice(4, 6) + '-' + tzMatch[2].slice(6, 8) + 'T' + tzMatch[2].slice(9, 11) + ':' + tzMatch[2].slice(11, 13) + ':' + tzMatch[2].slice(13, 15))
  }

  // Handle UTC 20250915T190000Z
  if (value.endsWith('Z')) {
    return new Date(value.slice(0, 4) + '-' + value.slice(4, 6) + '-' + value.slice(6, 8) + 'T' + value.slice(9, 11) + ':' + value.slice(11, 13) + ':' + value.slice(13, 15) + 'Z')
  }

  // Handle plain 20250915T190000
  if (/^\d{8}T\d{6}$/.test(value)) {
    return new Date(value.slice(0, 4) + '-' + value.slice(4, 6) + '-' + value.slice(6, 8) + 'T' + value.slice(9, 11) + ':' + value.slice(11, 13) + ':' + value.slice(13, 15))
  }

  return new Date(value)
}

export function parseICS(icsData: string): ParsedFixture[] {
  const fixtures: ParsedFixture[] = []
  const events = icsData.split('BEGIN:VEVENT')

  for (let i = 1; i < events.length; i++) {
    const event = events[i]
    const lines = event.split('\n').map(l => l.trim().replace(/\r/g, ''))

    let uid = ''
    let summary = ''
    let description = ''
    let start = ''
    let end = ''
    let location = ''
    let status = ''

    for (const line of lines) {
      if (line.startsWith('UID:')) uid = line.slice(4)
      else if (line.startsWith('SUMMARY:')) summary = line.slice(8)
      else if (line.startsWith('DESCRIPTION:')) description = line.slice(12)
      else if (line.startsWith('DTSTART')) start = line.split(':').slice(1).join(':')
      else if (line.startsWith('DTEND')) end = line.split(':').slice(1).join(':')
      else if (line.startsWith('LOCATION:')) location = line.slice(9)
      else if (line.startsWith('STATUS:')) status = line.slice(7)
    }

    if (uid && start) {
      fixtures.push({
        uid,
        summary,
        description,
        start: parseDateTime(start),
        end: end ? parseDateTime(end) : parseDateTime(start),
        location,
        status,
        raw: event,
      })
    }
  }

  return fixtures
}

export function webcalToHttps(url: string): string {
  return url.replace(/^webcal:\/\//, 'https://')
}
