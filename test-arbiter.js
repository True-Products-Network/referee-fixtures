// Test Arbiter parsing

const description = `Sport: Soccer
Level: Women's
Team: Mineral Area CC
Site: Mineral Area CC
Subsite: Mineral Area CC

Chad Clutes  Position: AR 2
Nigel Lear  Position: AR 1
Christopher Smith  Position: Referee

`;

console.log('=== Testing official regex ===');
const lines = description.split('\n').map(l => l.trim()).filter(l => l.length > 0);
lines.forEach(line => {
  // Current regex
  const match1 = line.match(/^(.+?)\s+Position:\s*(.+)/);
  if (match1) {
    console.log('Match1:', match1[1].trim(), '|', match1[2].trim());
  }
  
  // Test with double space
  const match2 = line.match(/^(.+?)\s{2,}Position:\s*(.+)/);
  if (match2) {
    console.log('Match2:', match2[1].trim(), '|', match2[2].trim());
  }
});

console.log('\n=== Testing extractTeams ===');
// The description doesn't have vs. - only has Team: 
// So extractTeams needs to use the Arbiter team data

function isArbiterDescription(description) {
  return description.includes('Position:') && description.includes('Sport:');
}

function parseArbiterDescription(description) {
  const lines = description.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const details = { officials: [] };

  for (const line of lines) {
    const kvMatch = line.match(/^([^:]+):\s*(.+)/);
    if (kvMatch) {
      const key = kvMatch[1].trim().toLowerCase();
      const value = kvMatch[2].trim();
      if (key === 'team') details.team = value;
      else if (key === 'sport') details.sport = value;
      else if (key === 'level') details.level = value;
      else if (key === 'site') details.site = value;
      continue;
    }

    const officialMatch = line.match(/^(.+?)\s+Position:\s*(.+)/);
    if (officialMatch) {
      details.officials.push({
        name: officialMatch[1].trim(),
        position: officialMatch[2].trim(),
      });
    }
  }

  return details;
}

const arbiter = parseArbiterDescription(description);
console.log('Arbiter details:', arbiter);

// For extractTeams - Arbiter only has one team, not both
// We need to determine home/away from the site or just use the team name
console.log('\n=== Home/Away logic ===');
console.log('Team:', arbiter.team);
console.log('Site:', arbiter.site);
console.log('Level:', arbiter.level);
