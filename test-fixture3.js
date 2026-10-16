// Test fixture 28063424

const icsData = `BEGIN:VCALENDAR
BEGIN:VEVENT
DTSTAMP:20261016T123048Z
UID:28063424@usofficials.assignr.com
DTSTART;TZID=America/Chicago:20261017T090000
DTEND;TZID=America/Chicago:20261017T101000
CREATED:20260819T082400
DESCRIPTION:USOfficials\\nSLSG MO B 2013/2014 NAL St. Charles (St. Louis Sco
 tt Gallagher St. Charles) vs. STLDA 2013/14B Elite (NAL) (St. Louis Develo
 pment Academy)\\nR: Roca\\, Kevin\\nAR: ** unassigned **\\nAR: Lear\\, Nigel\\nh
 ttps://usofficials.assignr.com/games/28063424
SUMMARY:U13 Boys
END:VEVENT
END:VCALENDAR`;

// Simulate unfoldLines
function unfoldLines(icsData) {
  const rawLines = icsData.split(/\r?\n/)
  const lines = []

  for (const rawLine of rawLines) {
    if (rawLine.length === 0) continue
    if (rawLine.startsWith(' ') || rawLine.startsWith('\t')) {
      if (lines.length > 0) {
        lines[lines.length - 1] += rawLine.slice(1)
      }
    } else {
      lines.push(rawLine)
    }
  }

  return lines
}

const lines = unfoldLines(icsData);
console.log('=== Unfolded lines ===');
lines.forEach((l, i) => console.log(`Line ${i}:`, l.substring(0, 100)));

const descLine = lines.find(l => l.startsWith('DESCRIPTION:'));
const description = descLine.slice(12);
console.log('\n=== Description ===');
console.log(description);

// Test parseAssignrDescription
const descLines = description.split('\\n').map(l => l.trim()).filter(l => l.length > 0);
console.log('\n=== Parsed lines ===');
descLines.forEach((l, i) => console.log(`Line ${i}:`, l));

// Test team parsing
const vsLine = descLines.find(l => l.includes('vs.'));
console.log('\n=== vs. line ===');
console.log(vsLine);

const vsMatch = vsLine.match(/(.+?)\s+vs\.\s+(.+)/);
if (vsMatch) {
  const homePart = vsMatch[1].trim();
  const awayPart = vsMatch[2].trim();
  console.log('Home part:', homePart);
  console.log('Away part:', awayPart);
  
  const homeMatch = homePart.match(/^(.+)\s+\(([^)]+)\)$/);
  console.log('Home match:', homeMatch);
  
  const awayMatch = awayPart.match(/^(.+)\s+\(([^)]+)\)$/);
  console.log('Away match:', awayMatch);
}

// Test user role
const userFullName = 'Nigel Lear';
const nameParts = userFullName.toLowerCase().split(/\s+/).filter(p => p.length > 2);
let arCount = 0;
descLines.forEach(line => {
  const officialMatch = line.match(/^([A-Z]+\d*):\s*(.+)/);
  if (officialMatch) {
    const role = officialMatch[1];
    const name = officialMatch[2].toLowerCase();
    if (role === 'AR') arCount++;
    const nameMatch = nameParts.some(part => name.includes(part));
    if (nameMatch) {
      console.log('\n=== User role ===');
      console.log('Role:', role, '| AR count:', arCount);
      if (role === 'AR') {
        console.log('User is AR' + arCount);
      }
    }
  }
});
