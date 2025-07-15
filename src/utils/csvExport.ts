import Papa from 'papaparse';

interface CSVExportOptions {
  filename: string;
  headers?: string[];
  data: any[];
  includeHeaders?: boolean;
}

export const exportToCSV = (options: CSVExportOptions): void => {
  try {
    const { filename, data, headers, includeHeaders = true } = options;

    // Convert data to CSV format
    const csv = Papa.unparse(data, {
      header: includeHeaders,
      columns: headers,
      skipEmptyLines: true,
    });

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    throw new Error('Gagal mengeksport CSV. Silakan coba lagi.');
  }
};

interface CSVImportOptions {
  file: File;
  headers?: string[];
  skipFirstRow?: boolean;
  onProgress?: (progress: number) => void;
}

export const importFromCSV = (options: CSVImportOptions): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const { file, headers, skipFirstRow = true, onProgress } = options;

    Papa.parse(file, {
      header: !!headers,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
      // Remove step function as it's not working correctly with Papa Parse
      // onProgress will be called in complete callback
      complete: (results) => {
        try {
          if (onProgress) {
            onProgress(100); // Complete progress
          }

          let data = results.data;

          // Skip first row if needed and not using headers
          if (skipFirstRow && !headers) {
            data = data.slice(1);
          }

          // Apply custom headers if provided
          if (headers && !results.meta.fields) {
            data = data.map((row: any) => {
              const obj: any = {};
              headers.forEach((header, index) => {
                obj[header] = row[index];
              });
              return obj;
            });
          }

          resolve(data);
        } catch (error) {
          reject(new Error('Error processing CSV data: ' + error));
        }
      },
      error: (error) => {
        reject(new Error('Error parsing CSV: ' + error.message));
      }
    });
  });
};

// Utility function to validate CSV data structure
export const validateCSVData = (
  data: any[], 
  requiredFields: string[]
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data || data.length === 0) {
    errors.push('File CSV kosong atau tidak valid');
    return { isValid: false, errors };
  }

  // Check if required fields exist
  const firstRow = data[0];
  const availableFields = Object.keys(firstRow);
  
  requiredFields.forEach(field => {
    if (!availableFields.includes(field)) {
      errors.push(`Field yang diperlukan '${field}' tidak ditemukan`);
    }
  });

  // Check for empty required fields
  data.forEach((row, index) => {
    requiredFields.forEach(field => {
      if (!row[field] || row[field].toString().trim() === '') {
        errors.push(`Baris ${index + 1}: Field '${field}' tidak boleh kosong`);
      }
    });
  });

  return { isValid: errors.length === 0, errors };
};

// Helper function to format data for CSV export
export const formatDataForCSV = (data: any[], fieldMapping?: Record<string, string>): any[] => {
  if (!fieldMapping) return data;

  return data.map(item => {
    const formattedItem: any = {};
    Object.entries(fieldMapping).forEach(([csvField, dataField]) => {
      formattedItem[csvField] = item[dataField] || '';
    });
    return formattedItem;
  });
};

// Helper function to generate CSV template
export const generateCSVTemplate = (fields: string[], filename: string): void => {
  const templateData = [{}];
  fields.forEach(field => {
    templateData[0][field] = '';
  });

  exportToCSV({
    filename,
    data: templateData,
    includeHeaders: true
  });
};