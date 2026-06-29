from typing import TypedDict, Annotated, Any
import operator


class AgentState(TypedDict):
    customer_id: str
    customer_name: str
    user_email: str

    plan: list[str]
    current_step: int

    customer_context: dict        # Internal Knowledge Agent
    external_intel: dict          # External Research Agent
    analysis: dict                # Reasoning Agent
    recommendations: list[dict]   # Recommendation Agent
    report: dict                  # Report Agent

    agent_logs: Annotated[list[str], operator.add]
    errors: Annotated[list[str], operator.add]
    past_recommendations: list[dict]

    status: str