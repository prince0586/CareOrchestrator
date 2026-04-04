import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { translateClinicalNote, draftProviderResponse, analyzeCareLogs } from "./src/services/geminiService.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/translate", async (req, res) => {
    try {
      const { note } = req.body;
      const summary = await translateClinicalNote(note);
      res.json({ summary });
    } catch (error) {
      res.status(500).json({ error: "Translation failed" });
    }
  });

  app.post("/api/draft-response", async (req, res) => {
    try {
      const { message, history } = req.body;
      const draft = await draftProviderResponse(message, history || []);
      res.json({ draft });
    } catch (error) {
      res.status(500).json({ error: "Drafting failed" });
    }
  });

  app.post("/api/analyze-logs", async (req, res) => {
    try {
      const { logs } = req.body;
      const analysis = await analyzeCareLogs(logs);
      res.json({ analysis });
    } catch (error) {
      res.status(500).json({ error: "Analysis failed" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
