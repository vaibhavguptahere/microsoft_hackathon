from typing import Literal, Optional

from pydantic import BaseModel, Field, model_validator


Domain = Literal["HR", "IT", "FINANCE"]

ClassificationStatus = Literal[
    "single_intent",
    "multi_intent",
    "clarification_required",
    "out_of_scope",
]


class Intent(BaseModel):

    domain: Domain
    intent: str = Field(min_length=1)
    query: str = Field(min_length=1)


class RoutingResult(BaseModel):
    """
    Final classification result returned to the API and router.

    This model is NEVER sent directly to the LLM as a JSON schema.
    The LLM uses a simpler hand-crafted schema (see classifier.py).
    This model is used for internal validation and API responses only.
    """

    status: ClassificationStatus
    intents: list[Intent] = Field(default_factory=list)
    clarification_question: Optional[str] = None

    # Derived from status — never supplied by the LLM
    needs_clarification: bool = False

    @model_validator(mode="after")
    def validate_and_normalise(self) -> "RoutingResult":

        # Auto-derive needs_clarification from status
        self.needs_clarification = (self.status == "clarification_required")

        if self.status == "single_intent":
            if len(self.intents) != 1:
                raise ValueError(
                    f"single_intent requires exactly 1 intent, got {len(self.intents)}"
                )
            self.clarification_question = None

        elif self.status == "multi_intent":
            if len(self.intents) < 2:
                raise ValueError(
                    f"multi_intent requires at least 2 intents, got {len(self.intents)}"
                )
            self.clarification_question = None

        elif self.status == "clarification_required":
            if not self.clarification_question:
                raise ValueError(
                    "clarification_required must include a clarification_question"
                )
            self.intents = []

        elif self.status == "out_of_scope":
            self.intents = []
            self.clarification_question = None

        return self

    @classmethod
    def make_single(cls, domain: Domain, intent: str, query: str) -> "RoutingResult":
        """Fast-path factory for single-intent results from BART."""
        return cls(
            status="single_intent",
            intents=[Intent(domain=domain, intent=intent, query=query)],
        )

    @classmethod
    def make_out_of_scope(cls) -> "RoutingResult":
        return cls(status="out_of_scope")

    @classmethod
    def make_multi(cls, intents: list[Intent]) -> "RoutingResult":
        return cls(status="multi_intent", intents=intents)