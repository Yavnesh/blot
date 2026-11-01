import logging
from typing import List, Dict, Any, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

def rerank_documents(query: str, documents: List[Dict[str, Any]], top_n: int = 5) -> List[Dict[str, Any]]:
    """
    Reranks a list of candidate documents based on query relevance.
    Uses Cohere Rerank if COHERE_API_KEY is configured.
    Falls back gracefully to returning the original documents trimmed to top_n.
    """
    if not documents:
        return []

    if not getattr(settings, "COHERE_API_KEY", None):
        return documents[:top_n]

    try:
        import cohere
        co = cohere.ClientV2(api_key=settings.COHERE_API_KEY)
        
        # Format texts for Cohere
        doc_texts = [d.get("text", "") or d.get("content", "") for d in documents]
        
        response = co.rerank(
            model="rerank-v3.5",
            query=query,
            documents=doc_texts,
            top_n=min(top_n, len(documents))
        )
        
        reranked = []
        for result in response.results:
            idx = result.index
            item = documents[idx].copy()
            item["relevance_score"] = result.relevance_score
            reranked.append(item)
            
        logger.info(f"Successfully reranked {len(documents)} documents to top {len(reranked)} using Cohere.")
        return reranked

    except Exception as e:
        logger.warning(f"Cohere Rerank encountered an error, falling back to top_n: {e}")
        return documents[:top_n]
