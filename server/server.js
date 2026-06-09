require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const { syncExcelToDB } = require('./utils/excelSync');

const app = express();
connectDB();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth',      require('./routes/auth.routes'));
app.use('/api/users',     require('./routes/user.routes'));
app.use('/api/leads',     require('./routes/lead.routes'));
app.use('/api/bookings',  require('./routes/booking.routes'));
app.use('/api/shop',      require('./routes/shop.routes'));
app.use('/api/marketing', require('./routes/marketing.routes'));
app.use('/api/attendance', require('./routes/attendance.routes'));
app.use('/api/meetings',  require('./routes/meeting.routes'));
app.use('/api/targets',   require('./routes/target.routes'));
app.use('/api/reports',   require('./routes/report.routes'));
app.use('/api/import',    require('./routes/import.routes'));
app.use('/api/clients',       require('./routes/client.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));

const watchExcelFile = () => {
  const candidates = [
    path.join(__dirname, '../TamilNadu_Sports_Data.xlsx'),
    path.join(__dirname, 'TamilNadu_Sports_Data.xlsx'),
  ];
  const filePath = candidates.find(p => fs.existsSync(p));
  if (!filePath) return;

  let lastMtime = fs.statSync(filePath).mtimeMs;
  console.log('[ExcelSync] Watching Excel file for changes:', filePath);
  syncExcelToDB();

  fs.watchFile(filePath, { interval: 3000 }, async (curr, prev) => {
    if (curr.mtimeMs > prev.mtimeMs && curr.mtimeMs !== lastMtime) {
      lastMtime = curr.mtimeMs;
      console.log('[ExcelSync] Change detected, syncing Excel file...');
      await syncExcelToDB();
    }
  });
};

watchExcelFile();

app.get('/', (req, res) => res.json({ message: 'Play Time CRM API running ✅' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
