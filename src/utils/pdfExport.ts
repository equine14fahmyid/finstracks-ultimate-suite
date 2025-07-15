import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PDFExportOptions {
  filename: string;
  title: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'letter';
  includeHeader?: boolean;
  includeFooter?: boolean;
  companyInfo?: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
}

export const exportToPDF = async (
  elementId: string, 
  options: PDFExportOptions
): Promise<void> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    // Create canvas from HTML element
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      onclone: (clonedDoc) => {
        // Remove any print-only hidden elements
        const hiddenElements = clonedDoc.querySelectorAll('.print-hidden');
        hiddenElements.forEach(el => el.remove());
      }
    });

    const imgData = canvas.toDataURL('image/png');
    
    // Calculate dimensions
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;

    // Create PDF
    const pdf = new jsPDF({
      orientation: options.orientation || 'portrait',
      unit: 'mm',
      format: options.format || 'a4'
    });

    let position = 0;

    // Add header if requested
    if (options.includeHeader) {
      addPDFHeader(pdf, options);
      position += 30; // Space for header
    }

    // Add the content
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Add additional pages if content is longer than one page
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      
      if (options.includeHeader) {
        addPDFHeader(pdf, options);
        position += 30;
      }
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Add footer if requested
    if (options.includeFooter) {
      addPDFFooter(pdf, options);
    }

    // Save the PDF
    pdf.save(options.filename);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('Gagal mengeksport PDF. Silakan coba lagi.');
  }
};

const addPDFHeader = (pdf: jsPDF, options: PDFExportOptions): void => {
  const pageWidth = pdf.internal.pageSize.getWidth();
  
  // Company info
  if (options.companyInfo) {
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text(options.companyInfo.name, 20, 15);
    
    if (options.companyInfo.address || options.companyInfo.phone || options.companyInfo.email) {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      let yPos = 22;
      
      if (options.companyInfo.address) {
        pdf.text(options.companyInfo.address, 20, yPos);
        yPos += 5;
      }
      
      if (options.companyInfo.phone) {
        pdf.text(`Tel: ${options.companyInfo.phone}`, 20, yPos);
        yPos += 5;
      }
      
      if (options.companyInfo.email) {
        pdf.text(`Email: ${options.companyInfo.email}`, 20, yPos);
      }
    }
  }

  // Report title
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  const titleWidth = pdf.getTextWidth(options.title);
  pdf.text(options.title, (pageWidth - titleWidth) / 2, 15);

  // Date
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const currentDate = new Date().toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const dateWidth = pdf.getTextWidth(`Dicetak: ${currentDate}`);
  pdf.text(`Dicetak: ${currentDate}`, pageWidth - dateWidth - 20, 15);

  // Separator line
  pdf.setLineWidth(0.5);
  pdf.line(20, 25, pageWidth - 20, 25);
};

const addPDFFooter = (pdf: jsPDF, options: PDFExportOptions): void => {
  const pageCount = pdf.getNumberOfPages();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    
    // Footer line
    pdf.setLineWidth(0.5);
    pdf.line(20, pageHeight - 20, pageWidth - 20, pageHeight - 20);
    
    // Page number
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    const pageText = `Halaman ${i} dari ${pageCount}`;
    const pageTextWidth = pdf.getTextWidth(pageText);
    pdf.text(pageText, (pageWidth - pageTextWidth) / 2, pageHeight - 15);
    
    // Footer text
    const footerText = 'Dibuat dengan FINTracks Ultimate - Sistem Manajemen Keuangan';
    const footerTextWidth = pdf.getTextWidth(footerText);
    pdf.text(footerText, (pageWidth - footerTextWidth) / 2, pageHeight - 10);
  }
};

// Helper function to prepare element for PDF export
export const prepareElementForPDF = (elementId: string): void => {
  const element = document.getElementById(elementId);
  if (!element) return;

  // Add print styles
  element.style.backgroundColor = 'white';
  element.style.color = 'black';
  element.style.fontSize = '12px';
  element.style.lineHeight = '1.5';
  
  // Hide elements that shouldn't be in PDF
  const hideElements = element.querySelectorAll('.no-print, button, .print-hidden');
  hideElements.forEach(el => {
    (el as HTMLElement).style.display = 'none';
  });
};

// Helper function to restore element after PDF export
export const restoreElementAfterPDF = (elementId: string): void => {
  const element = document.getElementById(elementId);
  if (!element) return;

  // Remove inline styles
  element.style.removeProperty('background-color');
  element.style.removeProperty('color');
  element.style.removeProperty('font-size');
  element.style.removeProperty('line-height');
  
  // Show hidden elements
  const hiddenElements = element.querySelectorAll('.no-print, button, .print-hidden');
  hiddenElements.forEach(el => {
    (el as HTMLElement).style.removeProperty('display');
  });
};