const XLSX = require('xlsx');
const SportsPlace = require('../models/SportsPlace');
const ImportHistory = require('../models/ImportHistory');
const path = require('path');
const fs = require('fs');

const normalizeRow = (r, districtName) => {
  const keys = Object.keys(r);
  const get = (...candidates) => {
    for (const c of candidates) {
      const k = keys.find(k => k.trim().toLowerCase() === c.toLowerCase());
      if (k !== undefined) return String(r[k]).trim();
    }
    return '';
  };

  return {
    sno:                get('s.no', 'sno', 's no', 'sl no', 'serial'),
    sportsPlaceName:    get('facility name', 'sports place name', 'place name', 'name'),
    district:           get('district') || districtName,
    place:              get('address', 'place', 'area', 'location'),
    phone:              get('phone', 'contact number', 'contact no', 'mobile', 'contact'),
    category:           get('category', 'type', 'sport'),
    contactAvailability:get('contact available', 'contact availability', 'available') || 'Yes',
    googleMapsLink:     get('maps link', 'google maps link', 'google maps', 'map link'),
    sourceField:        get('source', 'origin file'),
  };
};

const syncExcelToDB = async () => {
  const candidates = [
    path.join(__dirname, '../../TamilNadu_Sports_Facilities_Consolidated (1).xlsx'),
    path.join(__dirname, '../TamilNadu_Sports_Facilities_Consolidated (1).xlsx'),
    path.join(__dirname, '../../TamilNadu_Sports_Facilities_Combined_Deduplicated.xlsx'),
    path.join(__dirname, '../TamilNadu_Sports_Facilities_Combined_Deduplicated.xlsx'),
  ];
  const filePath = candidates.find(p => fs.existsSync(p));

  if (!filePath) {
    console.log('[ExcelSync] File not found:', candidates);
    return { success: false, message: 'Excel file not found on server' };
  }

  try {
    const wb = XLSX.readFile(filePath, { cellDates: true });
    let allRows = [];

    wb.SheetNames.forEach(sheetName => {
      if (sheetName.toLowerCase() === 'summary') return;
      const ws = wb.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
      data.forEach(r => allRows.push(normalizeRow(r, sheetName)));
    });

    if (!allRows.length) return { success: false, message: 'No data found in file' };

    // Deduplicate by composite key: sno + phone + name (case-insensitive)
    const seen = new Set();
    const uniqueRows = [];
    allRows.forEach(r => {
      const key = `${r.sno}|${r.phone}|${(r.sportsPlaceName || '').toLowerCase().trim()}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueRows.push(r);
      }
    });

    console.log(`[ExcelSync] Total rows: ${allRows.length}, After dedup: ${uniqueRows.length}`);

    // Assign a global unique R.No starting at 11110001 (overrides per-district Excel serial)
    uniqueRows.forEach((r, i) => {
      r.sno = String(11110001 + i);
    });

    // Ensure name fallback
    uniqueRows.forEach(r => {
      if (!r.sportsPlaceName) {
        r.sportsPlaceName = r.sno
          ? `${r.district || 'Unknown'} Facility #${r.sno}`
          : `${r.district || 'Unknown'} Facility`;
      }
    });

    // Clear SportsPlace only — never touch Leads
    await SportsPlace.deleteMany({});
    console.log('[ExcelSync] Cleared SportsPlace collection.');

    // Insert in chunks of 500
    const CHUNK_SIZE = 500;
    let inserted = 0;

    for (let i = 0; i < uniqueRows.length; i += CHUNK_SIZE) {
      const chunk = uniqueRows.slice(i, i + CHUNK_SIZE).map(r => ({
        name:                r.sportsPlaceName,
        district:            r.district || 'Unknown',
        address:             r.place || '',
        phone:               r.phone || '',
        sno:                 r.sno || '',
        category:            r.category || 'Other',
        contactAvailability: r.contactAvailability || 'Yes',
        googleMapsLink:      r.googleMapsLink || '',
        sourceField:         r.sourceField || '',
        source:              'excel_import',
      }));

      await SportsPlace.insertMany(chunk, { ordered: false });
      inserted += chunk.length;
      console.log(`[ExcelSync] Inserted ${inserted}/${uniqueRows.length}`);
    }

    await ImportHistory.create({
      batchId:        `SYNC_${Date.now()}`,
      sourceFileName: path.basename(filePath),
      sourceType:     'auto-sync',
      totalRows:      allRows.length,
      imported:       inserted,
      duplicates:     allRows.length - uniqueRows.length,
      failed:         0,
      districts:      Array.from(new Set(uniqueRows.map(r => r.district).filter(Boolean))),
      notes:          `Clean sync — SportsPlace only. Inserted: ${inserted}`,
    }).catch(() => {});

    console.log(`[ExcelSync] Done — Inserted: ${inserted}`);
    return { success: true, total: inserted, duplicatesRemoved: allRows.length - uniqueRows.length };
  } catch (err) {
    console.error('[ExcelSync] Error:', err.message);
    return { success: false, message: err.message };
  }
};

module.exports = { syncExcelToDB };
