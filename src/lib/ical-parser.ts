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

// Parse iCal datetime values properly with timezone awareness
// iCal format: DTSTART;TZID=America/Chicago:20261017T110000
// The datetime string is in the specified timezone, NOT UTC
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
  // Note: tzid is passed separately from value
  if (tzid && /^\d{8}T\d{6}$/.test(value)) {
    const dtStr = value.slice(0, 4) + '-' + value.slice(4, 6) + '-' + value.slice(6, 8) + 'T' + value.slice(9, 11) + ':' + value.slice(11, 13) + ':' + value.slice(13, 15)
    const tz = tzid
    
    try {
      // Strategy: Use the fact that new Date('YYYY-MM-DDTHH:MM:SS') creates a date
      // in the LOCAL timezone. We need to find what UTC time corresponds to the given
      // local time in the target timezone.
      
      // Parse the target local time components
      const targetYear = parseInt(value.slice(0, 4))
      const targetMonth = parseInt(value.slice(4, 6)) - 1 // 0-indexed
      const targetDay = parseInt(value.slice(6, 8))
      const targetHour = parseInt(value.slice(9, 11))
      const targetMinute = parseInt(value.slice(11, 13))
      const targetSecond = parseInt(value.slice(13, 15))
      
      // Create a formatter for the target timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: false,
      })
      
      // Start with an estimate: create a UTC date with the same components
      // This will be wrong by the timezone offset, but gives us a starting point
      let guess = Date.UTC(targetYear, targetMonth, targetDay, targetHour, targetMinute, targetSecond)
      
      // Iteratively adjust: format the guess in target tz, compare to desired time
      for (let i = 0; i < 5; i++) {
        const guessDate = new Date(guess)
        const parts = formatter.formatToParts(guessDate)
        const getPart = (type: string) => parseInt(parts.find(p => p.type === type)?.value || '0')
        
        const guessYear = getPart('year')
        const guessMonth = getPart('month') - 1 // 0-indexed
        const guessDay = getPart('day')
        const guessHour = getPart('hour')
        const guessMinute = getPart('minute')
        const guessSecond = getPart('second')
        
        // Check if we found the right time
        if (guessYear === targetYear && 
            guessMonth === targetMonth && 
            guessDay === targetDay && 
            guessHour === targetHour && 
            guessMinute === targetMinute && 
            guessSecond === targetSecond) {
          return new Date(guess)
        }
        
        // Calculate the difference and adjust
        const guessTime = Date.UTC(guessYear, guessMonth, guessDay, guessHour, guessMinute, guessSecond)
        const targetTime = Date.UTC(targetYear, targetMonth, targetDay, targetHour, targetMinute, targetSecond)
        const diff = targetTime - guessTime
        
        guess += diff
      }
      
      return new Date(guess)
    } catch (e) {
      console.error('Timezone parsing error:', e)
      return new Date(dtStr)
    }
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
  let inNested = false
  let nestedDepth = 0
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
      inNested = false
      nestedDepth = 0
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
      inNested = false
      nestedDepth = 0
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

      // Skip nested components (VALARM, VTIMEZONE, etc)
      if (line.startsWith('BEGIN:')) {
        inNested = true
        nestedDepth++
        continue
      }
      if (line.startsWith('END:')) {
        nestedDepth--
        if (nestedDepth === 0) {
          inNested = false
        }
        continue
      }
      if (inNested) {
        continue
      }

      if (line.startsWith('UID:')) {
        uid = line.slice(4)
      } else if (line.startsWith('SUMMARY')) {
        // Handle SUMMARY;LANGUAGE=en-us:Women's Soccer
        const colonIdx = line.indexOf(':')
        if (colonIdx !== -1) {
          summary = line.slice(colonIdx + 1)
        }
      } else if (line.startsWith('DESCRIPTION')) {
        // Handle DESCRIPTION;LANGUAGE=en-us:...
        const colonIdx = line.indexOf(':')
        if (colonIdx !== -1) {
          description = line.slice(colonIdx + 1)
        }
      } else if (line.startsWith('DTSTART')) {
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
      } else if (line.startsWith('LOCATION')) {
        const colonIdx = line.indexOf(':')
        if (colonIdx !== -1) {
          location = line.slice(colonIdx + 1)
        }
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

// Parse Assignr description format
// iCal DESCRIPTION field uses \n for newlines, \, for commas, etc
// Example:
// USOfficials\nSLSG MO B 2012/2013 NAL St. Charles (St. Louis Scott Gallagher St. Charles) vs. STLDA 2012/13B Elite (NAL) (St. Louis Development Academy)\nR: Lear, Nigel\nAR: Roca, Kevin\nAR: unassigned\nhttps://usofficials.assignr.com/games/28063426
export interface AssignrDetails {
  organisation?: string
  homeTeam?: string
  awayTeam?: string
  homeTeamShort?: string
  awayTeamShort?: string
  referee?: string
  ar1?: string
  ar2?: string
  fourthOfficial?: string
  url?: string
  ageGroup?: string
}

export function parseAssignrDescription(description: string): AssignrDetails {
  // iCal escapes newlines as \n, so we need to split on actual newlines in the parsed content
  // The description field in iCal has literal \n characters which represent newlines
  const lines = description.split('\\n').map(l => l.trim()).filter(l => l.length > 0)
  const details: AssignrDetails = {}

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // First line is often the organisation (USOfficials, etc)
    if (i === 0 && !line.includes('vs.') && !line.includes(':') && !line.startsWith('http')) {
      details.organisation = line
      continue
    }

    // vs. line: "Team A (Short A) vs. Team B (Short B)"
    const vsMatch = line.match(/(.+?)\s+vs\.\s+(.+)/)
    if (vsMatch) {
      const homePart = vsMatch[1].trim()
      const awayPart = vsMatch[2].trim()

      // Extract team name and short name from "Name (Short)"
      // Use greedy match to find the LAST (text) at the end
      const homeMatch = homePart.match(/^(.+)\s+\(([^)]+)\)$/)
      if (homeMatch) {
        details.homeTeam = homeMatch[1].trim()
        details.homeTeamShort = homeMatch[2].trim()
      } else {
        details.homeTeam = homePart
      }

      const awayMatch = awayPart.match(/^(.+)\s+\(([^)]+)\)$/)
      if (awayMatch) {
        details.awayTeam = awayMatch[1].trim()
        details.awayTeamShort = awayMatch[2].trim()
      } else {
        details.awayTeam = awayPart
      }
      continue
    }

    // Officials - match R:, AR1:, AR2:, 4TH:
    const officialMatch = line.match(/^([A-Z]+\d*):\s*(.+)/)
    if (officialMatch) {
      const role = officialMatch[1].trim()
      const name = officialMatch[2].trim()
      if (role === 'R') details.referee = name
      if (role === 'AR1') details.ar1 = name
      if (role === 'AR2') details.ar2 = name
      if (role === 'AR') {
        // Fallback for plain AR (without number)
        if (!details.ar1) details.ar1 = name
        else if (!details.ar2) details.ar2 = name
      }
      if (role === '4TH') details.fourthOfficial = name
      continue
    }

    // URL
    if (line.startsWith('http')) {
      details.url = line
      continue
    }
  }

  return details
}

// Parse ArbiterSports description format
// Example:
// Event: Men's Soccer
// Location Address: 650 Maryville university Dr.
// Date: Saturday, October 17, 2026 11am - 12:20pm
// Sport: Soccer
// Level: Men's
// Team: Maryville Club
// Site: Maryville college club fields.
// Subsite: Maryville college club fields.
// Doug Helfrich Position: Referee
// Nigel Lear Position: AR 1
// Sadeth Phimphavong Position: AR 2
export interface ArbiterDetails {
  event?: string
  locationAddress?: string
  dateString?: string
  sport?: string
  level?: string
  team?: string
  site?: string
  subsite?: string
  officials: Array<{ name: string; position: string }>
  url?: string
}

export function parseArbiterDescription(description: string): ArbiterDetails {
  const lines = description.split('\\n').map(l => l.trim()).filter(l => l.length > 0)
  const details: ArbiterDetails = { officials: [] }

  for (const line of lines) {
    // Official format: "Name Position: Role" (check FIRST before key-value)
    // "Doug Helfrich Position: Referee"
    // "Nigel Lear Position: AR 1"
    const officialMatch = line.match(/^(.+?)\s+Position:\s*(.+)/)
    if (officialMatch) {
      details.officials.push({
        name: officialMatch[1].trim(),
        position: officialMatch[2].trim(),
      })
      continue
    }

    // Key: Value format (single word keys only)
    const kvMatch = line.match(/^([A-Za-z\s]+):\s*(.+)/)
    if (kvMatch) {
      const key = kvMatch[1].trim().toLowerCase()
      const value = kvMatch[2].trim()

      if (key === 'event') details.event = value
      else if (key === 'location address') details.locationAddress = value
      else if (key === 'date') details.dateString = value
      else if (key === 'sport') details.sport = value
      else if (key === 'level') details.level = value
      else if (key === 'team') details.team = value
      else if (key === 'site') details.site = value
      else if (key === 'subsite') details.subsite = value
      continue
    }

    // URL
    if (line.startsWith('http')) {
      details.url = line
    }
  }

  return details
}

// Determine if this is an Arbiter feed based on description content
function isArbiterDescription(description: string): boolean {
  return description.includes('Position:') && (description.includes('Sport:') || description.includes('Event:'))
}

// Determine if this is an Assignr feed based on description content
function isAssignrDescription(description: string): boolean {
  return description.includes('vs.') && (description.includes('R:') || description.includes('AR:'))
}

// Extract teams from fixture data based on source patterns
export function extractTeams(summary: string, description: string, location?: string): { homeTeam: string; awayTeam: string; competition?: string } {
  // Pattern 0a: Arbiter - use Sport/Level/Team from description
  if (isArbiterDescription(description)) {
    const arbiter = parseArbiterDescription(description)
    // Arbiter has: Sport + Level + Team (single team, not both home/away)
    // Competition is Level + Sport (e.g., "Women's Soccer")
    const competition = arbiter.level && arbiter.sport 
      ? `${arbiter.level} ${arbiter.sport}`
      : arbiter.sport || arbiter.level || ''
    
    if (arbiter.team) {
      return {
        homeTeam: arbiter.team,
        awayTeam: 'TBD',
        competition,
      }
    }
    if (competition) {
      return {
        homeTeam: competition,
        awayTeam: '',
        competition,
      }
    }
  }

  // Pattern 0b: Assignr - parse the description for teams
  if (isAssignrDescription(description)) {
    const assignrDetails = parseAssignrDescription(description)
    if (assignrDetails.homeTeam && assignrDetails.awayTeam) {
      return {
        homeTeam: assignrDetails.homeTeam,
        awayTeam: assignrDetails.awayTeam,
      }
    }
  }

  // Pattern 1: Vieira/RQ+ style - "Southwest Baptist at Maryville (MO) (12:00PM CDT)"
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

  // Pattern 3: Eventlink style
  const eventlinkMatch = summary.match(/-\s+(.+)$/)
  if (eventlinkMatch) {
    return {
      homeTeam: location || 'Home Team',
      awayTeam: eventlinkMatch[1].trim(),
    }
  }

  // Pattern 4: Assignr style summary only - "U14 Boys" or "U13 AD"
  const assignrMatch = summary.match(/^(U\d+\s+\w+)/)
  if (assignrMatch) {
    return {
      homeTeam: summary.trim(),
      awayTeam: '',
    }
  }

  // Pattern 5: Generic vs in description
  const descVsMatch = description.match(/^(.+?)\s+(?:vs?|VS?|Vs|@)\s+(.+?)$/mi)
  if (descVsMatch) {
    return {
      homeTeam: descVsMatch[1].trim(),
      awayTeam: descVsMatch[2].trim(),
    }
  }

  // Fallback
  return {
    homeTeam: summary.trim() || 'Unknown',
    awayTeam: '',
  }
}

// Extract role from fixture data
// NOTE: Must return valid values from fixture_roles table:
// referee, ar1, ar2, fourth_official, mentor, assessor, var, other
export function extractRole(summary: string, description: string, userName?: string): string {
  const upperDesc = description.toUpperCase()
  const upperSummary = summary.toUpperCase()

  // Check if this is Arbiter format with Position lines
  if (isArbiterDescription(description)) {
    const arbiter = parseArbiterDescription(description)
    // Find the official matching the user's name (if provided)
    // Otherwise find "Nigel Lear" or just use first official
    const targetName = userName ? userName.toLowerCase() : 'lear'
    
    for (const official of arbiter.officials) {
      const officialNameLower = official.name.toLowerCase()
      if (!userName || officialNameLower.includes(targetName) || targetName.includes(officialNameLower)) {
        const pos = official.position.toUpperCase()
        if (pos.includes('AR 1') || pos.includes('AR1') || pos.includes('ASSISTANT')) return 'ar1'
        if (pos.includes('AR 2') || pos.includes('AR2')) return 'ar2'
        if (pos.includes('REFEREE') && !pos.includes('ASSISTANT')) return 'referee'
        if (pos.includes('4TH') || pos.includes('FOURTH')) return 'fourth_official'
      }
    }
    
    // If no match found, check all officials for any role indicator
    for (const official of arbiter.officials) {
      const pos = official.position.toUpperCase()
      if (pos.includes('AR 1') || pos.includes('AR1')) return 'ar1'
      if (pos.includes('AR 2') || pos.includes('AR2')) return 'ar2'
      if (pos.includes('REFEREE') && !pos.includes('ASSISTANT')) return 'referee'
      if (pos.includes('4TH') || pos.includes('FOURTH')) return 'fourth_official'
    }
  }

  // Check if this is Assignr format
  if (isAssignrDescription(description)) {
    const assignr = parseAssignrDescription(description)
    // Check if user is listed as R, AR, etc
    // For now, check summary for role abbreviations
    if (/\bAD\b/.test(upperSummary)) return 'ar1'
    if (/\bAR\b/.test(upperSummary)) return 'ar1'
    if (/\bCR\b/.test(upperSummary)) return 'referee'
    
    // Check description for user's role
    // "R: Lear, Nigel" - user is referee
    // "AR: Lear, Nigel" - user is AR1
    if (upperDesc.includes('R:') && upperDesc.includes('LEAR')) return 'referee'
    if (upperDesc.includes('AR:') && upperDesc.includes('LEAR')) return 'ar1'
  }

  // Generic checks
  if (/\bAD\b/.test(upperSummary)) return 'ar1'
  if (/\bAR\b/.test(upperSummary)) return 'ar1'
  if (/\bCR\b/.test(upperSummary)) return 'referee'
  if (/\b4TH\b/.test(upperSummary)) return 'fourth_official'

  if (upperDesc.includes('CENTER REFEREE') || upperDesc.includes('CR ')) return 'referee'
  if (upperDesc.includes('ASSISTANT REFEREE') || upperDesc.includes('AR1')) return 'ar1'
  if (upperDesc.includes('AR2')) return 'ar2'
  if (upperDesc.includes('FOURTH OFFICIAL')) return 'fourth_official'

  if (upperDesc.includes('REFEREE')) return 'referee'

  return 'referee'
}

// Extract user's specific role from Arbiter/Assignr description
export function extractUserRole(description: string, userFullName: string): string {
  const nameParts = userFullName.toLowerCase().split(/\s+/).filter(p => p.length > 2)
  
  // Check Arbiter format
  if (isArbiterDescription(description)) {
    const arbiter = parseArbiterDescription(description)
    for (const official of arbiter.officials) {
      const officialLower = official.name.toLowerCase()
      // Match if any significant part of the name matches
      const nameMatch = nameParts.some(part => officialLower.includes(part))
      if (nameMatch) {
        const pos = official.position.toUpperCase()
        if (pos.includes('AR 1') || pos.includes('AR1') || pos.includes('ASSISTANT')) return 'ar1'
        if (pos.includes('AR 2') || pos.includes('AR2')) return 'ar2'
        if (pos.includes('REFEREE') && !pos.includes('ASSISTANT')) return 'referee'
        if (pos.includes('4TH') || pos.includes('FOURTH')) return 'fourth_official'
      }
    }
  }
  
  // Check Assignr format
  if (isAssignrDescription(description)) {
    const assignr = parseAssignrDescription(description)
    const descLower = description.toLowerCase()
    
    // Check each official line for user's name
    // Lines are like: "R: Lear, Nigel" or "AR1: Lear, Nigel" or "AR2: Lear, Nigel"
    // For plain "AR:", track which position (first = ar1, second = ar2)
    let arCount = 0
    const lines = description.split('\\n')
    for (const line of lines) {
      const officialMatch = line.match(/^([A-Z]+\d*):\s*(.+)/)
      if (officialMatch) {
        const role = officialMatch[1]
        const name = officialMatch[2].toLowerCase()
        
        // Count AR positions for plain AR: lines
        if (role === 'AR') {
          arCount++
        }
        
        const nameMatch = nameParts.some(part => name.includes(part))
        if (nameMatch) {
          if (role === 'R') return 'referee'
          if (role === 'AR1') return 'ar1'
          if (role === 'AR2') return 'ar2'
          if (role === 'AR') {
            // First AR = ar1, second AR = ar2
            return arCount === 1 ? 'ar1' : 'ar2'
          }
        }
      }
    }
  }
  
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
