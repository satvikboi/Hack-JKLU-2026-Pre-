import os
from pydantic import BaseModel, Field
from typing import List
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from rag_engine import search_contract

class LegalAnalysisResult(BaseModel):
    layman_summary: str = Field(description="A clear, simple summary of the legal document for a layperson")
    regional_translation: str = Field(description="Regional translation or adapted summary for the local language")
    key_obligations: List[str] = Field(description="List of key obligations")
    risk_score: int = Field(description="Risk score from 1-10", ge=1, le=10)
    future_action_plan: str = Field(description="Actionable steps for the user based on their profile")
    compliance_flags: List[str] = Field(description="Any red flags or compliance issues found")

def analyze_legal_document(session_id: str, user_profile: str, target_language: str) -> LegalAnalysisResult:
    """
    Pull the context from the RAG engine and construct a LangChain prompt to analyze the legal document.
    """
    # Pull relevant context from the RAG engine based on a comprehensive query
    query = "key legal obligations, risks, future actions, compliance flags, and general summary"
    context_chunks = search_contract(query, session_id)
    
    # If no context found, return a default/empty response fallback, though RAG ensures there is some context
    context_str = "\n\n---\n\n".join(context_chunks) if context_chunks else "No document context found."
    
    # Initialize LLM with OpenAI SDK pointing to Qwen 3.5 Cloud API (placeholder route)
    llm = ChatOpenAI(
        model="qwen-3.5", # Standard placeholder, user routes this outside SDK
        temperature=0.1,
        # Default configs for OpenAI SDK compatible cloud endpoint
        api_key=os.getenv("OPENAI_API_KEY", "dummy_key"), 
        base_url=os.getenv("OPENAI_API_BASE", "https://api.qwen.cloud/v1") 
    )
    
    # Force JSON schema output using LangChain's structured output parsers
    structured_llm = llm.with_structured_output(LegalAnalysisResult)
    
    prompt = PromptTemplate(
        template='''You are a strict, expert legal auditor.
Your job is to read the provided legal document context, identify hidden risks, and create a future action plan.
MOLD your future_action_plan specifically for this user profile: {user_profile}.
Also, provide the "regional_translation" in the target language: {target_language}.

Context from the legal document:
{context}

Based on the context, extract and analyze the information to provide the structured output.
''',
        input_variables=["user_profile", "target_language", "context"]
    )
    
    chain = prompt | structured_llm
    
    # Call the chain and return the structured response Pydantic object
    result = chain.invoke({
        "user_profile": user_profile,
        "target_language": target_language,
        "context": context_str
    })
    
    return result
