import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PdfPageData, PdfAnnotation, PdfTextItem, ActiveTool, FontStyleInfo } from '../types/pdf';
import { renderPdfPageToCanvas, sampleBackgroundColor } from '../utils/pdfHelper';
import { detectTextAtPoint } from '../utils/textDetector';
import { Sparkles, Check, X, ShieldCheck } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

interface PdfCanvasPageProps {
  page: PdfPageData;
  pageIndex: number;
  pdfDocProxy: pdfjsLib.PDFDocumentProxy | null;
  scale: number;
  activeTool: ActiveTool;
  annotations: PdfAnnotation[];
  selectedAnnotationId: string | null;
  defaultFont?: FontStyleInfo;
  onSelectAnnotation: (id: string | null) => void;
  onUpdateAnnotation: (updated: PdfAnnotation) => void;
  onAddAnnotation: (anno: PdfAnnotation) => void;
  onTextItemClick: (item: PdfTextItem, sampledBg: string, cropPreviewUrl?: string) => void;
  onQuickSignatureDrop: (xPct: number, yPct: number) => void;
}

export const PdfCanvasPage: React.FC<PdfCanvasPageProps> = ({
  page,
  pageIndex,
  pdfDocProxy,
  scale,
  activeTool,
  annotations,
  selectedAnnotationId,
  defaultFont,
  onSelectAnnotation,
  onUpdateAnnotation,
  onAddAnnotation,
  onTextItemClick,
  onQuickSignatureDrop,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredTextItem, setHoveredTextItem] = useState<PdfTextItem | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  // Interaction dragging / resizing state
  const [dragState, setDragState] = useState<{
    type: 'move' | 'resize-se' | 'resize-sw' | 'resize-ne' | 'resize-nw';
    annotationId: string;
    startX: number;
    startY: number;
    initialAnno: PdfAnnotation;
  } | null>(null);

  // Creation drag state
  const [creationBox, setCreationBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Freehand drawing points
  const [penPoints, setPenPoints] = useState<{ x: number; y: number }[]>([]);
  const [isDrawingPen, setIsDrawingPen] = useState(false);

  // Render PDF page to canvas
  useEffect(() => {
    let isCancelled = false;
    const render = async () => {
      if (!pdfDocProxy || !canvasRef.current) return;
      try {
        setIsRendering(true);
        await renderPdfPageToCanvas(pdfDocProxy, pageIndex, canvasRef.current, scale * 1.5, page.rotation);
        if (!isCancelled) setIsRendering(false);
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException' && !err?.message?.includes('cancelled')) {
          console.error('Failed to render page to canvas:', err);
        }
        if (!isCancelled) setIsRendering(false);
      }
    };
    render();
    return () => {
      isCancelled = true;
      if (canvasRef.current && (canvasRef.current as any).__activeRenderTask) {
        try {
          (canvasRef.current as any).__activeRenderTask.cancel();
        } catch {}
      }
    };
  }, [pdfDocProxy, pageIndex, scale, page.rotation]);

  const displayWidth = page.width * scale;
  const displayHeight = page.height * scale;

  // Convert client coordinates to page percentage (0 - 100)
  const getPageCoords = useCallback(
    (clientX: number, clientY: number): { xPct: number; yPct: number } => {
      if (!containerRef.current) return { xPct: 0, yPct: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const xPct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      const yPct = Math.max(0, Math.min(100, (y / rect.height) * 100));
      return { xPct, yPct };
    },
    []
  );

  // Drag-and-drop file / chip drop handler
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dataStr = e.dataTransfer.getData('application/json');
    const { xPct, yPct } = getPageCoords(e.clientX, e.clientY);

    if (dataStr) {
      try {
        const data = JSON.parse(dataStr);
        if (data.type === 'quick-signature') {
          onQuickSignatureDrop(xPct, yPct);
        } else if (data.type === 'quick-date') {
          onAddAnnotation({
            id: `date_${Date.now()}`,
            pageIndex,
            type: 'text-box',
            x: Math.max(0, xPct - 5),
            y: Math.max(0, yPct - 1.5),
            width: 14,
            height: 3,
            content: data.payload || new Date().toLocaleDateString(),
            fontSettings: defaultFont || {
              family: '"Plus Jakarta Sans", Arial, sans-serif',
              size: 11,
              weight: '400',
              style: 'normal',
              color: '#0f172a',
              bgColor: '#ffffff',
            },
          });
        } else if (data.type === 'quick-check') {
          onAddAnnotation({
            id: `check_${Date.now()}`,
            pageIndex,
            type: 'shape',
            shapeType: 'check',
            x: Math.max(0, xPct - 2),
            y: Math.max(0, yPct - 2),
            width: 4,
            height: 4,
            strokeColor: '#16a34a',
            strokeWidth: 2.5,
          });
        } else if (data.type === 'quick-cross') {
          onAddAnnotation({
            id: `cross_${Date.now()}`,
            pageIndex,
            type: 'shape',
            shapeType: 'cross',
            x: Math.max(0, xPct - 2),
            y: Math.max(0, yPct - 2),
            width: 4,
            height: 4,
            strokeColor: '#dc2626',
            strokeWidth: 2.5,
          });
        }
      } catch (err) {
        console.warn('Drop error:', err);
      }
    }
  };

  // Click on a text item to initiate Font-Matching Edit
  const handleTextItemSelect = (item: PdfTextItem) => {
    let sampledBg = '#ffffff';
    let cropDataUrl: string | undefined = undefined;

    if (canvasRef.current) {
      const cW = canvasRef.current.width;
      const cH = canvasRef.current.height;
      const pxX = (item.x / page.width) * cW;
      const pxY = (item.y / page.height) * cH;
      const pxW = (item.width / page.width) * cW;
      const pxH = (item.height / page.height) * cH;

      sampledBg = sampleBackgroundColor(canvasRef.current, pxX, pxY, pxW, pxH);

      try {
        const cropC = document.createElement('canvas');
        cropC.width = Math.max(10, Math.round(pxW));
        cropC.height = Math.max(10, Math.round(pxH));
        const cropCtx = cropC.getContext('2d');
        if (cropCtx) {
          cropCtx.drawImage(canvasRef.current, pxX, pxY, pxW, pxH, 0, 0, cropC.width, cropC.height);
          cropDataUrl = cropC.toDataURL('image/png');
        }
      } catch (e) {}
    }

    onTextItemClick(item, sampledBg, cropDataUrl);
  };

  // Canvas pointer down handler
  const handlePointerDownContainer = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragState) return;

    const { xPct, yPct } = getPageCoords(e.clientX, e.clientY);

    // 1. ADD TEXT: Places a new text box with the document's matching primary font
    if (activeTool === 'add-text') {
      const matchingFont: FontStyleInfo = defaultFont
        ? { ...defaultFont }
        : {
            family: '"Plus Jakarta Sans", sans-serif',
            size: 12,
            weight: '400',
            style: 'normal',
            color: '#0f172a',
            bgColor: '#ffffff',
            lineHeight: 1.25,
          };

      onAddAnnotation({
        id: `text_${Date.now()}`,
        pageIndex,
        type: 'text-box',
        x: xPct,
        y: yPct,
        width: 25,
        height: 4,
        content: 'New Text',
        fontSettings: matchingFont,
      });
      return;
    }

    // 2. EDIT TEXT: Check if click hit near any text item, or start drag selection
    if (activeTool === 'edit-text') {
      const clickXpt = (xPct / 100) * page.width;
      const clickYpt = (yPct / 100) * page.height;

      // Find nearest text item
      let closestItem: PdfTextItem | null = null;
      for (const item of page.textItems) {
        if (
          clickXpt >= item.x - 6 &&
          clickXpt <= item.x + item.width + 6 &&
          clickYpt >= item.y - 6 &&
          clickYpt <= item.y + item.height + 6
        ) {
          closestItem = item;
          break;
        }
      }

      if (closestItem) {
        handleTextItemSelect(closestItem);
        return;
      }

      // Allow dragging or clicking to select text region
      setCreationBox({
        startX: xPct,
        startY: yPct,
        currentX: xPct,
        currentY: yPct,
      });
      return;
    }

    // 3. REDACTION / HIGHLIGHT
    if (activeTool === 'redaction' || activeTool === 'highlight') {
      setCreationBox({
        startX: xPct,
        startY: yPct,
        currentX: xPct,
        currentY: yPct,
      });
      return;
    }

    // 4. FREEHAND PEN
    if (activeTool === 'pen') {
      setIsDrawingPen(true);
      setPenPoints([{ x: xPct, y: yPct }]);
      return;
    }

    // Deselect if clicking on empty page in select mode
    if (activeTool === 'select') {
      onSelectAnnotation(null);
    }
  };

  const handlePointerMoveContainer = (e: React.PointerEvent<HTMLDivElement>) => {
    const { xPct, yPct } = getPageCoords(e.clientX, e.clientY);

    // If dragging an existing annotation (move or resize)
    if (dragState) {
      const { type, initialAnno, startX, startY } = dragState;
      const deltaX = xPct - startX;
      const deltaY = yPct - startY;

      if (type === 'move') {
        onUpdateAnnotation({
          ...initialAnno,
          x: Math.max(0, Math.min(100 - initialAnno.width, initialAnno.x + deltaX)),
          y: Math.max(0, Math.min(100 - initialAnno.height, initialAnno.y + deltaY)),
        });
      } else if (type === 'resize-se') {
        onUpdateAnnotation({
          ...initialAnno,
          width: Math.max(2, initialAnno.width + deltaX),
          height: Math.max(1.5, initialAnno.height + deltaY),
        });
      } else if (type === 'resize-sw') {
        const newW = Math.max(2, initialAnno.width - deltaX);
        const newX = initialAnno.x + (initialAnno.width - newW);
        onUpdateAnnotation({
          ...initialAnno,
          x: newX,
          width: newW,
          height: Math.max(1.5, initialAnno.height + deltaY),
        });
      }
      return;
    }

    // If drawing creation box
    if (creationBox) {
      setCreationBox((prev) => (prev ? { ...prev, currentX: xPct, currentY: yPct } : null));
      return;
    }

    // If drawing freehand pen
    if (isDrawingPen) {
      setPenPoints((prev) => [...prev, { x: xPct, y: yPct }]);
      return;
    }
  };

  const handlePointerUpContainer = async () => {
    if (dragState) {
      setDragState(null);
    }

    if (creationBox) {
      const minX = Math.min(creationBox.startX, creationBox.currentX);
      const minY = Math.min(creationBox.startY, creationBox.currentY);
      const width = Math.abs(creationBox.currentX - creationBox.startX);
      const height = Math.abs(creationBox.currentY - creationBox.startY);

      // Handle Edit Text Selection (Works on both native PDFs and uploaded Images!)
      if (activeTool === 'edit-text') {
        if (canvasRef.current) {
          const cW = canvasRef.current.width;
          const cH = canvasRef.current.height;
          const clickPxX = (minX / 100) * cW;
          const clickPxY = (minY / 100) * cH;

          const dragBox =
            width > 0.8 && height > 0.8
              ? {
                  startX: (minX / 100) * cW,
                  startY: (minY / 100) * cH,
                  endX: ((minX + width) / 100) * cW,
                  endY: ((minY + height) / 100) * cH,
                }
              : undefined;

          try {
            // Automatically detect text line boundaries around the click/drag
            const detected = await detectTextAtPoint(canvasRef.current, clickPxX, clickPxY, dragBox);

            const ptX = (detected.x / cW) * page.width;
            const ptY = (detected.y / cH) * page.height;
            const ptW = (detected.width / cW) * page.width;
            const ptH = (detected.height / cH) * page.height;

            // Check if there is an existing text item nearby
            const nearItem = page.textItems.find(
              (t) => Math.abs(t.x - ptX) < 40 && Math.abs(t.y - ptY) < 25
            );

            let familyName = defaultFont?.family || '"Plus Jakarta Sans", sans-serif';
            if (detected.fontCategory === 'serif') {
              familyName = 'Georgia, "Times New Roman", serif';
            } else if (detected.fontCategory === 'monospace') {
              familyName = '"Courier Prime", Courier, monospace';
            } else if (detected.fontCategory === 'cursive') {
              familyName = '"Dancing Script", cursive';
            }

            const virtualItem: PdfTextItem = {
              id: `edit_${Date.now()}`,
              text: detected.detectedText || nearItem?.text || '',
              x: ptX,
              y: ptY,
              width: Math.max(ptW, nearItem?.width || 50),
              height: Math.max(ptH, nearItem?.height || 18),
              fontName: nearItem?.fontName || (detected.fontCategory === 'serif' ? 'Times-Roman' : 'Helvetica'),
              fontSize: detected.estimatedFontSize || nearItem?.fontSize || 12,
              fontWeight: detected.fontWeight || nearItem?.fontWeight || '400',
              fontStyle: detected.fontStyle || nearItem?.fontStyle || 'normal',
              fontFamily: nearItem?.fontFamily || familyName,
              detectedColor: detected.textColor || nearItem?.detectedColor || '#0f172a',
              transform: nearItem?.transform || [12, 0, 0, 12, ptX, ptY],
            };

            onTextItemClick(virtualItem, detected.bgColor, detected.cropDataUrl);
          } catch (detErr) {
            console.warn('Text detection error:', detErr);
          }
        }
        setCreationBox(null);
        return;
      }

      if (width > 0.5 && height > 0.5) {
        if (activeTool === 'redaction') {
          onAddAnnotation({
            id: `redact_${Date.now()}`,
            pageIndex,
            type: 'redaction',
            x: minX,
            y: minY,
            width,
            height,
            fillColor: '#000000',
          });
        } else if (activeTool === 'highlight') {
          onAddAnnotation({
            id: `hl_${Date.now()}`,
            pageIndex,
            type: 'highlight',
            x: minX,
            y: minY,
            width,
            height,
            fillColor: '#fef08a',
            opacity: 0.4,
          });
        }
      }
      setCreationBox(null);
    }

    if (isDrawingPen && penPoints.length > 2) {
      setIsDrawingPen(false);
      setPenPoints([]);
    }
  };

  const pageAnnotations = annotations.filter((a) => a.pageIndex === pageIndex);

  return (
    <div className="relative flex justify-center py-4 px-2 sm:px-4">
      {/* Outer Paper Canvas Container */}
      <div
        ref={containerRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onPointerDown={handlePointerDownContainer}
        onPointerMove={handlePointerMoveContainer}
        onPointerUp={handlePointerUpContainer}
        style={{
          width: `${displayWidth}px`,
          height: `${displayHeight}px`,
        }}
        className={`relative bg-white shadow-2xl rounded-xs overflow-hidden transition-shadow ${
          activeTool === 'edit-text'
            ? 'cursor-pointer'
            : activeTool === 'redaction' || activeTool === 'highlight'
            ? 'cursor-crosshair'
            : activeTool === 'add-text'
            ? 'cursor-cell'
            : 'cursor-default'
        }`}
      >
        {/* Underlying PDF.js Render Canvas */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />

        {/* ========================================================
            LAYER 1: Text Inspection & Font Match Layer (When tool === 'edit-text')
            ======================================================== */}
        {activeTool === 'edit-text' && (
          <div className="absolute inset-0 pointer-events-auto z-40">
            {page.textItems.map((item) => {
              const leftPct = (item.x / page.width) * 100;
              const topPct = (item.y / page.height) * 100;
              const widthPct = (item.width / page.width) * 100;
              const heightPct = (item.height / page.height) * 100;

              const isHovered = hoveredTextItem?.id === item.id;

              return (
                <div
                  key={item.id}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    handleTextItemSelect(item);
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTextItemSelect(item);
                  }}
                  onMouseEnter={() => setHoveredTextItem(item)}
                  onMouseLeave={() => setHoveredTextItem(null)}
                  style={{
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    width: `${widthPct}%`,
                    height: `${heightPct}%`,
                  }}
                  className={`absolute rounded-xs transition-all cursor-pointer group ${
                    isHovered
                      ? 'bg-orange-500/35 ring-2 ring-orange-500 z-50 shadow-md'
                      : 'border border-blue-400/40 hover:border-orange-500 bg-blue-500/5'
                  }`}
                  title={`Click to edit: "${item.text}"`}
                >
                  {isHovered && (
                    <div className="absolute -top-7 left-0 bg-slate-950 text-white text-[10px] px-2 py-0.5 rounded-md shadow-xl whitespace-nowrap z-50 flex items-center gap-1.5 border border-orange-500/50 pointer-events-none">
                      <Sparkles className="w-2.5 h-2.5 text-orange-400" />
                      <span className="font-semibold text-orange-300">Click to Edit:</span>
                      <span className="text-slate-300">
                        {item.fontName.replace(/^[A-Z]{6}\+/, '')} ({item.fontSize}pt)
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================
            LAYER 2: Placed Annotations & Replaced Text Elements
            ======================================================== */}
        <div className="absolute inset-0 pointer-events-none z-30">
          {pageAnnotations.map((anno) => {
            const isSelected = selectedAnnotationId === anno.id;

            return (
              <div
                key={anno.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectAnnotation(anno.id);
                }}
                onPointerDown={(e) => {
                  if (activeTool === 'select' && !anno.isLocked) {
                    e.stopPropagation();
                    onSelectAnnotation(anno.id);
                    const { xPct, yPct } = getPageCoords(e.clientX, e.clientY);
                    setDragState({
                      type: 'move',
                      annotationId: anno.id,
                      startX: xPct,
                      startY: yPct,
                      initialAnno: { ...anno },
                    });
                  }
                }}
                style={{
                  left: `${anno.x}%`,
                  top: `${anno.y}%`,
                  width: `${anno.width}%`,
                  height: `${anno.height}%`,
                  transform: anno.rotation ? `rotate(${anno.rotation}deg)` : undefined,
                  opacity: anno.opacity ?? 1,
                }}
                className={`absolute transition-shadow pointer-events-auto ${
                  isSelected
                    ? 'ring-2 ring-orange-500 shadow-md z-30'
                    : 'hover:ring-1 hover:ring-orange-400/50 z-20'
                }`}
              >
                {/* 1. TEXT REPLACEMENT (Completely erases original text underneath with solid patch) */}
                {anno.type === 'text-replace' && (
                  <div
                    className="w-full h-full flex items-center overflow-hidden px-1 rounded-xs"
                    style={{
                      backgroundColor: anno.fontSettings?.bgColor || '#ffffff',
                      boxShadow: `0 0 0 1px ${anno.fontSettings?.bgColor || '#ffffff'}`,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: anno.fontSettings?.family,
                        fontSize: `${(anno.fontSettings?.size || 12) * scale}px`,
                        fontWeight: anno.fontSettings?.weight || '400',
                        fontStyle: anno.fontSettings?.style || 'normal',
                        color: anno.fontSettings?.color || '#0f172a',
                        textAlign: anno.fontSettings?.align || 'left',
                        letterSpacing: `${anno.fontSettings?.letterSpacing || 0}px`,
                        lineHeight: anno.fontSettings?.lineHeight ?? 1.25,
                        whiteSpace: 'pre-wrap',
                        width: '100%',
                      }}
                    >
                      {anno.content}
                    </span>
                  </div>
                )}

                {/* 2. TEXT BOX */}
                {anno.type === 'text-box' && (
                  <div
                    className="w-full h-full flex items-start overflow-hidden p-0.5"
                    style={{
                      backgroundColor: anno.fontSettings?.bgColor || 'transparent',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: anno.fontSettings?.family || 'sans-serif',
                        fontSize: `${(anno.fontSettings?.size || 12) * scale}px`,
                        fontWeight: anno.fontSettings?.weight || '400',
                        fontStyle: anno.fontSettings?.style || 'normal',
                        color: anno.fontSettings?.color || '#0f172a',
                        textAlign: anno.fontSettings?.align || 'left',
                        whiteSpace: 'pre-wrap',
                        width: '100%',
                        lineHeight: anno.fontSettings?.lineHeight ?? 1.25,
                      }}
                    >
                      {anno.content}
                    </span>
                  </div>
                )}

                {/* FLOATING ACTION TOOLBAR FOR SELECTED TEXT: LINE GAP & SPACING */}
                {isSelected && (anno.type === 'text-replace' || anno.type === 'text-box') && (() => {
                  const baseFont: FontStyleInfo = anno.fontSettings || defaultFont || {
                    family: '"Plus Jakarta Sans", sans-serif',
                    size: 12,
                    weight: '400',
                    style: 'normal',
                    color: '#0f172a',
                  };

                  const curLh = baseFont.lineHeight ?? 1.25;

                  const updateLineHeight = (newLh: number) => {
                    onUpdateAnnotation({
                      ...anno,
                      fontSettings: {
                        ...baseFont,
                        lineHeight: newLh,
                      },
                    });
                  };

                  return (
                    <div
                      className="absolute -top-9 left-0 bg-slate-950/95 text-white border border-slate-700/80 rounded-xl px-2 py-0.5 shadow-2xl z-50 flex items-center gap-1 backdrop-blur-md whitespace-nowrap pointer-events-auto text-[11px]"
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <span className="text-[10px] text-slate-400 font-medium">Line Gap:</span>
                      <button
                        type="button"
                        onClick={() => updateLineHeight(Math.max(0.75, Math.round((curLh - 0.1) * 100) / 100))}
                        className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-rose-400 hover:text-white border border-slate-700 font-bold transition-colors cursor-pointer"
                        title="Remove gap between lines (make tighter)"
                      >
                        -
                      </button>
                      <span className="font-mono text-[10px] font-bold text-orange-400 bg-orange-950/60 px-1.5 py-0.5 rounded border border-orange-800/60">
                        {curLh.toFixed(2)}x
                      </span>
                      <button
                        type="button"
                        onClick={() => updateLineHeight(Math.min(2.8, Math.round((curLh + 0.1) * 100) / 100))}
                        className="px-1.5 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-emerald-400 hover:text-white border border-slate-700 font-bold transition-colors cursor-pointer"
                        title="Add gap between lines (spread lines apart)"
                      >
                        +
                      </button>

                      <div className="w-px h-3 bg-slate-800 mx-0.5" />

                      <button
                        type="button"
                        onClick={() => updateLineHeight(0.9)}
                        className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                          Math.abs(curLh - 0.9) < 0.05
                            ? 'bg-orange-500 text-white font-bold'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80'
                        }`}
                        title="Set tight lines (0.9x - No Gap)"
                      >
                        Tight
                      </button>
                      <button
                        type="button"
                        onClick={() => updateLineHeight(1.5)}
                        className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                          Math.abs(curLh - 1.5) < 0.05
                            ? 'bg-orange-500 text-white font-bold'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80'
                        }`}
                        title="Set comfortable spacing (1.5x)"
                      >
                        1.5x
                      </button>
                      <button
                        type="button"
                        onClick={() => updateLineHeight(2.0)}
                        className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                          Math.abs(curLh - 2.0) < 0.05
                            ? 'bg-orange-500 text-white font-bold'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80'
                        }`}
                        title="Set double spacing (2.0x - Wide Gap)"
                      >
                        2.0x
                      </button>
                    </div>
                  );
                })()}

                {/* 3. DIGITAL SIGNATURE */}
                {(anno.type === 'signature' || anno.type === 'image') && anno.signatureDataUrl && (
                  <div className="w-full h-full relative group">
                    <img
                      src={anno.signatureDataUrl}
                      alt="Digital Signature"
                      className="w-full h-full object-contain pointer-events-none"
                    />

                    {anno.signatureMeta && (
                      <div className="absolute -bottom-3 left-0 bg-slate-900/90 text-white text-[8px] font-mono px-1 py-0.2 rounded border border-slate-700 whitespace-nowrap opacity-75 group-hover:opacity-100 flex items-center gap-1">
                        <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                        <span>Signed by {anno.signatureMeta.signerName}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. REDACTION BLOCK */}
                {anno.type === 'redaction' && (
                  <div
                    className="w-full h-full"
                    style={{ backgroundColor: anno.fillColor || '#000000' }}
                  />
                )}

                {/* 5. HIGHLIGHT */}
                {anno.type === 'highlight' && (
                  <div
                    className="w-full h-full"
                    style={{ backgroundColor: anno.fillColor || '#fef08a', opacity: anno.opacity || 0.4 }}
                  />
                )}

                {/* 6. SHAPES */}
                {anno.type === 'shape' && (
                  <div className="w-full h-full flex items-center justify-center">
                    {anno.shapeType === 'check' && (
                      <Check
                        className="w-full h-full"
                        style={{ color: anno.strokeColor || '#16a34a' }}
                      />
                    )}
                    {anno.shapeType === 'cross' && (
                      <X
                        className="w-full h-full"
                        style={{ color: anno.strokeColor || '#dc2626' }}
                      />
                    )}
                    {anno.shapeType === 'rectangle' && (
                      <div
                        className="w-full h-full border-2"
                        style={{ borderColor: anno.strokeColor || '#2563eb' }}
                      />
                    )}
                  </div>
                )}

                {/* Corner Resize Handles for Selected Element */}
                {isSelected && !anno.isLocked && (
                  <>
                    <div
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        const { xPct, yPct } = getPageCoords(e.clientX, e.clientY);
                        setDragState({
                          type: 'resize-se',
                          annotationId: anno.id,
                          startX: xPct,
                          startY: yPct,
                          initialAnno: { ...anno },
                        });
                      }}
                      className="absolute -right-1.5 -bottom-1.5 w-3.5 h-3.5 bg-orange-500 border-2 border-white rounded-full cursor-se-resize shadow-sm z-40"
                    />
                    <div
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        const { xPct, yPct } = getPageCoords(e.clientX, e.clientY);
                        setDragState({
                          type: 'resize-sw',
                          annotationId: anno.id,
                          startX: xPct,
                          startY: yPct,
                          initialAnno: { ...anno },
                        });
                      }}
                      className="absolute -left-1.5 -bottom-1.5 w-3.5 h-3.5 bg-orange-500 border-2 border-white rounded-full cursor-sw-resize shadow-sm z-40"
                    />
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Creation Box Preview */}
        {creationBox && (
          <div
            style={{
              left: `${Math.min(creationBox.startX, creationBox.currentX)}%`,
              top: `${Math.min(creationBox.startY, creationBox.currentY)}%`,
              width: `${Math.abs(creationBox.currentX - creationBox.startX)}%`,
              height: `${Math.abs(creationBox.currentY - creationBox.startY)}%`,
            }}
            className={`absolute border border-dashed z-50 pointer-events-none ${
              activeTool === 'edit-text'
                ? 'bg-orange-500/20 border-orange-500 ring-2 ring-orange-500/40'
                : activeTool === 'redaction'
                ? 'bg-slate-950/60 border-slate-900'
                : 'bg-yellow-300/40 border-yellow-500'
            }`}
          />
        )}
      </div>
    </div>
  );
};
