"""
Base connector interface that all source-specific connectors must implement.
"""
from abc import ABC, abstractmethod
from typing import Iterator


class BaseProjectSource(ABC):
    """
    Abstract base class for all government data source connectors.
    Each source (MoSPI, NITI Aayog, etc.) implements this interface.
    """

    source_name: str = "Unknown"

    @abstractmethod
    def fetch(self) -> bytes | str:
        """
        Retrieve raw data from the source.
        Could download a file, call an API, or read from local storage.
        Must NOT perform any transformation.
        Returns raw bytes or string.
        """
        raise NotImplementedError

    @abstractmethod
    def parse(self, raw_data) -> Iterator[dict]:
        """
        Parse the raw source data into an iterator of raw row dicts.
        No normalization — preserve original source field names and values.
        """
        raise NotImplementedError

    @abstractmethod
    def normalize(self, record: dict) -> dict:
        """
        Convert a raw source row dict into the platform's normalized field schema.
        Must return a dict with keys matching the platform schema.
        """
        raise NotImplementedError

    @abstractmethod
    def validate(self, record: dict) -> tuple[bool, list[str]]:
        """
        Validate a normalized record.
        Returns (is_valid, list_of_error_messages).
        Invalid records with meaningful data should go to the quality queue.
        """
        raise NotImplementedError
