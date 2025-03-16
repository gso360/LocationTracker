import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import type { Location, Barcode, Project } from "@shared/schema";
import { formatDate } from './utils';

// Helper function to generate a filename from project data
const getFileName = (project?: Project | null) => {
  const date = new Date().toLocaleString().replace(/[/:\\]/g, '-');
  if (!project) return `Inventory-${date}`;
  
  // Include Showroom Name, Date, and Scanner's Name in the file name
  const showroomName = project.name || 'Unknown';
  const scannerName = project.scannerName || 'Unknown';
  
  return `${showroomName}-${date}-${scannerName}`.replace(/[/:\\]/g, '-');
};

// Generate an Excel/CSV report with all barcodes and their locations
export const generateExcelReport = async (
  data: (Location & { barcodes: Barcode[] })[],
  projectData?: Project | null
): Promise<string> => {
  // Sort locations by GroupID numerically ascending
  const sortedData = [...data].sort((a, b) => {
    // Parse as numbers if possible for proper numeric sorting
    const numA = parseInt(a.name);
    const numB = parseInt(b.name);
    
    // If both are valid numbers, compare numerically
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    
    // Otherwise, fall back to string comparison
    return a.name.localeCompare(b.name);
  });
  
  // Flatten the data structure for Excel
  const rows: any[] = [];
  
  sortedData.forEach(location => {
    if (location.barcodes.length === 0) {
      // Include locations even without barcodes
      rows.push({
        'Barcode': '',
        'GroupID': location.name,
        'Notes': location.notes || '',
        'Created': formatDate(new Date(location.createdAt))
      });
    } else {
      location.barcodes.forEach(barcode => {
        rows.push({
          'Barcode': barcode.value,
          'GroupID': location.name,
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
    { wch: 20 }, // Barcode
    { wch: 15 }, // GroupID
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
  const filename = `GroupID_${getFileName(projectData)}.xlsx`;
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
  data: (Location & { barcodes: Barcode[] })[], 
  projectData?: Project | null
): Promise<string> => {
  // Sort GroupIDs in ascending order (lowest first)
  const sortedData = [...data].sort((a, b) => {
    // Parse as numbers if possible for proper numeric sorting
    const numA = parseInt(a.name);
    const numB = parseInt(b.name);
    
    // If both are valid numbers, compare numerically
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB;
    }
    
    // Otherwise, fall back to string comparison
    return a.name.localeCompare(b.name);
  });
  
  // Create PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // Add title
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0); // Black
  doc.text('Virtual Showroom Location ID Form', 105, 15, { align: 'center' });
  
  // Project information (using available data or defaults)
  const projectInfo = {
    name: projectData ? projectData.name : 'Not specified',
    scanDate: formatDate(new Date()),
    scannerName: projectData?.scannerName || 'Not specified',
    tourId: projectData?.tourId || 'Not specified',
    groupIdType: projectData?.groupIdType || 'GroupID (1-400)'
  };
  
  // Create showroom info table
  doc.setLineWidth(0.2);
  doc.setDrawColor(0);
  
  // Table header with showroom info
  // First row
  doc.rect(20, 25, 85, 10);
  doc.rect(105, 25, 85, 10);
  doc.setFontSize(10);
  doc.text('Showroom Name', 22, 31);
  doc.text('Date', 107, 31);
  
  // Second row
  doc.rect(20, 35, 85, 10);
  doc.rect(105, 35, 85, 10);
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text(projectInfo.name, 22, 41);
  doc.text(projectInfo.scanDate, 107, 41);
  
  // Third row
  doc.rect(20, 45, 85, 10);
  doc.rect(105, 45, 85, 10);
  doc.text('Tour ID', 22, 51);
  doc.text('Group ID Type', 107, 51);
  
  // Fourth row
  doc.rect(20, 55, 85, 10);
  doc.rect(105, 55, 85, 10);
  doc.text(projectInfo.tourId, 22, 61);
  doc.text(projectInfo.groupIdType, 107, 61);
  
  // Add each location with photo
  let yPos = 75;
  
  for (let i = 0; i < sortedData.length; i++) {
    const location = sortedData[i];
    
    // Check if we need a new page
    if (yPos > 230) {
      doc.addPage();
      yPos = 20;
    }
    
    // Add location image if available
    if (location.imageData) {
      try {
        // Set image dimensions to maintain aspect ratio but fit within bounds
        const imgWidth = 80; // Fixed width in mm
        const imgHeight = 60; // Fixed height for consistent layout
        
        doc.addImage(location.imageData, 'JPEG', 20, yPos, imgWidth, imgHeight);
        
        // Add GroupID number on the right side
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text(location.name, 170, yPos + 30, { align: 'center' });
        
        yPos += imgHeight + 15; // Move down for next image
      } catch (error) {
        // If image loading fails, add a placeholder text
        doc.setFillColor(240, 240, 240);
        doc.rect(20, yPos, 80, 60, 'F');
        doc.setFontSize(12);
        doc.setTextColor(150, 150, 150);
        doc.text('Image not available', 60, yPos + 30, { align: 'center' });
        
        // Still show the GroupID number
        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text(location.name, 170, yPos + 30, { align: 'center' });
        
        yPos += 75;
      }
    } else {
      // No image placeholder
      doc.setFillColor(240, 240, 240);
      doc.rect(20, yPos, 80, 60, 'F');
      doc.setFontSize(12);
      doc.setTextColor(150, 150, 150);
      doc.text('No image available', 60, yPos + 30, { align: 'center' });
      
      // Still show the GroupID number
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text(location.name, 170, yPos + 30, { align: 'center' });
      
      yPos += 75;
    }
    
    // If we have notes, add them in a smaller font
    if (location.notes) {
      doc.setFontSize(8);
      doc.setTextColor(80, 80, 80);
      
      // Split notes if too long
      const maxWidth = 150;
      const lines = doc.splitTextToSize(location.notes, maxWidth);
      doc.text(lines, 20, yPos - 10);
      
      if (lines.length > 1) {
        yPos += lines.length * 4; // Add space for multi-line notes
      }
    }
    
    // If we have barcodes, list them
    if (location.barcodes && location.barcodes.length > 0) {
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text(`Barcodes: ${location.barcodes.map(b => b.value).join(", ")}`, 20, yPos - 5);
    }
  }
  
  // Generate a filename with showroom name, date, and scanner name
  const filename = `GroupID_${getFileName(projectData)}.pdf`;
  doc.save(filename);
  
  return filename;
};