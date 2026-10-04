import React, { useState } from 'react';
import { Github, Download, Copy, Check, Terminal, Monitor, Laptop, PackageCheck, FileText, X } from 'lucide-react';

interface GitHubPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubPackageModal: React.FC<GitHubPackageModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'quickstart' | 'windows-desktop' | 'dependencies' | 'readme'>('quickstart');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const quickstartCommands = `# Clone the repository
git clone https://github.com/your-username/fluent-pdf-studio.git
cd fluent-pdf-studio

# Install production dependencies
npm install

# Start local development server with Vite
npm run dev

# Build cross-platform production web bundle
npm run build`;

  const tauriCommands = `# Package as a lightweight native Windows Desktop App (.exe / .msi) using Tauri
# Prerequisites: Rust & Visual Studio C++ Build Tools installed on Windows

npm install -D @tauri-apps/cli
npx tauri init

# In tauri.conf.json:
# "build": { "beforeBuildCommand": "npm run build", "frontendDist": "../dist" }

# Build native Windows executable
npx tauri build`;

  const electronCommands = `# Package as Windows Portable or Installer (.exe) with Electron
npm install -D electron electron-builder

# Run electron in dev
npx electron .

# Build standalone Windows .exe installer
npx electron-builder --win`;

  const dependenciesList = [
    {
      name: 'pdf-lib',
      version: '^1.17.1',
      role: 'PDF Mutation & Cryptographic Document Embedding',
      desc: 'Embeds true vector text, standard Type 1 fonts, transparent PNG signatures, shapes, and exports standard compliant PDF byte arrays.',
    },
    {
      name: 'pdfjs-dist',
      version: '^6.4.299',
      role: 'High-Fidelity PDF Parser & Canvas Rendering',
      desc: 'Mozilla PDF.js engine for rendering multi-page PDFs to HTML5 Canvas and extracting text coordinates, fonts, matrices, and metadata.',
    },
    {
      name: 'motion',
      version: '^12.23.24',
      role: 'Fluent Smooth Animations & Physics',
      desc: 'Handles Windows Fluent motion transitions, modal reveals, and smooth toolbar docking without layout jitter.',
    },
    {
      name: 'lucide-react',
      version: '^0.546.0',
      role: 'Fluent Windows Iconography',
      desc: 'Provides clean, lightweight vector icons matching modern desktop productivity software conventions.',
    },
    {
      name: 'tailwindcss',
      version: '^4.3.3',
      role: 'Modern Styling & Fluent Mica Themes',
      desc: 'Zero-runtime utility styling system providing dark/light acrylic panels, high-contrast readability, and responsive layout math.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <Github className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-white">GitHub Repository & Windows Desktop Setup</h2>
              <p className="text-xs text-slate-400">Deployment guides, dependency documentation, and packaging recipes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('quickstart')}
            className={`pb-2.5 px-3 font-medium transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'quickstart'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            Git & Local Run
          </button>
          <button
            onClick={() => setActiveTab('windows-desktop')}
            className={`pb-2.5 px-3 font-medium transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'windows-desktop'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            Windows Desktop Packaging
          </button>
          <button
            onClick={() => setActiveTab('dependencies')}
            className={`pb-2.5 px-3 font-medium transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'dependencies'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            Dependency Docs
          </button>
          <button
            onClick={() => setActiveTab('readme')}
            className={`pb-2.5 px-3 font-medium transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'readme'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Full README Preview
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {activeTab === 'quickstart' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-blue-400" />
                    Terminal Setup (PowerShell / Command Prompt / Bash)
                  </span>
                  <button
                    onClick={() => copyToClipboard(quickstartCommands, 'quickstart')}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded transition-colors"
                  >
                    {copiedKey === 'quickstart' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedKey === 'quickstart' ? 'Copied' : 'Copy Commands'}
                  </button>
                </div>
                <pre className="text-xs font-mono text-emerald-400 bg-slate-900/90 p-3 rounded overflow-x-auto">
                  {quickstartCommands}
                </pre>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <span className="font-semibold text-white block mb-1">Node.js Engine</span>
                  <p className="text-slate-400 text-[11px]">Recommended: Node.js 18.x or 20.x LTS. Works seamlessly on Windows 10/11, macOS, and Linux.</p>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <span className="font-semibold text-white block mb-1">Local Privacy Guaranteed</span>
                  <p className="text-slate-400 text-[11px]">Zero server uploads. 100% of PDF parsing, in-place font matching, and signing happens client-side.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'windows-desktop' && (
            <div className="space-y-4">
              {/* Option 1: PWA */}
              <div className="p-4 bg-slate-950/80 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Monitor className="w-3.5 h-3.5 text-blue-400" />
                    Option 1: Windows 11 Native PWA (Zero Setup)
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                    Instant 1-Click
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  In Microsoft Edge or Google Chrome on Windows, click the <strong>Install</strong> icon in the address bar (or in this app's top bar) to install FluentPDF Studio directly to the Windows Start Menu, Taskbar, and desktop window with native title bar controls.
                </p>
              </div>

              {/* Option 2: Tauri */}
              <div className="p-4 bg-slate-950/80 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <Laptop className="w-3.5 h-3.5 text-purple-400" />
                    Option 2: Tauri Native Windows Executable (.exe / .msi)
                  </span>
                  <button
                    onClick={() => copyToClipboard(tauriCommands, 'tauri')}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded transition-colors"
                  >
                    {copiedKey === 'tauri' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedKey === 'tauri' ? 'Copied' : 'Copy Tauri Config'}
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  Produces a tiny ~8MB standalone Windows installer with near-zero memory footprint using the Windows WebView2 runtime.
                </p>
                <pre className="text-xs font-mono text-slate-300 bg-slate-900 p-2.5 rounded overflow-x-auto">
                  {tauriCommands}
                </pre>
              </div>

              {/* Option 3: Electron */}
              <div className="p-4 bg-slate-950/80 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <PackageCheck className="w-3.5 h-3.5 text-sky-400" />
                    Option 3: Electron Builder (.exe)
                  </span>
                  <button
                    onClick={() => copyToClipboard(electronCommands, 'electron')}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded transition-colors"
                  >
                    {copiedKey === 'electron' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    {copiedKey === 'electron' ? 'Copied' : 'Copy Electron Config'}
                  </button>
                </div>
                <pre className="text-xs font-mono text-slate-300 bg-slate-900 p-2.5 rounded overflow-x-auto">
                  {electronCommands}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'dependencies' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                Detailed architecture and dependency audit documentation for GitHub code review:
              </p>
              <div className="space-y-2">
                {dependenciesList.map((dep) => (
                  <div key={dep.name} className="p-3 bg-slate-950/70 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono font-bold text-blue-400">
                        {dep.name} <span className="text-slate-400 font-normal">({dep.version})</span>
                      </span>
                      <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {dep.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{dep.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'readme' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300">Complete Repository README.md</span>
                <span className="text-[11px] text-slate-400">Available in root directory</span>
              </div>
              <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-xs text-slate-300 space-y-2 max-h-64 overflow-y-auto font-mono">
                <p className="text-white font-bold"># FluentPDF Studio</p>
                <p>Cross-Platform & Windows-Optimized PDF Editor with Font-Matching Text Replacement & Digital Signatures</p>
                <p className="text-slate-400">---</p>
                <p>## Highlights</p>
                <p>- Font Matching Engine: In-place text replacement mimicking original fonts (Helvetica, Times, Segoe UI, Courier, etc.)</p>
                <p>- Drag-and-Drop Digital Signatures: Smooth ink curve capture, calligraphy type, and photo scanned background transparency removal</p>
                <p>- Windows 11 Fluent UI: Acrylic frosted glass aesthetics, keyboard shortcuts, and full multi-page thumbnail management</p>
                <p>- 100% Client-Side Privacy: No files leave the user computer; genuine PDF export powered by pdf-lib and PDF.js</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-t border-slate-800">
          <span className="text-xs text-slate-400">Ready for GitHub upload & distribution</span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
