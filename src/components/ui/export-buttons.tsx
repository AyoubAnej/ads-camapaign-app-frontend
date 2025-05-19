import React from 'react';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportToPdf, exportToExcel, TableColumn } from '@/lib/exportUtils';

interface ExportButtonsProps {
  data: any[];
  columns: TableColumn[];
  fileName: string;
  title?: string;
}

export const ExportButtons: React.FC<ExportButtonsProps> = ({
  data,
  columns,
  fileName,
  title,
}) => {
  const handleExportPdf = () => {
    exportToPdf(columns, data, `${fileName}_export`, title);
  };

  const handleExportExcel = () => {
    exportToExcel(columns, data, `${fileName}_export`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <FileDown className="h-4 w-4" />
          <span>Export</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportPdf} className="cursor-pointer">
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportExcel} className="cursor-pointer">
          Export as Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
