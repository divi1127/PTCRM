require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const SportsPlace = require('../models/SportsPlace');
const Lead = require('../models/Lead');

const BACKUP_DIR = path.join(__dirname, 'backup');
const STORE = 'C:\\Users\\Lenovo\\AppData\\Local\\Temp\\opencode\\backup_ptcrm';

(async () => {
  await mongoose.connect(process.env.MONGO_URI, { connectTimeoutMS: 30000 });
  console.log('Connected.');

  fs.mkdirSync(STORE, { recursive: true });
  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  // ── 1. Backup ──────────────────────────────────────────────
  const allPlaces = await SportsPlace.find({}).lean();
  const allLeads = await Lead.find({}).lean();
  fs.writeFileSync(path.join(STORE, 'SportsPlace_backup.json'), JSON.stringify(allPlaces, null, 2));
  fs.writeFileSync(path.join(STORE, 'Lead_backup.json'), JSON.stringify(allLeads, null, 2));
  console.log(`Backed up ${allPlaces.length} SportsPlace, ${allLeads.length} Leads -> ${STORE}`);

  // ── 2. Renumber SportsPlace R.No → 11110001 + idx (sorted like the Targets module) ──
  const places = await SportsPlace.find({}).sort({ district: 1, name: 1 }).lean();
  const placeOps = places.map((p, i) => ({
    updateOne: { filter: { _id: p._id }, update: { $set: { sno: String(11110001 + i) } } }
  }));
  let res = await SportsPlace.bulkWrite(placeOps, { ordered: false });
  console.log(`SportsPlace renumbered: modified=${res.modifiedCount} (of ${places.length}), expected range 11110001..${11110000 + places.length}`);
  const spot = await SportsPlace.find({}).sort({ sno: 1 }).limit(3).select('name district sno').lean();
  const spotEnd = await SportsPlace.find({}).sort({ sno: -1 }).limit(3).select('name district sno').lean();
  console.log('  start:', JSON.stringify(spot.map(p => `${p.sno}|${p.district}|${p.name}`)));
  console.log('  end  :', JSON.stringify(spotEnd.map(p => `${p.sno}|${p.district}|${p.name}`)));

  // ── 3. Renumber Lead S.No → 1..n (oldest first) ──
  const leads = await Lead.find({}).sort({ createdAt: 1 }).lean();
  const leadOps = leads.map((l, i) => ({
    updateOne: { filter: { _id: l._id }, update: { $set: { sno: String(i + 1) } } }
  }));
  res = await Lead.bulkWrite(leadOps, { ordered: false });
  console.log(`Leads renumbered: modified=${res.modifiedCount} (of ${leads.length}), expected range 1..${leads.length}`);

  await mongoose.disconnect();
  console.log('Migration complete.');
  process.exit(0);
})().catch(e => { console.error('FAILED:', e); process.exit(1); });