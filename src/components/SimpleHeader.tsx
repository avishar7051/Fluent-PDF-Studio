import React, { useRef } from 'react';
import {
  FileText,
  Download,
  UploadCloud,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Type,
  PenTool,
  FileSignature,
  ShieldAlert,
  Highlighter,
  CheckSquare,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  Calendar,
  X as CrossIcon,
  Github,
} from 'lucide-react';
import { ActiveTool } from '../types/pdf';

interface SimpleHeaderProps {
  documentName: string;
  currentPage: number;
  totalPages: number;
  zoom: number;
  onZoomChange: (newZoom: number) => void;
  activeTool: ActiveTool;
  onSelectTool: (tool: ActiveTool) => void;
  onOpenSignatureModal: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onBackToUpload: () => void;
  onExportPdf: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onOpenGitHubModal: () => void;
}

export const SimpleHeader: React.FC<SimpleHeaderProps> = ({
  documentName,
  currentPage,
  totalPages,
  zoom,
  onZoomChange,
  activeTool,
  onSelectTool,
  onOpenSignatureModal,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onBackToUpload,
  onExportPdf,
  onPrevPage,
  onNextPage,
  onOpenGitHubModal,
}) => {
  const tools = [
    {
      id: 'edit-text' as ActiveTool,
      label: 'Edit Text',
      icon: Type,
      badge: 'Font Match',
      desc: 'Click any text on the PDF to edit it',
    },
    {
      id: 'add-text' as ActiveTool,
      label: 'Add Text',
      icon: Type,
      desc: 'Add custom notes or paragraphs',
    },
    {
      id: 'signature' as ActiveTool,
      label: 'Sign',
      icon: FileSignature,
      highlight: true,
      desc: 'Draw, type or scan digital signature',
    },
    {
      id: 'redaction' as ActiveTool,
      label: 'Whiteout / Redact',
      icon: ShieldAlert,
      desc: 'Mask or erase sensitive text',
    },
    {
      id: 'highlight' as ActiveTool,
      label: 'Highlight',
      icon: Highlighter,
      desc: 'Yellow text highlighter',
    },
    {
      id: 'shape' as ActiveTool,
      label: 'Checkmark',
      icon: CheckSquare,
      desc: 'Add approval checkmarks or boxes',
    },
  ];

  return (
    <header className="bg-slate-950 border-b border-slate-800 text-slate-100 px-3 py-2 flex flex-col md:flex-row items-center justify-between gap-2 select-none shrink-0 z-30 shadow-md">
      {/* LEFT: Brand, Back, and File Info */}
      <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-start">
        <button
          onClick={onBackToUpload}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-orange-300 hover:text-white transition-all text-xs font-semibold cursor-pointer shadow-xs"
          title="Go back to Upload screen to select another PDF or image"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-orange-400" />
          <span>Upload / Back</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-orange-500 via-rose-500 to-blue-600 flex items-center justify-center text-white shadow-sm shadow-orange-500/30">
            <PenTool className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold tracking-tight text-white hidden lg:inline">
            Fluent<span className="text-orange-400">PDF</span>
          </span>
        </div>

        {/* Current Document Name */}
        <div className="max-w-[130px] sm:max-w-[180px] truncate text-xs text-slate-300 font-medium px-2 py-1 bg-slate-900/60 rounded border border-slate-800">
          {documentName}
        </div>

        {/* Page Switcher (Back / Forward between pages) */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs">
          <button
            onClick={onPrevPage}
            disabled={currentPage <= 1}
            className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 transition-colors cursor-pointer"
            title="Previous Page (Back)"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="px-2 text-xs font-mono tabular-nums text-slate-200 whitespace-nowrap">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={onNextPage}
            disabled={currentPage >= totalPages}
            className="p-1 rounded hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent text-slate-300 transition-colors cursor-pointer"
            title="Next Page (Forward)"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* CENTER: Main Simplified Tool Selector */}
      <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800/80 p-1 rounded-xl shadow-inner overflow-x-auto max-w-full">
        {tools.map((t) => {
          const Icon = t.icon;
          const isActive = activeTool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                if (t.id === 'signature') {
                  onOpenSignatureModal();
                }
                onSelectTool(t.id);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-md shadow-orange-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title={t.desc}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
              {t.badge && !isActive && (
                <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1 py-0.2 rounded border border-blue-500/30">
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* RIGHT: Undo/Redo, Zoom, and Download CTA */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-25 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="p-1.5 rounded hover:bg-slate-800 disabled:opacity-25 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Redo (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Zoom */}
        <div className="hidden lg:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs text-slate-300">
          <button
            onClick={() => onZoomChange(Math.max(0.6, Math.round((zoom - 0.15) * 100) / 100))}
            className="p-1.5 rounded hover:bg-slate-800"
            title="Zoom Out"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <span className="w-10 text-center text-[10px] font-mono tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => onZoomChange(Math.min(2.0, Math.round((zoom + 0.15) * 100) / 100))}
            className="p-1.5 rounded hover:bg-slate-800"
            title="Zoom In"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>

        {/* Primary Download Button */}
        <button
          onClick={onExportPdf}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 via-rose-500 to-blue-600 hover:from-orange-600 hover:via-rose-600 hover:to-blue-700 shadow-md shadow-orange-500/20 transition-all hover:scale-102 cursor-pointer whitespace-nowrap"
          title="Export and download modified PDF (Free)"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download PDF</span>
        </button>

        {/* GitHub Guide button */}
        <button
          onClick={onOpenGitHubModal}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-colors"
          title="GitHub Repo & Windows Setup"
        >
          <Github className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
