const XLSX = require('xlsx');
const path = require('path');
const filePath = 'c:\\jod tech\\PTcrm\\TamilNadu_Sports_Data.xlsx';
try {
  const wb = XLSX.readFile(filePath);
  console.log('Sheet Names:', wb.SheetNames);
  wb.SheetNames.forEach(name => {
    const ws = wb.Sheets[name];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
    console.log(`Sheet: ${name}, Headers:`, data[0]);
  });
} catch (err) {
  console.error('Error reading Excel sheets:', err.message);
}
