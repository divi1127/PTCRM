const XLSX = require('xlsx');
const path = require('path');
const filePath = 'c:\\jod tech\\PTcrm\\TamilNadu_Sports_Data.xlsx';
try {
  const wb = XLSX.readFile(filePath);
  const masterSheetName = wb.SheetNames.find(n => n.toLowerCase().includes('master'));
  if (masterSheetName) {
    const ws = wb.Sheets[masterSheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
    console.log(`Master Sheet: ${masterSheetName}, Headers:`, data[0]);
    if (data.length > 1) console.log('First data row:', data[1]);
  } else {
    console.log('No Master sheet found');
  }
} catch (err) {
  console.error('Error reading Excel master sheet:', err.message);
}
