// Script to create example.xlsx file
import * as XLSX from 'xlsx';
import { mkdirSync, existsSync, writeFileSync } from 'fs';

// Ensure data directory exists
if (!existsSync('data')) {
  mkdirSync('data', { recursive: true });
}

// Create workbook
const wb = XLSX.utils.book_new();

// Sheet 1: Users
const usersData = [
  ['ID', 'Name', 'Email', 'Department', 'Salary'],
  [1, 'Firdavs', 'firdavs@example.com', 'Engineering', 5000],
  [2, 'Jasur', 'jasur@example.com', 'Marketing', 4500],
  [3, 'Nodira', 'nodira@example.com', 'HR', 4000],
  [4, 'Bekzod', 'bekzod@example.com', 'Engineering', 5500],
  [5, 'Dilnoza', 'dilnoza@example.com', 'Finance', 4800],
];
const ws1 = XLSX.utils.aoa_to_sheet(usersData);
XLSX.utils.book_append_sheet(wb, ws1, 'Users');

// Sheet 2: Sales
// Create manually to ensure formulas are correct
const ws2 = XLSX.utils.aoa_to_sheet([
  ['Month', 'Product', 'Quantity', 'Price', 'Total'],
  ['January', 'Laptop', 10, 1200, 0], // Placeholder for total
  ['January', 'Phone', 25, 800, 0],
  ['February', 'Laptop', 15, 1200, 0],
  ['February', 'Phone', 30, 800, 0],
  ['March', 'Laptop', 20, 1200, 0],
  ['March', 'Phone', 40, 800, 0],
  ['', '', '', 'Grand Total:', 0],
]);

// Set formulas explicitly
ws2['E2'] = { t: 'n', f: 'C2*D2', v: 12000 };
ws2['E3'] = { t: 'n', f: 'C3*D3', v: 20000 };
ws2['E4'] = { t: 'n', f: 'C4*D4', v: 18000 };
ws2['E5'] = { t: 'n', f: 'C5*D5', v: 24000 };
ws2['E6'] = { t: 'n', f: 'C6*D6', v: 24000 };
ws2['E7'] = { t: 'n', f: 'C7*D7', v: 32000 };
ws2['E8'] = { t: 'n', f: 'SUM(E2:E7)', v: 130000 };

XLSX.utils.book_append_sheet(wb, ws2, 'Sales');

// Sheet 3: Inventory
const inventoryData = [
  ['Item', 'Category', 'Stock', 'Min Stock', 'Status'],
  ['Laptop', 'Electronics', 50, 10, 'OK'],
  ['Phone', 'Electronics', 5, 10, 'Low'],
  ['Desk', 'Furniture', 30, 5, 'OK'],
  ['Chair', 'Furniture', 100, 20, 'OK'],
  ['Monitor', 'Electronics', 8, 15, 'Low'],
];
const ws3 = XLSX.utils.aoa_to_sheet(inventoryData);

// Inventory formulas
ws3['E2'] = { t: 's', f: 'IF(C2>D2,"OK","Low")', v: 'OK' };
ws3['E3'] = { t: 's', f: 'IF(C3>D3,"OK","Low")', v: 'Low' };
ws3['E4'] = { t: 's', f: 'IF(C4>D4,"OK","Low")', v: 'OK' };
ws3['E5'] = { t: 's', f: 'IF(C5>D5,"OK","Low")', v: 'OK' };
ws3['E6'] = { t: 's', f: 'IF(C6>D6,"OK","Low")', v: 'Low' };

XLSX.utils.book_append_sheet(wb, ws3, 'Inventory');

// Write file
const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
writeFileSync('data/example.xlsx', buffer);

console.log('✅ data/example.xlsx re-created successfully with explicit formulas!');
