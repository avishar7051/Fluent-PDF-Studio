import React, { useState, useEffect } from 'react';
import {
  Type,
  Sparkles,
  Check,
  X,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon,
  Eraser,
  Palette,
  Eye,
} from 'lucide-react';
import { FontStyleInfo, PdfTextItem } from '../types/pdf';
import { AVAILABLE_FONTS } from '../utils/fontMatcher';

interface TextEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetItem: PdfTextItem | null;
  cropPreviewUrl?: string;
  initialText?: string;
  initialFont?: FontStyleInfo;
  onApply: (
    replacementText: string,
    fontSettings: FontStyleInfo,
    originalText?: string,
    erasePadding?: { horizontal: number; vertical: number }
  ) => void;
}

export const TextEditModal: React.FC<TextEditModalProps> = ({
  isOpen,
  onClose,
  targetItem,
  cropPreviewUrl,
  initialText = '',
  initialFont,
  onApply,
}) => {
  const [text, setText] = useState<string>('');
  const [originalText, setOriginalText] = useState<string>('');
  const [fontFamily, setFontFamily] = useState<string>(AVAILABLE_FONTS[0].cssFamily);
  const [fontSize, setFontSize] = useState<number>(12);
  const [isBold, setIsBold] = useState<boolean>(false);
  const [isItalic, setIsItalic] = useState<boolean>(false);
  const [textColor, setTextColor] = useState<string>('#0f172a');
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right'>('left');
  const [letterSpacing, setLetterSpacing] = useState<number>(0);
  const [horizontalPadding, setHorizontalPadding] = useState<number>(4);
  const [verticalPadding, setVerticalPadding] = useState<number>(3);
  const [eraseOriginal, setEraseOriginal] = useState<boolean>(true);

  useEffect(() => {
    if (targetItem) {
      const orig = targetItem.text || initialText || '';
      setOriginalText(orig);
      // Pre-fill replacement text with original text so user can edit it immediately
      setText(orig);
      setFontFamily(initialFont?.family || targetItem.fontFamily || AVAILABLE_FONTS[0].cssFamily);
      setFontSize(initialFont?.size || targetItem.fontSize || 12);
      setIsBold(initialFont?.weight === '700' || targetItem.fontWeight === '700');
      setIsItalic(initialFont?.style === 'italic' || targetItem.fontStyle === 'italic');
      setTextColor(initialFont?.color || targetItem.detectedColor || '#0f172a');
      setBgColor(initialFont?.bgColor || '#ffffff');
      setAlignment(initialFont?.align || 'left');
    }
  }, [targetItem, initialText, initialFont, isOpen]);

  if (!isOpen || !targetItem) return null;

  const handleApply = () => {
    onApply(
      text,
      {
        family: fontFamily,
        size: fontSize,
        weight: isBold ? '700' : '400',
        style: isItalic ? 'italic' : 'normal',
        color: textColor,
        bgColor: eraseOriginal ? bgColor || '#ffffff' : 'transparent',
        letterSpacing,
        align: alignment,
        lineHeight: 1.25,
      },
      originalText,
      { horizontal: horizontalPadding, vertical: verticalPadding }
    );
    onClose();
  };

  const colorPresets = [
    { label: 'White', value: '#ffffff' },
    { label: 'Off-White', value: '#f8fafc' },
    { label: 'Slate Light', value: '#f1f5f9' },
    { label: 'Warm Light', value: '#fefce8' },
    { label: 'Dark Navy', value: '#0f172a' },
    { label: 'Pure Black', value: '#000000' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 to-rose-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold tracking-tight text-white">Edit & Replace Text</h2>
                <span className="flex items-center gap-1 text-[11px] text-orange-300 bg-orange-950/60 px-2 py-0.5 rounded border border-orange-800/60 font-medium">
                  <Sparkles className="w-3 h-3 text-orange-400" />
                  Font Matcher
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Erases original text with background patch and types new text in matching style
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Selected Original Text Snippet */}
          <div className="p-3.5 bg-slate-950/90 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Eraser className="w-3.5 h-3.5 text-orange-400" />
                Previous Text to Erase:
              </span>
              <span className="font-mono text-orange-400 text-[11px]">
                {targetItem.fontName ? targetItem.fontName.replace(/^[A-Z]{6}\+/, '') : 'Detected font'} ({fontSize}pt)
              </span>
            </div>

            {/* Visual Crop Preview if available */}
            {cropPreviewUrl && (
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex items-center gap-3">
                <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase tracking-wider shrink-0">
                  <ImageIcon className="w-3 h-3 text-orange-400" />
                  <span>Image Crop:</span>
                </div>
                <div className="bg-white p-1 rounded border border-slate-700 max-h-12 overflow-hidden flex items-center shadow-inner">
                  <img src={cropPreviewUrl} alt="Selected Text Area" className="max-h-10 object-contain" />
                </div>
              </div>
            )}

            {/* Editable Original Text Input */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Recognized text from document:</span>
                <span className="text-orange-400 text-[10px]">Edit if OCR was imperfect</span>
              </div>
              <input
                type="text"
                value={originalText}
                onChange={(e) => setOriginalText(e.target.value)}
                placeholder="e.g. Choose format"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 font-medium focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* New Replacement Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-white">New Replacement Text</label>
              <span className="text-[11px] text-emerald-400 font-medium">Replaces previous text completely</span>
            </div>
            <textarea
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type replacement text (e.g. Choose format, Select Type, New Title)..."
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-orange-500 transition-colors shadow-inner"
            />
          </div>

          {/* Live Result Preview */}
          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <Eye className="w-3.5 h-3.5 text-blue-400" />
                Live Preview on Document:
              </span>
              <span className="text-[10px] text-slate-400">Background patch completely hides previous text</span>
            </div>
            <div
              className="p-3 rounded-lg border border-slate-700 flex items-center overflow-hidden transition-all shadow-inner"
              style={{
                backgroundColor: eraseOriginal ? bgColor : 'transparent',
              }}
            >
              <span
                style={{
                  fontFamily,
                  fontSize: `${fontSize}px`,
                  fontWeight: isBold ? '700' : '400',
                  fontStyle: isItalic ? 'italic' : 'normal',
                  color: textColor,
                  textAlign: alignment,
                  letterSpacing: `${letterSpacing}px`,
                  lineHeight: 1.25,
                  width: '100%',
                }}
              >
                {text || <span className="opacity-40 italic">Type replacement text above...</span>}
              </span>
            </div>
          </div>

          {/* Font & Style Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-950/50 rounded-xl border border-slate-800">
            {/* Font Family */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">Matching Font Family</label>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-orange-500"
              >
                {AVAILABLE_FONTS.map((f) => (
                  <option key={f.id} value={f.cssFamily}>
                    {f.name} ({f.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Font Size Stepper */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">Font Size ({fontSize} pt)</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="8"
                  max="48"
                  step="0.5"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseFloat(e.target.value))}
                  className="flex-1 accent-orange-500 cursor-pointer"
                />
                <input
                  type="number"
                  min="6"
                  max="72"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseFloat(e.target.value) || 12)}
                  className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded-md text-center text-xs text-white"
                />
              </div>
            </div>

            {/* Formatting: Bold, Italic, Alignment */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">Weight & Alignment</label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setIsBold(!isBold)}
                  className={`p-2 rounded-lg border text-xs font-bold transition-colors ${
                    isBold
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title="Toggle Bold"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsItalic(!isItalic)}
                  className={`p-2 rounded-lg border text-xs italic transition-colors ${
                    isItalic
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title="Toggle Italic"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>
                <div className="h-5 w-px bg-slate-800 mx-1" />
                <button
                  type="button"
                  onClick={() => setAlignment('left')}
                  className={`p-2 rounded-lg border text-xs transition-colors ${
                    alignment === 'left'
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setAlignment('center')}
                  className={`p-2 rounded-lg border text-xs transition-colors ${
                    alignment === 'center'
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setAlignment('right')}
                  className={`p-2 rounded-lg border text-xs transition-colors ${
                    alignment === 'right'
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Text Color */}
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300">Text Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-slate-700 bg-slate-900 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={textColor}
                  onChange={(e) => setTextColor(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white"
                />
              </div>
            </div>
          </div>

          {/* Background Erase Patch Settings */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="erase-cb"
                  checked={eraseOriginal}
                  onChange={(e) => setEraseOriginal(e.target.checked)}
                  className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
                />
                <label htmlFor="erase-cb" className="text-xs font-semibold text-white cursor-pointer">
                  Erase Original Text with Solid Matching Patch
                </label>
              </div>
              <span className="text-[10px] text-slate-400">Guarantees old text does not show underneath</span>
            </div>

            {eraseOriginal && (
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Palette className="w-3 h-3 text-orange-400" />
                    Patch Color:
                  </span>
                  {colorPresets.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setBgColor(c.value)}
                      className={`px-2 py-1 rounded text-[11px] font-medium border flex items-center gap-1.5 transition-all ${
                        bgColor.toLowerCase() === c.value.toLowerCase()
                          ? 'border-orange-500 bg-orange-950/40 text-orange-200'
                          : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <span className="w-2.5 h-2.5 rounded-full border border-slate-600" style={{ backgroundColor: c.value }} />
                      <span>{c.label}</span>
                    </button>
                  ))}
                  <input
                    type="color"
                    value={bgColor.startsWith('#') ? bgColor : '#ffffff'}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-7 h-7 rounded border border-slate-700 bg-slate-900 cursor-pointer p-0.5 ml-auto"
                    title="Custom Background Color"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-slate-400">
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span>Horizontal Padding:</span>
                      <span className="text-orange-400">{horizontalPadding}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="16"
                      value={horizontalPadding}
                      onChange={(e) => setHorizontalPadding(parseInt(e.target.value) || 0)}
                      className="w-full accent-orange-500 cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span>Vertical Padding:</span>
                      <span className="text-orange-400">{verticalPadding}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="12"
                      value={verticalPadding}
                      onChange={(e) => setVerticalPadding(parseInt(e.target.value) || 0)}
                      className="w-full accent-orange-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-950/60 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApply}
              className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-orange-500 via-rose-500 to-blue-600 hover:from-orange-600 hover:via-rose-600 hover:to-blue-700 shadow-lg shadow-orange-500/20 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Apply & Replace Text</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
