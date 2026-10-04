import { FontStyleInfo } from '../types/pdf';

export interface AvailableFont {
  id: string;
  name: string;
  cssFamily: string;
  category: 'sans-serif' | 'serif' | 'monospace' | 'cursive';
  pdfLibFontName?: string;
}

export const AVAILABLE_FONTS: AvailableFont[] = [
  {
    id: 'plus-jakarta',
    name: 'Plus Jakarta Sans (Modern Clean)',
    cssFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    category: 'sans-serif',
    pdfLibFontName: 'Helvetica',
  },
  {
    id: 'segoe-ui',
    name: 'Segoe UI (Windows Fluent)',
    cssFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    category: 'sans-serif',
    pdfLibFontName: 'Helvetica',
  },
  {
    id: 'arial',
    name: 'Arial / Helvetica',
    cssFamily: 'Arial, Helvetica, "Nimbus Sans L", sans-serif',
    category: 'sans-serif',
    pdfLibFontName: 'Helvetica',
  },
  {
    id: 'times',
    name: 'Times New Roman (Standard Serif)',
    cssFamily: '"Times New Roman", Times, "Nimbus Roman No9 L", serif',
    category: 'serif',
    pdfLibFontName: 'TimesRoman',
  },
  {
    id: 'lora',
    name: 'Lora (Book & Document Serif)',
    cssFamily: 'Lora, Georgia, serif',
    category: 'serif',
    pdfLibFontName: 'TimesRoman',
  },
  {
    id: 'georgia',
    name: 'Georgia (Editorial Serif)',
    cssFamily: 'Georgia, Cambria, serif',
    category: 'serif',
    pdfLibFontName: 'TimesRoman',
  },
  {
    id: 'courier',
    name: 'Courier Prime (Typewriter Monospace)',
    cssFamily: '"Courier Prime", "Courier New", Courier, monospace',
    category: 'monospace',
    pdfLibFontName: 'Courier',
  },
  {
    id: 'dancing-script',
    name: 'Dancing Script (Signature Cursive)',
    cssFamily: '"Dancing Script", cursive',
    category: 'cursive',
    pdfLibFontName: 'Helvetica',
  },
  {
    id: 'caveat',
    name: 'Caveat (Natural Handwriting)',
    cssFamily: 'Caveat, cursive',
    category: 'cursive',
    pdfLibFontName: 'Helvetica',
  },
];

/**
 * Intelligent font analysis: Takes a raw PDF font identifier and infers
 * the best matching web/system font family, weight, style, and size.
 */
export function matchPdfFont(
  rawFontName: string,
  rawFontSize: number,
  transform?: number[]
): FontStyleInfo {
  const cleanName = rawFontName
    .replace(/^[A-Z]{6}\+/, '') // Remove subset prefix like 'BCDFEE+'
    .toLowerCase();

  // Detect font weight
  const isBold =
    cleanName.includes('bold') ||
    cleanName.includes('black') ||
    cleanName.includes('heavy') ||
    cleanName.includes('semibold') ||
    cleanName.includes('demi') ||
    cleanName.endsWith('-b') ||
    cleanName.includes('700') ||
    cleanName.includes('800');

  // Detect font style
  const isItalic =
    cleanName.includes('italic') ||
    cleanName.includes('oblique') ||
    cleanName.includes('slanted') ||
    cleanName.endsWith('-i') ||
    cleanName.includes('inclined');

  // Compute calculated font size
  let calculatedSize = rawFontSize;
  if (transform && transform.length >= 4) {
    const scaleX = Math.abs(transform[0]);
    const scaleY = Math.abs(transform[3]);
    const avgScale = (scaleX + scaleY) / 2;
    if (avgScale > 0) {
      calculatedSize = Math.round(avgScale * 10) / 10;
    }
  }
  if (!calculatedSize || calculatedSize <= 0) {
    calculatedSize = 12;
  }

  // Classify font family
  let matchedFamily = AVAILABLE_FONTS[0].cssFamily;
  let detectedType: 'sans-serif' | 'serif' | 'monospace' = 'sans-serif';

  if (
    cleanName.includes('times') ||
    cleanName.includes('georgia') ||
    cleanName.includes('garamond') ||
    cleanName.includes('cambria') ||
    cleanName.includes('palatino') ||
    cleanName.includes('minion') ||
    cleanName.includes('baskerville') ||
    cleanName.includes('serif') ||
    cleanName.includes('roman')
  ) {
    matchedFamily = AVAILABLE_FONTS[3].cssFamily; // Times New Roman
    detectedType = 'serif';
  } else if (
    cleanName.includes('courier') ||
    cleanName.includes('mono') ||
    cleanName.includes('consolas') ||
    cleanName.includes('menlo') ||
    cleanName.includes('typewriter') ||
    cleanName.includes('inconsolata')
  ) {
    matchedFamily = AVAILABLE_FONTS[6].cssFamily; // Courier Prime
    detectedType = 'monospace';
  } else if (
    cleanName.includes('segoe') ||
    cleanName.includes('calibri')
  ) {
    matchedFamily = AVAILABLE_FONTS[1].cssFamily; // Segoe UI
    detectedType = 'sans-serif';
  } else if (
    cleanName.includes('arial') ||
    cleanName.includes('helvetica') ||
    cleanName.includes('sans')
  ) {
    matchedFamily = AVAILABLE_FONTS[2].cssFamily; // Arial
    detectedType = 'sans-serif';
  }

  return {
    family: matchedFamily,
    size: calculatedSize,
    weight: isBold ? '700' : '400',
    style: isItalic ? 'italic' : 'normal',
    color: '#0f172a',
    bgColor: '#ffffff',
    letterSpacing: 0,
    align: 'left',
    lineHeight: 1.25,
  };
}

export function getFontFamilyLabel(cssFamily: string): string {
  const found = AVAILABLE_FONTS.find((f) => f.cssFamily === cssFamily);
  if (found) return found.name;
  if (cssFamily.includes('Times')) return 'Times New Roman';
  if (cssFamily.includes('Courier')) return 'Courier Prime';
  if (cssFamily.includes('Segoe')) return 'Segoe UI';
  if (cssFamily.includes('Arial')) return 'Arial';
  return 'Sans-Serif';
}
