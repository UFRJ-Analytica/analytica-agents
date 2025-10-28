from typing import List, Sequence

import google.generativeai as genai
from chromadb.utils.embedding_functions import EmbeddingFunction
from google.api_core import exceptions as google_exceptions

from .config import GEMINI_API_KEY, EMBED_MODEL


class GeminiEmbedding(EmbeddingFunction):
    """
    Embedding wrapper that uses the google-generativeai library.
    It authenticates using the GEMINI_API_KEY (if provided) or falls back to
    Application Default Credentials (ADC) if the key is not available.
    """

    def __init__(self, model: str = EMBED_MODEL, api_key: str | None = None):
        key = (api_key or GEMINI_API_KEY or "").strip()
        
        # Only configure with API key if it's explicitly provided.
        # Otherwise, the library will automatically use ADC if it's configured.
        if key:
            genai.configure(api_key=key)
        
        # The new API requires the 'models/' prefix for embedding models.
        self.model = f"models/{model}"

    def __call__(self, input: Sequence[str]) -> List[List[float]]:
        texts = self._normalize_inputs(input)
        try:
            # Use the top-level `embed_content` function from the new SDK
            response = genai.embed_content(
                model=self.model,
                content=texts,
                task_type="retrieval_document",  # Specify for ChromaDB retrieval
            )
        except (google_exceptions.GoogleAPIError, ValueError) as exc:
            # Surface a clearer message upstream, also catching ValueErrors for bad inputs
            raise RuntimeError(f"Gemini embedding request failed: {exc}") from exc

        embeddings: List[List[float]] = response["embedding"]
        if len(embeddings) != len(texts):
            raise RuntimeError(
                "Gemini did not return the expected number of embeddings "
                f"(got {len(embeddings)}, expected {len(texts)})."
            )
        return embeddings

    @staticmethod
    def _normalize_inputs(items: Sequence[str]) -> List[str]:
        if not isinstance(items, Sequence):
            raise TypeError("Embedding input must be a sequence of strings.")
        texts: List[str] = []
        for idx, value in enumerate(items):
            if not isinstance(value, str):
                raise TypeError(f"Embedding input at index {idx} is not a string.")
            stripped = value.strip()
            if not stripped:
                raise ValueError(f"Embedding input at index {idx} is empty.")
            texts.append(stripped)
        return texts
