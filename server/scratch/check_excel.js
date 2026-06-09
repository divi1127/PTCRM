const XLSX = require('xlsx');
const path = require('path');
const filePath = 'c:\\jod tech\\PTcrm\\TamilNadu_Sports_Data.xlsx';
try {
  const wb = XLSX.readFile(filePath);
  const firstSheetName = wb.SheetNames[0];
  const worksheet = wb.Sheets[firstSheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  console.log('Headers of first sheet:', data[0]);
  if (data.length > 1) {
    console.log('First row of data:', data[1]);
  }
} catch (err) {
  console.error('Error reading Excel headers:', err.message);
}
