// Test the actual parsing with real feed data

// Simulate unfoldLines
function unfoldLines(icsData) {
  const rawLines = icsData.split(/\r?\n/)
  const lines = []

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

// Simulate parsing
const icsData = `BEGIN:VCALENDAR
BEGIN:VEVENT
DTSTART;TZID=America/Chicago:20261018T110000
DESCRIPTION:Rise Officials\\nLou Fusz Athletic 2 U13 AD (Lou Fusz Athletic 2
 ) vs. Sting Nebraska U13 AD (Sting Nebraska)\\nR: Lear\\, Nigel\\nAR1: Beldne
 r\\, Brad\\nAR2: ** unassigned **\\nhttps://mlsnext.assignr.com/games/2802761
 9
END:VEVENT
END:VCALENDAR`;

const lines = unfoldLines(icsData);
console.log('=== Unfolded lines ===');
lines.forEach((line, i) => {
  console.log(`Line ${i}:`, line.substring(0, 100));
});

// Find DESCRIPTION line
const descLine = lines.find(l => l.startsWith('DESCRIPTION:'));
console.log('\n=== DESCRIPTION line ===');
console.log(descLine);

// Extract description
const description = descLine.slice(12);
console.log('\n=== Extracted description ===');
console.log(description);

// Split on \\n
const descLines = description.split('\\n').map(l => l.trim()).filter(l => l.length > 0);
console.log('\n=== Description lines ===');
descLines.forEach((line, i) => {
  console.log(`Line ${i}:`, line);
});

// Test vs. parsing
const vsLine = descLines.find(l => l.includes('vs.'));
console.log('\n=== vs. line ===');
console.log(vsLine);

const vsMatch = vsLine.match(/(.+?)\s+vs\.\s+(.+)/);
if (vsMatch) {
  console.log('Home part:', vsMatch[1]);
  console.log('Away part:', vsMatch[2]);
  
  const homePart = vsMatch[1].trim();
  const awayPart = vsMatch[2].trim();
  
  // Test regex
  const homeMatch = homePart.match(/^(.+)\s+\(([^)]+)\)$/);
  console.log('Home match:', homeMatch);
  
  const awayMatch = awayPart.match(/^(.+)\s+\(([^)]+)\)$/);
  console.log('Away match:', awayMatch);
}

// Test official parsing
console.log('\n=== Officials ===');
descLines.forEach(line => {
  const officialMatch = line.match(/^([A-Z]+\d*):\s*(.+)/);
  if (officialMatch) {
    console.log('Role:', officialMatch[1], '| Name:', officialMatch[2]);
  }
});
