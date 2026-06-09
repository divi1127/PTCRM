const XLSX = require('xlsx');
const path = require('path');
const filePath = 'c:\\jod tech\\PTcrm\\TamilNadu_Sports_Data.xlsx';
try {
  const wb = XLSX.readFile(filePath);
  let total = 0;
  wb.SheetNames.forEach(name => {
    if (name.toLowerCase().includes('master')) return;
    const ws = wb.Sheets[name];
    const data = XLSX.utils.sheet_to_json(ws);
    console.log(`Sheet: ${name}, Rows: ${data.length}`);
    total += data.length;
  });
  console.log('Total across all sheets (excluding master):', total);
} catch (err) {
  console.error('Error:', err.message);
}
