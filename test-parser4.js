// Test what the parser actually produces

const icsData = `BEGIN:VCALENDAR
BEGIN:VEVENT
DTSTART;TZID=America/Chicago:20261018T110000
DTEND;TZID=America/Chicago:20261018T120000
DESCRIPTION:Rise Officials\\nLou Fusz Athletic 2 U13 AD (Lou Fusz Athletic 2) vs. Sting Nebraska U13 AD (Sting Nebraska)\\nR: Lear\\, Nigel\\nAR1: Beldner\\, Brad\\nAR2: ** unassigned **\\nhttps://mlsnext.assignr.com/games/28027619
SUMMARY:U13 AD
UID:28027619@mlsnext.assignr.com
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
const descLine = lines.find(l => l.startsWith('DESCRIPTION:'));
const description = descLine.slice(12);

console.log('=== Raw description from parser ===');
console.log(JSON.stringify(description));
console.log('\n=== Description ===');
console.log(description);

// Now test parseAssignrDescription
const lines2 = description.split('\\n').map(l => l.trim()).filter(l => l.length > 0);
console.log('\n=== Split lines ===');
lines2.forEach((l, i) => console.log(`Line ${i}:`, l));

// Check vs. parsing
const vsLine = lines2.find(l => l.includes('vs.'));
console.log('\n=== vs. line ===');
console.log(vsLine);

const vsMatch = vsLine.match(/(.+?)\s+vs\.\s+(.+)/);
if (vsMatch) {
  console.log('Home part:', vsMatch[1]);
  console.log('Away part:', vsMatch[2]);
}

// Check official parsing
console.log('\n=== Officials ===');
lines2.forEach(line => {
  const officialMatch = line.match(/^([A-Z]+\d*):\s*(.+)/);
  if (officialMatch) {
    console.log('Role:', officialMatch[1], '| Name:', officialMatch[2]);
  }
});
