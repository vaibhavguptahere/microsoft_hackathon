import logging
import time

from ollama import AsyncClient

from app.core.config import settings


logger = logging.getLogger(__name__)


class LLMService:

    def __init__(self):

        self.client = AsyncClient(
            host=settings.OLLAMA_BASE_URL,
            timeout=300.0
        )

        self.model = settings.OLLAMA_MODEL

    async def generate_structured(
        self,
        system_prompt: str,
        user_prompt: str,
        response_schema: dict
    ):

        start_time = time.perf_counter()

        logger.info("Calling Ollama model: %s", self.model)

        response = await self.client.chat(
            model=self.model,

            messages=[
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": user_prompt
                }
            ],

            format=response_schema,

            options={
                "temperature": 0,
                "num_predict": 384
            },

            keep_alive="10m",

            think=False
        )

        elapsed = time.perf_counter() - start_time

        raw_content = response.message.content

        logger.info(
            "Ollama response received in %.2f seconds",
            elapsed
        )

        logger.info(
            "Raw model response: %r",
            raw_content
        )

        if not raw_content or not raw_content.strip():

            logger.error(
                "Ollama returned empty content. Model: %s",
                self.model
            )

            raise RuntimeError(
                "Ollama returned an empty response. "
                "Check model inference and structured output."
            )

        return raw_content


llm_service = LLMService()