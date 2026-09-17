from rest_framework import serializers
from .models import IngestionRun, DataQualityIssue


class IngestionRunSerializer(serializers.ModelSerializer):
    source_name = serializers.CharField(source="source.name", read_only=True)

    class Meta:
        model = IngestionRun
        fields = "__all__"


class DataQualityIssueSerializer(serializers.ModelSerializer):
    class Meta:
        model = DataQualityIssue
        fields = "__all__"
