import { jsPDF } from 'jspdf';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import type { CoverLetter } from '../types';

export async function exportToPDF(letter: CoverLetter): Promise<void> {
  const doc = new jsPDF();
  
  // Set font
  doc.setFont('helvetica');
  
  // Add content with proper formatting
  const lines = letter.content.split('\n');
  let y = 20;
  const lineHeight = 7;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  
  lines.forEach((line) => {
    // Check if we need a new page
    if (y > pageHeight - margin) {
      doc.addPage();
      y = 20;
    }
    
    // Handle long lines by splitting them
    const splitLines = doc.splitTextToSize(line || ' ', 170);
    splitLines.forEach((splitLine: string) => {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = 20;
      }
      doc.text(splitLine, 20, y);
      y += lineHeight;
    });
  });
  
  // Generate filename
  const filename = generateFilename(letter, 'pdf');
  
  // Save the PDF
  doc.save(filename);
}

export async function exportToDOCX(letter: CoverLetter): Promise<void> {
  // Split content into paragraphs
  const paragraphs = letter.content.split('\n').map(line => 
    new Paragraph({
      children: [new TextRun(line || ' ')],
      spacing: {
        after: 200,
      },
    })
  );
  
  // Create document
  const doc = new Document({
    sections: [{
      properties: {},
      children: paragraphs,
    }],
  });
  
  // Generate blob
  const blob = await Packer.toBlob(doc);
  
  // Generate filename
  const filename = generateFilename(letter, 'docx');
  
  // Download
  downloadBlob(blob, filename);
}

export function exportToText(letter: CoverLetter): void {
  // Create blob from content
  const blob = new Blob([letter.content], { type: 'text/plain' });
  
  // Generate filename
  const filename = generateFilename(letter, 'txt');
  
  // Download
  downloadBlob(blob, filename);
}

function generateFilename(letter: CoverLetter, extension: string): string {
  const jobTitle = letter.metadata.jobTitle.replace(/[^a-z0-9]/gi, '_');
  const company = letter.metadata.companyName.replace(/[^a-z0-9]/gi, '_');
  return `CoverLetter_${company}_${jobTitle}.${extension}`;
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
