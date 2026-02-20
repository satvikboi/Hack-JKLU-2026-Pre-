"""Async HTTP client for OpenRouter LLM inference (Qwen3 235B)."""

from __future__ import annotations

import json
import time
from typing import AsyncGenerator

import httpx

from config import settings
from app.utils.exceptions import OllamaError
from app.utils.logger import get_logger
from app.utils import metrics as m

log = get_logger("llm_client")


class LLMClient:
    """Async client for OpenRouter API — OpenAI-compatible format."""

    def __init__(self):
        self.base_url = settings.OPENROUTER_BASE_URL
        self.model = settings.OPENROUTER_MODEL
        self.api_key = settings.OPENROUTER_API_KEY
        self.client = httpx.AsyncClient(
            timeout=httpx.Timeout(settings.LLM_TIMEOUT, connect=10.0),
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "HTTP-Referer": "https://legalsaathi.in",
                "X-Title": "LegalSaathi",
                "Content-Type": "application/json",
            },
        )

    async def generate(
        self,
        prompt: str,
        system_prompt: str = "",
        temperature: float | None = None,
        max_tokens: int | None = None,
        json_mode: bool = False,
    ) -> str:
        """Generate a completion via OpenRouter. Retries up to 3 times."""
        temp = temperature if temperature is not None else settings.LLM_TEMPERATURE
        tokens = max_tokens if max_tokens is not None else settings.LLM_MAX_TOKENS

        messages = []
        if system_prompt:
            sys_text = system_prompt
            if json_mode:
                sys_text += "\n\nRespond ONLY with valid JSON. No markdown, no explanation, no code blocks."
            messages.append({"role": "system", "content": sys_text})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temp,
            "max_tokens": tokens,
        }
        if json_mode:
            payload["response_format"] = {"type": "json_object"}

        last_error = None
        for attempt in range(3):
            try:
                start = time.time()
                resp = await self.client.post(
                    f"{self.base_url}/chat/completions",
                    json=payload,
                )
                elapsed = time.time() - start
                m.INFERENCE_DURATION.observe(elapsed)

                if resp.status_code == 401:
                    raise OllamaError("OpenRouter API key invalid")
                if resp.status_code == 429:
                    log.warning("openrouter_rate_limited", attempt=attempt + 1)
                    import asyncio
                    await asyncio.sleep(2 ** attempt)
                    continue
                resp.raise_for_status()

                data = resp.json()
                choices = data.get("choices", [])
                if not choices:
                    raise OllamaError("OpenRouter returned no choices")

                response_text = choices[0].get("message", {}).get("content", "")

                # Strip thinking tags if present (Qwen3 thinking model)
                response_text = self._strip_thinking(response_text)

                log.info(
                    "llm_generate",
                    model=self.model,
                    latency_ms=int(elapsed * 1000),
                    response_len=len(response_text),
                    attempt=attempt + 1,
                )

                # Validate JSON if json_mode
                if json_mode:
                    try:
                        json.loads(response_text)
                    except json.JSONDecodeError:
                        # Try to extract JSON from response
                        response_text = self._extract_json(response_text)
                        if attempt < 2:
                            try:
                                json.loads(response_text)
                            except json.JSONDecodeError:
                                log.warning("llm_invalid_json_retry", attempt=attempt + 1)
                                continue

                return response_text

            except (httpx.TimeoutException, httpx.ConnectError) as e:
                last_error = e
                log.warning("llm_retry", attempt=attempt + 1, error=str(e))
                continue
            except httpx.HTTPStatusError as e:
                raise OllamaError(f"OpenRouter HTTP error: {e.response.status_code}") from e

        raise OllamaError(f"OpenRouter failed after 3 retries: {last_error}")

    async def generate_streaming(
        self,
        prompt: str,
        system_prompt: str = "",
    ) -> AsyncGenerator[str, None]:
        """Streaming response for voice/chat endpoints."""
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": settings.LLM_TEMPERATURE,
            "stream": True,
        }

        async with self.client.stream(
            "POST",
            f"{self.base_url}/chat/completions",
            json=payload,
        ) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if line.startswith("data: "):
                    data_str = line[6:]
                    if data_str.strip() == "[DONE]":
                        break
                    try:
                        data = json.loads(data_str)
                        delta = data.get("choices", [{}])[0].get("delta", {})
                        text = delta.get("content", "")
                        if text:
                            yield text
                    except json.JSONDecodeError:
                        continue

    async def health_check(self) -> bool:
        """Check if OpenRouter API is reachable."""
        try:
            resp = await self.client.get(
                f"{self.base_url}/models",
                timeout=5.0,
            )
            return resp.status_code == 200
        except Exception:
            return False

    async def close(self) -> None:
        """Close the HTTP client."""
        await self.client.aclose()

    @staticmethod
    def _strip_thinking(text: str) -> str:
        """Strip <think>...</think> tags from Qwen3 thinking model output."""
        import re
        # Remove thinking blocks
        cleaned = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)
        return cleaned.strip()

    @staticmethod
    def _extract_json(text: str) -> str:
        """Try to extract JSON from a response that may have extra text."""
        # Try to find JSON array or object
        import re
        # Look for JSON array
        match = re.search(r"(\[[\s\S]*\])", text)
        if match:
            return match.group(1)
        # Look for JSON object
        match = re.search(r"(\{[\s\S]*\})", text)
        if match:
            return match.group(1)
        return text


# ── Backward compatibility alias ─────────────────────────
OllamaClient = LLMClient
