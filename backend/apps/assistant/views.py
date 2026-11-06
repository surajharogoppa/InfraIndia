import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from .rag_engine import InfraRAGEngine, get_collection, get_groq_model, STRICT_FALLBACK_ANSWER

logger = logging.getLogger(__name__)


class AssistantChatView(APIView):
    """
    POST /api/assistant/chat/
    Grounded RAG Assistant query endpoint powered by Groq LLM, LangChain chunking, and ChromaDB.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        query = request.data.get("query", "").strip()
        history = request.data.get("history", [])

        if not query:
            return Response(
                {"error": "Query string is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            engine = InfraRAGEngine()
            result = engine.answer_query(query, conversation_history=history)
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Error processing assistant query")
            return Response(
                {
                    "answer": f"An error occurred while analyzing the documents: {str(e)}",
                    "sources": [],
                    "matched_projects": [],
                    "grounded": False,
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AssistantStatusView(APIView):
    """
    GET /api/assistant/status/
    Returns vector store index metrics and LLM engine status.
    """
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        try:
            col = get_collection()
            count = col.count()
            return Response({
                "status": "ready" if count > 0 else "needs_indexing",
                "collection_count": count,
                "groq_model": get_groq_model(),
                "embedding_algorithm": "FastHashingVectorizer-L2-Normalized",
                "vector_store": "ChromaDB Persistent",
            })
        except Exception as e:
            return Response({"status": "error", "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AssistantReindexView(APIView):
    """
    POST /api/assistant/reindex/
    Trigger reindexing of all documents and projects into ChromaDB.
    """
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        force = bool(request.data.get("force", False))
        limit_pages = int(request.data.get("limit_pages", 40))

        try:
            engine = InfraRAGEngine()
            res = engine.index_all(limit_pdf_pages=limit_pages, force=force)
            return Response(res, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception("Error during reindexing")
            return Response({"status": "error", "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

