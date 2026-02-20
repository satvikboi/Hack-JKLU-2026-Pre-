from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
import os

# Initialize HuggingFace embedding model
# We use BAAI/bge-small-en-v1.5 as requested
embeddings = HuggingFaceEmbeddings(model_name="BAAI/bge-small-en-v1.5")

CHROMA_PERSIST_DIR = "./chroma_db"

def vectorize_and_store(markdown_text: str, session_id: str):
    """
    Split the Markdown text and store chunks into a local ChromaDB instance,
    using the session_id as the collection name so user data remains isolated.
    """
    # Use LangChain's RecursiveCharacterTextSplitter
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )
    
    # Split text into Document objects
    chunks = splitter.create_documents([markdown_text])
    
    # Store the resulting chunks into local ChromaDB
    Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        collection_name=session_id,
        persist_directory=CHROMA_PERSIST_DIR
    )

def search_contract(query: str, session_id: str):
    """
    Retrieves the top 5 most relevant chunks from ChromaDB for a specific session.
    """
    vectorstore = Chroma(
        collection_name=session_id,
        embedding_function=embeddings,
        persist_directory=CHROMA_PERSIST_DIR
    )
    
    # Retrieving top 5 chunks
    results = vectorstore.similarity_search(query, k=5)
    
    return [doc.page_content for doc in results]
