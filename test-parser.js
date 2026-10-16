// Test script for iCal parsing

// Simple timezone-aware date parsing
function parseDateTime(value, tzid) {
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
    const tz = tzMatch[1]
    
    try {
      // Format a known UTC date in the target timezone to find the offset
      const testDate = new Date('2026-10-18T00:00:00Z') // Known UTC time
      
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
      
      const parts = formatter.formatToParts(testDate)
      const getPart = (type) => parseInt(parts.find(p => p.type === type)?.value)
      
      const tzYear = getPart('year')
      const tzMonth = getPart('month')
      const tzDay = getPart('day')
      const tzHour = getPart('hour')
      const tzMinute = getPart('minute')
      const tzSecond = getPart('second')
      
      // Calculate the time difference between UTC and target timezone
      const utcMs = testDate.getTime()
      const tzMs = Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMinute, tzSecond)
      const offsetMs = tzMs - utcMs
      
      // Now parse our target time as if it's UTC, then subtract the offset
      const targetAsUtc = new Date(dtStr + 'Z')
      const resultMs = targetAsUtc.getTime() - offsetMs
      
      if (isNaN(resultMs)) {
        console.log('NaN result!', { dtStr, offsetMs, targetAsUtc: targetAsUtc.getTime() })
        return new Date(dtStr)
      }
      
      return new Date(resultMs)
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

// Test timezone parsing
console.log('=== TIMEZONE TEST ===');
const testDate = parseDateTime('America/Chicago:20261018T110000', 'America/Chicago');
console.log('Input: 2026-10-18 11:00 America/Chicago');
console.log('Parsed:', testDate.toISOString());
console.log('Expected: 2026-10-18T16:00:00.000Z (CDT = UTC-5)');
console.log('');

// Test description parsing
console.log('=== DESCRIPTION TEST ===');
const desc = 'Rise Officials\\nLou Fusz Athletic 2 U13 AD (Lou Fusz Athletic 2) vs. Sting Nebraska U13 AD (Sting Nebraska)\\nR: Lear\\, Nigel\\nAR1: Beldner\\, Brad\\nAR2: ** unassigned **\\nhttps://mlsnext.assignr.com/games/28027619';

console.log('Raw description:');
console.log(desc);
console.log('');

// Split on \\n
const lines = desc.split('\\n').map(l => l.trim()).filter(l => l.length > 0);
console.log('Lines:', lines);
console.log('');

// Test vs. parsing
const vsLine = lines.find(l => l.includes('vs.'));
console.log('vs. line:', vsLine);

const vsMatch = vsLine.match(/(.+?)\s+vs\.\s+(.+)/);
if (vsMatch) {
  console.log('Home part:', vsMatch[1]);
  console.log('Away part:', vsMatch[2]);
  
  // Try to extract team name and short name from "Name (Short)"
  const homePart = vsMatch[1].trim();
  const awayPart = vsMatch[2].trim();
  
  // Problem: "Lou Fusz Athletic 2 U13 AD (Lou Fusz Athletic 2)"
  // The regex needs to find the LAST pair of parens
  const homeMatch = homePart.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  console.log('Home regex match:', homeMatch);
  
  // Better approach: find the last occurrence of (text) at the end
  const homeMatch2 = homePart.match(/^(.+)\s+\(([^)]+)\)$/);
  console.log('Home regex match2:', homeMatch2);
}

// Test AR1/AR2 parsing
console.log('');
console.log('=== ROLE TEST ===');
lines.forEach(line => {
  const officialMatch = line.match(/^([A-Z]+\d*):\s*(.+)/);
  if (officialMatch) {
    console.log('Role:', officialMatch[1], 'Name:', officialMatch[2]);
  }
});

// Test user role extraction
console.log('');
console.log('=== USER ROLE TEST ===');
const userName = 'Nigel Lear';
const nameParts = userName.toLowerCase().split(/\s+/).filter(p => p.length > 2);
console.log('Name parts:', nameParts);

for (const line of lines) {
  const officialMatch = line.match(/^([A-Z]+\d*):\s*(.+)/);
  if (officialMatch) {
    const role = officialMatch[1];
    const name = officialMatch[2];
    const nameLower = name.toLowerCase();
    const nameMatch = nameParts.some(part => nameLower.includes(part));
    console.log('Checking:', name, 'Match:', nameMatch);
    if (nameMatch) {
      console.log('  -> User role:', role);
    }
  }
}
