import jsPDF from 'jspdf';
// Kita tidak lagi meng-import autoTable, karena sudah dimuat dari index.html
// import autoTable from 'jspdf-autotable'; 
import { formatDate } from './format';

// Interface untuk konfigurasi ekspor tabel
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
 * Menggunakan jspdf-autotable.
 */
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

    // Memanggil autoTable yang sudah ada di 'window'
    (doc as any).autoTable({
      head: head,
      body: body,
      startY: 32, // Posisi tabel dimulai setelah header
      theme: 'grid', // Tema 'striped', 'grid', atau 'plain'
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [3, 105, 161], // Warna biru tua (sesuaikan dengan tema Anda)
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [241, 245, 249], // Warna abu-abu muda untuk baris ganjil
      },
      margin: { top: 30 },

      // Fungsi untuk menambahkan Header dan Footer di setiap halaman
      didDrawPage: (data) => {
        // ==== HEADER ====
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

        // ==== FOOTER ====
        const pageCount = (doc as any).internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.text(
          `Halaman ${data.pageNumber} dari ${pageCount}`,
          data.settings.margin.left,
          doc.internal.pageSize.getHeight() - 10
        );
        doc.text(
          'FINTracks Ultimate © 2024',
          doc.internal.pageSize.getWidth() - data.settings.margin.right,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'right' }
        );
      },
    });

    doc.save(filename);

  } catch (error) {
    console.error("Gagal membuat PDF:", error);
    // Anda bisa menambahkan toast notifikasi di sini jika diperlukan
  }
};