# 🎓 Explainable RAG: Visual Learning Lab

An interactive teaching platform that visualizes and explains Retrieval-Augmented Generation (RAG) pipelines step-by-step. Perfect for students, educators, and developers learning about RAG systems.

## ✨ Features

### 📊 Interactive Pipeline Visualization
- **Live Architecture Diagram**: See every stage of the RAG pipeline with animated connections
- **Real-time Status Updates**: Watch as documents are processed, embedded, indexed, and retrieved
- **Node-by-Node Exploration**: Click any stage to see detailed explanations and data

### 🔍 Complete RAG Pipeline
1. **Document Upload** - PDF, DOCX, TXT, Markdown support
2. **Text Extraction** - Real extraction with validation and previews
3. **Document Chunking** - Configurable chunking with overlap visualization
4. **Embedding Generation** - Sentence Transformers with vector previews
5. **Semantic Indexing** - FAISS-based vector storage
6. **Query Processing** - Embed user questions in the same vector space
7. **Similarity Search** - Dense retrieval with cosine similarity
8. **Hybrid Retrieval** - Combine semantic and keyword (BM25) search
9. **Reranking** - Cross-encoder reranking for improved relevance
10. **Context Augmentation** - Build prompts with retrieved evidence
11. **LLM Generation** - Generate answers with source attribution

### 🎯 Teaching Features
- **Teaching Mode**: Step-by-step execution with explanations
- **Failure Modes Lab**: Demonstrate and fix common RAG problems
- **Architecture Comparison**: Compare naive vs. advanced RAG approaches
- **Evaluation Dashboard**: Measure precision, recall, latency, and more
- **Complete Trace View**: See the entire execution path for each query

### 🎨 Beautiful UI
- Modern dark theme with smooth animations
- Interactive charts and visualizations
- Real-time event logging
- Source attribution with highlighting
- Responsive design

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+
- 8GB RAM minimum (for embedding models)

### Installation (Windows)

**One-Command Setup:**
```cmd
setup.bat
```

**One-Command Run:**
```cmd
run.bat
```

That's it! The application will open at `http://localhost:5173`

### Manual Setup

1. **Clone and enter directory:**
```cmd
cd explainable-rag-lab
```

2. **Backend Setup:**
```cmd
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

3. **Frontend Setup:**
```cmd
npm install
```

4. **Environment Configuration:**
```cmd
copy .env.example .env
```

5. **Run Backend:**
```cmd
cd backend
python main.py
```

6. **Run Frontend (in new terminal):**
```cmd
npm run dev
```

## 📖 Usage Guide

### Basic Workflow

1. **Upload a Document**
   - Click "Upload Document" in the left sidebar
   - Select a PDF, DOCX, TXT, or Markdown file
   - Watch the pipeline process your document

2. **Configure the Pipeline**
   - Adjust chunk size and overlap
   - Select embedding model
   - Choose retrieval method (dense, hybrid)
   - Enable/disable reranking

3. **Ask Questions**
   - Enter your question in the query input
   - See the complete retrieval and generation process
   - Explore retrieved chunks and source attribution

4. **Learn and Explore**
   - Click any pipeline node to see details
   - Enable Teaching Mode for step-by-step execution
   - Try the Failure Modes Lab to see common problems
   - Compare configurations in the Evaluation Dashboard

### Teaching Mode

Enable "Teaching Mode" to:
- Execute the pipeline one stage at a time
- See input/output data at each stage
- Read simple explanations of what's happening
- Understand why each step is necessary
- Learn about potential failure modes

### Failure Modes Lab

Explore common RAG problems:
- Poor chunking strategies
- Irrelevant retrieval results
- Missing context windows
- Hallucinated answers
- Source attribution failures

Each failure mode includes:
- What went wrong
- Why it happened
- How to detect it
- How to fix it
- Before/after comparisons

## 🔧 Configuration

### LLM Provider Options

**Local (Default):**
```env
LLM_PROVIDER=local
LLM_MODEL_NAME=gpt2
```

**OpenAI:**
```env
LLM_PROVIDER=openai
LLM_MODEL_NAME=gpt-3.5-turbo
OPENAI_API_KEY=your-key-here
```

**Anthropic:**
```env
LLM_PROVIDER=anthropic
LLM_MODEL_NAME=claude-3-haiku-20240307
ANTHROPIC_API_KEY=your-key-here
```

### Embedding Models

Available models (automatically downloaded):
- `all-MiniLM-L6-v2` (default, 384 dimensions, fast)
- `all-mpnet-base-v2` (768 dimensions, more accurate)
- `multi-qa-MiniLM-L6-cos-v1` (384 dimensions, optimized for QA)

### Reranker Models

- `cross-encoder/ms-marco-MiniLM-L-6-v2` (default)
- `cross-encoder/ms-marco-MiniLM-L-12-v2` (more accurate, slower)

## 📁 Project Structure

```
explainable-rag-lab/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── core/
│   │   ├── document_parser.py  # PDF, DOCX, TXT parsing
│   │   ├── chunker.py          # Text chunking strategies
│   │   ├── embedder.py         # Sentence Transformers wrapper
│   │   ├── vector_store.py     # FAISS indexing
│   │   ├── retriever.py        # Hybrid retrieval (dense + BM25)
│   │   ├── reranker.py         # Cross-encoder reranking
│   │   └── llm_provider.py     # LLM integration
│   ├── models/
│   │   └── schemas.py          # Pydantic models
│   └── utils/
│       └── helpers.py          # Utility functions
├── src/
│   ├── components/
│   │   ├── Pipeline/           # React Flow visualization
│   │   ├── Sidebar/            # Control panel
│   │   ├── Inspector/          # Explainability panel
│   │   ├── EventLog/           # Real-time events
│   │   ├── TeachingMode/       # Step-by-step mode
│   │   ├── FailureLab/         # Failure demonstrations
│   │   └── Evaluation/         # Metrics dashboard
│   ├── stores/
│   │   └── ragStore.ts         # Zustand state management
│   ├── services/
│   │   └── api.ts              # Backend API client
│   ├── types/
│   │   └── index.ts            # TypeScript interfaces
│   └── App.tsx                 # Main application
├── samples/
│   └── example-document.txt    # Sample document
├── setup.bat                   # Windows setup script
├── run.bat                     # Windows run script
├── requirements.txt            # Python dependencies
├── package.json                # Node.js dependencies
└── README.md                   # This file
```

## 🎓 Educational Use

This platform is designed for:
- University courses on NLP, IR, or AI
- Corporate training on RAG systems
- Self-study and experimentation
- Research and prototyping

### Seminar Presentation Tips

1. Start with a sample document already loaded
2. Enable Teaching Mode for first-time audiences
3. Use the Failure Modes Lab to demonstrate challenges
4. Show the Architecture Comparison for context
5. Let students experiment with different configurations
6. Use the Evaluation Dashboard to compare approaches

## 🔬 Advanced Features

### Hybrid Retrieval
Combines dense (embedding-based) and sparse (keyword-based) retrieval:
- Dense: Captures semantic similarity
- Sparse (BM25): Captures exact term matches
- Fusion: Reciprocal Rank Fusion for combining results

### Reranking
Cross-encoder models rerank retrieved candidates:
- More accurate than bi-encoder similarity
- Considers query-document pairs jointly
- Optional for performance reasons

### Evaluation Metrics
- **Precision@k**: Relevance of top-k results
- **Mean Reciprocal Rank**: Position of first relevant result
- **Latency**: Processing time per stage
- **Token Usage**: Count tokens for cost estimation

## 🐛 Troubleshooting

### Models Won't Download
```cmd
# Manually download models
python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"
```

### Port Already in Use
Edit `.env` to change ports:
```env
BACKEND_PORT=8001
```

Then update `vite.config.ts` proxy target.

### Out of Memory
Use smaller models:
```env
EMBEDDING_MODEL=all-MiniLM-L6-v2
LLM_PROVIDER=local
LLM_MODEL_NAME=gpt2
```

### CORS Errors
Ensure frontend URL is in `.env`:
```env
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

## 📝 License

MIT License - Free for educational and commercial use

## 🤝 Contributing

Contributions welcome! Areas for improvement:
- Additional embedding models
- Graph RAG implementation
- Agentic RAG workflows
- Multimodal document support
- Additional evaluation metrics

## 📚 Resources

- [RAG Survey Paper](https://arxiv.org/abs/2312.10997)
- [Sentence Transformers Docs](https://www.sbert.net/)
- [FAISS Documentation](https://github.com/facebookresearch/faiss)
- [LangChain RAG Guide](https://python.langchain.com/docs/use_cases/question_answering/)

## 🎯 Roadmap

- [x] Basic RAG pipeline
- [x] Interactive visualization
- [x] Teaching mode
- [x] Failure modes lab
- [x] Evaluation dashboard
- [ ] Graph RAG architecture
- [ ] Agentic RAG workflows
- [ ] Multimodal support (images, tables)
- [ ] Query expansion strategies
- [ ] Fine-tuning integration

---

**Built with ❤️ for education and understanding**

For questions, issues, or suggestions, please open an issue on GitHub.
