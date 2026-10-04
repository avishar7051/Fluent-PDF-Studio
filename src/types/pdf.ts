export interface FontStyleInfo {
  family: string;
  size: number;
  weight: string; // '400' | '600' | '700'
  style: 'normal' | 'italic';
  color: string;
  bgColor?: string;
  letterSpacing?: number;
  align?: 'left' | 'center' | 'right';
  lineHeight?: number;
}

export interface PdfTextItem {
  id: string;
  text: string;
  x: number; // in pt
  y: number; // in pt (from top-left of page)
  width: number;
  height: number;
  fontName: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: 'normal' | 'italic';
  fontFamily: string;
  detectedColor: string;
  transform: number[];
}

export interface SignatureMetadata {
  signerName: string;
  signerEmail?: string;
  timestamp: string;
  auditHash: string;
  type: 'draw' | 'type' | 'upload';
  verified: boolean;
}

export interface PdfAnnotation {
  id: string;
  pageIndex: number; // 0-based
  type: 'text-replace' | 'text-box' | 'signature' | 'image' | 'highlight' | 'pen' | 'redaction' | 'stamp' | 'shape';
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  width: number; // percentage 0 - 100
  height: number; // percentage 0 - 100
  rotation?: number; // degrees
  content?: string;
  originalText?: string;
  originalFont?: FontStyleInfo;
  fontSettings?: FontStyleInfo;
  signatureDataUrl?: string;
  signatureMeta?: SignatureMetadata;
  shapeType?: 'check' | 'cross' | 'rectangle' | 'circle' | 'line';
  strokeColor?: string;
  strokeWidth?: number;
  fillColor?: string;
  opacity?: number;
  pathPoints?: { x: number; y: number }[]; // for freehand pen / highlight
  isLocked?: boolean;
}

export interface PdfPageData {
  pageIndex: number;
  pageNumber: number;
  width: number;
  height: number;
  originalWidth: number;
  originalHeight: number;
  rotation: number;
  textItems: PdfTextItem[];
}

export interface PdfDocumentState {
  id: string;
  name: string;
  fileSize: number;
  numPages: number;
  pages: PdfPageData[];
  rawBytes: Uint8Array | null;
  annotations: PdfAnnotation[];
  primaryFont?: FontStyleInfo;
}

export type ActiveTool =
  | 'select'
  | 'edit-text'
  | 'add-text'
  | 'signature'
  | 'highlight'
  | 'pen'
  | 'redaction'
  | 'shape'
  | 'stamp'
  | 'image';

export interface HistoryStep {
  annotations: PdfAnnotation[];
  description: string;
}
