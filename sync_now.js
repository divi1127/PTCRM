require('dotenv').config({ path: './server/.env' });
const mongoose = require('mongoose');
const { syncExcelToDB } = require('./server/utils/excelSync');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(async () => {
  console.log('MongoDB Connected');
  const result = await syncExcelToDB();
  console.log('Result:', result);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
