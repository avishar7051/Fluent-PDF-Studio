export interface DetectedTextRegion {
  x: number; // in canvas pixels
  y: number; // in canvas pixels
  width: number;
  height: number;
  cropDataUrl: string;
  detectedText: string;
  fontCategory?: 'sans-serif' | 'serif' | 'monospace' | 'cursive';
  fontWeight?: '400' | '600' | '700';
  fontStyle?: 'normal' | 'italic';
  estimatedFontSize: number;
  bgColor: string;
  textColor: string;
}

/**
 * Samples the true background color from the perimeter pixels of a bounding box
 */
export function samplePerimeterBgColor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
): string {
  const pad = 3;
  const left = Math.max(0, Math.floor(x - pad));
  const top = Math.max(0, Math.floor(y - pad));
  const right = Math.min(ctx.canvas.width - 1, Math.ceil(x + width + pad));
  const bottom = Math.min(ctx.canvas.height - 1, Math.ceil(y + height + pad));

  let rSum = 0, gSum = 0, bSum = 0, count = 0;

  // Sample top and bottom edge pixels
  for (let px = left; px <= right; px += 2) {
    for (const py of [top, bottom]) {
      const d = ctx.getImageData(px, py, 1, 1).data;
      if (d[3] > 100) {
        rSum += d[0];
        gSum += d[1];
        bSum += d[2];
        count++;
      }
    }
  }

  // Sample left and right edge pixels
  for (let py = top; py <= bottom; py += 2) {
    for (const px of [left, right]) {
      const d = ctx.getImageData(px, py, 1, 1).data;
      if (d[3] > 100) {
        rSum += d[0];
        gSum += d[1];
        bSum += d[2];
        count++;
      }
    }
  }

  if (count === 0) return '#ffffff';
  const r = Math.round(rSum / count);
  const g = Math.round(gSum / count);
  const b = Math.round(bSum / count);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Automatically detects the text line bounding box around a clicked canvas pixel point (clickX, clickY)
 * or user dragged box, crops the text region, and calls the Gemini OCR service with local fallback.
 */
export async function detectTextAtPoint(
  canvas: HTMLCanvasElement,
  clickX: number,
  clickY: number,
  dragBox?: { startX: number; startY: number; endX: number; endY: number }
): Promise<DetectedTextRegion> {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    throw new Error('Canvas context not available');
  }

  const cWidth = canvas.width;
  const cHeight = canvas.height;

  let left = 0;
  let top = 0;
  let right = 0;
  let bottom = 0;

  // If the user dragged a box, use the user's drag box directly
  if (dragBox && Math.abs(dragBox.endX - dragBox.startX) > 12 && Math.abs(dragBox.endY - dragBox.startY) > 8) {
    left = Math.max(0, Math.min(dragBox.startX, dragBox.endX));
    top = Math.max(0, Math.min(dragBox.startY, dragBox.endY));
    right = Math.min(cWidth, Math.max(dragBox.startX, dragBox.endX));
    bottom = Math.min(cHeight, Math.max(dragBox.startY, dragBox.endY));
  } else {
    // Single Click: Automatically detect the bounding box of the text line around the click!
    const searchRadius = 45;
    const sX = Math.max(0, Math.floor(clickX - searchRadius));
    const sY = Math.max(0, Math.floor(clickY - searchRadius));
    const sW = Math.min(cWidth - sX, searchRadius * 2);
    const sH = Math.min(cHeight - sY, searchRadius * 2);

    const imgData = ctx.getImageData(sX, sY, sW, sH);
    const d = imgData.data;

    // 1. Determine local background color
    let bgR = 255, bgG = 255, bgB = 255;
    let lightCount = 0;
    let rSum = 0, gSum = 0, bSum = 0;

    for (let i = 0; i < d.length; i += 4) {
      const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      if (lum > 170) {
        rSum += d[i];
        gSum += d[i + 1];
        bSum += d[i + 2];
        lightCount++;
      }
    }
    if (lightCount > 10) {
      bgR = Math.round(rSum / lightCount);
      bgG = Math.round(gSum / lightCount);
      bgB = Math.round(bSum / lightCount);
    }
    const bgLum = 0.299 * bgR + 0.587 * bgG + 0.114 * bgB;

    const isInk = (x: number, y: number): boolean => {
      if (x < 0 || x >= cWidth || y < 0 || y >= cHeight) return false;
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      const lum = 0.299 * pixel[0] + 0.587 * pixel[1] + 0.114 * pixel[2];
      return Math.abs(lum - bgLum) > 30;
    };

    // Find nearest ink pixel near click
    let seedX = Math.floor(clickX);
    let seedY = Math.floor(clickY);
    let foundInk = false;

    for (let r = 0; r < searchRadius; r += 2) {
      for (let dy = -r; dy <= r; dy += 2) {
        for (let dx = -r; dx <= r; dx += 2) {
          if (isInk(Math.floor(clickX + dx), Math.floor(clickY + dy))) {
            seedX = Math.floor(clickX + dx);
            seedY = Math.floor(clickY + dy);
            foundInk = true;
            break;
          }
        }
        if (foundInk) break;
      }
      if (foundInk) break;
    }

    if (foundInk) {
      // Find vertical bounds
      let lineTop = seedY;
      let lineBottom = seedY;
      let gap = 0;

      while (lineTop > 0 && gap < 8) {
        lineTop--;
        let hasInk = false;
        for (let x = seedX - 25; x <= seedX + 25; x += 3) {
          if (isInk(x, lineTop)) {
            hasInk = true;
            break;
          }
        }
        if (hasInk) gap = 0;
        else gap++;
      }
      lineTop += gap;

      gap = 0;
      while (lineBottom < cHeight && gap < 8) {
        lineBottom++;
        let hasInk = false;
        for (let x = seedX - 25; x <= seedX + 25; x += 3) {
          if (isInk(x, lineBottom)) {
            hasInk = true;
            break;
          }
        }
        if (hasInk) gap = 0;
        else gap++;
      }
      lineBottom -= gap;

      const lineH = Math.max(12, lineBottom - lineTop);

      // Expand left along the line
      let lineLeft = seedX;
      let spaceGap = 0;
      const maxSpace = Math.max(22, lineH * 1.2);

      while (lineLeft > 0 && spaceGap < maxSpace) {
        lineLeft--;
        let hasInk = false;
        for (let y = lineTop; y <= lineBottom; y += 2) {
          if (isInk(lineLeft, y)) {
            hasInk = true;
            break;
          }
        }
        if (hasInk) spaceGap = 0;
        else spaceGap++;
      }
      lineLeft += spaceGap;

      // Expand right along the line
      let lineRight = seedX;
      spaceGap = 0;
      while (lineRight < cWidth && spaceGap < maxSpace) {
        lineRight++;
        let hasInk = false;
        for (let y = lineTop; y <= lineBottom; y += 2) {
          if (isInk(lineRight, y)) {
            hasInk = true;
            break;
          }
        }
        if (hasInk) spaceGap = 0;
        else spaceGap++;
      }
      lineRight -= spaceGap;

      left = Math.max(0, lineLeft - 6);
      right = Math.min(cWidth, lineRight + 6);
      top = Math.max(0, lineTop - 4);
      bottom = Math.min(cHeight, lineBottom + 4);
    } else {
      left = Math.max(0, clickX - 60);
      right = Math.min(cWidth, clickX + 90);
      top = Math.max(0, clickY - 14);
      bottom = Math.min(cHeight, clickY + 16);
    }
  }

  const regionW = Math.max(24, Math.round(right - left));
  const regionH = Math.max(14, Math.round(bottom - top));

  // High quality crop canvas
  const cropCanvas = document.createElement('canvas');
  cropCanvas.width = regionW;
  cropCanvas.height = regionH;
  const cropCtx = cropCanvas.getContext('2d');
  if (cropCtx) {
    cropCtx.drawImage(canvas, left, top, regionW, regionH, 0, 0, regionW, regionH);
  }

  const cropDataUrl = cropCanvas.toDataURL('image/png');

  // Sample exact background color
  const sampleBg = samplePerimeterBgColor(ctx, left, top, regionW, regionH);

  // Call OCR region service
  let detectedText = '';
  let fontCategory: 'sans-serif' | 'serif' | 'monospace' | 'cursive' = 'sans-serif';
  let fontWeight: '400' | '600' | '700' = '400';
  let fontStyle: 'normal' | 'italic' = 'normal';
  let estimatedFontSize = Math.max(11, Math.round(regionH * 0.72));
  let textColor = '#0f172a';
  let bgPatchColor = sampleBg;

  try {
    const ocrResponse = await fetch('/api/ocr-region', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: cropDataUrl, mimeType: 'image/png' }),
    });

    if (ocrResponse.ok) {
      const data = await ocrResponse.json();
      if (data.detectedText) {
        detectedText = data.detectedText.trim();
      }
      if (data.fontFamily) {
        fontCategory = data.fontFamily;
      }
      if (data.fontWeight) {
        fontWeight = data.fontWeight;
      }
      if (data.fontStyle) {
        fontStyle = data.fontStyle;
      }
      if (data.estimatedFontSize && Number(data.estimatedFontSize) > 6) {
        estimatedFontSize = Number(data.estimatedFontSize);
      }
      if (data.textColor && data.textColor.startsWith('#')) {
        textColor = data.textColor;
      }
      if (data.bgColor && (data.bgColor.startsWith('#') || data.bgColor.startsWith('rgb'))) {
        bgPatchColor = data.bgColor;
      }
    }
  } catch (apiErr) {
    console.warn('Backend OCR region call skipped or offline:', apiErr);
  }

  return {
    x: left,
    y: top,
    width: regionW,
    height: regionH,
    cropDataUrl,
    detectedText,
    fontCategory,
    fontWeight,
    fontStyle,
    estimatedFontSize,
    bgColor: bgPatchColor,
    textColor,
  };
}
