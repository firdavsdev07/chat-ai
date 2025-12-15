// Script to create example.xlsx file
import * as XLSX from 'xlsx';
import { mkdirSync, existsSync } from 'fs';

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
const salesData = [
  ['Month', 'Product', 'Quantity', 'Price', 'Total'],
  ['January', 'Laptop', 10, 1200, { f: 'C2*D2' }],
  ['January', 'Phone', 25, 800, { f: 'C3*D3' }],
  ['February', 'Laptop', 15, 1200, { f: 'C4*D4' }],
  ['February', 'Phone', 30, 800, { f: 'C5*D5' }],
  ['March', 'Laptop', 20, 1200, { f: 'C6*D6' }],
  ['March', 'Phone', 40, 800, { f: 'C7*D7' }],
  ['', '', '', 'Grand Total:', { f: 'SUM(E2:E7)' }],
];
const ws2 = XLSX.utils.aoa_to_sheet(salesData);
XLSX.utils.book_append_sheet(wb, ws2, 'Sales');

// Sheet 3: Inventory
const inventoryData = [
  ['Item', 'Category', 'Stock', 'Min Stock', 'Status'],
  ['Laptop', 'Electronics', 50, 10, { f: 'IF(C2>D2,"OK","Low")' }],
  ['Phone', 'Electronics', 5, 10, { f: 'IF(C3>D3,"OK","Low")' }],
  ['Desk', 'Furniture', 30, 5, { f: 'IF(C4>D4,"OK","Low")' }],
  ['Chair', 'Furniture', 100, 20, { f: 'IF(C5>D5,"OK","Low")' }],
  ['Monitor', 'Electronics', 8, 15, { f: 'IF(C6>D6,"OK","Low")' }],
];
const ws3 = XLSX.utils.aoa_to_sheet(inventoryData);
XLSX.utils.book_append_sheet(wb, ws3, 'Inventory');

// Write file
XLSX.writeFile(wb, 'data/example.xlsx');

console.log('✅ data/example.xlsx created successfully!');
console.log('Sheets: Users, Sales, Inventory');
