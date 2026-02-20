import asyncio
from docling.document_converter import DocumentConverter

async def process_uploaded_file(file_path: str) -> str:
    """
    Load the file, parse it, and export the document layout perfectly into a Markdown string.
    Using docling.document_converter.DocumentConverter.
    """
    def _convert() -> str:
        converter = DocumentConverter()
        result = converter.convert(file_path)
        # Export the document layout perfectly into a Markdown string
        return result.document.export_to_markdown()

    # Run the synchronous docling conversion in a separate thread to not block the event loop
    markdown_content = await asyncio.to_thread(_convert)
    return markdown_content
