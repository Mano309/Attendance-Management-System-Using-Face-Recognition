// Utility to parse Excel files to JSON
import * as XLSX from "xlsx";

export function parseStudentsExcel(buffer: Buffer): any[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  // Optionally, map/validate fields here
  return json;
}

export function parseFacultyExcel(buffer: Buffer): any[] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  // Optionally, map/validate fields here
  return json;
}
