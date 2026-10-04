import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Increase JSON body limit to handle high-resolution image crops and canvas data
app.use(express.json({ limit: '35mb' }));

// Initialize Google GenAI client (uses process.env.GEMINI_API_KEY automatically)
let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI();
  }
} catch (e) {
  console.warn('Failed to initialize GoogleGenAI client:', e);
}

/**
 * POST /api/ocr-region
 * Analyzes a cropped image region (selected by user or text detector)
 * Returns the exact text (e.g. "Choose format"), font family, weight, style, colors, and background color.
 */
app.post('/api/ocr-region', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/png' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 parameter' });
    }

    if (!ai && process.env.GEMINI_API_KEY) {
      ai = new GoogleGenAI();
    }

    if (!ai) {
      return res.status(503).json({ error: 'Gemini AI not initialized (missing API key)' });
    }

    // Clean data URL prefix if provided
    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');

    const prompt = `You are a high-precision OCR and typographic analysis engine for a document and PDF editor.
Analyze the provided image snippet of text carefully.
Extract the EXACT text shown in the image (e.g. "Choose format", button labels, headers, words, sentences).
Preserve original capitalization, punctuation, and wording.
Also analyze the font style, estimated text color (hex code), and background patch color (hex code) so the editor can cleanly replace this text without leaving any trace of the old text.

Respond ONLY with a JSON object matching this schema:
{
  "detectedText": "exact text in the image",
  "fontFamily": "sans-serif | serif | monospace | cursive",
  "fontWeight": "400 | 600 | 700",
  "fontStyle": "normal | italic",
  "estimatedFontSize": 14,
  "textColor": "#0f172a",
  "bgColor": "#ffffff",
  "confidence": 0.95
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: cleanBase64,
                mimeType,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const textOutput = response.text?.trim() || '{}';
    let parsedData = {};
    try {
      parsedData = JSON.parse(textOutput);
    } catch {
      // Fallback regex extraction if JSON wrapper has markdown
      const match = textOutput.match(/\{[\s\S]*\}/);
      if (match) {
        parsedData = JSON.parse(match[0]);
      }
    }

    res.json({ success: true, ...parsedData });
  } catch (err: any) {
    console.error('OCR region analysis error:', err);
    res.status(500).json({ error: err.message || 'OCR analysis failed' });
  }
});

/**
 * POST /api/ocr-page
 * Analyzes an entire document page or uploaded image
 * Detects all text lines/blocks with bounding boxes (as percentages 0-100)
 */
app.post('/api/ocr-page', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/png' } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: 'Missing imageBase64 parameter' });
    }

    if (!ai && process.env.GEMINI_API_KEY) {
      ai = new GoogleGenAI();
    }

    if (!ai) {
      return res.status(503).json({ error: 'Gemini AI not initialized (missing API key)' });
    }

    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');

    const prompt = `You are a document OCR engine. Identify all distinct text lines/phrases in this image (e.g. headings, labels like "Choose format", form fields, paragraphs).
For each detected text line, provide:
- text: the exact string content
- box2d: [ymin, xmin, ymax, xmax] normalized on a scale from 0 to 1000 (where 0 is top/left, 1000 is bottom/right)
- fontCategory: "sans-serif" | "serif" | "monospace" | "cursive"
- fontWeight: "400" | "600" | "700"
- fontStyle: "normal" | "italic"
- textColor: hex color of the text (e.g. "#1e293b")
- bgColor: hex background color immediately behind this text line (e.g. "#ffffff")

Respond ONLY with a JSON object:
{
  "items": [
    {
      "text": "Choose format",
      "box2d": [120, 45, 160, 280],
      "fontCategory": "sans-serif",
      "fontWeight": "600",
      "fontStyle": "normal",
      "textColor": "#0f172a",
      "bgColor": "#ffffff"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: cleanBase64,
                mimeType,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const textOutput = response.text?.trim() || '{"items":[]}';
    let parsedData = { items: [] };
    try {
      parsedData = JSON.parse(textOutput);
    } catch {
      const match = textOutput.match(/\{[\s\S]*\}/);
      if (match) {
        parsedData = JSON.parse(match[0]);
      }
    }

    res.json({ success: true, items: parsedData.items || [] });
  } catch (err: any) {
    console.error('OCR page analysis error:', err);
    res.status(500).json({ error: err.message || 'Page OCR failed' });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Development mode: Mount Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: Serve built static files
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FluentPDF Studio server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
