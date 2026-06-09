const XLSX = require('xlsx');
const Lead = require('../models/Lead');
const SportsPlace = require('../models/SportsPlace');
const ImportHistory = require('../models/ImportHistory');
const path = require('path');
const fs   = require('fs');

const normalizeRow = (r, sheetName = '') => {
  const keys = Object.keys(r);
  const get = (...candidates) => {
    for (const c of candidates) {
      const k = keys.find(k => k.trim().toLowerCase() === c.toLowerCase());
      if (k !== undefined) return String(r[k]).trim();
    }
    return '';
  };

  // Derive a clean category from the sheet name (e.g. "Soapy football" -> "Soapy Football")
  const sheetCategory = sheetName
    ? sheetName.trim().replace(/\b\w/g, c => c.toUpperCase())
    : '';

  return {
    sno: get('s.no', 'sno', 's no', 'sl no', 'serial'),
    sportsPlaceName: get('sports place name', 'sports place', 'place name', 'name', 'name '),
    district: get('district'),
    place: get('place', 'area', 'location', 'address'),
    phone: get('contact number', 'contact no', 'phone', 'mobile', 'contact', 'phone '),
    category: get('category', 'type', 'sport') || sheetCategory,
    contactAvailability: get('contact available', 'contact availability', 'available') || 'Yes',
  };
};

const syncExcelToDB = async () => {
  const candidates = [
    path.join(__dirname, '../../TamilNadu_Sports_Data.xlsx'),
    path.join(__dirname, '../TamilNadu_Sports_Data.xlsx'),
    path.join(__dirname, '../../TamilNadu_Sports_Data .xlsx'),
    path.join(__dirname, '../TamilNadu_Sports_Data .xlsx'),
  ];
  const filePath = candidates.find(p => fs.existsSync(p));

  if (!filePath) {
    console.log('[ExcelSync] File not found in:', candidates);
    return { success: false, message: 'Excel file not found on server' };
  }

  try {
    const wb = XLSX.readFile(filePath, { cellDates: true });
    let allRaw = [];

    const TN_DISTRICTS = new Set([
      'ariyalur','chengalpattu','chennai','coimbatore','cuddalore','dharmapuri',
      'dindigul','erode','kallakurichi','kanchipuram','kanniyakumari','karur',
      'krishnagiri','madurai','mayiladuthurai','nagapattinam','namakkal','nilgiris',
      'perambalur','pudukkottai','ramanathapuram','ranipet','salem','sivagangai',
      'tenkasi','thanjavur','theni','thoothukudi','tirunelveli','tiruchirappalli',
      'tirupathur','tiruppur','tiruvallur','tiruvannamalai','tiruvarur','vellore',
      'viluppuram','virudhunagar'
    ]);

    wb.SheetNames.forEach(name => {
      if (name.toLowerCase().includes('master')) return;
      const ws   = wb.Sheets[name];
      const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
      // Only use sheet name as category for non-district special sheets (e.g. "Soapy football")
      const isDistrictSheet = TN_DISTRICTS.has(name.trim().toLowerCase());
      const sheetRows = data.map(r => normalizeRow(r, isDistrictSheet ? '' : name));
      allRaw = allRaw.concat(sheetRows);
    });

    if (!allRaw.length) return { success: false, message: 'No data found in file' };

    const rows = allRaw.filter(r => r.sportsPlaceName); // already normalized per-sheet

    console.log(`[ExcelSync] Prepared ${rows.length} rows for indexing.`);

    // Bulk operations
    const sportsPlaceOps = [];
    const leadOps = [];

    for (const r of rows) {
      const phone = r.phone || '';
      const sno = r.sno || '';
      const name = r.sportsPlaceName;
      const district = r.district;

      const placeData = {
        name,
        district,
        address: r.place,
        phone,
        sno,
        category: r.category || 'Other',
        contactAvailability: r.contactAvailability || 'Yes',
        source: 'excel_import',
      };

      const placeFilter = phone ? { phone } : { name, district, sno };
      
      sportsPlaceOps.push({
        insertOne: {
          document: placeData
        }
      });

      const leadData = {
        name,
        sportsPlaceName: name,
        phone,
        sno,
        district,
        category: r.category || 'Other',
        'location.address': r.place,
        source: 'excel_import',
        status: 'New Lead',
        contactAvailability: r.contactAvailability || 'Yes',
      };

      leadOps.push({
        insertOne: {
          document: leadData
        }
      });
    }

    console.log(`[ExcelSync] Running bulk update for ${rows.length} records...`);
    
    // Drop the collection to prevent compounding duplicates on resync
    try {
      await SportsPlace.deleteMany({});
      await Lead.deleteMany({});
    } catch(e) {}

    // Run in chunks to prevent memory issues
    const CHUNK_SIZE = 500;
    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const spChunk = sportsPlaceOps.slice(i, i + CHUNK_SIZE);
      const lChunk = leadOps.slice(i, i + CHUNK_SIZE);
      await Promise.all([
        SportsPlace.bulkWrite(spChunk, { ordered: false }),
        Lead.bulkWrite(lChunk, { ordered: false })
      ]);
      console.log(`[ExcelSync] Completed chunk ${Math.floor(i / CHUNK_SIZE) + 1} / ${Math.ceil(rows.length / CHUNK_SIZE)}`);
    }

    const batchId = `SYNC_${Date.now()}`;
    let skipped = 0;
    await ImportHistory.create({
      batchId,
      sourceFileName: path.basename(filePath),
      sourceType: 'auto-sync',
      totalRows: rows.length,
      imported: rows.length,
      duplicates: skipped,
      failed: 0,
      districts: Array.from(new Set(rows.map(r => r.district).filter(Boolean))),
      notes: 'Bulk auto-sync from server Excel watcher',
    }).catch(() => {});

    console.log(`[ExcelSync] Done — Total processed: ${rows.length}, Skipped: ${skipped}`);
    return { success: true, total: rows.length, skipped };
  } catch (err) {
    console.error('[ExcelSync] Error:', err.message);
    return { success: false, message: err.message };
  }
};

module.exports = { syncExcelToDB };
