from typing import List
import io
import pypdf
import docx
import openpyxl
from pptx import Presentation
from loguru import logger
from app.core.clients import genai_client
import pandas as pd

def parse_pdf(file_bytes: bytes) -> str:
    """Extract complete text from a PDF stream."""
    try:
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            content = page.extract_text()
            if content:
                text += content + "\n"
        return text
    except Exception as e:
        logger.error(f"PDF Parsing Error: {e}")
        return ""

def parse_docx(file_bytes: bytes) -> str:
    """Extract complete text from a Word stream."""
    try:
        doc = docx.Document(io.BytesIO(file_bytes))
        return "\n".join([p.text for p in doc.paragraphs])
    except Exception as e:
        logger.error(f"DOCX Parsing Error: {e}")
        return ""

def parse_pptx(file_bytes: bytes) -> str:
    """Extract text from all slides and notes in a PowerPoint."""
    try:
        prs = Presentation(io.BytesIO(file_bytes))
        text_runs = []
        for i, slide in enumerate(prs.slides):
            text_runs.append(f"--- Slide {i+1} ---")
            for shape in slide.shapes:
                if hasattr(shape, "text"):
                    text_runs.append(shape.text)
        return "\n".join(text_runs)
    except Exception as e:
        logger.error(f"PPTX Parsing Error: {e}")
        return ""

def parse_xlsx(file_bytes: bytes) -> str:
    """Flatten an Excel workbook into text chunks."""
    try:
        # Load all sheets
        dfs = pd.read_excel(io.BytesIO(file_bytes), sheet_name=None)
        text_parts = []
        for sheet_name, df in dfs.items():
            text_parts.append(f"--- Sheet: {sheet_name} ---")
            # Convert to a readable string (markdown table style)
            text_parts.append(df.to_string(index=False))
        return "\n\n".join(text_parts)
    except Exception as e:
        logger.error(f"Excel Parsing Error: {e}")
        return ""

def chunk_text(text: str, chunk_size: int = 1500, overlap: int = 200) -> List[str]:
    """Semantic chunking to maintain context."""
    if not text: return []
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        if end < len(text):
            # Try to break at a newline for better semantics
            last_newline = text.rfind('\n', start + chunk_size // 2, end)
            if last_newline != -1: end = last_newline + 1
        chunks.append(text[start:end].strip())
        start = end - overlap
        if start >= len(text) - overlap: break
    return chunks

async def process_and_embed_asset(db, asset_id: int, file_bytes: bytes, file_type: str):
    """
    Multimodal RAG Processor: Analyzes formats including visuals, slides, and data.
    """
    from app.models.rag import WorkspaceAsset, AssetEmbedding
    
    asset = db.query(WorkspaceAsset).get(asset_id)
    if not asset: return

    try:
        text = ""
        file_ext = file_type.lower()

        # 1. Branching based on Multimodal capability
        if file_ext in ['jpg', 'png', 'jpeg', 'webp']:
            logger.info(f"Asset {asset_id}: Triggering Vision Analysis for {file_ext}")
            mime = f"image/{'jpeg' if file_ext in ['jpg', 'jpeg'] else file_ext}"
            text = await genai_client.describe_image(file_bytes, mime)
        
        elif file_ext == 'pdf':
            text = parse_pdf(file_bytes)
        elif file_ext == 'docx':
            text = parse_docx(file_bytes)
        elif file_ext == 'pptx':
            text = parse_pptx(file_bytes)
        elif file_ext in ['xlsx', 'xls']:
            text = parse_xlsx(file_bytes)
        elif file_ext in ['csv']:
            df = pd.read_csv(io.BytesIO(file_bytes))
            text = df.to_string(index=False)
        elif file_ext in ['txt', 'md', 'markdown']:
            text = file_bytes.decode('utf-8', errors='ignore')

        if not text:
            raise ValueError(f"Extracted zero content for {file_ext}")

        # 2. Chunking
        chunks = chunk_text(text)
        logger.info(f"Asset {asset_id}: {len(chunks)} chunks created via {file_ext} parser.")

        # 3. Vectorization
        for i, chunk in enumerate(chunks):
            # Gemini Embedding for each chunk
            embedding_vec = await genai_client.generate_embeddings(chunk)
            
            db.add(AssetEmbedding(
                asset_id=asset.id,
                chunk_content=chunk,
                embedding=embedding_vec,
                metadata_json={"chunk_index": i, "parser": file_ext}
            ))
        
        asset.status = "ready"
        db.commit()
        logger.success(f"Asset {asset_id} Knowledge Indexed Successfully.")
        
    except Exception as err:
        logger.error(f"Multimodal Failure for {asset_id}: {err}")
        db.rollback() # Reset session state before marking error
        asset = db.query(WorkspaceAsset).get(asset_id)
        if asset:
            asset.status = "error"
            db.commit()

async def retrieve_context(db, org_id: int, query: str, limit: int = 5) -> List[str]:
    """
    Semantic Retrieval: Finds the most relevant knowledge chunks for a given query.
    """
    from app.models.rag import WorkspaceAsset, AssetEmbedding
    from sqlalchemy import and_
    
    try:
        # 1. Generate Query Vector
        query_vec = await genai_client.generate_embeddings(query)
        
        # 2. Query only assets belonging to this organization
        chunks = db.query(AssetEmbedding).join(WorkspaceAsset).filter(
            and_(
                WorkspaceAsset.org_id == org_id,
                WorkspaceAsset.status == 'ready'
            )
        ).order_by(AssetEmbedding.embedding.l2_distance(query_vec)).limit(limit).all()
        
        return [c.chunk_content for c in chunks]
    except Exception as e:
        logger.error(f"Semantic Retrieval Failed for Org {org_id}: {e}")
        return []
