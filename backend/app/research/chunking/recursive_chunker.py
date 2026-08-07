"""
Recursive Text Chunker

Splits text into chunks of target size (1000 chars) with overlap (200 chars),
preserving paragraph and sentence boundaries where possible.
Annotates every chunk with document_id, chunk_id, source, page_number, timestamp metadata.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from app.core.logging import get_logger
from app.schemas.research import Chunk, Document

logger = get_logger(__name__)


class RecursiveChunker:
    """
    Recursive Character Text Chunker.

    Chunk Size: 1000 characters
    Overlap: 200 characters
    Separators: ["\n\n", "\n", ". ", "? ", "! ", " ", ""]
    """

    def __init__(
        self,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        separators: Optional[List[str]] = None,
    ) -> None:
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.separators = separators or ["\n\n", "\n", ". ", "? ", "! ", " ", ""]

    def _split_text(self, text: str, separators: List[str]) -> List[str]:
        """Recursively split text using the hierarchy of separators."""
        final_chunks: List[str] = []

        if not text:
            return final_chunks

        # Select current separator
        separator = separators[-1]
        new_separators: List[str] = []

        for i, s in enumerate(separators):
            if s == "":
                separator = s
                break
            if s in text:
                separator = s
                new_separators = separators[i + 1 :]
                break

        # Split text by current separator
        splits = text.split(separator) if separator != "" else list(text)

        # Merge splits into chunks respecting size & overlap
        good_splits: List[str] = []
        for split in splits:
            if len(split) < self.chunk_size:
                good_splits.append(split)
            else:
                if good_splits:
                    merged = self._merge_splits(good_splits, separator)
                    final_chunks.extend(merged)
                    good_splits = []
                if new_separators:
                    other_chunks = self._split_text(split, new_separators)
                    final_chunks.extend(other_chunks)
                else:
                    final_chunks.append(split)

        if good_splits:
            merged = self._merge_splits(good_splits, separator)
            final_chunks.extend(merged)

        return final_chunks

    def _merge_splits(self, splits: List[str], separator: str) -> List[str]:
        """Combine smaller splits into chunks of target chunk_size with overlap."""
        docs: List[str] = []
        current_doc: List[str] = []
        total = 0

        for d in splits:
            len_d = len(d)
            if total + len_d + (len(separator) if current_doc else 0) > self.chunk_size:
                if current_doc:
                    doc_str = separator.join(current_doc)
                    if doc_str.strip():
                        docs.append(doc_str)

                    # Build overlap from trailing splits
                    while total > self.chunk_overlap and current_doc:
                        removed = current_doc.pop(0)
                        total -= len(removed) + (len(separator) if current_doc else 0)

            current_doc.append(d)
            total += len_d + (len(separator) if len(current_doc) > 1 else 0)

        if current_doc:
            doc_str = separator.join(current_doc)
            if doc_str.strip():
                docs.append(doc_str)

        return docs

    def create_chunks(
        self,
        document: Document,
        default_page_number: int = 1,
    ) -> List[Chunk]:
        """
        Split a Document into chunk objects with complete metadata.

        Args:
            document: Document instance to split.
            default_page_number: Fallback page number.

        Returns:
            List of Chunk objects containing chunk_id, document_id, content,
            page_number, source, metadata, and timestamp.
        """
        logger.info(
            "Chunking document",
            document_id=document.document_id,
            content_length=len(document.content),
            chunk_size=self.chunk_size,
            overlap=self.chunk_overlap,
        )

        raw_chunks = self._split_text(document.content, self.separators)
        chunks: List[Chunk] = []
        char_pointer = 0

        for idx, text in enumerate(raw_chunks):
            chunk_text = text.strip()
            if not chunk_text:
                continue

            # Detect page number if embedded in text (e.g. [Page X])
            page_number = default_page_number
            if "[Page " in chunk_text:
                try:
                    p_str = chunk_text.split("[Page ")[1].split("]")[0]
                    page_number = int(p_str)
                except (IndexError, ValueError):
                    pass

            chunk_id = f"{document.document_id}_chunk_{idx + 1}"
            start_pos = char_pointer
            end_pos = start_pos + len(chunk_text)
            char_pointer = max(0, end_pos - self.chunk_overlap)

            metadata: Dict[str, Any] = {
                **document.metadata,
                "document_id": document.document_id,
                "chunk_id": chunk_id,
                "source": document.source_path_or_url or document.title,
                "page_number": page_number,
                "timestamp": datetime.utcnow().isoformat(),
                "file_type": document.file_type,
            }

            chunks.append(
                Chunk(
                    chunk_id=chunk_id,
                    document_id=document.document_id,
                    content=chunk_text,
                    page_number=page_number,
                    start_char=start_pos,
                    end_char=end_pos,
                    source=document.source_path_or_url or document.title,
                    metadata=metadata,
                    timestamp=datetime.utcnow(),
                )
            )

        logger.info("Chunking completed", document_id=document.document_id, num_chunks=len(chunks))
        return chunks
