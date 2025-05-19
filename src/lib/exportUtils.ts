import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Add autoTable to jsPDF prototype
// This is necessary because TypeScript doesn't recognize the plugin extension
type AutoTablePlugin = {
  autoTable: (options: any) => jsPDF;
};

// Extend jsPDF with autoTable
type jsPDFWithAutoTable = jsPDF & AutoTablePlugin;

// Generic interface for table data
export interface TableColumn {
  header: string;
  accessor: string;
  format?: (value: any) => string;
}

/**
 * Export data to PDF
 * @param columns Column definitions with header and accessor
 * @param data Array of data objects
 * @param fileName Name of the file to download
 * @param title Optional title for the PDF
 */
export const exportToPdf = (
  columns: TableColumn[],
  data: any[],
  fileName: string,
  title?: string
): void => {
  // Initialize PDF document
  const doc = new jsPDF() as jsPDFWithAutoTable;
  
  // Add title if provided
  if (title) {
    doc.setFontSize(18);
    doc.text(title, 14, 22);
    doc.setFontSize(12);
  }

  // Prepare table headers and rows
  const headers = columns.map(column => column.header);
  
  const rows = data.map(item => {
    return columns.map(column => {
      const value = getNestedValue(item, column.accessor);
      return column.format ? column.format(value) : String(value || '');
    });
  });

  // Apply autoTable plugin
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: title ? 30 : 14,
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
    margin: { top: 20 },
  });

  // Save the PDF
  doc.save(`${fileName}.pdf`);
};

/**
 * Export data to Excel
 * @param columns Column definitions with header and accessor
 * @param data Array of data objects
 * @param fileName Name of the file to download
 * @param sheetName Optional sheet name
 */
export const exportToExcel = (
  columns: TableColumn[],
  data: any[],
  fileName: string,
  sheetName: string = 'Sheet1'
): void => {
  // Prepare headers
  const headers = columns.map(column => column.header);
  
  // Prepare rows with formatted data
  const rows = data.map(item => {
    return columns.map(column => {
      const value = getNestedValue(item, column.accessor);
      return column.format ? column.format(value) : value;
    });
  });

  // Create worksheet with headers and data
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  
  // Create workbook and add the worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  
  // Generate Excel file and trigger download
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
};

/**
 * Helper function to get nested object values using dot notation
 * @param obj The object to extract value from
 * @param path Path to the value using dot notation (e.g., 'user.name')
 * @returns The value at the specified path
 */
const getNestedValue = (obj: any, path: string): any => {
  if (!obj || !path) return '';
  
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined) return '';
    result = result[key];
  }
  
  return result;
};

/**
 * Format date values for display
 * @param dateString Date string or Date object
 * @returns Formatted date string
 */
export const formatDate = (dateString: string | Date): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format currency values for display
 * @param value Numeric value
 * @param currency Currency code (default: USD)
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number, currency: string = 'USD'): string => {
  if (value === null || value === undefined) return '';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value);
};
