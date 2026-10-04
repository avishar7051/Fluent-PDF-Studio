import React, { useRef, useState } from 'react';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Sparkles,
  PenTool,
  ShieldCheck,
  Zap,
  ArrowRight,
  FileCheck,
} from 'lucide-react';

interface WelcomeUploadScreenProps {
  onFileSelect: (file: File) => void;
  onLoadSample: (type: 'contract' | 'invoice') => void;
  isLoading: boolean;
  loadingMessage: string;
}

export const WelcomeUploadScreen: React.FC<WelcomeUploadScreenProps> = ({
  onFileSelect,
  onLoadSample,
  isLoading,
  loadingMessage,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-between p-4 md:p-8 select-none">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept="application/pdf, image/png, image/jpeg, image/webp"
        className="hidden"
      />

      {/* Top Simple Brand Header */}
      <header className="flex items-center justify-between max-w-5xl w-full mx-auto pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-500 via-rose-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
            <PenTool className="w-5 h-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-white">
              Fluent<span className="text-orange-400">PDF</span>
            </span>
            <span className="text-[11px] text-blue-400 ml-1.5 font-medium">Studio</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-emerald-400 flex items-center gap-1 font-medium bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-800/60">
            <Zap className="w-3.5 h-3.5" />
            100% Free · No Limits
          </span>
          <span className="hidden sm:inline text-slate-400 text-xs">
            100% Client-Side Private
          </span>
        </div>
      </header>

      {/* Hero Content & Upload Area */}
      <main className="max-w-3xl w-full mx-auto my-auto py-6 space-y-6">
        {/* Title & Tagline */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Edit PDF Text & Add <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-rose-400 to-blue-400">Digital Signatures</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto font-light">
            Change text with automatic font matching, draw or scan legal signatures, and convert images to PDF directly in your browser.
          </p>
        </div>

        {/* Upload Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !isLoading && fileInputRef.current?.click()}
          className={`relative rounded-2xl border-2 border-dashed p-8 md:p-12 text-center cursor-pointer transition-all duration-200 group ${
            isDragOver
              ? 'border-orange-500 bg-orange-950/20 scale-[1.01] shadow-2xl shadow-orange-500/10'
              : 'border-slate-700 bg-slate-900/60 hover:border-orange-500/80 hover:bg-slate-900/90 shadow-xl'
          }`}
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full border-3 border-orange-500 border-t-transparent animate-spin" />
              <p className="text-base font-semibold text-white">{loadingMessage || 'Processing document...'}</p>
              <p className="text-xs text-slate-400">Matching fonts and rendering pages...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4">
              {/* Vibrant Icon Stack */}
              <div className="flex items-center justify-center -space-x-3 group-hover:scale-105 transition-transform duration-200">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/30">
                  <FileText className="w-7 h-7" />
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                  <ImageIcon className="w-7 h-7" />
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg md:text-xl font-bold text-white">
                  Drop your PDF or Image here
                </h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  Supports <strong className="text-slate-200">PDF, PNG, JPG, WEBP</strong> (Images are automatically converted to PDF)
                </p>
              </div>

              {/* Primary Action Button */}
              <button
                type="button"
                className="mt-2 px-6 py-3 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-orange-500 via-rose-500 to-blue-600 hover:from-orange-600 hover:via-rose-600 hover:to-blue-700 shadow-lg shadow-rose-500/25 transition-all transform group-hover:scale-102 flex items-center gap-2"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Select PDF or Image from Computer</span>
              </button>
            </div>
          )}
        </div>

        {/* Quick Sample Documents for instant testing */}
        <div className="space-y-2">
          <p className="text-center text-xs font-medium text-slate-400">
            Don't have a file right now? Try with an instant sample:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLoadSample('contract');
              }}
              className="p-3 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-orange-500/50 rounded-xl text-left transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center border border-orange-500/20">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-orange-400 transition-colors">
                    Sample Contract & NDA
                  </div>
                  <div className="text-[10px] text-slate-400">2 Pages with signatures to edit</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onLoadSample('invoice');
              }}
              className="p-3 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-blue-500/50 rounded-xl text-left transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors">
                    Sample Work Invoice
                  </div>
                  <div className="text-[10px] text-slate-400">1 Page with editable billing text</div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4 border-t border-slate-800/60 text-slate-400 text-xs text-center">
          <div className="flex flex-col items-center gap-1 p-2">
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span className="font-semibold text-slate-200">Auto Font Matching</span>
            <span className="text-[10px] text-slate-400">Matches original document fonts</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2">
            <PenTool className="w-4 h-4 text-rose-400" />
            <span className="font-semibold text-slate-200">Digital Signatures</span>
            <span className="text-[10px] text-slate-400">Draw, type, or scan signatures</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2">
            <ImageIcon className="w-4 h-4 text-blue-400" />
            <span className="font-semibold text-slate-200">Image to PDF</span>
            <span className="text-[10px] text-slate-400">Converts PNG & JPG instantly</span>
          </div>
          <div className="flex flex-col items-center gap-1 p-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-slate-200">100% Free & Private</span>
            <span className="text-[10px] text-slate-400">Zero files uploaded to servers</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 py-2">
        FluentPDF Studio · Cross-Platform Desktop & Web PDF Editor · Free & Open Source
      </footer>
    </div>
  );
};
