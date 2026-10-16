// Test name matching with escaped commas

const userFullName = 'Nigel Lear';
const nameParts = userFullName.toLowerCase().split(/\s+/).filter(p => p.length > 2);
console.log('Name parts:', nameParts);

const description = 'Rise Officials\\nLou Fusz Athletic 2 U13 AD (Lou Fusz Athletic 2) vs. Sting Nebraska U13 AD (Sting Nebraska)\\nR: Lear\\, Nigel\\nAR1: Beldner\\, Brad\\nAR2: ** unassigned **\\nhttps://mlsnext.assignr.com/games/28027619';

const lines = description.split('\\n');
console.log('\n=== Checking each line ===');
for (const line of lines) {
  const officialMatch = line.match(/^([A-Z]+\d*):\s*(.+)/);
  if (officialMatch) {
    const role = officialMatch[1];
    const name = officialMatch[2];
    const nameLower = name.toLowerCase();
    console.log('Line:', line);
    console.log('  Role:', role, '| Name:', name);
    console.log('  nameLower:', nameLower);
    
    const nameMatch = nameParts.some(part => {
      const includes = nameLower.includes(part);
      console.log(`  Checking if '${nameLower}' includes '${part}': ${includes}`);
      return includes;
    });
    console.log('  nameMatch:', nameMatch);
  }
}
