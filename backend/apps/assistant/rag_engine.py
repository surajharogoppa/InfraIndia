import os
import re
import csv
import math
import hashlib
import logging
from typing import List, Dict, Any, Optional
from pathlib import Path

from django.conf import settings

# ── Graceful dependency imports ───────────────────────────────────────────────
try:
    from sklearn.feature_extraction.text import HashingVectorizer
    HAS_SKLEARN = True
except ImportError:
    HAS_SKLEARN = False

try:
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    HAS_LANGCHAIN = True
except ImportError:
    HAS_LANGCHAIN = False

try:
    import chromadb
    from chromadb.api.types import Documents, EmbeddingFunction, Embeddings
    HAS_CHROMADB = True
except ImportError:
    HAS_CHROMADB = False
    Documents = List[str]
    Embeddings = List[List[float]]
    class EmbeddingFunction:
        pass

try:
    from groq import Groq
    HAS_GROQ = True
except ImportError:
    HAS_GROQ = False

logger = logging.getLogger(__name__)

CHROMA_DATA_DIR = getattr(settings, "CHROMA_DATA_DIR", settings.BASE_DIR / "data" / "chroma_db")
COLLECTION_NAME = "infras_knowledge_v1"
STRICT_FALLBACK_ANSWER = (
    "I do not have sufficient information in the ingested InfraIndia documents and records to answer this question. "
    "Please ask a question related to tracked central sector infrastructure projects, MoSPI flash reports, or platform datasets."
)


class FastHashingEmbeddingFunction(EmbeddingFunction):
    """
    Ultra-reliable, high-performance L2-normalized hashing vectorizer for ChromaDB.
    Uses sklearn HashingVectorizer when installed, with a zero-dependency pure-Python
    fallback to ensure seamless operation across all container environments.
    """
    def __init__(self, n_features: int = 512):
        self.n_features = n_features
        if HAS_SKLEARN:
            self.vectorizer = HashingVectorizer(
                n_features=n_features,
                ngram_range=(1, 2),
                norm="l2",
                alternate_sign=False,
                token_pattern=r"(?u)\b\w+\b",
            )
        else:
            self.vectorizer = None

    def __call__(self, input: Documents) -> Embeddings:
        if not input:
            return []
        if self.vectorizer is not None:
            matrix = self.vectorizer.transform(input).toarray()
            return matrix.tolist()

        # Pure-Python fallback hashing
        embeddings = []
        for text in input:
            vec = [0.0] * self.n_features
            tokens = re.findall(r"(?u)\b\w+\b", text.lower())
            for t in tokens:
                idx = int(hashlib.md5(t.encode("utf-8")).hexdigest(), 16) % self.n_features
                vec[idx] += 1.0
            norm = math.sqrt(sum(v * v for v in vec))
            if norm > 0:
                vec = [v / norm for v in vec]
            embeddings.append(vec)
        return embeddings


_chroma_client = None
_embedding_fn = None


def get_chroma_client():
    global _chroma_client
    if not HAS_CHROMADB:
        logger.warning("chromadb package is not installed.")
        return None
    if _chroma_client is None:
        os.makedirs(CHROMA_DATA_DIR, exist_ok=True)
        _chroma_client = chromadb.PersistentClient(path=str(CHROMA_DATA_DIR))
    return _chroma_client


def get_embedding_function():
    global _embedding_fn
    if _embedding_fn is None:
        _embedding_fn = FastHashingEmbeddingFunction()
    return _embedding_fn


def get_collection():
    client = get_chroma_client()
    if client is None:
        return None
    ef = get_embedding_function()
    return client.get_or_create_collection(name=COLLECTION_NAME, embedding_function=ef)


def get_groq_client():
    if not HAS_GROQ:
        logger.warning("groq package is not installed.")
        return None
    api_key = getattr(settings, "GROQ_API_KEY", None) or os.getenv("GROQ_API_KEY")
    if not api_key:
        try:
            from pathlib import Path
            from dotenv import load_dotenv
            env_path = Path(settings.BASE_DIR) / ".env"
            if env_path.exists():
                load_dotenv(env_path)
                api_key = os.getenv("GROQ_API_KEY")
        except Exception:
            pass
    if not api_key:
        logger.warning("GROQ_API_KEY is not set.")
        return None
    return Groq(api_key=api_key)


def get_groq_model() -> str:
    # Default to high-parameter reasoning model or fast instruction model
    return os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")


def format_crore(paise: Optional[int]) -> str:
    if paise is None:
        return "N/A"
    return f"₹{paise / 10_000_000:,.2f} Cr"


class InfraRAGEngine:
    def __init__(self):
        self.collection = get_collection()
        if HAS_LANGCHAIN:
            self.splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=150,
                separators=["\n\n", "\n", ". ", " ", ""]
            )
        else:
            class SimpleSplitter:
                def split_text(self, text):
                    chunk_sz = 1000
                    overlap = 150
                    step = chunk_sz - overlap
                    return [text[i:i + chunk_sz] for i in range(0, len(text), step)]
            self.splitter = SimpleSplitter()

        # If ChromaDB collection is empty, trigger one-time auto indexing
        if self.collection is not None:
            try:
                if self.collection.count() == 0:
                    logger.info("ChromaDB is empty on startup. Triggering auto-index...")
                    self.index_all(limit_pdf_pages=30)
            except Exception as e:
                logger.warning(f"Could not check/auto-index ChromaDB: {e}")

    def parse_pdf_document(self, file_path: str, doc_title: str, doc_id: int, limit_pages: Optional[int] = None) -> List[Dict[str, Any]]:
        """Extract text page by page from PDF using pdfplumber."""
        chunks_data = []
        if not os.path.exists(file_path):
            return chunks_data

        try:
            import pdfplumber
            with pdfplumber.open(file_path) as pdf:
                total_pages = len(pdf.pages)
                pages_to_read = min(total_pages, limit_pages) if limit_pages else total_pages
                
                for page_idx in range(pages_to_read):
                    page = pdf.pages[page_idx]
                    page_text = page.extract_text() or ""
                    if not page_text.strip():
                        continue
                    
                    split_texts = self.splitter.split_text(page_text)
                    for chunk_idx, text_chunk in enumerate(split_texts):
                        chunks_data.append({
                            "id": f"doc_{doc_id}_p{page_idx + 1}_c{chunk_idx}",
                            "text": f"Document: {doc_title} (Page {page_idx + 1})\n\n{text_chunk}",
                            "metadata": {
                                "source_type": "document_pdf",
                                "doc_id": doc_id,
                                "doc_title": doc_title,
                                "page": page_idx + 1,
                                "chunk_idx": chunk_idx,
                            }
                        })
        except Exception as e:
            logger.error(f"Error parsing PDF {file_path}: {e}")

        return chunks_data

    def parse_csv_document(self, file_path: str, doc_title: str, doc_id: int) -> List[Dict[str, Any]]:
        """Extract rows from CSV and format into narrative chunks."""
        chunks_data = []
        if not os.path.exists(file_path):
            return chunks_data

        try:
            with open(file_path, "r", encoding="utf-8-sig", errors="replace") as f:
                reader = csv.DictReader(f)
                rows = list(reader)
                
                # Group rows in batches of 3-5 rows
                batch_size = 4
                for b_idx in range(0, len(rows), batch_size):
                    batch = rows[b_idx: b_idx + batch_size]
                    batch_texts = []
                    for r in batch:
                        items = [f"{k}: {v}" for k, v in r.items() if v]
                        batch_texts.append(" | ".join(items))
                    
                    combined = f"Dataset: {doc_title}\n" + "\n".join(batch_texts)
                    chunks_data.append({
                        "id": f"doc_{doc_id}_row_{b_idx}",
                        "text": combined,
                        "metadata": {
                            "source_type": "document_csv",
                            "doc_id": doc_id,
                            "doc_title": doc_title,
                            "page": 1,
                            "chunk_idx": b_idx,
                        }
                    })
        except Exception as e:
            logger.error(f"Error parsing CSV {file_path}: {e}")

        return chunks_data

    def parse_project_records(self, batch_size: int = 500) -> List[Dict[str, Any]]:
        """Index all database Project records as searchable factual knowledge chunks."""
        from apps.projects.models import Project
        
        chunks_data = []
        projects = Project.objects.select_related("state", "district", "sector", "ministry", "organization").all()
        
        for p in projects:
            sector_name = p.sector.name if p.sector else "General Infrastructure"
            state_name = p.state.name if p.state else "Multi-State / National"
            district_name = p.district.name if p.district else "N/A"
            org_name = p.organization.name if p.organization else "Central Agency"
            ministry_name = p.ministry.name if p.ministry else "Government of India"
            
            orig_cost_str = format_crore(p.original_cost)
            curr_cost_str = format_crore(p.current_cost)
            exp_str = format_crore(p.current_expenditure)
            
            # Delay in months
            delay_months = p.schedule_delay_months or 0
            cost_overrun = ""
            if p.cost_change_pct is not None:
                cost_overrun = f"Cost Overrun: {p.cost_change_pct:+.2f}%"
            
            summary = (
                f"Project Record #{p.id}: {p.name}\n"
                f"External Identifier: {p.external_project_id or 'N/A'}\n"
                f"Sector: {sector_name} | Ministry: {ministry_name} | Agency: {org_name}\n"
                f"Location: State of {state_name}, District: {district_name}\n"
                f"Financials: Original Cost: {orig_cost_str} | Current Revised Cost: {curr_cost_str} | Cumulative Expenditure: {exp_str}\n"
                f"{cost_overrun}\n"
                f"Timeline: Start Date: {p.current_start_date or p.original_start_date or 'N/A'} | "
                f"Original Completion: {p.original_completion_date or 'N/A'} | Current Anticipated Completion: {p.current_completion_date or 'N/A'}\n"
                f"Schedule Delay: {delay_months} months | Physical Progress: {p.current_progress or 0}% | Status: {p.platform_status} ({p.source_status or 'Reported'})\n"
                f"Contractor / Implementing Partner: {p.contractor_name or 'N/A'}"
            )
            
            chunks_data.append({
                "id": f"proj_rec_{p.id}",
                "text": summary,
                "metadata": {
                    "source_type": "project_record",
                    "project_id": p.id,
                    "doc_title": f"Project: {p.name}",
                    "sector": sector_name,
                    "state": state_name,
                    "page": 1,
                    "chunk_idx": 0,
                }
            })
            
        return chunks_data

    def index_all(self, limit_pdf_pages: Optional[int] = 30, force: bool = False) -> Dict[str, Any]:
        """Index all documents and database projects into ChromaDB."""
        from apps.documents.models import Document
        
        if force:
            try:
                get_chroma_client().delete_collection(COLLECTION_NAME)
                self.collection = get_collection()
            except Exception:
                pass

        total_chunks = 0
        docs_indexed = 0

        # 1. Ingest Documents
        docs = Document.objects.all()
        for doc in docs:
            if not doc.file:
                continue
            
            file_path = doc.file.path
            filename = doc.file.name.lower()
            chunks = []
            
            if filename.endswith(".pdf"):
                chunks = self.parse_pdf_document(file_path, doc.title, doc.id, limit_pages=limit_pdf_pages)
            elif filename.endswith(".csv"):
                chunks = self.parse_csv_document(file_path, doc.title, doc.id)
            
            if chunks:
                self._upsert_chunks(chunks)
                total_chunks += len(chunks)
                docs_indexed += 1

        # 2. Ingest Project Records from DB
        proj_chunks = self.parse_project_records()
        if proj_chunks:
            self._upsert_chunks(proj_chunks)
            total_chunks += len(proj_chunks)

        return {
            "status": "success",
            "total_chunks_indexed": total_chunks,
            "documents_indexed": docs_indexed,
            "projects_indexed": len(proj_chunks),
            "collection_count": self.collection.count(),
        }

    def _upsert_chunks(self, chunks: List[Dict[str, Any]], batch_size: int = 100):
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i: i + batch_size]
            ids = [c["id"] for c in batch]
            documents = [c["text"] for c in batch]
            metadatas = [c["metadata"] for c in batch]
            self.collection.upsert(ids=ids, documents=documents, metadatas=metadatas)

    def retrieve(self, query: str, top_k: int = 8) -> List[Dict[str, Any]]:
        """
        Production-grade Hybrid Retrieval:
        1. Query Intent & Named-Entity Extraction (States, Sectors, Delays, Costs, Specific Projects, Flash Reports)
        2. Direct database ground-truth matching
        3. ChromaDB Vector similarity search
        4. Unified ranking and chunk deduplication
        """
        query = (query or "").strip().strip("\"'").strip()
        if not query:
            return []

        retrieved_dict: Dict[str, Dict[str, Any]] = {}
        q_lower = query.lower()

        from apps.projects.models import Project
        from apps.documents.models import Document

        # ── 1. Intent Detection: Flash Reports & Official Documents ───────────
        from apps.documents.models import Document

        matched_docs = []
        is_doc_query = any(term in q_lower for term in [
            "flash report", "mospi", "paimana", "monthly report", "report",
            "findings", "overview", "document", "documents", "annexure", "dataset", "baseline"
        ])

        # Check for specific months or dates in query
        if any(m in q_lower for m in ["september", "sep", "09/2026", "2026-09", "sep 2026"]):
            matched_docs.extend(list(Document.objects.filter(title__icontains="September")))
        if any(m in q_lower for m in ["july", "jul", "07/2026", "2026-07", "jul 2026"]):
            matched_docs.extend(list(Document.objects.filter(title__icontains="July")))
        if any(m in q_lower for m in ["august", "aug", "08/2026", "2026-08"]):
            matched_docs.extend(list(Document.objects.filter(title__icontains="August")))
        if any(m in q_lower for m in ["june", "jun", "06/2026", "2026-06"]):
            matched_docs.extend(list(Document.objects.filter(title__icontains="June")))

        # If general document/flash report query without specific month, include latest flash reports
        if is_doc_query and not matched_docs:
            matched_docs = list(Document.objects.filter(document_type="FLASH_REPORT")[:2])

        if matched_docs and self.collection is not None:
            for doc in matched_docs:
                try:
                    # Fetch overview pages (pages 2, 3, 4, 5, 6) for high-level findings
                    overview_ids = [f"doc_{doc.id}_p{p}_c0" for p in [2, 3, 4, 5, 6]]
                    ov_res = self.collection.get(ids=overview_ids)
                    if ov_res and ov_res.get("documents"):
                        for cid, doc_text, meta in zip(ov_res["ids"], ov_res["documents"], ov_res["metadatas"]):
                            retrieved_dict[cid] = {
                                "id": cid,
                                "text": doc_text,
                                "metadata": meta,
                                "score": 3.5,
                                "method": "document_overview",
                            }

                    # Also vector query within this specific document
                    doc_query_res = self.collection.query(
                        query_texts=[query],
                        where={"doc_id": doc.id},
                        n_results=min(4, self.collection.count()),
                        include=["documents", "metadatas", "distances"]
                    )
                    if doc_query_res and doc_query_res.get("documents") and doc_query_res["documents"]:
                        for cid, doc_text, meta, dist in zip(
                            doc_query_res["ids"][0],
                            doc_query_res["documents"][0],
                            doc_query_res["metadatas"][0],
                            doc_query_res.get("distances", [[1.0]])[0]
                        ):
                            if cid not in retrieved_dict:
                                retrieved_dict[cid] = {
                                    "id": cid,
                                    "text": doc_text,
                                    "metadata": meta,
                                    "score": 2.8 + (1.0 / (1.0 + float(dist))),
                                    "method": "document_vector",
                                }
                except Exception as e:
                    logger.error(f"Error fetching chunks for document {doc.id}: {e}")

        # ── 2. Intent Detection: Aggregations & Project Filters ───────────────
        targeted_projects = []

        # (a) State detection
        state_match = None
        for state_name in [
            "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
            "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
            "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
            "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
            "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir"
        ]:
            if state_name.lower() in q_lower:
                state_match = state_name
                break

        # (b) Sector detection
        sector_match = None
        for s_key, s_target in [
            ("road", "Roads & Highways"), ("highway", "Roads & Highways"),
            ("rail", "Railways"), ("train", "Railways"),
            ("power", "Power"), ("energy", "Power"), ("solar", "Electricity Generation"),
            ("petroleum", "Petroleum & Natural Gas"), ("gas", "Petroleum & Natural Gas"), ("oil", "Petroleum & Natural Gas"),
            ("urban", "Urban Public Transport"), ("metro", "Urban Public Transport"),
            ("aviation", "Aviation & Aviation Infrastructure"), ("airport", "Aviation & Aviation Infrastructure"),
            ("shipping", "Shipping"), ("port", "Shipping"),
            ("telecom", "Telecommunications"), ("coal", "Coal"),
            ("water", "Water Resources"),
        ]:
            if s_key in q_lower:
                sector_match = s_target
                break

        # (c) High delay intent
        is_delay_query = any(w in q_lower for w in ["delayed", "most delayed", "delay", "time overrun", "overdue"])
        
        # (d) High cost intent
        is_cost_query = any(w in q_lower for w in ["highest cost", "most expensive", "largest", "biggest", "above 1000", "above 500", "costliest"])

        # Execute targeted DB query if structured intent found
        if state_match or sector_match or is_delay_query or is_cost_query:
            qs = Project.objects.all()
            if state_match:
                qs = qs.filter(state__name__icontains=state_match)
            if sector_match:
                qs = qs.filter(sector__name__icontains=sector_match)
            
            if is_delay_query:
                # Order by projects with completion dates having largest delay
                qs = qs.exclude(original_completion_date__isnull=True).exclude(current_completion_date__isnull=True).order_by("-current_cost")
            elif is_cost_query:
                qs = qs.order_by("-current_cost")
            else:
                qs = qs.order_by("-current_cost")

            targeted_projects = list(qs[:5])

        # (e) Entity Name Search (for specific named projects)
        attribute_words = {
            "tell", "about", "what", "which", "where", "show", "give", "list", "find",
            "with", "from", "that", "this", "have", "been", "project", "projects",
            "cost", "costs", "delay", "delays", "delayed", "progress", "schedule",
            "status", "budget", "expenditure", "overrun", "overruns", "report", "reports",
            "dataset", "datasets", "details", "information", "sector", "state", "sector",
            "across", "india", "more", "most", "than", "high", "highest", "large", "largest",
            "crore", "crores", "rs", "inr"
        }
        raw_words = [w for w in re.split(r"[^\w\-]+", query) if len(w) >= 3 and w.lower() not in attribute_words]

        # Try multi-word search phrases or single words
        if raw_words:
            # First try 2-word phrase
            found_named = False
            for i in range(len(raw_words) - 1):
                phrase = f"{raw_words[i]} {raw_words[i+1]}"
                matched = list(Project.objects.filter(name__icontains=phrase)[:3])
                if matched:
                    targeted_projects.extend(matched)
                    found_named = True
                    break
            
            if not found_named:
                for w in raw_words[:3]:
                    matched = list(Project.objects.filter(name__icontains=w)[:3])
                    targeted_projects.extend(matched)

        # Retrieve direct project chunks for targeted projects
        if targeted_projects:
            for p in targeted_projects:
                cid = f"proj_rec_{p.id}"
                if cid not in retrieved_dict:
                    doc_text = None
                    doc_meta = None
                    if self.collection is not None:
                        try:
                            fetched = self.collection.get(ids=[cid])
                            if fetched and fetched.get("documents"):
                                doc_text = fetched["documents"][0]
                                doc_meta = fetched["metadatas"][0]
                        except Exception as e:
                            logger.error(f"Error fetching chunk {cid}: {e}")

                    if not doc_text:
                        sector_name = p.sector.name if p.sector else "General Infrastructure"
                        state_name = p.state.name if p.state else "Multi-State / National"
                        doc_text = (
                            f"Project Record #{p.id}: {p.name}\n"
                            f"External Identifier: {p.external_project_id or 'N/A'}\n"
                            f"Sector: {sector_name} | Ministry: {p.ministry.name if p.ministry else 'N/A'} | State: {state_name}\n"
                            f"Original Cost: {format_crore(p.original_cost)} | Current Revised Cost: {format_crore(p.current_cost)} | "
                            f"Physical Progress: {p.current_progress or 0}% | Status: {p.platform_status}\n"
                            f"Delay: {p.schedule_delay_months or 0} months"
                        )
                        doc_meta = {
                            "source_type": "project_record",
                            "project_id": p.id,
                            "doc_title": f"Project: {p.name}",
                            "page": 1,
                        }

                    retrieved_dict[cid] = {
                        "id": cid,
                        "text": doc_text,
                        "metadata": doc_meta,
                        "score": 2.5,
                        "method": "targeted_entity",
                    }

        # ── 3. ChromaDB Vector Similarity Search ──────────────────────────────
        if self.collection is not None:
            try:
                count = self.collection.count()
                if count > 0:
                    actual_k = min(top_k * 2, count)
                    results = self.collection.query(
                        query_texts=[query],
                        n_results=actual_k,
                        include=["documents", "metadatas", "distances"]
                    )
                    if results and "documents" in results and results["documents"]:
                        docs = results["documents"][0]
                        metas = results["metadatas"][0]
                        distances = results.get("distances", [[1.0] * len(docs)])[0]
                        ids = results.get("ids", [[]])[0]

                        for chunk_id, doc_text, meta, dist in zip(ids, docs, metas, distances):
                            if chunk_id not in retrieved_dict:
                                retrieved_dict[chunk_id] = {
                                    "id": chunk_id,
                                    "text": doc_text,
                                    "metadata": meta,
                                    "score": 1.0 / (1.0 + float(dist)),
                                    "method": "vector",
                                }
            except Exception as e:
                logger.error(f"Error querying ChromaDB vector store: {e}")

        # Sort combined results by score descending and return top_k
        sorted_chunks = sorted(retrieved_dict.values(), key=lambda x: x["score"], reverse=True)
        return sorted_chunks[:top_k]

    def answer_query(self, query: str, conversation_history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """
        Execute grounded RAG workflow with Groq LLM:
        1. Retrieve relevant chunks from ChromaDB.
        2. Verify relevance. If insufficient, return strict fallback answer.
        3. Formulate strict grounding prompt and call Groq.
        4. Extract verified sources and project references.
        """
        query = (query or "").strip().strip("\"'").strip()
        groq_client = get_groq_client()
        if not groq_client:
            return {
                "answer": "Groq API key is not configured on the server. Please check backend settings.",
                "sources": [],
                "matched_projects": [],
                "grounded": False,
            }

        # 1. Retrieve context
        retrieved_chunks = self.retrieve(query, top_k=6)

        # Also search DB for any direct project name match to boost accuracy
        from apps.projects.models import Project
        from apps.projects.serializers import ProjectListSerializer

        matched_project_ids = set()
        for c in retrieved_chunks:
            p_id = c["metadata"].get("project_id")
            if p_id:
                matched_project_ids.add(p_id)

        # Keyword project fallback matching
        cleaned_words = [w for w in re.split(r"[^\w]+", query) if len(w) >= 4]
        for word in cleaned_words[:3]:
            qs = Project.objects.filter(name__icontains=word)[:3]
            for p in qs:
                matched_project_ids.add(p.id)

        # Context string assembly
        context_parts = []
        sources = []
        seen_sources = set()

        for idx, chunk in enumerate(retrieved_chunks):
            meta = chunk["metadata"]
            title = meta.get("doc_title", "InfraIndia Dataset")
            page = meta.get("page", 1)
            source_key = f"{title}_p{page}"
            
            if source_key not in seen_sources:
                seen_sources.add(source_key)
                sources.append({
                    "title": title,
                    "type": meta.get("source_type", "document"),
                    "page": page,
                    "snippet": chunk["text"][:200] + "...",
                })
            
            context_parts.append(f"--- SOURCE CHUNK [{idx + 1}] (Reference: {title}, Page/Section: {page}) ---\n{chunk['text']}")

        # 2. Strict grounding check: if no context found at all
        if not context_parts:
            return {
                "answer": STRICT_FALLBACK_ANSWER,
                "sources": [],
                "matched_projects": [],
                "grounded": False,
            }

        context_str = "\n\n".join(context_parts)

        # 3. Formulate Groq prompt with strict anti-hallucination rules
        system_prompt = (
            "You are the official InfraIndia AI Intelligence Assistant.\n"
            "You strictly assist users by answering questions about Indian central sector infrastructure projects, "
            "MoSPI monthly flash reports, and platform datasets.\n\n"
            "CRITICAL RULES (ABSOLUTE GROUNDING - NO HALLUCINATION):\n"
            "1. You MUST answer EXCLUSIVELY and SOLELY based on the provided Context below.\n"
            "2. If the user question CANNOT be answered truthfully, directly, and completely using the provided Context "
            "(for example: general world knowledge, celebrities, sports, recipes, coding help, or infrastructure facts not mentioned in the text), "
            f"you MUST reply ONLY with EXACTLY:\n\"{STRICT_FALLBACK_ANSWER}\"\n"
            "3. Do NOT assume, extrapolate, or invent any numbers, dates, project costs, delays, or implementing agencies.\n"
            "4. Cite sources clearly in brackets like [Source Title, Page X] or [Project: Name] when mentioning facts.\n"
            "5. Format output cleanly in Markdown with bold titles, bullet points, and tables where helpful."
        )

        user_content = f"Context:\n{context_str}\n\nUser Question: {query}"

        # Build messages payload
        messages = [{"role": "system", "content": system_prompt}]
        if conversation_history:
            # Append last 2 exchanges for context if relevant
            for item in conversation_history[-4:]:
                if item.get("role") in ["user", "assistant"]:
                    messages.append({"role": item["role"], "content": item["content"]})
        messages.append({"role": "user", "content": user_content})

        # 4. Call Groq
        model = get_groq_model()
        try:
            response = groq_client.chat.completions.create(
                model=model,
                messages=messages,
                temperature=0.1,  # Low temperature for factual precision
                max_tokens=1000,
            )
            raw_answer = response.choices[0].message.content or ""
            if not raw_answer.strip():
                # Fallback model attempt if primary returned empty reasoning
                fallback_model = "qwen/qwen3.8-27b"
                fallback_resp = groq_client.chat.completions.create(
                    model=fallback_model,
                    messages=messages,
                    temperature=0.1,
                    max_tokens=1000,
                )
                raw_answer = fallback_resp.choices[0].message.content or STRICT_FALLBACK_ANSWER
        except Exception as e:
            logger.error(f"Error calling Groq API: {e}")
            # Try secondary model on Groq
            try:
                fallback_resp = groq_client.chat.completions.create(
                    model="qwen/qwen3.8-27b",
                    messages=messages,
                    temperature=0.1,
                    max_tokens=1000,
                )
                raw_answer = fallback_resp.choices[0].message.content or STRICT_FALLBACK_ANSWER
            except Exception as e2:
                logger.error(f"Fallback Groq API failed: {e2}")
                raw_answer = f"Error communicating with AI reasoning service: {str(e2)}"

        # 5. Retrieve matched project records from database for frontend cards
        matched_projects_data = []
        ordered_pids = []
        for c in retrieved_chunks:
            pid = c["metadata"].get("project_id")
            if pid and pid not in ordered_pids:
                ordered_pids.append(pid)

        if ordered_pids:
            projects_dict = {
                p.id: p for p in Project.objects.filter(id__in=ordered_pids[:6]).select_related(
                    "state", "district", "sector", "ministry", "organization"
                )
            }
            ordered_projects = [projects_dict[pid] for pid in ordered_pids[:6] if pid in projects_dict]
            matched_projects_data = ProjectListSerializer(ordered_projects, many=True).data

        is_refusal = STRICT_FALLBACK_ANSWER in raw_answer

        return {
            "answer": raw_answer.strip(),
            "sources": [] if is_refusal else sources,
            "matched_projects": [] if is_refusal else matched_projects_data,
            "grounded": not is_refusal,
            "model": model,
        }
