import jsPDF from 'jspdf';
import html2canvas from 'html2canvas'; // Kita tambahkan lagi import ini
import { formatDate } from './format';

// ============================================================================
// FUNGSI BARU: Untuk Ekspor Tabel yang Rapi (digunakan di Penjualan, Pembelian, dll)
// ============================================================================
interface TableExportConfig {
  data: any[];
  columns: { title: string; dataKey: string }[];
  title: string;
  filename: string;
  companyInfo: {
    name: string;
    address?: string;
  };
}

export const exportDataTableAsPDF = ({ 
  data, 
  columns, 
  title, 
  filename, 
  companyInfo 
}: TableExportConfig) => {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const head = [columns.map(col => col.title)];
    const body = data.map(row => columns.map(col => row[col.dataKey] ?? '-'));

    (doc as any).autoTable({
      head: head,
      body: body,
      startY: 32,
      theme: 'grid',
      styles: { font: 'helvetica', fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
      headStyles: { fillColor: [3, 105, 161], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [241, 245, 249] },
      margin: { top: 30 },
      didDrawPage: (data) => {
        // HEADER
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(companyInfo.name, data.settings.margin.left, 15);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(title, data.settings.margin.left, 22);
        doc.setFontSize(8);
        const reportDate = `Dicetak pada: ${formatDate(new Date())}`;
        doc.text(reportDate, doc.internal.pageSize.getWidth() - data.settings.margin.right, 15, { align: 'right' });
        if (companyInfo.address) {
          doc.text(companyInfo.address, doc.internal.pageSize.getWidth() - data.settings.margin.right, 22, { align: 'right' });
        }

        // FOOTER
        const pageCount = (doc as any).internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.text(`Halaman ${data.pageNumber} dari ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.getHeight() - 10);
        doc.text('FINTracks Ultimate © 2024', doc.internal.pageSize.getWidth() - data.settings.margin.right, doc.internal.pageSize.getHeight() - 10, { align: 'right' });
      },
    });

    doc.save(filename);

  } catch (error) {
    console.error("Gagal membuat PDF tabel:", error);
  }
};

// ============================================================================
// FUNGSI LAMA: Untuk Ekspor Visual/Screenshot (digunakan di Dashboard)
// ============================================================================
interface PDFExportOptions {
  filename: string;
  title: string;
  orientation?: 'portrait' | 'landscape';
  format?: 'a4' | 'letter';
  includeHeader?: boolean;
  includeFooter?: boolean;
  companyInfo?: { name: string; address?: string; phone?: string; email?: string; };
}

export const exportToPDF = async (elementId: string, options: PDFExportOptions): Promise<void> => {
  // Ini adalah kode lama Anda yang kita kembalikan lagi
  try {
    const element = document.getElementById(elementId);
    if (!element) throw new Error(`Element with id "${elementId}" not found`);
    const canvas = await html2canvas(element, { scale: 2, useCORS: true, allowTaint: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: options.orientation || 'portrait', unit: 'mm', format: options.format || 'a4' });
    const imgWidth = 210;
    const pageHeight = 295;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    pdf.save(options.filename);
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    throw new Error('Gagal mengeksport PDF. Silakan coba lagi.');
  }
};