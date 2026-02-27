import * as XLSX from 'xlsx';

interface ExportToExcelParams {
  data: any[];
  sheetName: string;
  fileName: string;
}

export const exportToExcel = ({ data, sheetName, fileName }: ExportToExcelParams) => {
  // 1. Create a new workbook
  const workbook = XLSX.utils.book_new();

  // 2. Convert the array of objects to a worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);
  
  // 3. Append the worksheet to the workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // 4. Generate the .xlsx file buffer
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });

  // 5. Create a Blob from the buffer
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });

  // 6. Create a link element, set the download attribute, and trigger the download
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  
  // 7. Clean up by removing the link
  document.body.removeChild(link);
};
