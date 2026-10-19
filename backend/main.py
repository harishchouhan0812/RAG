"""
Explainable RAG Lab - FastAPI Backend
Main application entry point with complete RAG pipeline
"""

import os
import sys
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import uvicorn
from dotenv import load_dotenv

# Add backend directory to path
sys.path.append(str(Path(__file__).parent))

from models.schemas import (
    DocumentResponse,
    ChunkingConfig,
    QueryRequest,
    QueryResponse,
    PipelineStatus,
    RetrievalConfig,
    EvaluationRequest,
    EvaluationResponse,
)
from core.document_parser import DocumentParser
from core.chunker import DocumentChunker
from core.embedder import EmbeddingGenerator
from core.vector_store import VectorStore
from core.retriever import HybridRetriever
from core.reranker import Reranker
from core.llm_provider import LLMProvider
from utils.helpers import EventLogger, calculate_metrics

# Load environment variables
load_dotenv()

# Global state
app_state = {
    "documents": {},
    "chunks": {},
    "embeddings": {},
    "vector_store": None,
    "retriever": None,
    "reranker": None,
    "llm_provider": None,
    "event_logger": EventLogger(),
    "embedding_generator": None,
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup resources"""
    # Startup
    print("🚀 Initializing RAG Pipeline Components...")
    
    # Initialize embedding generator
    embedding_model = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
    app_state["embedding_generator"] = EmbeddingGenerator(embedding_model)
    print(f"✅ Loaded embedding model: {embedding_model}")
    
    # Initialize vector store
    vector_dim = app_state["embedding_generator"].dimension
    app_state["vector_store"] = VectorStore(dimension=vector_dim)
    print(f"✅ Initialized vector store (dim={vector_dim})")
    
    # Initialize retriever
    app_state["retriever"] = HybridRetriever(
        vector_store=app_state["vector_store"],
        embedding_generator=app_state["embedding_generator"]
    )
    print("✅ Initialized hybrid retriever")
    
    # Initialize reranker (optional)
    reranker_model = os.getenv("RERANKER_MODEL", "cross-encoder/ms-marco-MiniLM-L-6-v2")
    try:
        app_state["reranker"] = Reranker(reranker_model)
        print(f"✅ Loaded reranker model: {reranker_model}")
    except Exception as e:
        print(f"⚠️  Reranker not available: {e}")
        app_state["reranker"] = None
    
    # Initialize LLM provider
    llm_provider = os.getenv("LLM_PROVIDER", "local")
    app_state["llm_provider"] = LLMProvider(provider=llm_provider)
    print(f"✅ Initialized LLM provider: {llm_provider}")
    
    print("🎉 RAG Pipeline Ready!\n")
    
    yield
    
    # Cleanup
    print("\n🛑 Shutting down RAG Pipeline...")
    app_state.clear()


# Initialize FastAPI app
app = FastAPI(
    title="Explainable RAG Lab API",
    description="Backend API for interactive RAG pipeline visualization and teaching",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "message": "Explainable RAG Lab API",
        "version": "1.0.0",
        "pipeline_ready": app_state["vector_store"] is not None,
    }


@app.get("/api")
async def api_root():
    """API health check endpoint"""
    return {
        "status": "online",
        "message": "Explainable RAG Lab API",
        "version": "1.0.0",
        "pipeline_ready": app_state["vector_store"] is not None,
    }


@app.get("/api/pipeline/status")
async def get_pipeline_status():
    """Get current pipeline status"""
    return PipelineStatus(
        documents_count=len(app_state["documents"]),
        chunks_count=len(app_state["chunks"]),
        indexed_count=app_state["vector_store"].count() if app_state["vector_store"] else 0,
        embedding_model=os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2"),
        llm_provider=os.getenv("LLM_PROVIDER", "local"),
        reranker_available=app_state["reranker"] is not None,
    )


@app.post("/api/documents/upload", response_model=DocumentResponse)
async def upload_document(file: UploadFile = File(...)):
    """Upload and parse a document"""
    logger = app_state["event_logger"]
    logger.log("document_upload_started", {"filename": file.filename})
    
    try:
        # Validate file type
        allowed_extensions = os.getenv("ALLOWED_EXTENSIONS", "pdf,docx,txt,md").split(",")
        file_ext = file.filename.split(".")[-1].lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"File type .{file_ext} not allowed. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Read file content
        content = await file.read()
        max_size_mb = int(os.getenv("MAX_UPLOAD_SIZE_MB", "50"))
        if len(content) > max_size_mb * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail=f"File too large. Maximum size: {max_size_mb}MB"
            )
        
        logger.log("file_validation_passed", {"size_mb": len(content) / (1024 * 1024)})
        
        # Parse document
        parser = DocumentParser()
        doc_data = parser.parse(content, file.filename)
        
        # Store document
        doc_id = doc_data["id"]
        app_state["documents"][doc_id] = doc_data
        
        logger.log("document_parsed", {
            "doc_id": doc_id,
            "pages": doc_data.get("pages", 1),
            "char_count": len(doc_data["text"]),
            "word_count": len(doc_data["text"].split()),
        })
        
        return DocumentResponse(
            id=doc_id,
            filename=doc_data["filename"],
            file_type=doc_data["file_type"],
            text=doc_data["text"],
            metadata=doc_data["metadata"],
            char_count=len(doc_data["text"]),
            word_count=len(doc_data["text"].split()),
            status="parsed",
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.log("document_upload_failed", {"error": str(e)})
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")


@app.post("/api/documents/{doc_id}/chunk")
async def chunk_document(doc_id: str, config: ChunkingConfig):
    """Chunk a document with configurable parameters"""
    logger = app_state["event_logger"]
    
    if doc_id not in app_state["documents"]:
        raise HTTPException(status_code=404, detail="Document not found")
    
    try:
        logger.log("chunking_started", {"doc_id": doc_id, "config": config.dict()})
        
        doc_data = app_state["documents"][doc_id]
        chunker = DocumentChunker()
        
        chunks = chunker.chunk(
            text=doc_data["text"],
            chunk_size=config.chunk_size,
            overlap=config.overlap,
            strategy=config.strategy,
        )
        
        # Store chunks with metadata
        chunk_objects = []
        for i, chunk_text in enumerate(chunks):
            chunk_id = f"{doc_id}_chunk_{i}"
            chunk_obj = {
                "id": chunk_id,
                "doc_id": doc_id,
                "text": chunk_text,
                "index": i,
                "char_count": len(chunk_text),
                "word_count": len(chunk_text.split()),
                "metadata": {
                    "document": doc_data["filename"],
                    "chunk_index": i,
                    "total_chunks": len(chunks),
                }
            }
            app_state["chunks"][chunk_id] = chunk_obj
            chunk_objects.append(chunk_obj)
        
        logger.log("chunking_completed", {
            "doc_id": doc_id,
            "chunk_count": len(chunks),
            "avg_chunk_size": sum(len(c) for c in chunks) // len(chunks) if chunks else 0,
        })
        
        return {
            "doc_id": doc_id,
            "chunks": chunk_objects,
            "chunk_count": len(chunks),
            "config": config.dict(),
        }
        
    except Exception as e:
        logger.log("chunking_failed", {"error": str(e)})
        raise HTTPException(status_code=500, detail=f"Failed to chunk document: {str(e)}")


@app.post("/api/embeddings/generate")
async def generate_embeddings(doc_id: str):
    """Generate embeddings for all chunks of a document"""
    logger = app_state["event_logger"]
    
    # Get chunks for this document
    doc_chunks = [c for c in app_state["chunks"].values() if c["doc_id"] == doc_id]
    
    if not doc_chunks:
        raise HTTPException(status_code=404, detail="No chunks found for document")
    
    try:
        logger.log("embedding_started", {"doc_id": doc_id, "chunk_count": len(doc_chunks)})
        
        embedder = app_state["embedding_generator"]
        
        # Generate embeddings
        texts = [chunk["text"] for chunk in doc_chunks]
        embeddings = embedder.embed_batch(texts)
        
        # Store embeddings
        embedding_objects = []
        for chunk, embedding in zip(doc_chunks, embeddings):
            embedding_obj = {
                "chunk_id": chunk["id"],
                "embedding": embedding.tolist(),
                "dimension": len(embedding),
                "model": embedder.model_name,
            }
            app_state["embeddings"][chunk["id"]] = embedding_obj
            embedding_objects.append({
                "chunk_id": chunk["id"],
                "dimension": len(embedding),
                "preview": embedding[:5].tolist(),  # First 5 values
            })
        
        logger.log("embedding_completed", {
            "doc_id": doc_id,
            "embedding_count": len(embeddings),
            "dimension": embedder.dimension,
        })
        
        return {
            "doc_id": doc_id,
            "embeddings": embedding_objects,
            "model": embedder.model_name,
            "dimension": embedder.dimension,
        }
        
    except Exception as e:
        logger.log("embedding_failed", {"error": str(e)})
        raise HTTPException(status_code=500, detail=f"Failed to generate embeddings: {str(e)}")


@app.post("/api/index/build")
async def build_index(doc_id: str):
    """Build vector index from embeddings"""
    logger = app_state["event_logger"]
    
    # Get embeddings for this document
    doc_embeddings = [
        (chunk_id, app_state["embeddings"][chunk_id]["embedding"])
        for chunk_id in app_state["embeddings"]
        if chunk_id.startswith(doc_id)
    ]
    
    if not doc_embeddings:
        raise HTTPException(status_code=404, detail="No embeddings found for document")
    
    try:
        logger.log("indexing_started", {"doc_id": doc_id, "vector_count": len(doc_embeddings)})
        
        vector_store = app_state["vector_store"]
        
        # Add to index
        for chunk_id, embedding in doc_embeddings:
            chunk_metadata = app_state["chunks"][chunk_id]
            vector_store.add(
                chunk_id=chunk_id,
                embedding=embedding,
                text=chunk_metadata["text"],
                metadata=chunk_metadata["metadata"],
            )
        
        logger.log("indexing_completed", {
            "doc_id": doc_id,
            "indexed_count": len(doc_embeddings),
            "total_index_size": vector_store.count(),
        })
        
        return {
            "doc_id": doc_id,
            "indexed_count": len(doc_embeddings),
            "total_index_size": vector_store.count(),
            "dimension": vector_store.dimension,
        }
        
    except Exception as e:
        logger.log("indexing_failed", {"error": str(e)})
        raise HTTPException(status_code=500, detail=f"Failed to build index: {str(e)}")


@app.post("/api/query", response_model=QueryResponse)
async def query_pipeline(request: QueryRequest):
    """Execute complete RAG query pipeline"""
    logger = app_state["event_logger"]
    
    try:
        import time
        start_time = time.time()
        
        logger.log("query_started", {"query": request.query})
        
        # Step 1: Embed query
        embedder = app_state["embedding_generator"]
        query_embedding = embedder.embed(request.query)
        
        logger.log("query_embedded", {
            "dimension": len(query_embedding),
            "preview": query_embedding[:5].tolist(),
        })
        
        # Step 2: Retrieve candidates
        retriever = app_state["retriever"]
        retrieval_results = retriever.retrieve(
            query=request.query,
            query_embedding=query_embedding,
            top_k=request.top_k,
            retrieval_method=request.retrieval_method,
            alpha=request.alpha if request.retrieval_method == "hybrid" else None,
        )
        
        logger.log("retrieval_completed", {
            "retrieved_count": len(retrieval_results),
            "method": request.retrieval_method,
        })
        
        # Step 3: Rerank (optional)
        if request.use_reranking and app_state["reranker"]:
            reranker = app_state["reranker"]
            retrieval_results = reranker.rerank(request.query, retrieval_results)
            logger.log("reranking_completed", {"reranked_count": len(retrieval_results)})
        
        # Step 4: Build context
        context_chunks = retrieval_results[:request.context_limit]
        context_text = "\n\n".join([
            f"[Source {i+1}] {chunk['text']}"
            for i, chunk in enumerate(context_chunks)
        ])
        
        # Step 5: Generate answer
        llm_provider = app_state["llm_provider"]
        answer = llm_provider.generate(
            query=request.query,
            context=context_text,
            system_prompt=request.system_prompt,
        )
        
        end_time = time.time()
        total_time = end_time - start_time
        
        logger.log("query_completed", {
            "total_time": total_time,
            "answer_length": len(answer),
        })
        
        return QueryResponse(
            query=request.query,
            answer=answer,
            retrieved_chunks=retrieval_results,
            context_used=context_chunks,
            query_embedding_preview=query_embedding[:5].tolist(),
            metrics={
                "total_time": total_time,
                "retrieved_count": len(retrieval_results),
                "context_chunks": len(context_chunks),
                "retrieval_method": request.retrieval_method,
                "reranking_used": request.use_reranking,
            }
        )
        
    except Exception as e:
        logger.log("query_failed", {"error": str(e)})
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")


@app.get("/api/chunks")
async def get_all_chunks():
    """Get all stored chunks"""
    return {"chunks": list(app_state["chunks"].values())}


@app.get("/api/chunks/{chunk_id}")
async def get_chunk(chunk_id: str):
    """Get specific chunk details"""
    if chunk_id not in app_state["chunks"]:
        raise HTTPException(status_code=404, detail="Chunk not found")
    
    chunk = app_state["chunks"][chunk_id]
    embedding = app_state["embeddings"].get(chunk_id)
    
    return {
        "chunk": chunk,
        "embedding": {
            "dimension": embedding["dimension"],
            "preview": embedding["embedding"][:10],
            "model": embedding["model"],
        } if embedding else None,
    }


@app.get("/api/events")
async def get_events():
    """Get event log"""
    logger = app_state["event_logger"]
    return {"events": logger.get_events()}


@app.post("/api/events/clear")
async def clear_events():
    """Clear event log"""
    logger = app_state["event_logger"]
    logger.clear()
    return {"status": "cleared"}


@app.post("/api/reset")
async def reset_pipeline():
    """Reset entire pipeline"""
    logger = app_state["event_logger"]
    
    app_state["documents"].clear()
    app_state["chunks"].clear()
    app_state["embeddings"].clear()
    
    # Reset vector store
    if app_state["vector_store"]:
        vector_dim = app_state["embedding_generator"].dimension
        app_state["vector_store"] = VectorStore(dimension=vector_dim)
    
    # Reset retriever with new vector store
    if app_state["retriever"]:
        app_state["retriever"] = HybridRetriever(
            vector_store=app_state["vector_store"],
            embedding_generator=app_state["embedding_generator"]
        )
    
    logger.clear()
    logger.log("pipeline_reset", {})
    
    return {"status": "reset", "message": "Pipeline reset successfully"}


@app.post("/api/evaluate", response_model=EvaluationResponse)
async def evaluate_retrieval(request: EvaluationRequest):
    """Evaluate retrieval quality with metrics"""
    try:
        metrics = calculate_metrics(
            retrieved_chunks=request.retrieved_chunks,
            relevant_chunks=request.relevant_chunks,
            k_values=request.k_values,
        )
        
        return EvaluationResponse(
            precision_at_k=metrics["precision_at_k"],
            recall_at_k=metrics["recall_at_k"],
            mrr=metrics["mrr"],
            average_score=metrics["average_score"],
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")


if __name__ == "__main__":
    host = os.getenv("BACKEND_HOST", "127.0.0.1")
    port = int(os.getenv("BACKEND_PORT", "8000"))
    
    print(f"""
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║          🎓 Explainable RAG Lab - Backend API           ║
║                                                          ║
║  Server:     http://localhost:{port}                      ║
║  API Docs:   http://localhost:{port}/docs                 ║
║  Health:     http://localhost:{port}/                     ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
    """)
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info",
    )
