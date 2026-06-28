"""
Groq LLM service: Q&A, summarization, comparison, investment memo generation
"""
from typing import Optional
from groq import Groq
from app.core.config import get_settings

settings = get_settings()
_client: Optional[Groq] = None


def _get_client() -> Groq:
    global _client
    if _client is None:
        _client = Groq(api_key=settings.groq_api_key)
    return _client


def _chat(system: str, user: str, max_tokens: int = 1500) -> str:
    client = _get_client()
    response = client.chat.completions.create(
        model=settings.groq_model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        max_tokens=max_tokens,
        temperature=0.2,
    )
    return response.choices[0].message.content.strip()


# ── Prompts ────────────────────────────────────────────────────────────────

FINANCE_SYSTEM = """You are a senior financial analyst at a top-tier investment bank.
You analyze corporate documents (10-Ks, earnings transcripts, financial reports) with precision.
- Be concise, data-driven, and structured.
- Always cite specific figures, percentages, or quotes when available in the context.
- Use financial terminology correctly.
- If the context doesn't contain enough information to answer, say so clearly."""


def answer_question(question: str, context_chunks: list[str], filename: str) -> str:
    context = "\n\n---\n\n".join(context_chunks)
    prompt = f"""Document: {filename}

CONTEXT:
{context}

QUESTION: {question}

Provide a precise, well-structured answer based strictly on the context above.
If specific numbers or quotes are available, include them."""
    return _chat(FINANCE_SYSTEM, prompt, max_tokens=1200)


def summarize_document(raw_text: str, filename: str) -> str:
    # Use first ~6000 chars for speed + cost
    excerpt = raw_text[:6000]
    prompt = f"""Document: {filename}

CONTENT (excerpt):
{excerpt}

Provide an executive summary in this exact structure:

## Overview
[2-3 sentence company/document overview]

## Key Financial Highlights
[4-6 bullet points with specific numbers]

## Business Segments
[Key segments and their performance]

## Strategic Priorities
[2-3 priorities management emphasized]

## Risks & Challenges
[3-4 key risk factors]

## Investment Takeaway
[1-2 sentence overall assessment]"""
    return _chat(FINANCE_SYSTEM, prompt, max_tokens=1500)


def compare_documents(
    query: str,
    doc1_chunks: list[str],
    doc1_name: str,
    doc2_chunks: list[str],
    doc2_name: str,
) -> str:
    ctx1 = "\n\n".join(doc1_chunks)
    ctx2 = "\n\n".join(doc2_chunks)

    prompt = f"""You are comparing two financial documents.

DOCUMENT 1 — {doc1_name}:
{ctx1}

DOCUMENT 2 — {doc2_name}:
{ctx2}

COMPARISON QUERY: {query}

Provide a structured side-by-side analysis:

## Comparison: {query}

### {doc1_name}
[Findings from Document 1 with specific data]

### {doc2_name}
[Findings from Document 2 with specific data]

### Key Differences
[3-5 bullet points on material differences]

### Analyst Takeaway
[Which document/company shows stronger positioning on this metric and why]"""
    return _chat(FINANCE_SYSTEM, prompt, max_tokens=1800)


def generate_investment_memo(
    filename: str,
    summary: str,
    risks: list[str],
    guidance: list[str],
    metrics: dict,
    sentiment: dict,
) -> str:
    risks_text = "\n".join(f"- {r}" for r in risks[:8])
    guidance_text = "\n".join(f"- {g}" for g in guidance[:6])
    metrics_text = "\n".join(f"- {k}: {', '.join(v)}" for k, v in metrics.items())

    prompt = f"""Based on the following analysis of {filename}, write a concise investment memo.

SUMMARY:
{summary[:1500]}

KEY METRICS FOUND:
{metrics_text or 'None extracted'}

RISK FACTORS:
{risks_text or 'None extracted'}

FORWARD GUIDANCE:
{guidance_text or 'None extracted'}

SENTIMENT: {sentiment.get('label', 'Neutral')} (score: {sentiment.get('score', 0)})

Write a professional one-page investment memo with:
1. **Investment Thesis** (2-3 sentences)
2. **Bull Case** (3 bullet points)
3. **Bear Case** (3 bullet points)
4. **Key Metrics to Watch**
5. **Recommendation** (Buy / Hold / Sell with brief rationale)

Be direct and opinionated like a Goldman Sachs research note."""
    return _chat(FINANCE_SYSTEM, prompt, max_tokens=1500)


def extract_entities(text: str) -> str:
    excerpt = text[:4000]
    prompt = f"""Extract key financial entities from this document excerpt.

TEXT:
{excerpt}

Return a structured JSON-like response with these categories:
- Companies mentioned (name, ticker if known)
- Key executives (name, title)
- Financial figures (metric, value, period)
- Geographic markets mentioned
- Products/services mentioned
- Regulatory bodies / legal entities

Format clearly with headers."""
    return _chat(FINANCE_SYSTEM, prompt, max_tokens=800)
