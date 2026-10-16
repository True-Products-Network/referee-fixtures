// Full Arbiter test

const { parseICS, extractTeams, extractRole, extractUserRole, parseArbiterDescription } = require('./src/lib/ical-parser.ts');

const icsData = `BEGIN:VCALENDAR
PRODID:-//ArbiterSports Calendar//EN
VERSION:2.0
X-WR-CALNAME: ArbiterSports
BEGIN:VEVENT
SUMMARY;LANGUAGE=en-us:Women's Soccer
CLASS:PUBLIC
DTSTAMP:20261016T180321Z
DTSTART:20260823T230000Z
DTEND:20260824T000000Z
UID:G-101201691
LOCATION: 5270 Flat River  Rd. P.O. Box 1000, Park Hills Missouri  63601
DESCRIPTION:Sport: Soccer\\nLevel: Women's\\nTeam: Mineral Area CC\\nSite: Mineral Area CC\\nSubsite: Mineral Area CC\\n\\nChad Clutes  Position: AR 2\\nNigel Lear  Position: AR 1\\nChristopher Smith  Position: Referee\\n\\n
END:VEVENT
BEGIN:VEVENT
SUMMARY;LANGUAGE=en-us:Women's Soccer
CLASS:PUBLIC
DTSTAMP:20261016T180321Z
DTSTART:20260913T180000Z
DTEND:20260913T190000Z
UID:G-102300077
LOCATION: One Brooking Dr Campus Box 1067, St Louis Missouri  63130
DESCRIPTION:Sport: Soccer\\nLevel: Women's\\nTeam: Wash Univ Club\\nSite: Washington U\\nSubsite: Old CBC Clayton RD\\n\\nDoug Helfrich  Position: AR 1\\nNigel Lear  Position: Referee\\nDerrick Madej  Position: AR 2\\n\\n
END:VEVENT
END:VCALENDAR`;

const fixtures = parseICS(icsData);
console.log('Parsed', fixtures.length, 'fixtures');

fixtures.forEach((f, i) => {
  console.log(`\n=== Fixture ${i+1} ===`);
  console.log('UID:', f.uid);
  console.log('Summary:', f.summary);
  console.log('Description:', f.description);
  console.log('Start:', f.start.toISOString());
  
  const teams = extractTeams(f.summary, f.description, f.location);
  console.log('Teams:', teams);
  
  const role = extractRole(f.summary, f.description);
  console.log('Generic Role:', role);
  
  const userRole = extractUserRole(f.description, 'Nigel Lear');
  console.log('User Role:', userRole);
  
  const arbiter = parseArbiterDescription(f.description);
  console.log('Arbiter:', JSON.stringify(arbiter, null, 2));
});
