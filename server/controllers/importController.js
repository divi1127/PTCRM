const XLSX = require('xlsx');
const Lead = require('../models/Lead');
const User = require('../models/User');
const SportsPlace = require('../models/SportsPlace');
const ImportHistory = require('../models/ImportHistory');
const path = require('path');
const fs = require('fs');

const normalizeRow = (r, idx) => {
  const keys = Object.keys(r);
  const get = (...candidates) => {
    for (const c of candidates) {
      const k = keys.find(k => k.trim().toLowerCase() === c.toLowerCase());
      if (k !== undefined) return String(r[k]).trim();
    }
    return '';
  };

  return {
    rowIndex: idx + 2,
    sno: get('s.no', 'sno', 's no', 'sl no', 'serial'),
    sportsPlaceName: get('sports place name', 'sports place', 'place name', 'name'),
    district: get('district'),
    place: get('place', 'area', 'location', 'address'),
    phone: get('contact number', 'contact no', 'phone', 'mobile', 'contact'),
    category: get('category', 'type', 'sport'),
    contactAvailability: get('contact available', 'contact availability', 'available') || 'Yes',
  };
};

const buildImportSummary = (rows, inserted, failed, dupCount) => ({
  totalRows: rows.length,
  validRows: rows.filter(r => r.phone && r.sportsPlaceName).length,
  duplicates: dupCount,
  imported: inserted,
  failed,
});

const previewImport = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  try {
    const wb = XLSX.readFile(req.file.path, { cellDates: true });
    let allRaw = [];
    wb.SheetNames.forEach(name => {
      if (name.toLowerCase().includes('master')) return;
      const ws = wb.Sheets[name];
      const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
      allRaw = allRaw.concat(data);
    });

    fs.unlink(req.file.path, () => {});

    if (!allRaw.length) return res.status(400).json({ message: 'File is empty or unreadable' });

    const rows = allRaw.map(normalizeRow);
    const seenPhones = new Set();
    const seenSnos = new Set();

    const preview = rows.map(r => {
      const isDupInFile = (r.phone && seenPhones.has(r.phone)) || (r.sno && seenSnos.has(r.sno));
      if (r.phone) seenPhones.add(r.phone);
      if (r.sno) seenSnos.add(r.sno);
      return { ...r, isDupInFile };
    });

    res.json({ total: preview.length, rows: preview });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const importLeads = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  try {
    // commit flag: when true, create Lead records in addition to upserting SportsPlace master records
    const commit = (req.query.commit === 'true') || (req.body && req.body.commit === true);
    const wb = XLSX.readFile(req.file.path, { cellDates: true });
    let allRaw = [];
    wb.SheetNames.forEach(name => {
      if (name.toLowerCase().includes('master')) return;
      const ws = wb.Sheets[name];
      const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
      allRaw = allRaw.concat(data);
    });
    fs.unlink(req.file.path, () => {});

    if (!allRaw.length) return res.status(400).json({ message: 'File is empty or unreadable' });

    const rows = allRaw.map(normalizeRow);
    const validRows = rows.filter(r => r.phone && r.sportsPlaceName);

    if (!validRows.length) {
      return res.status(400).json({ message: 'No valid rows with name + contact found' });
    }

    // Only detect duplicates within the same file, allow database records to be updated
    const filePhoneSet = new Set();
    const fileSnoSet = new Set();
    const uniqueRows = [];
    let dupCount = 0;

    for (const row of validRows) {
      // Only skip if duplicate in the same file
      const isDupInFile = (row.phone && filePhoneSet.has(row.phone)) ||
        (row.sno && row.sno && fileSnoSet.has(row.sno));

      if (isDupInFile) {
        dupCount++;
        continue;
      }

      if (row.phone) filePhoneSet.add(row.phone);
      if (row.sno) fileSnoSet.add(row.sno);
      uniqueRows.push(row);
    }

    const employees = await User.find({ role: 'employee', isActive: true }).select('_id name');
    const byDistrict = {};
    for (const row of uniqueRows) {
      const district = (row.district || 'Unknown').trim();
      if (!byDistrict[district]) byDistrict[district] = [];
      byDistrict[district].push(row);
    }

    const batchId = `BATCH_${Date.now()}`;
    const leadsToInsert = [];
    const sportsPlaceUpserts = [];

    for (const [district, districtRows] of Object.entries(byDistrict)) {
      let empIndex = 0;
      for (const row of districtRows) {
        const assignedEmployee = employees.length ? employees[empIndex % employees.length] : null;
        empIndex++;

        const placeData = {
          name: row.sportsPlaceName,
          district,
          address: row.place || district,
          phone: row.phone,
          sno: row.sno || '',
          category: row.category || 'other',
          contactAvailability: row.contactAvailability || 'Yes',
          source: 'excel_import',
          importBatch: batchId,
        };

        sportsPlaceUpserts.push({
          updateOne: {
            filter: row.sno
              ? { $or: [{ phone: row.phone }, { sno: row.sno }] }
              : { phone: row.phone },
            update: { $set: placeData },
            upsert: true,
          }
        });

        leadsToInsert.push({
          name: row.sportsPlaceName,
          sportsPlaceName: row.sportsPlaceName,
          phone: row.phone,
          sno: row.sno || '',
          district,
          category: row.category || 'other',
          location: { address: row.place || district },
          contactAvailability: row.contactAvailability || 'Yes',
          source: 'excel_import',
          status: 'New Lead',
          leadType: 'Offline',
          sport: 'other',
          assignedTo: assignedEmployee?._id || null,
          importBatch: batchId,
        });
      }
    }

    // Always persist/update master SportsPlace records first
    if (sportsPlaceUpserts.length) {
      await SportsPlace.bulkWrite(sportsPlaceUpserts, { ordered: false }).catch(err => {
        console.error('[Import] SportsPlace bulkWrite error:', err?.message || err);
      });
    }

    // If commit is not set, skip creating Lead documents and only save master table
    let inserted = 0;
    let updated = 0;
    let failed = 0;
    if (commit) {
      try {
        const leadOps = leadsToInsert.map(l => {
          const filter = l.sno ? { $or: [{ phone: l.phone }, { sno: l.sno }] } : { phone: l.phone };
          return {
            updateOne: {
              filter,
              update: { $set: l },
              upsert: true,
            }
          };
        });

        if (leadOps.length) {
          const bulkRes = await Lead.bulkWrite(leadOps, { ordered: false });
          inserted = bulkRes.upsertedCount || bulkRes.nUpserted || 0;
          updated = bulkRes.modifiedCount || bulkRes.nModified || 0;
        }
      } catch (err) {
        console.error('[Import] Lead bulkWrite error:', err.message);
        failed = leadsToInsert.length - (inserted + updated);
      }
    }

    const history = await ImportHistory.create({
      batchId,
      sourceFileName: req.file.originalname,
      sourceType: commit ? 'upload' : 'upload-master',
      totalRows: rows.length,
      imported: inserted + updated,
      duplicates: dupCount,
      failed,
      districts: Object.keys(byDistrict),
      createdBy: req.user ? req.user._id : null,
    });

    res.json({
      batchId,
      summary: buildImportSummary(rows, inserted + updated, failed, dupCount),
      districtBreakdown: Object.fromEntries(Object.entries(byDistrict).map(([d, arr]) => [d, arr.length])),
      historyId: history._id,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const reassignLeads = async (req, res) => {
  try {
    const { leadIds, employeeId, batchId, district } = req.body;
    const filter = {};
    if (leadIds?.length) filter._id = { $in: leadIds };
    else if (batchId) filter.importBatch = batchId;
    if (district) filter.district = district;

    const result = await Lead.updateMany(filter, { assignedTo: employeeId });
    res.json({ updated: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getBatches = async (req, res) => {
  try {
    const batches = await Lead.aggregate([
      { $match: { importBatch: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$importBatch',
          count: { $sum: 1 },
          districts: { $addToSet: '$district' },
          createdAt: { $max: '$createdAt' },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);
    res.json(batches);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getImportHistory = async (req, res) => {
  try {
    const history = await ImportHistory.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('createdBy', 'name email');
    res.json(history);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { previewImport, importLeads, reassignLeads, getBatches, getImportHistory };
