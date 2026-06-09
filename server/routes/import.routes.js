const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { previewImport, importLeads, reassignLeads, getBatches, getImportHistory } = require('../controllers/importController');
const { syncExcelToDB } = require('../utils/excelSync');

// Multer config — accept xlsx & csv only, 20 MB max
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, `import_${Date.now()}${path.extname(file.originalname)}`),
});
const fileFilter = (req, file, cb) => {
  const allowed = ['.xlsx', '.xls', '.csv'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Only .xlsx, .xls and .csv files are allowed'));
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 20 * 1024 * 1024 } });

router.post('/preview', protect, adminOnly, upload.single('file'), previewImport);
router.post('/leads',   protect, adminOnly, upload.single('file'), importLeads);
router.post('/reassign', protect, adminOnly, reassignLeads);
router.get('/batches',   protect, adminOnly, getBatches);
router.get('/history',   protect, adminOnly, getImportHistory);
router.post('/sync',     protect, adminOnly, async (req, res) => {
  const result = await syncExcelToDB();
  res.json(result);
});

module.exports = router;
