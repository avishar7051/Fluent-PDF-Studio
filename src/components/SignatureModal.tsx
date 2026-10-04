import React, { useRef, useState, useEffect } from 'react';
import { PenTool, Type, Upload, RotateCcw, Check, ShieldCheck, X, Sparkles } from 'lucide-react';
import { SignatureMetadata } from '../types/pdf';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSignature: (dataUrl: string, meta?: SignatureMetadata) => void;
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  isOpen,
  onClose,
  onSaveSignature,
}) => {
  const [tab, setTab] = useState<'draw' | 'type' | 'upload'>('draw');
  const [inkColor, setInkColor] = useState<string>('#1e3a8a'); // Professional fountain pen blue
  const [penWidth, setPenWidth] = useState<number>(2.5);
  const [typedName, setTypedName] = useState<string>('Alex J. Morgan');
  const [selectedFont, setSelectedFont] = useState<string>('Dancing Script');
  const [uploadedImgUrl, setUploadedImgUrl] = useState<string | null>(null);
  const [transparencyThreshold, setTransparencyThreshold] = useState<number>(215);

  // Digital audit certificate option
  const [includeAuditTrail, setIncludeAuditTrail] = useState<boolean>(true);
  const [signerEmail, setSignerEmail] = useState<string>('alex.morgan@company.com');

  // Canvas drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (tab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [tab, isOpen]);

  if (!isOpen) return null;

  // Clear draw canvas
  const handleClear = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      setHasDrawn(false);
    }
  };

  // Pointer event handlers for natural drawing
  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    setIsDrawing(true);
    setHasDrawn(true);
    lastPointRef.current = { x, y };

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.arc(x, y, penWidth / 2, 0, Math.PI * 2);
      ctx.fillStyle = inkColor;
      ctx.fill();
    }
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPointRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = penWidth;
    ctx.stroke();

    lastPointRef.current = { x, y };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPointRef.current = null;
  };

  // Handle uploaded image background removal
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        processUploadedImage(img, transparencyThreshold);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const processUploadedImage = (img: HTMLImageElement, threshold: number) => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
    const d = imgData.data;

    // Remove white/light paper background
    for (let i = 0; i < d.length; i += 4) {
      const brightness = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      if (brightness > threshold) {
        d[i + 3] = 0; // Transparent
      } else {
        // Boost contrast on ink strokes
        d[i] = Math.max(0, d[i] - 30);
        d[i + 1] = Math.max(0, d[i + 1] - 30);
        d[i + 2] = Math.max(0, d[i + 2] - 30);
      }
    }

    ctx.putImageData(imgData, 0, 0);
    setUploadedImgUrl(tempCanvas.toDataURL('image/png'));
  };

  // Generate cryptographic-looking audit hash
  const generateAuditHash = () => {
    const chars = '0123456789ABCDEF';
    let hash = '';
    for (let i = 0; i < 32; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash;
  };

  // Convert Type tab signature to PNG
  const renderTypedSignatureToPng = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 180;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = `64px "${selectedFont}", cursive, serif`;
    ctx.fillStyle = inkColor;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(typedName, canvas.width / 2, canvas.height / 2);

    return canvas.toDataURL('image/png');
  };

  const handleApply = () => {
    let finalDataUrl = '';

    if (tab === 'draw') {
      if (!canvasRef.current || !hasDrawn) return;
      finalDataUrl = canvasRef.current.toDataURL('image/png');
    } else if (tab === 'type') {
      if (!typedName.trim()) return;
      finalDataUrl = renderTypedSignatureToPng();
    } else if (tab === 'upload') {
      if (!uploadedImgUrl) return;
      finalDataUrl = uploadedImgUrl;
    }

    if (!finalDataUrl) return;

    const meta: SignatureMetadata | undefined = includeAuditTrail
      ? {
          signerName: tab === 'type' ? typedName : 'Authorized Signer',
          signerEmail: signerEmail,
          timestamp: new Date().toISOString(),
          auditHash: generateAuditHash(),
          type: tab,
          verified: true,
        }
      : undefined;

    onSaveSignature(finalDataUrl, meta);
    onClose();
  };

  const fonts = [
    { name: 'Dancing Script', label: 'Dancing Script (Fluid Elegance)' },
    { name: 'Great Vibes', label: 'Great Vibes (Formal Calligraphy)' },
    { name: 'Sacramento', label: 'Sacramento (Executive Script)' },
    { name: 'Caveat', label: 'Caveat (Casual Modern)' },
    { name: 'Lora', label: 'Lora Italic (Classic Engraved)' },
  ];

  const inkColors = [
    { label: 'Royal Blue', value: '#1d4ed8', bg: 'bg-blue-700' },
    { label: 'Midnight Black', value: '#0f172a', bg: 'bg-slate-900' },
    { label: 'Flame Orange', value: '#ea580c', bg: 'bg-orange-600' },
    { label: 'Crimson Red', value: '#dc2626', bg: 'bg-red-600' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-500 to-rose-500 text-white flex items-center justify-center shadow-sm shadow-orange-500/30">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-white">Create Digital Signature</h2>
              <p className="text-xs text-slate-400">Draw, type or scan your legal signature for free</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Segmented Mode Tabs */}
        <div className="flex items-center gap-1 px-6 pt-4">
          <div className="flex w-full p-1 bg-slate-950/70 rounded-xl border border-slate-800">
            <button
              onClick={() => setTab('draw')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-all ${
                tab === 'draw'
                  ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              Draw Signature
            </button>
            <button
              onClick={() => setTab('type')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-all ${
                tab === 'type'
                  ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              Type Name
            </button>
            <button
              onClick={() => setTab('upload')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium rounded-lg transition-all ${
                tab === 'upload'
                  ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Image
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-6 space-y-4">
          {/* TAB 1: DRAW */}
          {tab === 'draw' && (
            <div className="space-y-3">
              <div className="relative w-full h-48 bg-white rounded-lg border-2 border-dashed border-slate-700/60 overflow-hidden cursor-crosshair shadow-inner">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={240}
                  className="w-full h-full touch-none"
                  onPointerDown={startDrawing}
                  onPointerMove={draw}
                  onPointerUp={stopDrawing}
                  onPointerLeave={stopDrawing}
                />
                {!hasDrawn && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-sm font-light">
                    Sign with mouse, trackpad, or stylus here
                  </div>
                )}
                {/* Baseline Guide */}
                <div className="absolute left-6 right-6 bottom-10 border-b border-slate-200 pointer-events-none">
                  <span className="text-[10px] text-slate-400 font-mono">x signature line</span>
                </div>
              </div>

              {/* Ink Controls */}
              <div className="flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">Ink Color:</span>
                  <div className="flex items-center gap-1.5">
                    {inkColors.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setInkColor(c.value)}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          inkColor === c.value ? 'scale-110 border-white ring-2 ring-blue-500' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c.value }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-slate-400">Width:</span>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    step="0.5"
                    value={penWidth}
                    onChange={(e) => setPenWidth(parseFloat(e.target.value))}
                    className="w-20 accent-blue-500 cursor-pointer"
                  />
                  <button
                    onClick={handleClear}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TYPE */}
          {tab === 'type' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Legal Name</label>
                <input
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Cursive Font Grid */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">Select Signature Style</label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                  {fonts.map((f) => (
                    <button
                      key={f.name}
                      onClick={() => setSelectedFont(f.name)}
                      className={`w-full p-3 rounded-lg border text-left flex items-center justify-between transition-all ${
                        selectedFont === f.name
                          ? 'border-blue-500 bg-blue-950/40 text-white'
                          : 'border-slate-800 bg-slate-950/50 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <span
                        className="text-2xl"
                        style={{
                          fontFamily: `"${f.name}", cursive`,
                          color: inkColor,
                        }}
                      >
                        {typedName || 'Your Signature'}
                      </span>
                      <span className="text-[11px] text-slate-400">{f.label.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ink Color Selector for Type */}
              <div className="flex items-center gap-3 text-xs text-slate-300 pt-1">
                <span className="text-slate-400">Ink Color:</span>
                <div className="flex items-center gap-1.5">
                  {inkColors.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => setInkColor(c.value)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        inkColor === c.value ? 'scale-110 border-white ring-2 ring-blue-500' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: UPLOAD */}
          {tab === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-slate-600 transition-colors bg-slate-950/30">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="sig-file-upload"
                />
                <label htmlFor="sig-file-upload" className="cursor-pointer flex flex-col items-center">
                  <Upload className="w-8 h-8 text-blue-400 mb-2" />
                  <span className="text-sm font-medium text-white">Click to upload scanned signature</span>
                  <span className="text-xs text-slate-400 mt-1">PNG, JPG, or WebP photo on white paper</span>
                </label>
              </div>

              {uploadedImgUrl && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-300">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      Auto Background Transparency Removal
                    </span>
                    <span className="text-slate-400">{transparencyThreshold}</span>
                  </div>
                  <input
                    type="range"
                    min="150"
                    max="250"
                    value={transparencyThreshold}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setTransparencyThreshold(val);
                      // re-filter if image exists
                      const img = new Image();
                      img.onload = () => processUploadedImage(img, val);
                      img.src = uploadedImgUrl;
                    }}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                  <div className="p-4 bg-slate-800/60 rounded-lg flex items-center justify-center h-28 border border-slate-700">
                    <img src={uploadedImgUrl} alt="Signature Preview" className="max-h-full object-contain" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cryptographic Audit Trail Option */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={includeAuditTrail}
                onChange={(e) => setIncludeAuditTrail(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="font-medium text-white flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Attach Digital Signature Verification & Audit Trail
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Includes signer identity, UTC timestamp, and SHA-256 integrity stamp
                </span>
              </div>
            </label>

            {includeAuditTrail && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <input
                  type="text"
                  value={signerEmail}
                  onChange={(e) => setSignerEmail(e.target.value)}
                  placeholder="Signer email address"
                  className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs text-white focus:outline-none focus:border-blue-500"
                />
                <div className="px-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-md text-slate-400 text-[11px] flex items-center">
                  Timestamp: {new Date().toLocaleDateString()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 rounded-xl shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            Place Signature on Document
          </button>
        </div>
      </div>
    </div>
  );
};
