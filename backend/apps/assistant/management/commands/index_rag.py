from django.core.management.base import BaseCommand
from apps.assistant.rag_engine import InfraRAGEngine


class Command(BaseCommand):
    help = "Index official infrastructure documents, flash reports, and project records into ChromaDB vector store."

    def add_arguments(self, parser):
        parser.add_argument(
            "--force",
            action="store_true",
            help="Delete existing collection and recreate fresh vector index",
        )
        parser.add_argument(
            "--limit-pages",
            type=int,
            default=40,
            help="Maximum pages to parse per PDF document (default: 40)",
        )

    def handle(self, *args, **options):
        force = options["force"]
        limit_pages = options["limit_pages"]

        self.stdout.write(self.style.NOTICE(f"Starting RAG Indexing (force={force}, limit_pages={limit_pages})..."))
        engine = InfraRAGEngine()
        result = engine.index_all(limit_pdf_pages=limit_pages, force=force)

        self.stdout.write(self.style.SUCCESS(
            f"Successfully indexed knowledge base!\n"
            f"- Total chunks: {result['total_chunks_indexed']}\n"
            f"- Documents processed: {result['documents_indexed']}\n"
            f"- Project records processed: {result['projects_indexed']}\n"
            f"- Total items in ChromaDB: {result['collection_count']}"
        ))

