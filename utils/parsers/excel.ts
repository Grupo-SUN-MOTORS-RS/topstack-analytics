import * as XLSX from 'xlsx';

/**
 * Converts Excel file to CSV string
 */
export const excelToCsv = async (file: File | ArrayBuffer): Promise<string> => {
  let workbook: XLSX.WorkBook;
  
  if (file instanceof File) {
    const arrayBuffer = await file.arrayBuffer();
    workbook = XLSX.read(arrayBuffer, { type: 'array' });
  } else {
    workbook = XLSX.read(file, { type: 'array' });
  }
  
  // Get first sheet
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Convert to CSV
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  
  return csv;
};

/**
 * Converts Excel file (from URL/path) to CSV string
 */
export const excelUrlToCsv = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return excelToCsv(arrayBuffer);
};
