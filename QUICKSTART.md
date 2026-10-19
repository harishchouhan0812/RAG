# 🚀 Quick Start Guide - Explainable RAG Lab

Get up and running in 5 minutes!

## Prerequisites

- **Python 3.9+** - [Download](https://www.python.org/downloads/)
- **Node.js 16+** - [Download](https://nodejs.org/)
- **8GB RAM minimum** (for embedding models)
- **Windows** operating system

## One-Command Setup

```cmd
setup.bat
```

This will:
1. Create Python virtual environment
2. Install Python dependencies (FastAPI, Sentence Transformers, FAISS)
3. Install Node.js dependencies (React, Tailwind, React Flow)
4. Create `.env` configuration file

**Expected time:** 5-10 minutes (depending on download speed)

## One-Command Run

```cmd
run.bat
```

This will:
1. Start FastAPI backend on http://localhost:8000
2. Start React frontend on http://localhost:5173

**The app will open in your browser automatically!**

## First Steps

### 1. Upload a Document (30 seconds)

- Click "Upload Document" in the left sidebar
- Select `samples/example-document.txt`
- Watch the pipeline process it automatically

**What happens:**
- ✅ Document parsed (text extracted)
- ✅ Split into chunks (42 chunks from the sample)
- ✅ Embeddings generated (384-dim vectors)
- ✅ Indexed in FAISS (ready for search)

### 2. Ask a Question (10 seconds)

Try these queries in the bottom panel:

```
What is RAG?
```

```
What are the main components of a RAG system?
```

```
How do I improve retrieval quality?
```

**What you'll see:**
- Retrieved chunks with similarity scores
- Generated answer with source citations
- Query metrics (latency, retrieval count)
- Event log showing each pipeline stage

### 3. Explore Teaching Mode (5 minutes)

1. Click the **"Teaching Mode"** tab at the top
2. Step through the 10 lessons
3. Learn how each RAG stage works

**You'll learn:**
- Why chunking matters
- How embeddings work
- What retrieval methods exist
- Common failure modes and fixes

### 4. Try Different Configurations (5 minutes)

In the left sidebar, experiment with:

**Chunking:**
- Chunk Size: 200 → 1000 (see how it affects context)
- Overlap: 0 → 200 (observe context preservation)

**Retrieval:**
- Dense (semantic similarity only)
- Sparse (keyword matching only)
- Hybrid (both combined - usually best)

**Top-K:**
- 3 → 10 (more results = better recall, more latency)

**Reranking:**
- Enable to improve accuracy (adds ~0.5s latency)

### 5. View the Failure Modes Lab (10 minutes)

1. Click **"Failure Modes Lab"** tab
2. Explore 10 common RAG problems
3. See before/after examples
4. Learn mitigation strategies

**Examples:**
- Poor Chunking (broken sentences)
- Irrelevant Retrieval (high score ≠ relevant)
- Hallucination (made-up facts)
- Context Overflow (exceeding token limits)

### 6. Check the Evaluation Dashboard (5 minutes)

1. Click **"Evaluation"** tab
2. View metrics for your queries:
   - Precision & Recall
   - MRR (Mean Reciprocal Rank)
   - Latency distribution
   - Method comparisons

## Architecture Overview

```
Frontend (React)              Backend (FastAPI)
├─ Pipeline Visualization  ←→ ├─ Document Parser
├─ Query Interface         ←→ ├─ Chunker
├─ Inspector Panel         ←→ ├─ Embedder (Sentence Transformers)
├─ Event Log               ←→ ├─ Vector Store (FAISS)
├─ Teaching Mode           ←→ ├─ Retriever (Hybrid: Dense + BM25)
├─ Failure Lab             ←→ ├─ Reranker (Cross-encoder)
└─ Evaluation Dashboard    ←→ └─ LLM Provider (Local/API)
```

## Configuration

### Using Local Models (Default)

No API keys needed! Uses:
- **Embeddings:** all-MiniLM-L6-v2 (auto-downloaded)
- **LLM:** GPT-2 (auto-downloaded)
- **Reranker:** ms-marco-MiniLM-L-6-v2 (auto-downloaded)

### Using OpenAI

Edit `.env`:
```env
LLM_PROVIDER=openai
LLM_MODEL_NAME=gpt-3.5-turbo
OPENAI_API_KEY=your-key-here
```

### Using Anthropic

Edit `.env`:
```env
LLM_PROVIDER=anthropic
LLM_MODEL_NAME=claude-3-haiku-20240307
ANTHROPIC_API_KEY=your-key-here
```

## Troubleshooting

### "Backend not running" error

**Solution:**
```cmd
cd backend
python main.py
```

Wait for "RAG Pipeline Ready!" then refresh the page.

### "Port already in use"

**Solution:**
Edit `.env`:
```env
BACKEND_PORT=8001
```

Then update `vite.config.ts` proxy target to 8001.

### Models won't download

**Solution:**
```cmd
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"
```

### Out of memory

**Solution:**
Use smaller models in `.env`:
```env
EMBEDDING_MODEL=all-MiniLM-L6-v2
LLM_MODEL_NAME=gpt2
```

## Advanced Usage

### Custom Documents

Upload your own:
- **PDF:** Text-based PDFs work best (scanned PDFs need OCR)
- **Word:** .docx format supported
- **Text:** .txt or .md files
- **Size:** Up to 50MB per file

### Evaluation with Ground Truth

For accurate metrics, you need labeled data:

1. Create a file with query-document pairs
2. Mark which chunks should be retrieved
3. Use the Evaluation API to calculate true precision/recall

### Production Deployment

See `README.md` for:
- Environment variables
- Scaling strategies
- Monitoring setup
- Security considerations

## Learning Path

### Beginner (30 minutes)
1. Upload sample document
2. Run 5-10 queries
3. Complete Teaching Mode
4. Read Failure Modes Lab

### Intermediate (2 hours)
1. Try all retrieval methods
2. Test different chunk sizes
3. Compare with/without reranking
4. Upload your own documents
5. Analyze evaluation metrics

### Advanced (1 day)
1. Fine-tune embeddings on your domain
2. Implement custom reranking
3. Add metadata filtering
4. Set up production deployment
5. Build custom evaluation datasets

## Next Steps

- Read the full [README.md](README.md)
- Explore the [sample queries](samples/sample-queries.md)
- Check out the [API documentation](http://localhost:8000/docs)
- Join discussions about RAG systems
- Contribute improvements!

## Resources

- **Sentence Transformers:** https://www.sbert.net/
- **FAISS:** https://github.com/facebookresearch/faiss
- **RAG Paper:** https://arxiv.org/abs/2005.11401
- **LangChain Docs:** https://python.langchain.com/docs/use_cases/question_answering/

---

**Built with ❤️ for education and understanding**

Need help? Check the [README](README.md) or open an issue!
