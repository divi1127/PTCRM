const XLSX = require('xlsx');
const path = require('path');
const filePath = 'c:\\jod tech\\PTcrm\\TamilNadu_Sports_Data.xlsx';
try {
  const wb = XLSX.readFile(filePath);
  const sheet = wb.Sheets['Ariyalur'];
  if (sheet) {
    const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    console.log('Total rows in Ariyalur:', data.length);
    console.log('First 5 rows of Ariyalur:', JSON.stringify(data.slice(0, 5), null, 2));
  } else {
    console.log('Ariyalur sheet not found');
  }
} catch (err) {
  console.error('Error:', err.message);
}
