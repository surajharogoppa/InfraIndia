from django.urls import path
from .views import AssistantChatView, AssistantStatusView, AssistantReindexView

urlpatterns = [
    path("chat/", AssistantChatView.as_view(), name="assistant-chat"),
    path("status/", AssistantStatusView.as_view(), name="assistant-status"),
    path("reindex/", AssistantReindexView.as_view(), name="assistant-reindex"),
]

