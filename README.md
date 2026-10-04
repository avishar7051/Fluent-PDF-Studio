# FluentPDF Studio 📄✍️

> A simple, fast, and cross-platform PDF editor featuring in-place font-matching text replacement, digital signatures with ink smoothing and background transparency removal, automatic Image-to-PDF conversion, and a minimalist Red-Orange-Blue interface.

[![Platform](https://img.shields.io/badge/Platform-Windows%2011%20%7C%20macOS%20%7C%20Linux%20%7C%20Web-blue)](#cross-platform-compatibility)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646cff.svg)](https://vitejs.dev/)
[![Cost](https://img.shields.io/badge/Price-100%25%20Free%20%26%20Open-success.svg)](#privacy--security-guarantee)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Client--Side%20Offline-orange.svg)](#privacy--security-guarantee)
[![License](https://img.shields.io/badge/License-Apache%202.0-red.svg)](LICENSE)

---

## 🌟 Key Features

### 1. Simple Drop-and-Go Upload Screen
- **Instant File Dropping**: Drag & drop any PDF or image file (PNG, JPG, WEBP) directly onto the clean landing screen.
- **Automatic Image-to-PDF Conversion**: Uploading an image automatically builds a standardized, high-resolution PDF canvas and opens it straight in the editor.
- **Instant Sample Documents**: Quick one-click buttons to test immediately with a realistic multi-page contract or commercial invoice.

### 2. In-Place Text Editing with Intelligent Font Matching
- **Automatic Typography Detection**: Extracts text bounding boxes, font identifiers (`Times-Roman`, `Helvetica`, `SegoeUI`, `Courier`, etc.), font sizes (in points), font weights (Regular/Bold), and styles (Normal/Italic).
- **Style-Matched Replacement**: Seamlessly covers original text with an underlying background patch (auto-sampled from the document canvas) and stamps replacement text matching the original font family, size, line-height, and color.
- **Font Tuning Inspector**: Fine-tune font family, size stepper, bold/italic, alignment (left/center/right), letter-spacing, and patch color.

### 3. Intuitive Drag-and-Drop Digital Signatures
- **Draw Signature**: Smooth ink strokes with natural velocity/pressure curves, customizable fountain pen ink colors (Royal Blue `#1d4ed8`, Midnight Black `#0f172a`, Flame Orange `#ea580c`, Crimson Red `#dc2626`), and stroke thickness slider.
- **Type Signature**: 5 elegant calligraphy signature script fonts (*Dancing Script*, *Great Vibes*, *Sacramento*, *Caveat*, *Lora Italic*).
- **Upload Scanned Signature**: Photo upload with **Automatic Background Transparency Removal** (luminosity thresholding converts white/gray scanner paper transparent while preserving dark ink strokes).
- **Quick Drag-and-Drop Dock**: Drag signatures, approval checkmarks (`✓`), crosses (`✗`), or automated date stamps directly from the toolbar onto any line of any page.
- **Cryptographic Audit Trail**: Attach verifiable signer identity, UTC timestamp, and SHA-256 integrity hash.

### 4. Minimalist Red, Orange & Blue Interface (Fast & 100% Free)
- Clean, distraction-free unified top toolbar with high-contrast tools.
- Vibrant, energetic palette featuring warm orange, coral red, and royal blue accents.
- 100% free with no watermarks, no subscriptions, and no sign-up walls.
- Works fast locally in any browser on Windows, macOS, Linux, and mobile devices.

### 3. Full Annotation Suite & Page Management
- **Redaction / Whiteout**: Draw masking rectangles to permanently black out or white out sensitive account numbers or confidential clauses.
- **Translucent Highlighting**: Draw yellow translucent highlighter bands over text.
- **Freehand Markup & Pen**: Add handwritten notes and diagrams.
- **Shapes & Badges**: Rectangles, checkmarks, crosses, and custom image/stamp embedding.
- **Thumbnail Navigator**: Multi-page thumbnail sidebar with 90° rotation, duplicate page, reorder, and delete page.

### 4. Native Windows 11 Fluent Design & Cross-Platform UX
- Designed following modern desktop software aesthetics: acrylic frosted glass headers, dark/light theme discipline, and responsive layout math.
- Windows title bar simulation with minimize, maximize/restore, and zoom controls.
- Full keyboard shortcuts (`Ctrl+Z`, `Ctrl+Y`, `Ctrl+S`, `Delete`, `Escape`).
- Works on Windows, macOS, Linux, ChromeOS, iPad, and mobile browsers.

---

## 🔒 Privacy & Security Guarantee

All PDF parsing, text extraction, font matching, digital signing, and file export operations run **100% client-side** in your local browser or desktop webview engine. **Zero documents, bytes, or personal signatures are ever uploaded to external servers.**

---

## 🚀 Quickstart & Setup Instructions

### Prerequisites
- [Node.js](https://nodejs.org/) (Version `18.x`, `20.x`, or `22.x` LTS recommended)
- `npm` (bundled with Node.js) or `pnpm` / `yarn`
- Any modern web browser (Edge, Chrome, Firefox, Safari)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/fluent-pdf-studio.git

# 2. Enter project directory
cd fluent-pdf-studio

# 3. Install dependencies
npm install

# 4. Start the local development server
npm run dev
```

Open your browser to `http://localhost:3000` (or the address printed in terminal).

### Production Build

```bash
# Compile and bundle for production
npm run build

# Preview production build locally
npm run preview
```

The compiled static assets will be output to the `dist/` directory.

---

## 🖥️ Packaging as a Native Windows Desktop App

FluentPDF Studio can be packaged into a standalone Windows desktop application via three popular methods:

### Option 1: Native Windows PWA (Zero Setup, Recommended)
1. Launch the app in **Microsoft Edge** or **Google Chrome** on Windows.
2. Click the **App Available** / **Install** icon in the browser address bar (or in the app top bar).
3. FluentPDF Studio will install directly to your Windows **Start Menu**, **Taskbar**, and launch in an independent desktop window with native OS integration.

### Option 2: Lightweight Tauri Windows Executable (.exe / .msi)
[Tauri](https://tauri.app/) produces a tiny ~8MB native Windows executable using the native Windows WebView2 runtime.

```bash
# 1. Ensure Rust is installed on your Windows system (https://rustup.rs)
# 2. Install Tauri CLI
npm install -D @tauri-apps/cli

# 3. Initialize Tauri in the project
npx tauri init

# 4. In src-tauri/tauri.conf.json configure:
# "build": {
#   "beforeBuildCommand": "npm run build",
#   "frontendDist": "../dist"
# }

# 5. Build native Windows installer
npx tauri build
```
Your compiled `.exe` and `.msi` installers will be located in `src-tauri/target/release/bundle/`.

### Option 3: Electron Windows Installer (.exe)
[Electron](https://www.electronjs.org/) wraps the Chromium runtime for complete cross-platform desktop bundling:

```bash
# 1. Install Electron and Electron Builder
npm install -D electron electron-builder

# 2. Add "main": "electron/main.js" to package.json
# 3. Build Windows standalone package
npx electron-builder --win
```

---

## 📦 Dependency Documentation

A full breakdown of all dependencies utilized by FluentPDF Studio and their architectural responsibilities:

| Package | Version | Purpose & Architectural Role |
| :--- | :--- | :--- |
| **`pdfjs-dist`** | `^6.4.299` | **PDF Rendering & Geometry Parser**: Mozilla's PDF.js engine. Renders multi-page PDF documents to HTML5 Canvas and extracts text items with font names, point sizes, transform matrices, and bounding boxes. |
| **`pdf-lib`** | `^1.17.1` | **PDF Mutation & Embedding Engine**: Embeds vector typography, standard fonts (Helvetica, Times Roman, Courier), high-res transparent PNG signatures, shapes, and generates true downloadable binary PDF files without quality degradation. |
| **`react` & `react-dom`** | `^19.0.1` | **Component UI Framework**: State management for active tools, page navigation, history stacks, annotations, and modal controllers. |
| **`lucide-react`** | `^0.546.0` | **Fluent Desktop Icons**: Vector iconography matching modern desktop productivity standards. |
| **`motion`** | `^12.23.24` | **Fluent UI Motion**: Compositor animations for modal dialog transitions, tool reveals, and smooth dragging feedback. |
| **`tailwindcss`** | `^4.3.3` | **Styling & Theme Engine**: Zero-runtime CSS utility framework providing dark slate palettes, acrylic frosted backdrops, and WCAG AA contrast. |
| **`canvas-confetti`** | `^1.9.4` | **User Feedback**: Delightful celebration physics burst when documents are signed and exported. |
| **`vite`** | `^8.3.0` | **Build Tool & Dev Server**: Lightning-fast ES modules development server and optimized rollup production bundler. |
| **`typescript`** | `^7.0.2` | **Type Safety**: Enforces strict typing across PDF annotations, text items, matrix transformations, and fonts. |

---

## 🧠 How the Font-Matching Engine Works

When a user edits text inside an existing PDF, FluentPDF Studio executes a 5-step heuristic pipeline:

1. **Matrix & Font Geometry Extraction**:
   PDF.js inspects the text item's affine transform matrix:
   $$\text{Transform} = [s_x, k_y, k_x, s_y, t_x, t_y]$$
   The optical point size is calculated via Euclidean hypotenuse:
   $$\text{FontSize} = \sqrt{s_x^2 + k_y^2}$$

2. **Font Family Classification**:
   The raw PostScript/PDF font identifier (e.g. `BCDFEE+TimesNewRomanPSMT`) has its subset prefix stripped and is mapped against standard font classifications:
   - *Serif*: Mapped to `Times New Roman`, `Lora`, `Georgia`
   - *Sans-Serif*: Mapped to `Plus Jakarta Sans`, `Segoe UI`, `Arial`
   - *Monospace*: Mapped to `Courier Prime`, `Courier New`, `Consolas`

3. **Weight & Style Invariant Detection**:
   Substrings including `bold`, `heavy`, `black`, `demi`, `700` trigger bold weights; substrings including `italic`, `oblique`, `slanted` trigger italic styles.

4. **Background Color Sampling**:
   To ensure the whiteout or background patch blends invisibly with the page, the canvas pixels directly behind the text bounding box are sampled to compute the average background color (adapting to pure white `#FFFFFF`, paper cream, or colored headers).

5. **Vector Inscription on Export**:
   When exporting via `pdf-lib`, the patch is drawn as a vector rectangle and the replacement text is stamped with matching font metrics into the PDF stream.

---

## ⌨️ Keyboard Shortcuts Reference

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + Z` / `Cmd + Z` | Undo last edit or annotation |
| `Ctrl + Y` / `Cmd + Shift + Z` | Redo undone edit |
| `Ctrl + S` / `Cmd + S` | Export & Save Signed PDF |
| `Delete` / `Backspace` | Delete selected element |
| `Escape` | Deselect element / Close open modals |
| `T` | Activate **Edit Text (Font Match)** tool |
| `S` | Open **Digital Signature** studio |
| `V` | Switch to **Select & Move** tool |
| `R` | Activate **Redaction / Whiteout** tool |
| `H` | Activate **Highlighter** tool |

---

## 🌐 Cross-Platform Compatibility

| Operating System | Compatibility | Recommended Delivery |
| :--- | :--- | :--- |
| **Windows 11 / 10** | 100% Native Feel | PWA, Tauri `.exe`, Electron `.exe` |
| **macOS (Apple Silicon & Intel)** | 100% Tested | Web, PWA, Safari, Chrome |
| **Linux (Ubuntu / Debian / Fedora)** | 100% Tested | Web, Chrome, Firefox, Tauri |
| **iPadOS / iOS** | Touch & Pencil Enabled | Safari PWA (Add to Home Screen) |
| **Android** | Touch & Stylus Enabled | Chrome PWA |

---

## 📄 License

This project is licensed under the Apache 2.0 License. See the [LICENSE](LICENSE) file for details.
