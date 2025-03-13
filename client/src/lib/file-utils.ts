import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import type { Location, Barcode } from "@shared/schema";
import { formatDate } from './utils';

// Generate an Excel/CSV report with all barcodes and their locations
export const generateExcelReport = async (
  data: (Location & { barcodes: Barcode[] })[]
): Promise<string> => {
  // Flatten the data structure for Excel
  const rows: any[] = [];
  
  data.forEach(location => {
    if (location.barcodes.length === 0) {
      // Include locations even without barcodes
      rows.push({
        'Location ID': location.name,
        'Barcode': '',
        'Notes': location.notes || '',
        'Created': formatDate(new Date(location.createdAt))
      });
    } else {
      location.barcodes.forEach(barcode => {
        rows.push({
          'Location ID': location.name,
          'Barcode': barcode.value,
          'Notes': location.notes || '',
          'Created': formatDate(new Date(location.createdAt))
        });
      });
    }
  });
  
  // Create workbook and worksheet
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventory');
  
  // Auto-size columns
  const colWidths = [
    { wch: 15 }, // Location ID
    { wch: 20 }, // Barcode
    { wch: 30 }, // Notes
    { wch: 15 }  // Created
  ];
  worksheet['!cols'] = colWidths;
  
  // Generate the Excel file
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  
  // Convert to Blob and create download link
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  
  // Create download element
  const filename = `inventory_report_${new Date().toISOString().split('T')[0]}.xlsx`;
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  return filename;
};

// Generate a PDF report with location photos
export const generatePDFReport = async (
  data: Location[]
): Promise<string> => {
  // Create PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Add title
  doc.setFontSize(18);
  doc.setTextColor(45, 55, 72); // Dark gray
  doc.text('Inventory Location Report', 105, 15, { align: 'center' });
  doc.setDrawColor(45, 85, 255); // Blue
  doc.line(20, 20, 190, 20);
  
  // Add generation date
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on ${formatDate(new Date())}`, 105, 25, { align: 'center' });
  
  // Add each location
  let yPos = 35;
  
  for (let i = 0; i < data.length; i++) {
    const location = data[i];
    
    // Check if we need a new page
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    // Add location name
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Location #${location.name}`, 20, yPos);
    yPos += 7;
    
    // Add creation date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Created: ${formatDate(new Date(location.createdAt))}`, 20, yPos);
    yPos += 10;
    
    // Add location notes if any
    if (location.notes) {
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(`Notes: ${location.notes}`, 20, yPos);
      yPos += 10;
    }
    
    // Add location image if available
    if (location.imageData) {
      try {
        // Set image dimensions (max width 150mm, proportional height)
        const imgWidth = 150;
        const imgHeight = 100; // Assuming aspect ratio, adjust as needed
        
        doc.addImage(location.imageData, 'JPEG', 20, yPos, imgWidth, imgHeight);
        yPos += imgHeight + 15;
      } catch (error) {
        // If image loading fails, add a placeholder text
        doc.setFontSize(10);
        doc.setTextColor(200, 0, 0);
        doc.text('Error loading image', 20, yPos);
        yPos += 20;
      }
    } else {
      // No image placeholder
      doc.setFillColor(240, 240, 240);
      doc.rect(20, yPos, 150, 80, 'F');
      doc.setFontSize(12);
      doc.setTextColor(150, 150, 150);
      doc.text('No image available', 95, yPos + 40, { align: 'center' });
      yPos += 90;
    }
    
    // Add a separator line
    doc.setDrawColor(220, 220, 220);
    doc.line(20, yPos, 190, yPos);
    yPos += 15;
  }
  
  // Save the PDF
  const filename = `location_photo_report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
  
  return filename;
};
