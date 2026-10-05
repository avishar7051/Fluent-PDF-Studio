import React from 'react';
import {
  Trash2,
  Copy,
  Lock,
  Unlock,
  Type,
  Bold,
  Italic,
  Sliders,
  ShieldCheck,
  Info,
  Maximize,
  Sparkles,
} from 'lucide-react';
import { PdfAnnotation, FontStyleInfo } from '../types/pdf';
import { AVAILABLE_FONTS } from '../utils/fontMatcher';

interface PropertiesPanelProps {
  selectedAnnotation: PdfAnnotation | null;
  onUpdateAnnotation: (updated: PdfAnnotation) => void;
  onDeleteAnnotation: (id: string) => void;
  onDuplicateAnnotation: (annotation: PdfAnnotation) => void;
  totalAnnotations: number;
  isOpen: boolean;
  onToggle: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  onDuplicateAnnotation,
  totalAnnotations,
  isOpen,
  onToggle,
}) => {
  if (!isOpen) return null;

  const font = selectedAnnotation?.fontSettings;

  const handleFontChange = (partial: Partial<FontStyleInfo>) => {
    if (!selectedAnnotation || !font) return;
    onUpdateAnnotation({
      ...selectedAnnotation,
      fontSettings: {
        ...font,
        ...partial,
      },
    });
  };

  return (
    <aside className="w-64 h-full bg-slate-950 border-l border-slate-800/80 p-4 flex flex-col text-slate-200 select-none shrink-0 z-10 overflow-y-auto">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-blue-400" />
          Inspector & Properties
        </span>
        <span className="text-[10px] text-slate-500 font-mono">
          {totalAnnotations} items
        </span>
      </div>

      {selectedAnnotation ? (
        <div className="py-4 space-y-4 text-xs">
          {/* Item Type Badge */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Element:</span>
            <span className="capitalize font-mono font-medium text-blue-400 bg-blue-950/50 px-2 py-0.5 rounded border border-blue-800/50">
              {selectedAnnotation.type.replace('-', ' ')}
            </span>
          </div>

          {/* Quick Action Buttons (Delete, Duplicate, Lock) */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onDuplicateAnnotation(selectedAnnotation)}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-slate-300 hover:text-white transition-colors"
              title="Duplicate"
            >
              <Copy className="w-3 h-3" />
              <span>Duplicate</span>
            </button>
            <button
              onClick={() =>
                onUpdateAnnotation({
                  ...selectedAnnotation,
                  isLocked: !selectedAnnotation.isLocked,
                })
              }
              className={`p-1.5 border rounded transition-colors ${
                selectedAnnotation.isLocked
                  ? 'bg-amber-950/60 border-amber-800 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
              title={selectedAnnotation.isLocked ? 'Unlock Element' : 'Lock Element'}
            >
              {selectedAnnotation.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => onDeleteAnnotation(selectedAnnotation.id)}
              className="p-1.5 bg-slate-900 hover:bg-red-950/60 border border-slate-800 hover:border-red-800 text-slate-400 hover:text-red-400 rounded transition-colors"
              title="Delete element"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* TEXT EDITING PROPERTIES */}
          {(selectedAnnotation.type === 'text-replace' || selectedAnnotation.type === 'text-box') && font && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              {/* Text content edit */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Content</label>
                <textarea
                  rows={2}
                  value={selectedAnnotation.content || ''}
                  onChange={(e) =>
                    onUpdateAnnotation({
                      ...selectedAnnotation,
                      content: e.target.value,
                    })
                  }
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Font Family */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Font Family</label>
                <select
                  value={font.family}
                  onChange={(e) => handleFontChange({ family: e.target.value })}
                  className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs text-white"
                >
                  {AVAILABLE_FONTS.map((f) => (
                    <option key={f.id} value={f.cssFamily}>
                      {f.name.split(' (')[0]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Font Size & Weight */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Size ({font.size}pt)</label>
                  <input
                    type="number"
                    min="6"
                    max="72"
                    value={font.size}
                    onChange={(e) => handleFontChange({ size: parseFloat(e.target.value) || 12 })}
                    className="w-full px-2 py-1 bg-slate-900 border border-slate-800 rounded text-center text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Style</label>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleFontChange({ weight: font.weight === '700' ? '400' : '700' })}
                      className={`flex-1 py-1 rounded border text-xs font-bold transition-colors ${
                        font.weight === '700'
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      B
                    </button>
                    <button
                      onClick={() => handleFontChange({ style: font.style === 'italic' ? 'normal' : 'italic' })}
                      className={`flex-1 py-1 rounded border text-xs italic transition-colors ${
                        font.style === 'italic'
                          ? 'bg-blue-600 border-blue-500 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      I
                    </button>
                  </div>
                </div>
              </div>

              {/* Colors */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Text Color</label>
                  <input
                    type="color"
                    value={font.color}
                    onChange={(e) => handleFontChange({ color: e.target.value })}
                    className="w-full h-7 rounded border border-slate-800 cursor-pointer bg-transparent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Mask Patch</label>
                  <input
                    type="color"
                    value={font.bgColor === 'transparent' ? '#ffffff' : font.bgColor || '#ffffff'}
                    onChange={(e) => handleFontChange({ bgColor: e.target.value })}
                    className="w-full h-7 rounded border border-slate-800 cursor-pointer bg-transparent"
                  />
                </div>
              </div>

              {/* Line Gap / Line Spacing */}
              <div className="space-y-1.5 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold text-slate-300">Line Gap (Spacing):</span>
                  <span className="font-mono text-orange-400 font-bold">
                    {(font.lineHeight ?? 1.25).toFixed(2)}x
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      const cur = font.lineHeight ?? 1.25;
                      handleFontChange({ lineHeight: Math.max(0.75, Math.round((cur - 0.1) * 100) / 100) });
                    }}
                    className="flex-1 py-1 px-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-rose-300 hover:text-white transition-colors text-xs font-semibold"
                    title="Remove gap between lines"
                  >
                    - Remove Gap
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = font.lineHeight ?? 1.25;
                      handleFontChange({ lineHeight: Math.min(2.8, Math.round((cur + 0.1) * 100) / 100) });
                    }}
                    className="flex-1 py-1 px-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-emerald-300 hover:text-white transition-colors text-xs font-semibold"
                    title="Add gap between lines"
                  >
                    + Add Gap
                  </button>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="2.8"
                  step="0.05"
                  value={font.lineHeight ?? 1.25}
                  onChange={(e) => handleFontChange({ lineHeight: parseFloat(e.target.value) })}
                  className="w-full accent-orange-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* SIGNATURE PROPERTIES */}
          {selectedAnnotation.type === 'signature' && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="p-2.5 bg-blue-950/30 rounded-lg border border-blue-900/60 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="text-[11px] leading-tight">
                  <span className="font-semibold text-white block">Digital Certificate</span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    {selectedAnnotation.signatureMeta?.auditHash?.substring(0, 12) || 'VERIFIED-TOKEN'}...
                  </span>
                </div>
              </div>

              {/* Opacity slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Ink Opacity</span>
                  <span>{Math.round((selectedAnnotation.opacity ?? 1) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1"
                  step="0.05"
                  value={selectedAnnotation.opacity ?? 1}
                  onChange={(e) =>
                    onUpdateAnnotation({
                      ...selectedAnnotation,
                      opacity: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* REDACTION PROPERTIES */}
          {selectedAnnotation.type === 'redaction' && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Mask Color</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      onUpdateAnnotation({
                        ...selectedAnnotation,
                        fillColor: '#000000',
                      })
                    }
                    className={`flex-1 py-1.5 text-[11px] rounded border transition-colors ${
                      selectedAnnotation.fillColor === '#000000'
                        ? 'border-blue-500 bg-slate-900 text-white'
                        : 'border-slate-800 text-slate-400'
                    }`}
                  >
                    Blackout
                  </button>
                  <button
                    onClick={() =>
                      onUpdateAnnotation({
                        ...selectedAnnotation,
                        fillColor: '#ffffff',
                      })
                    }
                    className={`flex-1 py-1.5 text-[11px] rounded border transition-colors ${
                      selectedAnnotation.fillColor === '#ffffff'
                        ? 'border-blue-500 bg-slate-900 text-white'
                        : 'border-slate-800 text-slate-400'
                    }`}
                  >
                    Whiteout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty selection state: Useful tips */
        <div className="py-6 space-y-4 text-xs text-slate-400">
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80 space-y-2">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Quick Tips
            </span>
            <ul className="space-y-1.5 text-[11px] text-slate-300">
              <li>• Click any text in <strong>Edit Text</strong> mode to replace it with matching fonts.</li>
              <li>• Drag signatures or dates from the top bar directly onto the document.</li>
              <li>• Use corner handles on any element to resize or drag to reposition.</li>
            </ul>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Shortcuts
            </span>
            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Undo / Redo</span>
                <span className="text-slate-200">Ctrl+Z / Ctrl+Y</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Delete item</span>
                <span className="text-slate-200">Del / Backspace</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Save PDF</span>
                <span className="text-slate-200">Ctrl+S</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
