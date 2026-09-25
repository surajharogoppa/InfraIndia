import mimetypes
import os
from django.http import FileResponse, Http404, HttpResponseRedirect
from django.views.decorators.clickjacking import xframe_options_exempt
from django.utils.decorators import method_decorator
from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action
from .models import Document
from .serializers import DocumentSerializer


class DocumentViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Document.objects.all().select_related("data_source", "project")
    serializer_class = DocumentSerializer
    permission_classes = [AllowAny]
    filterset_fields = ["document_type", "data_source", "project"]
    search_fields = ["title", "source_url"]

    @action(detail=True, methods=["get"], url_path="download")
    def download(self, request, pk=None):
        doc = self.get_object()
        if doc.file:
            try:
                filename = os.path.basename(doc.file.name)
                response = FileResponse(doc.file.open("rb"), as_attachment=True, filename=filename)
                return response
            except FileNotFoundError:
                pass
        if doc.source_url:
            return HttpResponseRedirect(doc.source_url)
        raise Http404("Document file not found")

    @method_decorator(xframe_options_exempt)
    @action(detail=True, methods=["get"], url_path="preview")
    def preview(self, request, pk=None):
        doc = self.get_object()
        if doc.file:
            try:
                filename = os.path.basename(doc.file.name)
                content_type, _ = mimetypes.guess_type(filename)
                fname_lower = filename.lower()
                if not content_type:
                    if fname_lower.endswith(".pdf"):
                        content_type = "application/pdf"
                    elif fname_lower.endswith(".xml"):
                        content_type = "application/xml; charset=utf-8"
                    elif fname_lower.endswith(".csv"):
                        content_type = "text/plain; charset=utf-8"
                    elif fname_lower.endswith(".json"):
                        content_type = "application/json"
                    else:
                        content_type = "text/plain; charset=utf-8"
                elif content_type == "text/csv":
                    content_type = "text/plain; charset=utf-8"

                response = FileResponse(
                    doc.file.open("rb"),
                    as_attachment=False,
                    content_type=content_type,
                    filename=filename,
                )
                response["Content-Disposition"] = f'inline; filename="{filename}"'
                response["Access-Control-Allow-Origin"] = "*"
                return response
            except FileNotFoundError:
                pass
        if doc.source_url:
            return HttpResponseRedirect(doc.source_url)
        raise Http404("Document file not found")
