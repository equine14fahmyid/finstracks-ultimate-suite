import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  Search,
  Download,
  Bug
} from 'lucide-react';

interface SimpleColumn {
  key: string;
  title: string;
  render?: (value: any, record: any) => React.ReactNode;
}

interface DataTableProps {
  data: any[];
  columns: SimpleColumn[];
  loading?: boolean;
  title?: string;
  description?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  onExport?: () => void;
  actions?: React.ReactNode;
  debug?: boolean;
}

export function DataTable({
  columns,
  data,
  loading = false,
  title,
  description,
  searchable = false,
  searchPlaceholder = "Cari data...",
  onExport,
  actions,
  debug = false,
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDebug, setShowDebug] = useState(false);
  const itemsPerPage = 10;

  // DEBUG: Log data untuk troubleshooting
  if (debug) {
    console.log("=== DATATABLE DEBUG ===");
    console.log("Data received:", data);
    console.log("Columns config:", columns);
    console.log("Data length:", data.length);
    if (data.length > 0) {
      console.log("First data item:", data[0]);
      console.log("Available keys in first item:", Object.keys(data[0]));
    }
  }

  // Filter data based on search term
  const filteredData = searchable 
    ? data.filter(item => 
        Object.values(item || {}).some(value => 
          String(value || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    : data;

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-muted animate-pulse rounded"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* DEBUG Panel */}
      {debug && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-yellow-800 flex items-center">
              <Bug className="h-4 w-4 mr-2" />
              Debug Mode
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDebug(!showDebug)}
            >
              {showDebug ? 'Hide' : 'Show'} Details
            </Button>
          </div>
          
          {showDebug && (
            <div className="space-y-2 text-sm">
              <div>
                <strong>Data Count:</strong> {data.length}
              </div>
              <div>
                <strong>Columns:</strong> {columns.map(c => c.key).join(', ')}
              </div>
              {data.length > 0 && (
                <div>
                  <strong>Available Keys:</strong> {Object.keys(data[0] || {}).join(', ')}
                </div>
              )}
              <div>
                <strong>Missing Keys:</strong> {
                  columns
                    .filter(col => data.length > 0 && !(col.key in (data[0] || {})))
                    .map(col => col.key)
                    .join(', ') || 'None'
                }
              </div>
            </div>
          )}
        </div>
      )}

      {/* Title & Actions */}
      {(title || actions || onExport) && (
        <div className="flex items-center justify-between">
          <div>
            {title && <h2 className="text-lg font-semibold">{title}</h2>}
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          <div className="flex items-center space-x-2">
            {actions}
            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Search */}
      {searchable && (
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredData.length} dari {data.length} data
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className="font-semibold">
                  {column.title}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length ? (
              paginatedData.map((item, index) => (
                <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {debug && !(column.key in (item || {})) && !column.render ? (
                        <span className="text-red-500 italic">
                          Missing: {column.key}
                        </span>
                      ) : (
                        column.render 
                          ? column.render(item?.[column.key], item) 
                          : (item?.[column.key] ?? '-')
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center py-8">
                    <Search className="h-8 w-8 text-muted-foreground mb-2 opacity-50" />
                    <p className="text-muted-foreground">Tidak ada data ditemukan</p>
                    {debug && data.length > 0 && (
                      <p className="text-xs text-yellow-600 mt-1">
                        Debug: Data tersedia ({data.length} items) tapi tidak cocok dengan filter
                      </p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between space-x-2">
          <div className="text-sm text-muted-foreground">
            Halaman {currentPage} dari {totalPages} 
            {debug && ` (${filteredData.length} filtered / ${data.length} total)`}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}