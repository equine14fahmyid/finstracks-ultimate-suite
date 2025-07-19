// src/utils/pdfExport.ts (Kode Final)

// Kita TIDAK lagi meng-import jsPDF di sini, karena akan kita ambil dari window
// import jsPDF from 'jspdf'; 
import { formatDate } from './format';

// Deklarasikan jsPDF di scope global untuk TypeScript
declare const jsPDF: any;

// Interface untuk konfigurasi ekspor tabel (tidak berubah)
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

/**
 * Fungsi BARU untuk membuat PDF dari data tabel dengan tampilan modern.
 * Menggunakan jspdf-autotable dari window.
 */
export const exportDataTableAsPDF = ({ 
  data, 
  columns, 
  title, 
  filename, 
  companyInfo 
}: TableExportConfig) => {
  try {
    // [PERBAIKAN UTAMA] Buat instance jsPDF dari objek global 'window'
    const doc = new (window as any).jspdf.jsPDF({
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
      didDrawPage: (data: any) => {
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


// Note: Fungsi exportToPDF (screenshot) sengaja dihilangkan untuk sementara
// agar kita fokus pada perbaikan fitur tabel. Kita bisa tambahkan lagi nanti jika diperlukan.