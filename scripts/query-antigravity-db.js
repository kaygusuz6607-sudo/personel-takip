const { DatabaseSync } = require('node:sqlite');

const db = new DatabaseSync('C:/Users/User/.gemini/antigravity/conversations/313863bc-1131-4c1b-8f80-ad561fb76f65.db');

const r = db.prepare("SELECT idx, step_payload FROM steps WHERE idx = 1230;").get();
const str = String(r.step_payload);
console.log(str.substring(str.indexOf('Invoke-RestMethod'), str.indexOf('Invoke-RestMethod') + 500));
