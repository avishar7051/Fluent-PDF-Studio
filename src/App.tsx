import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  PdfDocumentState,
  PdfAnnotation,
  PdfTextItem,
  ActiveTool,
  FontStyleInfo,
  SignatureMetadata,
  HistoryStep,
} from './types/pdf';
import { parsePdfDocument } from './utils/pdfHelper';
import { createSampleContractPdf, createSampleInvoicePdf } from './utils/samplePdfs';
import { convertImageToPdf } from './utils/imageToPdf';
import { exportModifiedPdf, triggerPdfDownload } from './utils/pdfExporter';
import { WelcomeUploadScreen } from './components/WelcomeUploadScreen';
import { SimpleHeader } from './components/SimpleHeader';
import { PdfCanvasPage } from './components/PdfCanvasPage';
import { TextEditModal } from './components/TextEditModal';
import { SignatureModal } from './components/SignatureModal';
import { GitHubPackageModal } from './components/GitHubPackageModal';
import {
  FileSignature,
  Calendar,
  Check,
  X as CrossIcon,
  RotateCw,
  Trash2,
  Layers,
  Loader2,
  AlertCircle,
  Maximize2,
  Minimize2,
  ArrowUp,
  ArrowDown,
  ZoomIn,
  ZoomOut,
  Rows3,
  Square,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

export default function App() {
  const [docState, setDocState] = useState<PdfDocumentState | null>(null);
  const [pdfDocProxy, setPdfDocProxy] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(1.0);
  const [activeTool, setActiveTool] = useState<ActiveTool>('edit-text');
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // View Mode: Continuous Multi-Page Scroll vs Single Page Focus
  const [isContinuousView, setIsContinuousView] = useState<boolean>(true);

  // Scroll Viewport Ref
  const mainScrollRef = useRef<HTMLDivElement | null>(null);

  // Page container refs for scroll observation
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Drawers & Modals
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState<boolean>(false);
  const [isTextEditModalOpen, setIsTextEditModalOpen] = useState<boolean>(false);
  const [isGitHubModalOpen, setIsGitHubModalOpen] = useState<boolean>(false);

  // Target text item being edited & crop preview image
  const [targetTextItem, setTargetTextItem] = useState<PdfTextItem | null>(null);
  const [sampledBgColor, setSampledBgColor] = useState<string>('#ffffff');
  const [cropPreviewUrl, setCropPreviewUrl] = useState<string | undefined>(undefined);
  const [editingTargetPageIndex, setEditingTargetPageIndex] = useState<number>(0);

  // Pending signature drop location
  const pendingDropLocationRef = useRef<{ pageIndex: number; xPct: number; yPct: number } | null>(null);

  // Saved signatures library
  const [lastUsedSignature, setLastUsedSignature] = useState<{
    dataUrl: string;
    meta?: SignatureMetadata;
  } | null>(null);

  // Undo / Redo history
  const [history, setHistory] = useState<HistoryStep[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Push history snapshot
  const pushHistory = useCallback(
    (newAnnotations: PdfAnnotation[], description: string) => {
      setHistory((prev) => {
        const sliced = prev.slice(0, historyIndex + 1);
        return [...sliced, { annotations: newAnnotations, description }];
      });
      setHistoryIndex((prev) => prev + 1);
    },
    [historyIndex]
  );

  // Auto-calculate optimal fit zoom based on viewport dimensions
  const autoFitZoom = useCallback((pageW: number, pageH: number) => {
    if (!mainScrollRef.current) return;
    const viewW = mainScrollRef.current.clientWidth - 80;
    const viewH = mainScrollRef.current.clientHeight - 120;
    if (viewW <= 0 || viewH <= 0) return;

    // Default to fit width with comfortable margins
    const scaleW = viewW / pageW;
    const scaleH = viewH / pageH;
    const chosen = Math.max(0.6, Math.min(1.4, Math.min(scaleW, scaleH * 1.1)));
    setZoom(Math.round(chosen * 100) / 100);
  }, []);

  // Load a document from bytes
  const loadDocumentFromBytes = useCallback(
    async (bytes: Uint8Array, name: string, extraTextItems?: PdfTextItem[]) => {
      try {
        setIsLoading(true);
        setErrorMessage(null);
        setLoadingMessage(`Rendering ${name}...`);

        const { state, pdfDocProxy: proxy } = await parsePdfDocument(bytes, name);

        // If extra OCR items were extracted from image, attach to first page
        if (extraTextItems && extraTextItems.length > 0 && state.pages.length > 0) {
          state.pages[0].textItems = extraTextItems;
        }

        setDocState(state);
        setPdfDocProxy(proxy);
        setCurrentPageIndex(0);
        setSelectedAnnotationId(null);
        setHistory([{ annotations: [], description: 'Document Initialized' }]);
        setHistoryIndex(0);
        setIsLoading(false);

        // Auto fit zoom for initial view
        if (state.pages.length > 0) {
          setTimeout(() => {
            autoFitZoom(state.pages[0].width, state.pages[0].height);
          }, 100);
        }
      } catch (err) {
        console.error('Failed to load PDF document:', err);
        setIsLoading(false);
        setErrorMessage('Unable to parse document. Please verify the file is a valid PDF or image.');
      }
    },
    [autoFitZoom]
  );

  // Handle User File Upload (PDF or Image auto-converted to PDF with OCR)
  const handleFileSelect = async (file: File) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      if (file.type.startsWith('image/')) {
        setLoadingMessage(`Converting image "${file.name}" to PDF with text recognition...`);
        const { bytes, name, textItems } = await convertImageToPdf(file, (_, msg) => {
          setLoadingMessage(msg);
        });
        await loadDocumentFromBytes(bytes, name, textItems);
      } else {
        setLoadingMessage(`Loading "${file.name}"...`);
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        await loadDocumentFromBytes(bytes, file.name);
      }
    } catch (err) {
      console.error('File load error:', err);
      setIsLoading(false);
      setErrorMessage('Could not load file. Please check file format.');
    }
  };

  // Sample Documents
  const handleLoadSample = async (type: 'contract' | 'invoice') => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      if (type === 'contract') {
        setLoadingMessage('Generating Sample Contract NDA...');
        const { bytes, name } = await createSampleContractPdf();
        await loadDocumentFromBytes(bytes, name);
      } else {
        setLoadingMessage('Generating Sample Invoice...');
        const { bytes, name } = await createSampleInvoicePdf();
        await loadDocumentFromBytes(bytes, name);
      }
    } catch (err) {
      console.error('Sample generation error:', err);
      setIsLoading(false);
      setErrorMessage('Could not generate sample document.');
    }
  };

  // Annotations Management
  const handleAddAnnotation = (anno: PdfAnnotation) => {
    if (!docState) return;
    const updated = [...docState.annotations, anno];
    setDocState({ ...docState, annotations: updated });
    setSelectedAnnotationId(anno.id);
    pushHistory(updated, `Add ${anno.type}`);
  };

  const handleUpdateAnnotation = (updated: PdfAnnotation) => {
    if (!docState) return;
    const newAnnos = docState.annotations.map((a) => (a.id === updated.id ? updated : a));
    setDocState({ ...docState, annotations: newAnnos });
    pushHistory(newAnnos, `Update ${updated.type}`);
  };

  const handleDeleteAnnotation = (id: string) => {
    if (!docState) return;
    const newAnnos = docState.annotations.filter((a) => a.id !== id);
    setDocState({ ...docState, annotations: newAnnos });
    if (selectedAnnotationId === id) setSelectedAnnotationId(null);
    pushHistory(newAnnos, 'Delete item');
  };

  // Undo / Redo
  const handleUndo = () => {
    if (historyIndex > 0 && docState) {
      const prevStep = history[historyIndex - 1];
      setDocState({ ...docState, annotations: prevStep.annotations });
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1 && docState) {
      const nextStep = history[historyIndex + 1];
      setDocState({ ...docState, annotations: nextStep.annotations });
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Export & Download PDF
  const handleExportPdf = async () => {
    if (!docState) return;
    try {
      setIsExporting(true);
      const modifiedBytes = await exportModifiedPdf(docState);
      triggerPdfDownload(modifiedBytes, docState.name);
      setIsExporting(false);

      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#f97316', '#ef4444', '#3b82f6', '#10b981'],
        });
      } catch (e) {}
    } catch (err) {
      console.error('Export failed:', err);
      setIsExporting(false);
      setErrorMessage('Could not export PDF. Please check annotations and try again.');
    }
  };

  // Text Item Click -> Open In-Place Text Replacement
  const handleTextItemClick = (
    item: PdfTextItem,
    sampledBg: string,
    cropUrl?: string,
    pageIdx: number = currentPageIndex
  ) => {
    setTargetTextItem(item);
    setSampledBgColor(sampledBg);
    setCropPreviewUrl(cropUrl);
    setEditingTargetPageIndex(pageIdx);
    setIsTextEditModalOpen(true);
  };

  const handleApplyTextReplacement = (
    newText: string,
    fontSettings: FontStyleInfo,
    originalText?: string,
    erasePadding?: { horizontal: number; vertical: number }
  ) => {
    if (!targetTextItem || !docState) return;
    const targetPage = docState.pages[editingTargetPageIndex] || docState.pages[0];

    const origText = originalText || targetTextItem.text;
    const origW = targetTextItem.width;
    const origH = targetTextItem.height;

    const padH = erasePadding?.horizontal ?? 4;
    const padV = erasePadding?.vertical ?? 3;

    // Approximate character width of replacement text
    const approxCharWidth = (fontSettings.size || 12) * 0.62;
    const newTextWidth = newText.length * approxCharWidth;

    // Width covers either the original width or the new text width, plus padding
    const linesCount = Math.max(1, newText.split('\n').length);
    const lineGapMultiplier = fontSettings.lineHeight ?? 1.25;
    const finalWidthPt = Math.max(origW + padH * 2, newTextWidth + padH * 2);
    const finalHeightPt = Math.max(
      origH + padV * 2,
      (fontSettings.size || 12) * lineGapMultiplier * linesCount + padV * 2
    );

    const finalWidthPct = (finalWidthPt / targetPage.width) * 100;
    const finalHeightPct = (finalHeightPt / targetPage.height) * 100;

    // Offset slightly by padding so patch completely surrounds original text ink
    const finalLeftPct = Math.max(0, ((targetTextItem.x - padH) / targetPage.width) * 100);
    const finalTopPct = Math.max(0, ((targetTextItem.y - padV) / targetPage.height) * 100);

    const existing = docState.annotations.find(
      (a) => a.pageIndex === editingTargetPageIndex && a.id === targetTextItem.id
    );

    if (existing) {
      handleUpdateAnnotation({
        ...existing,
        content: newText,
        fontSettings,
        width: Math.min(100 - existing.x, finalWidthPct),
        height: Math.min(100 - existing.y, finalHeightPct),
      });
    } else {
      const replacementAnno: PdfAnnotation = {
        id: `replace_${Date.now()}`,
        pageIndex: editingTargetPageIndex,
        type: 'text-replace',
        x: finalLeftPct,
        y: finalTopPct,
        width: Math.min(100 - finalLeftPct, finalWidthPct),
        height: Math.min(100 - finalTopPct, finalHeightPct),
        content: newText,
        originalText: origText,
        fontSettings: {
          ...fontSettings,
          bgColor: fontSettings.bgColor || sampledBgColor || '#ffffff',
        },
      };
      handleAddAnnotation(replacementAnno);
    }
  };

  // Digital Signature Creation & Placement
  const handleSaveSignature = (dataUrl: string, meta?: SignatureMetadata) => {
    setLastUsedSignature({ dataUrl, meta });

    const dropLoc = pendingDropLocationRef.current || { pageIndex: currentPageIndex, xPct: 40, yPct: 75 };
    pendingDropLocationRef.current = null;

    handleAddAnnotation({
      id: `sig_${Date.now()}`,
      pageIndex: dropLoc.pageIndex,
      type: 'signature',
      x: dropLoc.xPct,
      y: dropLoc.yPct,
      width: 22,
      height: 7,
      signatureDataUrl: dataUrl,
      signatureMeta: meta,
      opacity: 1,
    });
  };

  // Quick Signature Drop from dock
  const handleQuickSignatureDrop = (xPct: number, yPct: number, pageIdx: number = currentPageIndex) => {
    if (lastUsedSignature) {
      handleAddAnnotation({
        id: `sig_${Date.now()}`,
        pageIndex: pageIdx,
        type: 'signature',
        x: Math.max(0, xPct - 11),
        y: Math.max(0, yPct - 3.5),
        width: 22,
        height: 7,
        signatureDataUrl: lastUsedSignature.dataUrl,
        signatureMeta: lastUsedSignature.meta,
        opacity: 1,
      });
    } else {
      pendingDropLocationRef.current = { pageIndex: pageIdx, xPct: Math.max(0, xPct - 11), yPct: Math.max(0, yPct - 3.5) };
      setIsSignatureModalOpen(true);
    }
  };

  // Page Operations
  const handleRotatePage = (index: number) => {
    if (!docState) return;
    const newPages = docState.pages.map((p, i) =>
      i === index ? { ...p, rotation: ((p.rotation + 90) % 360) as any } : p
    );
    setDocState({ ...docState, pages: newPages });
  };

  const handleDeletePage = (index: number) => {
    if (!docState || docState.pages.length <= 1) return;
    const newPages = docState.pages.filter((_, i) => i !== index);
    const newAnnos = docState.annotations
      .filter((a) => a.pageIndex !== index)
      .map((a) => (a.pageIndex > index ? { ...a, pageIndex: a.pageIndex - 1 } : a));

    setDocState({
      ...docState,
      pages: newPages,
      numPages: newPages.length,
      annotations: newAnnos,
    });
    if (currentPageIndex >= newPages.length) {
      setCurrentPageIndex(newPages.length - 1);
    }
  };

  // Navigation and Smooth Scroll Helpers
  const scrollToPage = (pageIdx: number) => {
    setCurrentPageIndex(pageIdx);
    if (isContinuousView && pageRefs.current[pageIdx]) {
      pageRefs.current[pageIdx]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleScrollTop = () => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleScrollBottom = () => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTo({ top: mainScrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  const handleFitToWidth = () => {
    if (!docState || !mainScrollRef.current) return;
    const pageW = docState.pages[0]?.width || 600;
    const viewW = mainScrollRef.current.clientWidth - 60;
    if (viewW > 100) {
      setZoom(Math.round((viewW / pageW) * 100) / 100);
    }
  };

  const handleFitToPage = () => {
    if (!docState || !mainScrollRef.current) return;
    const p = docState.pages[currentPageIndex] || docState.pages[0];
    if (p) {
      autoFitZoom(p.width, p.height);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleExportPdf();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedAnnotationId) {
          e.preventDefault();
          handleDeleteAnnotation(selectedAnnotationId);
        }
      } else if (e.key === 'Escape') {
        setSelectedAnnotationId(null);
        setIsTextEditModalOpen(false);
        setIsSignatureModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAnnotationId, historyIndex, docState]);

  // If no document is loaded, render the Simple Welcome & Upload Screen
  if (!docState) {
    return (
      <div className="relative w-full h-full min-h-screen">
        <WelcomeUploadScreen
          onFileSelect={handleFileSelect}
          onLoadSample={handleLoadSample}
          isLoading={isLoading}
          loadingMessage={loadingMessage}
        />
        {errorMessage && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-950 text-red-200 border border-red-800 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs z-50">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="ml-2 hover:text-white">✕</button>
          </div>
        )}
      </div>
    );
  }

  const currentPage = docState.pages[currentPageIndex];

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 font-sans antialiased text-slate-100 overflow-hidden">
      {/* 1. UNIFIED MINIMALIST TOP HEADER */}
      <SimpleHeader
        documentName={docState.name}
        currentPage={currentPageIndex + 1}
        totalPages={docState.numPages}
        zoom={zoom}
        onZoomChange={setZoom}
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        onOpenSignatureModal={() => setIsSignatureModalOpen(true)}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onBackToUpload={() => {
          setDocState(null);
          setPdfDocProxy(null);
        }}
        onExportPdf={handleExportPdf}
        onPrevPage={() => scrollToPage(Math.max(0, currentPageIndex - 1))}
        onNextPage={() => scrollToPage(Math.min(docState.numPages - 1, currentPageIndex + 1))}
        onOpenGitHubModal={() => setIsGitHubModalOpen(true)}
      />

      {/* Mode Guidance & View Toggle Bar */}
      <div className="bg-slate-950 border-b border-slate-800/80 px-4 py-1.5 flex items-center justify-between text-xs text-slate-300 z-20 shrink-0">
        <div className="flex items-center gap-2">
          {activeTool === 'edit-text' ? (
            <div className="flex items-center gap-2 text-orange-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span>
                <strong>Edit Text Active:</strong> Click or drag a box over any text (e.g. &ldquo;Choose format&rdquo;) to edit in matching font.
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Current Tool: <strong className="text-white capitalize">{activeTool.replace('-', ' ')}</strong></span>
            </div>
          )}
        </div>

        {/* View Mode Switcher: Continuous Scroll vs Single Page */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setIsContinuousView(true)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                isContinuousView ? 'bg-orange-500 text-white font-medium shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="Continuous Multi-Page Scroll (Scroll all pages vertically)"
            >
              <Rows3 className="w-3 h-3" />
              <span>Continuous Scroll</span>
            </button>
            <button
              onClick={() => setIsContinuousView(false)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                !isContinuousView ? 'bg-orange-500 text-white font-medium shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
              title="Single Page Mode"
            >
              <Square className="w-3 h-3" />
              <span>Single Page</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error banner if present */}
      {errorMessage && (
        <div className="bg-red-950/90 text-red-200 border-b border-red-800 px-4 py-2 flex items-center justify-between text-xs z-40">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="hover:text-white">✕</button>
        </div>
      )}

      {/* 2. MAIN WORKSPACE VIEWPORT */}
      <div className="flex flex-1 overflow-hidden relative min-h-0">
        {/* Left Thumbnail Drawer */}
        {showThumbnails && (
          <aside className="w-48 bg-slate-950/95 border-r border-slate-800 p-3 overflow-y-auto space-y-3 shrink-0 z-20 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-semibold text-slate-300">
              <span>All Pages ({docState.pages.length})</span>
              <button
                onClick={() => setShowThumbnails(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>
            {docState.pages.map((p, idx) => (
              <div
                key={idx}
                onClick={() => scrollToPage(idx)}
                className={`p-2 rounded-lg border text-center cursor-pointer transition-all ${
                  currentPageIndex === idx
                    ? 'border-orange-500 bg-orange-950/30 ring-1 ring-orange-500'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="text-xs font-medium text-slate-300">Page {idx + 1}</div>
                <div className="flex items-center justify-center gap-2 mt-1 text-[11px] text-slate-400">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRotatePage(idx);
                    }}
                    className="p-1 hover:text-white"
                    title="Rotate 90°"
                  >
                    <RotateCw className="w-3 h-3" />
                  </button>
                  {docState.pages.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePage(idx);
                      }}
                      className="p-1 hover:text-red-400"
                      title="Delete Page"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </aside>
        )}

        {/* Center Scrollable Canvas Viewport */}
        <main
          ref={mainScrollRef}
          className="flex-1 bg-slate-900/90 overflow-y-auto overflow-x-auto relative flex flex-col items-center select-none"
        >
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-3 my-auto">
              <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
              <p className="text-sm font-medium text-slate-300">{loadingMessage || 'Processing document...'}</p>
            </div>
          ) : pdfDocProxy ? (
            <div className="pt-6 pb-40 px-4 flex flex-col items-center min-h-full space-y-8">
              {isContinuousView ? (
                /* Continuous All-Pages Scroll View */
                docState.pages.map((page, idx) => (
                  <div
                    key={idx}
                    ref={(el) => {
                      pageRefs.current[idx] = el;
                    }}
                    className="flex flex-col items-center relative"
                  >
                    {/* Page Number Label */}
                    <div className="mb-2 px-3 py-0.5 rounded-full bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-400 shadow-xs flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      <span>Page {idx + 1} of {docState.pages.length}</span>
                    </div>

                    <PdfCanvasPage
                      page={page}
                      pageIndex={idx}
                      pdfDocProxy={pdfDocProxy}
                      scale={zoom}
                      activeTool={activeTool}
                      annotations={docState.annotations}
                      selectedAnnotationId={selectedAnnotationId}
                      defaultFont={docState.primaryFont}
                      onSelectAnnotation={setSelectedAnnotationId}
                      onUpdateAnnotation={handleUpdateAnnotation}
                      onAddAnnotation={handleAddAnnotation}
                      onTextItemClick={(item, bg, crop) => handleTextItemClick(item, bg, crop, idx)}
                      onQuickSignatureDrop={(x, y) => handleQuickSignatureDrop(x, y, idx)}
                    />
                  </div>
                ))
              ) : currentPage ? (
                /* Single Page View */
                <div className="flex flex-col items-center">
                  <div className="mb-2 px-3 py-0.5 rounded-full bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-slate-400 shadow-xs flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    <span>Page {currentPageIndex + 1} of {docState.pages.length}</span>
                  </div>

                  <PdfCanvasPage
                    page={currentPage}
                    pageIndex={currentPageIndex}
                    pdfDocProxy={pdfDocProxy}
                    scale={zoom}
                    activeTool={activeTool}
                    annotations={docState.annotations}
                    selectedAnnotationId={selectedAnnotationId}
                    defaultFont={docState.primaryFont}
                    onSelectAnnotation={setSelectedAnnotationId}
                    onUpdateAnnotation={handleUpdateAnnotation}
                    onAddAnnotation={handleAddAnnotation}
                    onTextItemClick={(item, bg, crop) => handleTextItemClick(item, bg, crop, currentPageIndex)}
                    onQuickSignatureDrop={(x, y) => handleQuickSignatureDrop(x, y, currentPageIndex)}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Floating Professional Page Scroll & Zoom Controller */}
          <div className="fixed right-6 bottom-16 bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-2xl p-1.5 flex flex-col items-center gap-1.5 z-40 backdrop-blur-md">
            <button
              onClick={handleFitToPage}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Fit Entire Page to Screen (Full View)"
            >
              <Minimize2 className="w-4 h-4 text-orange-400" />
            </button>
            <button
              onClick={handleFitToWidth}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Fit Page to Width"
            >
              <Maximize2 className="w-4 h-4 text-blue-400" />
            </button>
            <button
              onClick={() => setZoom(1.0)}
              className="px-1.5 py-1 rounded text-[10px] font-mono font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Reset to 100% Zoom"
            >
              100%
            </button>
            <div className="w-4 h-px bg-slate-800 my-0.5" />
            <button
              onClick={handleScrollTop}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Scroll to Top"
            >
              <ArrowUp className="w-4 h-4 text-slate-300" />
            </button>
            <button
              onClick={handleScrollBottom}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Scroll to Bottom"
            >
              <ArrowDown className="w-4 h-4 text-slate-300" />
            </button>
          </div>
        </main>
      </div>

      {/* 3. COMPACT FLOATING QUICK DOCK (DRAG-AND-DROP SIGNATURE & STAMPS) */}
      <footer className="h-11 bg-slate-950/95 border-t border-slate-800/80 px-4 flex items-center justify-between text-xs text-slate-400 z-20 shrink-0 select-none">
        {/* Toggle Thumbnail Drawer & Page navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Pages ({docState.pages.length})</span>
          </button>

          <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[11px]">
            <button
              onClick={() => scrollToPage(Math.max(0, currentPageIndex - 1))}
              disabled={currentPageIndex <= 0}
              className="p-1 hover:text-white disabled:opacity-30 cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <span className="px-1.5 font-mono">{currentPageIndex + 1}/{docState.pages.length}</span>
            <button
              onClick={() => scrollToPage(Math.min(docState.pages.length - 1, currentPageIndex + 1))}
              disabled={currentPageIndex >= docState.pages.length - 1}
              className="p-1 hover:text-white disabled:opacity-30 cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Drag-to-page palette */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 hidden sm:inline">Drag onto page:</span>

          {/* Quick Signature */}
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/json', JSON.stringify({ type: 'quick-signature' }));
              e.dataTransfer.effectAllowed = 'copy';
            }}
            onClick={() => setIsSignatureModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-orange-500/20 to-rose-500/20 hover:from-orange-500/30 hover:to-rose-500/30 text-orange-200 border border-orange-500/40 rounded-lg cursor-grab active:cursor-grabbing transition-all text-xs font-medium"
            title="Drag and drop onto signature line"
          >
            <FileSignature className="w-3.5 h-3.5 text-orange-400" />
            <span>Signature</span>
          </div>

          {/* Quick Date Stamp */}
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData(
                'application/json',
                JSON.stringify({ type: 'quick-date', payload: new Date().toLocaleDateString() })
              );
              e.dataTransfer.effectAllowed = 'copy';
            }}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-lg cursor-grab active:cursor-grabbing transition-colors text-xs"
            title="Drag date stamp"
          >
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Date</span>
          </div>

          {/* Quick Checkmark */}
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/json', JSON.stringify({ type: 'quick-check' }));
              e.dataTransfer.effectAllowed = 'copy';
            }}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-slate-700/80 rounded-lg cursor-grab active:cursor-grabbing transition-colors text-xs"
            title="Drag checkmark"
          >
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Check</span>
          </div>

          {/* Quick Cross */}
          <div
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/json', JSON.stringify({ type: 'quick-cross' }));
              e.dataTransfer.effectAllowed = 'copy';
            }}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-red-300 border border-slate-700/80 rounded-lg cursor-grab active:cursor-grabbing transition-colors text-xs"
            title="Drag cross"
          >
            <CrossIcon className="w-3.5 h-3.5 text-red-400" />
          </div>
        </div>

        {/* Free & Local indicator */}
        <div className="text-[11px] text-slate-400 hidden md:block">
          100% Free · Client-Side Private
        </div>
      </footer>

      {/* 4. MODALS */}
      {/* In-Place Text Replacement Modal */}
      <TextEditModal
        isOpen={isTextEditModalOpen}
        onClose={() => setIsTextEditModalOpen(false)}
        targetItem={targetTextItem}
        cropPreviewUrl={cropPreviewUrl}
        initialText={targetTextItem?.text || ''}
        initialFont={
          targetTextItem
            ? {
                family: targetTextItem.fontFamily,
                size: targetTextItem.fontSize,
                weight: targetTextItem.fontWeight,
                style: targetTextItem.fontStyle,
                color: targetTextItem.detectedColor || '#0f172a',
                bgColor: sampledBgColor,
                lineHeight: 1.25,
              }
            : docState.primaryFont
        }
        onApply={handleApplyTextReplacement}
      />

      {/* Digital Signature Creator Modal */}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSaveSignature={handleSaveSignature}
      />

      {/* GitHub Repository & Desktop Packaging Modal */}
      <GitHubPackageModal
        isOpen={isGitHubModalOpen}
        onClose={() => setIsGitHubModalOpen(false)}
      />

      {/* Export Loading Overlay */}
      {isExporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm">
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex items-center gap-3 text-slate-200">
            <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
            <span className="text-sm font-semibold">Generating & Downloading PDF...</span>
          </div>
        </div>
      )}
    </div>
  );
}
