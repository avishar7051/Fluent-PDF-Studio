import React, { useRef } from 'react';
import {
  MousePointer,
  Type,
  PenTool,
  Highlighter,
  ShieldAlert,
  CheckSquare,
  Image as ImageIcon,
  Stamp,
  Calendar,
  Sparkles,
  FileSignature,
  Square,
  Check,
  X as CrossIcon,
} from 'lucide-react';
import { ActiveTool } from '../types/pdf';

interface ToolbarProps {
  activeTool: ActiveTool;
  onSelectTool: (tool: ActiveTool) => void;
  onOpenSignatureModal: () => void;
  savedSignatures: string[];
  onInsertImage: (file: File) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  activeTool,
  onSelectTool,
  onOpenSignatureModal,
  savedSignatures,
  onInsertImage,
}) => {
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  const tools = [
    {
      id: 'select' as ActiveTool,
      label: 'Select / Move',
      icon: MousePointer,
      shortcut: 'V',
      desc: 'Select and resize placed elements',
    },
    {
      id: 'edit-text' as ActiveTool,
      label: 'Edit Text (Font Match)',
      icon: Type,
      shortcut: 'T',
      badge: 'Font Match',
      desc: 'Click any PDF text to edit in-place with matching typography',
    },
    {
      id: 'add-text' as ActiveTool,
      label: 'Add Text Box',
      icon: Type,
      shortcut: 'A',
      desc: 'Add custom text notes, headers, or paragraphs',
    },
    {
      id: 'signature' as ActiveTool,
      label: 'Sign Document',
      icon: FileSignature,
      shortcut: 'S',
      highlight: true,
      desc: 'Draw, type, or upload digital signature',
    },
    {
      id: 'highlight' as ActiveTool,
      label: 'Highlight',
      icon: Highlighter,
      shortcut: 'H',
      desc: 'Draw yellow translucent highlights over text',
    },
    {
      id: 'pen' as ActiveTool,
      label: 'Freehand Pen',
      icon: PenTool,
      shortcut: 'P',
      desc: 'Freehand markup or handwritten notes',
    },
    {
      id: 'redaction' as ActiveTool,
      label: 'Redact / Whiteout',
      icon: ShieldAlert,
      shortcut: 'R',
      desc: 'Permanently mask confidential words or numbers',
    },
    {
      id: 'shape' as ActiveTool,
      label: 'Shapes & Checkmarks',
      icon: CheckSquare,
      shortcut: 'C',
      desc: 'Add approval checkmarks, crosses, or frames',
    },
  ];

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onInsertImage(file);
    }
  };

  // Drag-and-drop starter
  const handleDragStart = (e: React.DragEvent, itemType: string, payload?: any) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: itemType, payload }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="h-11 bg-slate-900 border-b border-slate-800/80 px-3 flex items-center justify-between text-slate-300 text-xs select-none shrink-0 z-20 overflow-x-auto">
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleImageFileChange}
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
      />

      {/* Main Tool Selector */}
      <div className="flex items-center gap-1 shrink-0">
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
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap relative ${
                isActive
                  ? 'bg-blue-600 text-white font-medium shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
              title={`${t.label} (${t.shortcut}) - ${t.desc}`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
              {t.badge && (
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 rounded border border-emerald-500/30">
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Image insertion tool */}
        <button
          onClick={() => imageInputRef.current?.click()}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 transition-colors whitespace-nowrap"
          title="Insert logo or graphic stamp"
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Insert Image</span>
        </button>
      </div>

      {/* Drag & Drop Quick Palette Dock */}
      <div className="hidden xl:flex items-center gap-2 pl-3 border-l border-slate-800 shrink-0 text-[11px]">
        <span className="text-slate-400 font-medium whitespace-nowrap">Drag to Page:</span>

        {/* Drag Signature Chip */}
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, 'quick-signature')}
          onClick={onOpenSignatureModal}
          className="flex items-center gap-1 px-2 py-1 bg-blue-950/60 hover:bg-blue-900/80 text-blue-200 border border-blue-700/60 rounded cursor-grab active:cursor-grabbing transition-colors"
          title="Drag and drop onto signature line"
        >
          <FileSignature className="w-3 h-3 text-blue-400" />
          <span>Signature</span>
        </div>

        {/* Drag Date Stamp Chip */}
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, 'quick-date', new Date().toLocaleDateString())}
          className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded cursor-grab active:cursor-grabbing transition-colors"
          title="Drag current date badge onto page"
        >
          <Calendar className="w-3 h-3 text-amber-400" />
          <span>Date Stamp</span>
        </div>

        {/* Drag Checkmark Chip */}
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, 'quick-check')}
          className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 rounded cursor-grab active:cursor-grabbing transition-colors"
          title="Drag approval checkmark"
        >
          <Check className="w-3 h-3 text-emerald-400" />
          <span>Checkmark</span>
        </div>

        {/* Drag Cross Chip */}
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, 'quick-cross')}
          className="flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-red-300 border border-slate-700 rounded cursor-grab active:cursor-grabbing transition-colors"
          title="Drag cross"
        >
          <CrossIcon className="w-3 h-3 text-red-400" />
          <span>Cross</span>
        </div>
      </div>
    </div>
  );
};
