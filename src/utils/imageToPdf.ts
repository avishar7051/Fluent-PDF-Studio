import { PDFDocument } from 'pdf-lib';
import { extractTextFromImage } from './imageOcr';
import { PdfTextItem } from '../types/pdf';

/**
 * Converts any image (PNG, JPG, JPEG, WEBP, SVG) into a standard PDF Document
 * and extracts text so all text in images becomes selectable and editable!
 */
export async function convertImageToPdf(
  file: File,
  onProgress?: (progress: number, status: string) => void
): Promise<{ bytes: Uint8Array; name: string; textItems: PdfTextItem[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const dataUrl = e.target?.result as string;
        const img = new Image();

        img.onload = async () => {
          try {
            if (onProgress) onProgress(0.1, 'Optimizing image resolution...');

            let origW = img.naturalWidth || img.width;
            let origH = img.naturalHeight || img.height;

            let targetW = origW;
            let targetH = origH;

            // Normalize dimensions if excessively large
            if (targetW > 2000 || targetH > 2000) {
              const ratio = Math.min(2000 / targetW, 2000 / targetH);
              targetW = Math.round(targetW * ratio);
              targetH = Math.round(targetH * ratio);
            }

            const canvas = document.createElement('canvas');
            canvas.width = targetW;
            canvas.height = targetH;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Could not get canvas context');

            // Solid white background in case image has alpha/transparency
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, targetW, targetH);
            ctx.drawImage(img, 0, 0, targetW, targetH);

            // Extract text items from image with OCR
            let textItems: PdfTextItem[] = [];
            try {
              textItems = await extractTextFromImage(canvas, targetW, targetH, onProgress);
            } catch (ocrErr) {
              console.warn('OCR error ignored:', ocrErr);
            }

            const pngDataUrl = canvas.toDataURL('image/png');
            const pngBase64 = pngDataUrl.split(',')[1];
            const pngBytes = Uint8Array.from(atob(pngBase64), (c) => c.charCodeAt(0));

            // Create PDF with pdf-lib
            const pdfDoc = await PDFDocument.create();
            const embeddedPng = await pdfDoc.embedPng(pngBytes);

            const page = pdfDoc.addPage([targetW, targetH]);
            page.drawImage(embeddedPng, {
              x: 0,
              y: 0,
              width: targetW,
              height: targetH,
            });

            const pdfBytes = await pdfDoc.save();
            const cleanName = file.name.replace(/\.[^/.]+$/, '') + '.pdf';

            resolve({ bytes: pdfBytes, name: cleanName, textItems });
          } catch (embedErr) {
            reject(embedErr);
          }
        };

        img.onerror = () => reject(new Error('Failed to load image file.'));
        img.src = dataUrl;
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}
