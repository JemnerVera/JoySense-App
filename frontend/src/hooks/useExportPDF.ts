import { useState, useCallback } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface UseExportPDFProps {
  stationName: string;
}

interface ExportOptions {
  title?: string;
  filename?: string;
}

export const useExportPDF = ({ stationName }: UseExportPDFProps) => {
  const [exporting, setExporting] = useState(false);

  const exportToPDF = useCallback(async (
    contentRef: React.RefObject<HTMLElement>,
    options: ExportOptions = {}
  ) => {
    if (!contentRef.current || exporting) return;

    const { title, filename } = options;
    setExporting(true);

    try {
      const content = contentRef.current;
      
      const canvas = await html2canvas(content, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      } as any);

      const imgData = canvas.toDataURL('image/png');
      
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      const pdf = new jsPDF({
        orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
        unit: 'px',
        format: [imgWidth / 2, imgHeight / 2],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth / 2, imgHeight / 2);

      const fileName = filename || `Meteorologia_${stationName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`;
      pdf.save(`${fileName}.pdf`);

    } catch (error) {
      console.error('Error exporting to PDF:', error);
    } finally {
      setExporting(false);
    }
  }, [stationName, exporting]);

  const exportToImage = useCallback(async (
    contentRef: React.RefObject<HTMLElement>,
    options: ExportOptions = {}
  ) => {
    if (!contentRef.current || exporting) return;

    const { filename } = options;
    setExporting(true);

    try {
      const content = contentRef.current;
      
      const canvas = await html2canvas(content, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      } as any);

      const link = document.createElement('a');
      link.download = filename || `Meteorologia_${stationName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

    } catch (error) {
      console.error('Error exporting to image:', error);
    } finally {
      setExporting(false);
    }
  }, [stationName, exporting]);

  return {
    exportToPDF,
    exportToImage,
    exporting,
  };
};

export default useExportPDF;