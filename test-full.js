// Full integration test

const { parseICS, extractTeams, extractRole, extractUserRole, parseAssignrDescription } = require('./src/lib/ical-parser.ts');

// Mock iCal data
const icsData = `BEGIN:VCALENDAR
BEGIN:VEVENT
DTSTART;TZID=America/Chicago:20261018T110000
DTEND;TZID=America/Chicago:20261018T120000
DESCRIPTION:Rise Officials\\nLou Fusz Athletic 2 U13 AD (Lou Fusz Athletic 2) vs. Sting Nebraska U13 AD (Sting Nebraska)\\nR: Lear\\, Nigel\\nAR1: Beldner\\, Brad\\nAR2: ** unassigned **\\nhttps://mlsnext.assignr.com/games/28027619
SUMMARY:U13 AD
UID:28027619@mlsnext.assignr.com
END:VEVENT
BEGIN:VEVENT
DTSTART;TZID=America/Chicago:20261018T090000
DTEND;TZID=America/Chicago:20261018T100000
DESCRIPTION:Rise Officials\\nLou Fusz Athletic 2 U14 AD (Lou Fusz Athletic 2) vs. Sting Nebraska U14 AD (Sting Nebraska)\\nR: Beldner\\, Brad\\nAR1: Lear\\, Nigel\\nAR2: ** unassigned **\\nhttps://mlsnext.assignr.com/games/28027620
SUMMARY:U14 AD
UID:28027620@mlsnext.assignr.com
END:VEVENT
END:VCALENDAR`;

const fixtures = parseICS(icsData);

console.log('=== Parsed Fixtures ===');
fixtures.forEach((f, i) => {
  console.log(`\n--- Fixture ${i + 1} ---`);
  console.log('UID:', f.uid);
  console.log('Summary:', f.summary);
  console.log('Description:', f.description);
  console.log('Start:', f.start.toISOString());
  
  const teams = extractTeams(f.summary, f.description, f.location);
  console.log('Teams:', teams);
  
  const role = extractRole(f.summary, f.description);
  console.log('Role:', role);
  
  const userRole = extractUserRole(f.description, 'Nigel Lear');
  console.log('User Role:', userRole);
  
  const assignr = parseAssignrDescription(f.description);
  console.log('Assignr Details:', assignr);
});
