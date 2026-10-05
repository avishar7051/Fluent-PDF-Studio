import { PDFDocument, rgb, StandardFonts, PDFPage } from 'pdf-lib';
import { PdfAnnotation, PdfDocumentState } from '../types/pdf';

/**
 * Parses hex or rgb/rgba string into pdf-lib rgb(0..1)
 */
function parseColorToPdfRgb(colorStr: string): { r: number; g: number; b: number } {
  if (!colorStr) return { r: 0.1, g: 0.1, b: 0.1 };

  // Hex format #rrggbb or #rgb
  if (colorStr.startsWith('#')) {
    let hex = colorStr.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map((c) => c + c).join('');
    }
    const intVal = parseInt(hex, 16);
    return {
      r: ((intVal >> 16) & 255) / 255,
      g: ((intVal >> 8) & 255) / 255,
      b: (intVal & 255) / 255,
    };
  }

  // rgb(r, g, b)
  const rgbMatch = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10) / 255,
      g: parseInt(rgbMatch[2], 10) / 255,
      b: parseInt(rgbMatch[3], 10) / 255,
    };
  }

  return { r: 0.1, g: 0.1, b: 0.1 };
}

/**
 * Maps CSS font family to standard PDF-lib fonts
 */
async function getPdfLibFont(pdfDoc: PDFDocument, fontSettings?: any) {
  const family = (fontSettings?.family || '').toLowerCase();
  const isBold = fontSettings?.weight === '700' || fontSettings?.weight === '600' || fontSettings?.weight === 'bold';
  const isItalic = fontSettings?.style === 'italic';

  try {
    if (family.includes('times') || family.includes('lora') || family.includes('georgia') || family.includes('serif')) {
      if (isBold && isItalic) return await pdfDoc.embedFont(StandardFonts.TimesRomanBoldItalic);
      if (isBold) return await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
      if (isItalic) return await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
      return await pdfDoc.embedFont(StandardFonts.TimesRoman);
    }

    if (family.includes('courier') || family.includes('mono')) {
      if (isBold && isItalic) return await pdfDoc.embedFont(StandardFonts.CourierBoldOblique);
      if (isBold) return await pdfDoc.embedFont(StandardFonts.CourierBold);
      if (isItalic) return await pdfDoc.embedFont(StandardFonts.CourierOblique);
      return await pdfDoc.embedFont(StandardFonts.Courier);
    }

    // Default to Helvetica (Standard Sans)
    if (isBold && isItalic) return await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
    if (isBold) return await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    if (isItalic) return await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
    return await pdfDoc.embedFont(StandardFonts.Helvetica);
  } catch (err) {
    return await pdfDoc.embedFont(StandardFonts.Helvetica);
  }
}

/**
 * Exports modified PDF document with all annotations, replaced text, and signatures embedded
 */
export async function exportModifiedPdf(
  docState: PdfDocumentState,
  options?: { flatten?: boolean }
): Promise<Uint8Array> {
  if (!docState.rawBytes) {
    throw new Error('Original PDF raw bytes not found.');
  }

  const pdfDoc = await PDFDocument.load(docState.rawBytes);
  const pages = pdfDoc.getPages();

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const { width: pWidth, height: pHeight } = page.getSize();
    const pageAnnotations = docState.annotations.filter((a) => a.pageIndex === i);

    for (const anno of pageAnnotations) {
      const pdfX = (anno.x / 100) * pWidth;
      const pdfW = (anno.width / 100) * pWidth;
      const pdfH = (anno.height / 100) * pHeight;
      // In PDF-lib, Y is from bottom-left
      const pdfY = pHeight - ((anno.y + anno.height) / 100) * pHeight;

      if (anno.type === 'text-replace') {
        // 1. Cover original text with matching background patch
        const bgCol = parseColorToPdfRgb(anno.fontSettings?.bgColor || '#ffffff');
        page.drawRectangle({
          x: pdfX - 1,
          y: pdfY - 1,
          width: pdfW + 2,
          height: pdfH + 2,
          color: rgb(bgCol.r, bgCol.g, bgCol.b),
        });

        // 2. Draw new replacement text
        const text = anno.content || '';
        if (text) {
          const font = await getPdfLibFont(pdfDoc, anno.fontSettings);
          const fontSize = anno.fontSettings?.size || 12;
          const textCol = parseColorToPdfRgb(anno.fontSettings?.color || '#0f172a');
          const lines = text.split('\n');
          const lineGapMultiplier = anno.fontSettings?.lineHeight ?? 1.25;
          const lineHeight = fontSize * lineGapMultiplier;

          if (lines.length === 1) {
            // Align baseline nicely inside the box
            page.drawText(text, {
              x: pdfX + 2,
              y: pdfY + Math.max(2, (pdfH - fontSize) / 2),
              size: fontSize,
              font,
              color: rgb(textCol.r, textCol.g, textCol.b),
            });
          } else {
            lines.forEach((line, lineIdx) => {
              page.drawText(line, {
                x: pdfX + 2,
                y: pdfY + pdfH - (lineIdx + 1) * lineHeight + Math.max(0, (lineHeight - fontSize) * 0.35),
                size: fontSize,
                font,
                color: rgb(textCol.r, textCol.g, textCol.b),
              });
            });
          }
        }
      } else if (anno.type === 'text-box') {
        const text = anno.content || '';
        if (text) {
          const font = await getPdfLibFont(pdfDoc, anno.fontSettings);
          const fontSize = anno.fontSettings?.size || 14;
          const textCol = parseColorToPdfRgb(anno.fontSettings?.color || '#0f172a');

          if (anno.fontSettings?.bgColor && anno.fontSettings.bgColor !== 'transparent') {
            const bgCol = parseColorToPdfRgb(anno.fontSettings.bgColor);
            page.drawRectangle({
              x: pdfX,
              y: pdfY,
              width: pdfW,
              height: pdfH,
              color: rgb(bgCol.r, bgCol.g, bgCol.b),
            });
          }

          // Support multi-line text with customizable line gap
          const lines = text.split('\n');
          const lineGapMultiplier = anno.fontSettings?.lineHeight ?? 1.25;
          const lineHeight = fontSize * lineGapMultiplier;
          lines.forEach((line, lineIdx) => {
            page.drawText(line, {
              x: pdfX + 4,
              y: pdfY + pdfH - (lineIdx + 1) * lineHeight + Math.max(0, (lineHeight - fontSize) * 0.35),
              size: fontSize,
              font,
              color: rgb(textCol.r, textCol.g, textCol.b),
            });
          });
        }
      } else if (anno.type === 'signature' || anno.type === 'image') {
        if (anno.signatureDataUrl) {
          try {
            const pngImage = await pdfDoc.embedPng(anno.signatureDataUrl);
            page.drawImage(pngImage, {
              x: pdfX,
              y: pdfY,
              width: pdfW,
              height: pdfH,
              opacity: anno.opacity ?? 1,
            });

            // If signature has verification metadata, stamp small digital certificate label
            if (anno.signatureMeta) {
              const metaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
              const metaText = `Digitally Signed by ${anno.signatureMeta.signerName} | ${anno.signatureMeta.timestamp.substring(0, 16)} | Hash: ${anno.signatureMeta.auditHash.substring(0, 8)}...`;
              page.drawText(metaText, {
                x: pdfX,
                y: Math.max(5, pdfY - 9),
                size: 6,
                font: metaFont,
                color: rgb(0.35, 0.45, 0.55),
              });
            }
          } catch (imgErr) {
            console.warn('Could not embed signature PNG:', imgErr);
          }
        }
      } else if (anno.type === 'redaction') {
        const col = parseColorToPdfRgb(anno.fillColor || '#000000');
        page.drawRectangle({
          x: pdfX,
          y: pdfY,
          width: pdfW,
          height: pdfH,
          color: rgb(col.r, col.g, col.b),
        });
      } else if (anno.type === 'highlight') {
        page.drawRectangle({
          x: pdfX,
          y: pdfY,
          width: pdfW,
          height: pdfH,
          color: rgb(1, 0.95, 0.2),
          opacity: 0.35,
        });
      } else if (anno.type === 'shape') {
        const strokeCol = parseColorToPdfRgb(anno.strokeColor || '#2563eb');
        const strokeW = anno.strokeWidth || 2;

        if (anno.shapeType === 'check') {
          // Draw checkmark
          const startX = pdfX + pdfW * 0.2;
          const startY = pdfY + pdfH * 0.5;
          const midX = pdfX + pdfW * 0.45;
          const midY = pdfY + pdfH * 0.2;
          const endX = pdfX + pdfW * 0.85;
          const endY = pdfY + pdfH * 0.8;

          page.drawLine({
            start: { x: startX, y: startY },
            end: { x: midX, y: midY },
            thickness: strokeW,
            color: rgb(strokeCol.r, strokeCol.g, strokeCol.b),
          });
          page.drawLine({
            start: { x: midX, y: midY },
            end: { x: endX, y: endY },
            thickness: strokeW,
            color: rgb(strokeCol.r, strokeCol.g, strokeCol.b),
          });
        } else if (anno.shapeType === 'rectangle') {
          page.drawRectangle({
            x: pdfX,
            y: pdfY,
            width: pdfW,
            height: pdfH,
            borderColor: rgb(strokeCol.r, strokeCol.g, strokeCol.b),
            borderWidth: strokeW,
          });
        }
      }
    }
  }

  return await pdfDoc.save();
}

/**
 * Triggers native browser download for the edited PDF
 */
export function triggerPdfDownload(pdfBytes: Uint8Array, fileName: string): void {
  const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const cleanName = fileName.replace(/\.pdf$/i, '');
  a.download = `${cleanName}_signed.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
