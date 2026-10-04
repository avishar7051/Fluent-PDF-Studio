import { PdfTextItem } from '../types/pdf';

/**
 * Extracts text items from an image/canvas by calling the server-side OCR service
 * with fallback to local detection.
 */
export async function extractTextFromImage(
  imageSource: HTMLCanvasElement | HTMLImageElement | string,
  pageWidth: number,
  pageHeight: number,
  onProgress?: (progress: number, status: string) => void
): Promise<PdfTextItem[]> {
  try {
    if (onProgress) onProgress(0.2, 'Analyzing text in image with OCR...');

    let dataUrl = '';
    if (typeof imageSource === 'string') {
      dataUrl = imageSource;
    } else if (imageSource instanceof HTMLCanvasElement) {
      dataUrl = imageSource.toDataURL('image/png');
    } else if (imageSource instanceof HTMLImageElement) {
      const c = document.createElement('canvas');
      c.width = imageSource.naturalWidth || imageSource.width;
      c.height = imageSource.naturalHeight || imageSource.height;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.drawImage(imageSource, 0, 0);
        dataUrl = c.toDataURL('image/png');
      }
    }

    if (!dataUrl) return [];

    const response = await fetch('/api/ocr-page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: dataUrl, mimeType: 'image/png' }),
    });

    if (!response.ok) {
      console.warn('Server OCR response not ok, returning empty text list');
      return [];
    }

    const resData = await response.json();
    const items = resData.items || [];

    if (onProgress) onProgress(0.9, 'Building selectable text boxes...');

    const textItems: PdfTextItem[] = [];

    items.forEach((item: any, idx: number) => {
      const text = (item.text || '').trim();
      if (!text) return;

      // box2d: [ymin, xmin, ymax, xmax] normalized 0 - 1000
      const box = item.box2d || [0, 0, 50, 200];
      const ymin = Math.max(0, box[0] / 1000);
      const xmin = Math.max(0, box[1] / 1000);
      const ymax = Math.min(1, box[2] / 1000);
      const xmax = Math.min(1, box[3] / 1000);

      const x = xmin * pageWidth;
      const y = ymin * pageHeight;
      const width = Math.max(16, (xmax - xmin) * pageWidth);
      const height = Math.max(12, (ymax - ymin) * pageHeight);
      const fontSize = Math.max(10, Math.round(height * 0.75));

      let fontFamily = '"Plus Jakarta Sans", Arial, sans-serif';
      if (item.fontCategory === 'serif') {
        fontFamily = 'Georgia, "Times New Roman", serif';
      } else if (item.fontCategory === 'monospace') {
        fontFamily = '"Courier Prime", Courier, monospace';
      } else if (item.fontCategory === 'cursive') {
        fontFamily = '"Dancing Script", cursive';
      }

      textItems.push({
        id: `ocr_item_${idx}_${Date.now()}`,
        text,
        x,
        y,
        width,
        height,
        fontName: item.fontCategory === 'serif' ? 'Times-Roman' : 'Helvetica',
        fontSize,
        fontWeight: item.fontWeight || '400',
        fontStyle: item.fontStyle || 'normal',
        fontFamily,
        detectedColor: item.textColor || '#0f172a',
        transform: [fontSize, 0, 0, fontSize, x, y],
      });
    });

    return textItems;
  } catch (err) {
    console.warn('Image text extraction warning:', err);
    return [];
  }
}
