import React, { useState, useRef } from 'react';
import {
  FileText,
  Download,
  FolderOpen,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Minus,
  Square,
  X,
  Github,
  ChevronDown,
  Sparkles,
  Smartphone,
  Share2,
} from 'lucide-react';

interface TitleBarProps {
  documentName: string;
  currentPage: number;
  totalPages: number;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onOpenFile: (file: File) => void;
  onLoadSample: (type: 'contract' | 'invoice') => void;
  onExportPdf: () => void;
  onOpenGitHubModal: () => void;
  isModified: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  documentName,
  currentPage,
  totalPages,
  zoom,
  onZoomChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenFile,
  onLoadSample,
  onExportPdf,
  onOpenGitHubModal,
  isModified,
  onPrevPage,
  onNextPage,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showSamplesMenu, setShowSamplesMenu] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onOpenFile(file);
    }
  };

  const toggleMaximize = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsMaximized(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsMaximized(false);
    }
  };

  return (
    <header className="h-12 bg-slate-950/95 border-b border-slate-800/80 flex items-center justify-between px-3 text-slate-200 select-none z-30 shrink-0">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="application/pdf"
        className="hidden"
      />

      {/* ZONE 1: Brand & Document Info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-white whitespace-nowrap hidden sm:inline">
            FluentPDF
          </span>
        </div>

        <div className="h-4 w-px bg-slate-800 hidden sm:block" />

        {/* Current Document Name */}
        <div className="flex items-center gap-2 min-w-0 max-w-xs md:max-w-md">
          <span className="text-xs text-slate-300 font-medium truncate" title={documentName}>
            {documentName || 'Untitled Document.pdf'}
          </span>
          {isModified && (
            <span className="text-[10px] text-amber-400 bg-amber-950/50 px-1.5 py-0.2 rounded border border-amber-800/60 whitespace-nowrap">
              Edited
            </span>
          )}
        </div>
      </div>

      {/* ZONE 2: Document Navigation & Zoom Controls */}
      <div className="flex items-center gap-2">
        {/* Page stepper */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-md px-1 py-0.5 text-xs text-slate-300">
          <button
            onClick={onPrevPage}
            disabled={currentPage <= 1}
            className="px-1.5 py-0.5 rounded hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-[11px]"
            title="Previous Page"
          >
            ←
          </button>
          <span className="px-1.5 text-[11px] font-mono tabular-nums">
            {currentPage} / {totalPages || 1}
          </span>
          <button
            onClick={onNextPage}
            disabled={currentPage >= totalPages}
            className="px-1.5 py-0.5 rounded hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent transition-colors text-[11px]"
            title="Next Page"
          >
            →
          </button>
        </div>

        {/* Zoom controls */}
        <div className="hidden lg:flex items-center bg-slate-900 border border-slate-800 rounded-md px-1 py-0.5 text-xs text-slate-300">
          <button
            onClick={() => onZoomChange(Math.max(0.5, Math.round((zoom - 0.15) * 100) / 100))}
            className="p-1 rounded hover:bg-slate-800 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="w-12 text-center text-[11px] font-mono tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => onZoomChange(Math.min(2.5, Math.round((zoom + 0.15) * 100) / 100))}
            className="p-1 rounded hover:bg-slate-800 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 bg-slate-900 border border-slate-800 rounded-md p-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ZONE 3: Primary Actions & Windows Controls */}
      <div className="flex items-center gap-2">
        {/* Sample Docs Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowSamplesMenu(!showSamplesMenu)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden md:inline">Samples</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showSamplesMenu && (
            <div className="absolute right-0 mt-1.5 w-52 bg-slate-900 border border-slate-800 rounded-lg shadow-xl py-1 text-xs z-50">
              <button
                onClick={() => {
                  onLoadSample('contract');
                  setShowSamplesMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-slate-200 hover:bg-blue-600/20 hover:text-white flex flex-col"
              >
                <span className="font-medium">Master Consulting NDA</span>
                <span className="text-[10px] text-slate-400">2 Pages with signatures & clauses</span>
              </button>
              <button
                onClick={() => {
                  onLoadSample('invoice');
                  setShowSamplesMenu(false);
                }}
                className="w-full px-3 py-2 text-left text-slate-200 hover:bg-blue-600/20 hover:text-white flex flex-col"
              >
                <span className="font-medium">Commercial Work Invoice</span>
                <span className="text-[10px] text-slate-400">1 Page with line items & total</span>
              </button>
            </div>
          )}
        </div>

        {/* Open Local File */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-md transition-colors"
          title="Open local PDF from computer"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Open PDF</span>
        </button>

        {/* Export Signed PDF */}
        <button
          onClick={onExportPdf}
          className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-md shadow-sm transition-colors whitespace-nowrap"
          title="Export and download modified PDF"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Save PDF</span>
        </button>

        {/* GitHub & Packaging Guide */}
        <button
          onClick={onOpenGitHubModal}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
          title="GitHub Repo & Windows Desktop packaging guide"
        >
          <Github className="w-4 h-4" />
        </button>

        {/* Simulated Windows 11 Native Window Controls */}
        <div className="hidden sm:flex items-center ml-1 pl-1 border-l border-slate-800">
          <button
            onClick={() => {}}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleMaximize}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Square className="w-3 h-3" />}
          </button>
          <button
            onClick={() => {
              if (confirm('Close current document session?')) {
                onLoadSample('contract');
              }
            }}
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-red-600 rounded transition-colors"
            title="Close Document"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
