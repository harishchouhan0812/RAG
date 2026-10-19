# 🚀 Explainable RAG Lab - Quick Start Guide

## ⚡ ONE-CLICK START

Just double-click: **`RUN-ME.bat`**

That's it! The application will start automatically.

---

## 📋 What Happens When You Run It:

1. ✅ Backend starts on http://localhost:8000
2. ✅ Models load (takes ~5-10 seconds first time)
3. ✅ Frontend starts on http://localhost:5173
4. ✅ Browser opens automatically

---

## 🎯 How to Use:

### Step 1: Upload a Document
- Click "Upload Document" button
- Select a PDF, DOCX, TXT, or MD file
- Or use the sample: `samples/example-document.txt`

### Step 2: Process the Document
- Click "Chunk Document" (default settings work great)
- Click "Generate Embeddings"
- Click "Build Index"

### Step 3: Ask Questions
- Type a question in the query box at the bottom
- Press Enter or click "Ask"
- Watch the pipeline light up!
- See retrieved chunks and generated answer

---

## 🎨 Features:

### Pipeline View (Default)
- Live visualization of RAG pipeline
- See every step in action
- Click nodes for detailed explanations

### Teaching Mode
- Step-by-step lessons
- Learn how RAG works internally
- Technical details and examples

### Failure Modes Lab
- Common RAG problems
- Root causes
- Mitigation strategies
- Before/after examples

### Evaluation Dashboard
- Metrics and comparisons
- Test different configurations
- Measure retrieval quality

---

## 🔧 Manual Start (If Needed):

**Terminal 1 - Backend:**
```bash
cd c:\Users\chouh\OneDrive\Desktop\rag
venv\Scripts\activate.bat
cd backend
python main.py
```

**Terminal 2 - Frontend:**
```bash
cd c:\Users\chouh\OneDrive\Desktop\rag
npm run dev
```

---

## ❓ Troubleshooting:

### Backend Not Starting?
1. Run: `test-backend.bat` to check connection
2. Make sure no other app is using port 8000
3. Check backend window for error messages

### Frontend Can't Connect?
1. Wait 10 seconds for models to load
2. Refresh browser (F5)
3. Click "Retry Connection" button
4. Check that backend window shows "🎉 RAG Pipeline Ready!"

### Models Taking Long to Load?
- First-time download: 2-5 minutes (normal!)
- Sentence Transformers models: ~400MB
- Subsequent starts: ~5-10 seconds

---

## 🔑 Enable Full LLM (Optional):

Currently using **Demo Mode** (context-aware responses without real LLM).

To enable real AI answers:

1. Open `.env` file
2. Add your API key:
   ```
   OPENAI_API_KEY=your-key-here
   LLM_PROVIDER=openai
   ```
3. Restart backend

---

## 📦 Tech Stack:

- **Frontend:** React + TypeScript + Tailwind CSS + React Flow
- **Backend:** FastAPI + Python
- **Embeddings:** Sentence Transformers (all-MiniLM-L6-v2)
- **Vector Store:** FAISS
- **Retrieval:** Hybrid (Dense + BM25)
- **Reranking:** Cross-Encoder

---

## 🎓 Made for Learning:

This is a **teaching tool** designed to make RAG explainable.
Every operation is visualized, logged, and explained.

Perfect for:
- University seminars
- Developer education
- RAG experimentation
- Understanding LLM pipelines

---

## 🆘 Still Having Issues?

Make sure:
1. ✅ Python virtual environment is activated
2. ✅ All dependencies installed (run `setup.bat` if needed)
3. ✅ Node modules installed (`npm install`)
4. ✅ Backend shows "🎉 RAG Pipeline Ready!"
5. ✅ Frontend shows the dashboard (not error page)

If all else fails, restart:
1. Close both terminal windows
2. Double-click `RUN-ME.bat` again

---

**Enjoy exploring RAG! 🎉**
