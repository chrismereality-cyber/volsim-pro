import fs from 'fs';

const FILE = './data/store.json';

export function loadStore() {
  if (!fs.existsSync(FILE)) {
    return {
      primaryHedges: [],
      secondaryHedges: [],
      secondaryAccountLog: []
    };
  }
  return JSON.parse(fs.readFileSync(FILE, 'utf8'));
}

export function saveStore(data) {
  fs.mkdirSync('./data', { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(data, null, 2));
}
