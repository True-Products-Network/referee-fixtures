// Test Eventlink timezone parsing

const { parseICS } = require('./src/lib/ical-parser.ts');

const icsData = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:+//schooldatebooks/eventlink//NONSGML v2.0//EN
CALSCALE:GREGORIAN
BEGIN:VTIMEZONE
TZID:America/Chicago
BEGIN:DAYLIGHT
DTSTART:20260308T030000
TZNAME:CDT
TZOFFSETFROM:-0600
TZOFFSETTO:-0500
END:DAYLIGHT
END:VTIMEZONE
BEGIN:VEVENT
DTSTAMP:20261016T095424Z
UID:f33c9305-ae7a-4ea1-903e-0fdfc052e200
DTSTART;TZID=America/Chicago:20260916T173053
DTEND;TZID=America/Chicago:20260916T183053
SUMMARY:Soccer (Boys V) - John Burroughs High School
LOCATION:Francis Howell North High School
DESCRIPTION:Start Time: 5:30 PM\nEnd Time: 6:30 PM\nSport: Soccer\nGender: Boys\nLevel: Varsity\nLocation: Francis Howell North High School\nFacility: Stadium\nAthletic Director:\n Dusty Weiskopf\n Email: dusty.weiskopf@fhsdschools.org\n\nOfficials:\n Nigel Lear\n Email: nigel.lear@me.com\n Phone: 314-915-3356\n\n Peter Fong\n Email: pfong@charter.net\n Phone: 636-900-2800\n\n Vernon Gano\n Email: vernongano@aol.com\n\nInvited By:\n Tim Fleming\n Email: stlassignor@gmail.com\n Phone: 3144065568\n\nOpponent(s)\n John Burroughs High School\n Ath. Dir: Willie Owens\n Email: wowens@jburroughs.org\n\n
END:VEVENT
END:VCALENDAR`;

const fixtures = parseICS(icsData);
console.log('=== Eventlink Fixture ===');
fixtures.forEach((f, i) => {
  console.log('Summary:', f.summary);
  console.log('Start:', f.start.toISOString());
  console.log('Start local:', f.start.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
  console.log('End:', f.end.toISOString());
  console.log('End local:', f.end.toLocaleString('en-US', { timeZone: 'America/Chicago' }));
});
