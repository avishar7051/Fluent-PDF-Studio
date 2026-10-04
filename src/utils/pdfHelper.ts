import * as pdfjsLib from 'pdfjs-dist';
import { PdfDocumentState, PdfPageData, PdfTextItem } from '../types/pdf';
import { matchPdfFont } from './fontMatcher';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  try {
    // Prefer CDN worker for smooth Vite compatibility without complex worker bundler configuration
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  } catch (err) {
    console.warn('PDF.js worker initialization notice:', err);
  }
}

/**
 * Loads a PDF from Uint8Array and extracts pages and text elements
 */
export async function parsePdfDocument(
  data: Uint8Array,
  name: string
): Promise<{ state: PdfDocumentState; pdfDocProxy: pdfjsLib.PDFDocumentProxy }> {
  // Make a copy of Uint8Array to avoid Detached ArrayBuffer issues
  const copyData = new Uint8Array(data);
  const loadingTask = pdfjsLib.getDocument({
    data: copyData,
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
    cMapPacked: true,
  });

  const pdfDocProxy = await loadingTask.promise;
  const numPages = pdfDocProxy.numPages;
  const pages: PdfPageData[] = [];

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDocProxy.getPage(i);
    const viewport = page.getViewport({ scale: 1.0, rotation: 0 });
    const textContent = await page.getTextContent();

    const textItems: PdfTextItem[] = [];

    const allPageItems: PdfTextItem[] = [];

    textContent.items.forEach((item: any, idx: number) => {
      if (!item.str || item.str.trim() === '') return;

      // Transform from PDF user space to viewport coordinate space
      let m = item.transform;
      if ((pdfjsLib as any).Util && (pdfjsLib as any).Util.transform) {
        m = (pdfjsLib as any).Util.transform(viewport.transform, item.transform);
      }

      const fontSize = Math.hypot(m[0], m[1]) || 12;

      // In viewport coordinate space, m[4] is X from left, m[5] is baseline Y from top.
      // Top of bounding box is m[5] - fontSize
      let x = m[4];
      let y = m[5] - fontSize;

      // Fallback if matrix was unshifted
      if (y < 0 && item.transform[5] > 0) {
        y = viewport.height - item.transform[5] - (item.height || fontSize);
        x = item.transform[4];
      }

      const width = item.width || (item.str.length * fontSize * 0.55);
      const height = item.height || fontSize * 1.2;

      const fontMatch = matchPdfFont(item.fontName || 'Helvetica', fontSize, item.transform);

      textItems.push({
        id: `p${i}_t${idx}_${Math.random().toString(36).substring(2, 7)}`,
        text: item.str,
        x: Math.max(0, x),
        y: Math.max(0, y),
        width: Math.max(width, 10),
        height: Math.max(height, 10),
        fontName: item.fontName || 'Helvetica',
        fontSize: Math.round(fontSize * 10) / 10,
        fontWeight: fontMatch.weight,
        fontStyle: fontMatch.style,
        fontFamily: fontMatch.family,
        detectedColor: '#0f172a',
        transform: item.transform,
      });
    });

    // Group adjacent text items into coherent phrases/lines when appropriate
    const groupedItems = groupAdjacentTextItems(textItems, viewport.width, viewport.height);

    pages.push({
      pageIndex: i - 1,
      pageNumber: i,
      width: viewport.width,
      height: viewport.height,
      originalWidth: viewport.width,
      originalHeight: viewport.height,
      rotation: 0,
      textItems: groupedItems,
    });
  }

  // Detect dominant document font
  let dominantFamily = '"Plus Jakarta Sans", sans-serif';
  let dominantSize = 12;
  const fontCounts: Record<string, number> = {};

  pages.forEach((p) => {
    p.textItems.forEach((t) => {
      if (t.fontFamily) {
        fontCounts[t.fontFamily] = (fontCounts[t.fontFamily] || 0) + 1;
      }
    });
  });

  let maxCount = 0;
  Object.entries(fontCounts).forEach(([fam, count]) => {
    if (count > maxCount) {
      maxCount = count;
      dominantFamily = fam;
    }
  });

  const state: PdfDocumentState = {
    id: `doc_${Date.now()}`,
    name,
    fileSize: data.byteLength,
    numPages,
    pages,
    rawBytes: data,
    annotations: [],
    primaryFont: {
      family: dominantFamily,
      size: dominantSize,
      weight: '400',
      style: 'normal',
      color: '#0f172a',
      bgColor: '#ffffff',
      lineHeight: 1.25,
    },
  };

  return { state, pdfDocProxy };
}

/**
 * Intelligent grouping of adjacent fragmented PDF text spans into full lines/sentences
 * for easier editing
 */
function groupAdjacentTextItems(
  items: PdfTextItem[],
  pageWidth: number,
  pageHeight: number
): PdfTextItem[] {
  if (items.length <= 1) return items;

  // Sort by Y ascending (top to bottom), then X ascending (left to right)
  const sorted = [...items].sort((a, b) => {
    if (Math.abs(a.y - b.y) < 4) {
      return a.x - b.x;
    }
    return a.y - b.y;
  });

  const grouped: PdfTextItem[] = [];
  let current = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];

    // Check if on same horizontal baseline and close together
    const sameLine = Math.abs(current.y - next.y) < 4;
    const sameFont =
      current.fontName === next.fontName &&
      Math.abs(current.fontSize - next.fontSize) < 1.5;
    const distance = next.x - (current.x + current.width);
    const isAdjacent = distance >= -2 && distance < current.fontSize * 1.5;

    if (sameLine && sameFont && isAdjacent) {
      // Merge
      const separator = distance > 1 ? ' ' : '';
      current = {
        ...current,
        text: current.text + separator + next.text,
        width: next.x + next.width - current.x,
        height: Math.max(current.height, next.height),
      };
    } else {
      grouped.push(current);
      current = next;
    }
  }
  grouped.push(current);

  return grouped;
}

/**
 * Renders a PDF page to a canvas element at the specified scale and rotation
 */
export async function renderPdfPageToCanvas(
  pdfDocProxy: pdfjsLib.PDFDocumentProxy,
  pageIndex: number,
  canvas: HTMLCanvasElement,
  scale: number = 1.5,
  rotation: number = 0
): Promise<void> {
  // If an ongoing render is running on this canvas, cancel it and wait
  const existingTask = (canvas as any).__activeRenderTask;
  if (existingTask) {
    try {
      existingTask.cancel();
    } catch {}
    (canvas as any).__activeRenderTask = null;
  }

  const page = await pdfDocProxy.getPage(pageIndex + 1);
  const viewport = page.getViewport({ scale, rotation });

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);

  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;

  // Fill canvas with white background initially
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const renderContext = {
    canvasContext: ctx,
    viewport,
    canvas,
  };

  const renderTask = page.render(renderContext);
  (canvas as any).__activeRenderTask = renderTask;

  try {
    await renderTask.promise;
  } catch (renderErr: any) {
    if (renderErr?.name === 'RenderingCancelledException' || renderErr?.message?.includes('cancelled')) {
      return;
    }
    throw renderErr;
  } finally {
    if ((canvas as any).__activeRenderTask === renderTask) {
      (canvas as any).__activeRenderTask = null;
    }
  }
}

/**
 * Samples the average background color around a specific region of a canvas
 * so replacement patches blend seamlessly with the PDF page background
 */
export function sampleBackgroundColor(
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
  width: number,
  height: number
): string {
  try {
    const ctx = canvas.getContext('2d');
    if (!ctx) return '#ffffff';

    // Sample pixels along the edges of the box
    const sampleX = Math.max(0, Math.floor(x));
    const sampleY = Math.max(0, Math.floor(y));
    const sampleW = Math.min(canvas.width - sampleX, Math.floor(width));
    const sampleH = Math.min(canvas.height - sampleY, Math.floor(height));

    if (sampleW <= 0 || sampleH <= 0) return '#ffffff';

    const imgData = ctx.getImageData(sampleX, sampleY, sampleW, Math.min(sampleH, 10));
    const d = imgData.data;
    let r = 0, g = 0, b = 0, count = 0;

    for (let i = 0; i < d.length; i += 4) {
      // Ignore very dark pixels (which might be text itself)
      if (d[i] > 180 && d[i + 1] > 180 && d[i + 2] > 180) {
        r += d[i];
        g += d[i + 1];
        b += d[i + 2];
        count++;
      }
    }

    if (count === 0) return '#ffffff';

    const avgR = Math.round(r / count);
    const avgG = Math.round(g / count);
    const avgB = Math.round(b / count);

    return `rgb(${avgR}, ${avgG}, ${avgB})`;
  } catch (err) {
    return '#ffffff';
  }
}
