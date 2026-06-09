const mongoose = require('mongoose');
const { syncExcelToDB } = require('../utils/excelSync');
require('dotenv').config();

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    const result = await syncExcelToDB();
    console.log('Sync result:', result);
    process.exit(0);
  } catch (err) {
    console.error('Sync error:', err);
    process.exit(1);
  }
};
run();
