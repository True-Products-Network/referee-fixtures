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
    const dtStr = tzMatch[2].slice(0, 4) + '-' + tzMatch[2].slice(4, 6) + '-' + tzMatch[2].slice(6, 8) + 'T' + tzMatch[2].slice(9, 11) + ':' + tzMatch[2].slice(11, 13) + ':' + tzMatch[2].slice(13, 15)
    return new Date(dtStr)
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

// Unfold iCal lines per RFC 5545
// Lines starting with space/tab are continuations of the previous line
function unfoldLines(icsData: string): string[] {
  const rawLines = icsData.split(/\r?\n/)
  const lines: string[] = []

  for (const rawLine of rawLines) {
    if (rawLine.length === 0) continue
    if (rawLine.startsWith(' ') || rawLine.startsWith('\t')) {
      // Continuation of previous line
      if (lines.length > 0) {
        lines[lines.length - 1] += rawLine.slice(1)
      }
    } else {
      lines.push(rawLine)
    }
  }

  return lines
}

export function parseICS(icsData: string): ParsedFixture[] {
  const fixtures: ParsedFixture[] = []
  const lines = unfoldLines(icsData)

  let inEvent = false
  let uid = ''
  let summary = ''
  let description = ''
  let start = ''
  let startTzid = ''
  let end = ''
  let endTzid = ''
  let location = ''
  let status = ''
  let rawEvent = ''

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true
      uid = ''
      summary = ''
      description = ''
      start = ''
      startTzid = ''
      end = ''
      endTzid = ''
      location = ''
      status = ''
      rawEvent = line + '\n'
      continue
    }

    if (line === 'END:VEVENT') {
      inEvent = false
      rawEvent += line + '\n'

      if (uid && start) {
        fixtures.push({
          uid,
          summary,
          description,
          start: parseDateTime(start, startTzid),
          end: end ? parseDateTime(end, endTzid) : parseDateTime(start, startTzid),
          location,
          status,
          raw: rawEvent,
        })
      }
      continue
    }

    if (inEvent) {
      rawEvent += line + '\n'

      if (line.startsWith('UID:')) {
        uid = line.slice(4)
      } else if (line.startsWith('SUMMARY:')) {
        summary = line.slice(8)
      } else if (line.startsWith('DESCRIPTION:')) {
        description = line.slice(12)
      } else if (line.startsWith('DTSTART')) {
        // Handle DTSTART;TZID=America/Chicago:20260913T090000
        // or DTSTART:20250915T190000Z
        const colonIdx = line.indexOf(':')
        if (colonIdx !== -1) {
          const params = line.slice(0, colonIdx)
          start = line.slice(colonIdx + 1)
          const tzMatch = params.match(/TZID=([^;]+)/)
          if (tzMatch) startTzid = tzMatch[1]
        }
      } else if (line.startsWith('DTEND')) {
        const colonIdx = line.indexOf(':')
        if (colonIdx !== -1) {
          const params = line.slice(0, colonIdx)
          end = line.slice(colonIdx + 1)
          const tzMatch = params.match(/TZID=([^;]+)/)
          if (tzMatch) endTzid = tzMatch[1]
        }
      } else if (line.startsWith('LOCATION:')) {
        location = line.slice(9)
      } else if (line.startsWith('STATUS:')) {
        status = line.slice(7)
      }
    }
  }

  return fixtures
}

export function webcalToHttps(url: string): string {
  return url.replace(/^webcal:\/\//, 'https://')
}

// Extract teams from fixture data based on source patterns
export function extractTeams(summary: string, description: string, location?: string): { homeTeam: string; awayTeam: string; competition?: string } {
  // Pattern 1: Vieira/RQ+ style - "Southwest Baptist at Maryville (MO) (12:00PM CDT)"
  // The description contains "Team A at Team B (time)"
  const atMatch = description.match(/^(.+?)\s+at\s+(.+?)\s*\(/)
  if (atMatch) {
    return {
      homeTeam: atMatch[2].trim(),
      awayTeam: atMatch[1].trim(),
    }
  }

  // Pattern 2: "Team A vs Team B" or "Team A v Team B" in summary
  const vsMatch = summary.match(/^(.+?)\s+(?:vs?|VS?|Vs)\s+(.+)$/i)
  if (vsMatch) {
    return {
      homeTeam: vsMatch[1].trim(),
      awayTeam: vsMatch[2].trim(),
    }
  }

  // Pattern 3: Eventlink style - "Soccer (Boys V) - John Burroughs High School"
  // Venue/location is the home team, summary after dash is away team
  const eventlinkMatch = summary.match(/-\s+(.+)$/)
  if (eventlinkMatch) {
    return {
      homeTeam: location || 'Home Team',
      awayTeam: eventlinkMatch[1].trim(),
    }
  }

  // Pattern 4: Assignr style - "U14 Boys" or "U13 AD" - no teams, just age group
  const assignrMatch = summary.match(/^(U\d+\s+\w+)/)
  if (assignrMatch) {
    return {
      homeTeam: summary.trim(),
      awayTeam: '',
    }
  }

  // Pattern 5: Arbiter style - often has game info in summary like "Boys Varsity Soccer"
  // and teams in description. Try to find "vs" or "at" in description
  const descVsMatch = description.match(/^(.+?)\s+(?:vs?|VS?|Vs|@)\s+(.+?)$/mi)
  if (descVsMatch) {
    return {
      homeTeam: descVsMatch[1].trim(),
      awayTeam: descVsMatch[2].trim(),
    }
  }

  // Fallback: use summary as home team
  return {
    homeTeam: summary.trim() || 'Unknown',
    awayTeam: '',
  }
}

// Extract role from fixture data
export function extractRole(summary: string, description: string): string {
  // Check summary for role abbreviations
  const upperSummary = summary.toUpperCase()

  // Assignr: "U13 AD" = Assistant Referee, "U14 CR" = Center Referee
  if (/\bAD\b/.test(upperSummary)) return 'assistant_referee'
  if (/\bAR\b/.test(upperSummary)) return 'assistant_referee'
  if (/\bCR\b/.test(upperSummary)) return 'center_referee'
  if (/\b4TH\b/.test(upperSummary)) return 'fourth_official'
  if (/\b4TH\b/.test(upperSummary)) return 'fourth_official'

  // Check description for role mentions
  const upperDesc = description.toUpperCase()
  if (upperDesc.includes('CENTER REFEREE') || upperDesc.includes('CR ')) return 'center_referee'
  if (upperDesc.includes('ASSISTANT REFEREE') || upperDesc.includes('AR ')) return 'assistant_referee'
  if (upperDesc.includes('FOURTH OFFICIAL')) return 'fourth_official'

  // Arbiter often puts role in description like "Referee" or "Assistant Referee"
  if (upperDesc.includes('ASSISTANT REFEREE')) return 'assistant_referee'
  if (upperDesc.includes('REFEREE')) return 'referee'

  // Default
  return 'referee'
}

// Extract competition from summary
export function extractCompetition(summary: string): string | null {
  // Vieira: "Game for Vieira Collegiate Assigning - Men's Great Lakes Valley Con"
  const vieiraMatch = summary.match(/-\s*(.+?)(?:\s*-|\s*\(|$)/)
  if (vieiraMatch) {
    return vieiraMatch[1].trim()
  }

  // Eventlink: "Soccer (Boys V) - John Burroughs High School"
  const eventlinkMatch = summary.match(/^(.+?)\s*\(/)
  if (eventlinkMatch) {
    return eventlinkMatch[1].trim()
  }

  return null
}

// Clean up location string (unescape commas, etc)
export function cleanLocation(location: string): string {
  return location.replace(/\\,/g, ',').replace(/\\n/g, ' ').trim()
}
