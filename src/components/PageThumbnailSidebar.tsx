import React from 'react';
import { RotateCw, Trash2, Plus, Copy, ChevronLeft, ChevronRight, File } from 'lucide-react';
import { PdfPageData } from '../types/pdf';

interface PageThumbnailSidebarProps {
  pages: PdfPageData[];
  currentPageIndex: number;
  onSelectPage: (index: number) => void;
  onRotatePage: (index: number) => void;
  onDeletePage: (index: number) => void;
  onDuplicatePage: (index: number) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const PageThumbnailSidebar: React.FC<PageThumbnailSidebarProps> = ({
  pages,
  currentPageIndex,
  onSelectPage,
  onRotatePage,
  onDeletePage,
  onDuplicatePage,
  isOpen,
  onToggle,
}) => {
  return (
    <aside
      className={`h-full bg-slate-950 border-r border-slate-800/80 transition-all duration-200 flex flex-col select-none shrink-0 z-10 ${
        isOpen ? 'w-56' : 'w-10'
      }`}
    >
      {/* Sidebar Header */}
      <div className="h-9 px-2 flex items-center justify-between border-b border-slate-800 text-xs text-slate-400">
        {isOpen ? (
          <>
            <span className="font-semibold text-slate-300">Pages ({pages.length})</span>
            <button
              onClick={onToggle}
              className="p-1 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Collapse thumbnail panel"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <button
            onClick={onToggle}
            className="w-full h-full flex items-center justify-center hover:text-white hover:bg-slate-800 transition-colors"
            title="Expand thumbnail panel"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Pages List */}
      {isOpen && (
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {pages.map((page, idx) => {
            const isSelected = currentPageIndex === idx;
            const aspect = (page.height || 842) / (page.width || 595);

            return (
              <div
                key={`page_thumb_${idx}`}
                className="group flex flex-col items-center space-y-1.5"
              >
                {/* Thumbnail card */}
                <div
                  onClick={() => onSelectPage(idx)}
                  className={`w-full relative rounded-md border cursor-pointer transition-all overflow-hidden bg-white shadow-sm flex items-center justify-center ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-500/30'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                  style={{
                    height: `${Math.min(180, Math.floor(160 * aspect))}px`,
                  }}
                >
                  {/* Subtle simulated page content lines */}
                  <div className="w-full h-full p-3 flex flex-col justify-between opacity-30 pointer-events-none">
                    <div className="space-y-1.5">
                      <div className="h-2 w-3/4 bg-slate-900 rounded" />
                      <div className="h-1.5 w-full bg-slate-400 rounded" />
                      <div className="h-1.5 w-5/6 bg-slate-400 rounded" />
                      <div className="h-1.5 w-2/3 bg-slate-400 rounded" />
                    </div>
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-slate-400 rounded" />
                      <div className="h-1.5 w-4/5 bg-slate-400 rounded" />
                      <div className="h-2 w-1/3 bg-blue-600 rounded mt-2" />
                    </div>
                  </div>

                  {/* Hover action overlay */}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-slate-950/80 p-1 rounded backdrop-blur-xs">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRotatePage(idx);
                      }}
                      className="p-1 hover:text-white text-slate-300 rounded hover:bg-slate-800 transition-colors"
                      title="Rotate Page 90°"
                    >
                      <RotateCw className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicatePage(idx);
                      }}
                      className="p-1 hover:text-white text-slate-300 rounded hover:bg-slate-800 transition-colors"
                      title="Duplicate Page"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    {pages.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePage(idx);
                        }}
                        className="p-1 hover:text-red-400 text-slate-300 rounded hover:bg-slate-800 transition-colors"
                        title="Delete Page"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Page indicator */}
                <span className="text-[11px] font-mono text-slate-400">
                  Page {idx + 1}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
};
