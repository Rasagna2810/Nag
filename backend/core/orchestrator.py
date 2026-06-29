from typing import AsyncGenerator
from models.state import AgentState
from agents.planner  import planner_agent
from agents.internal_knowledge import internal_knowledge_agent
from agents.reasoning import reasoning_agent
from agents.report import report_agent

# Fixed 4-step pipeline
_PIPELINE = [
    ("planner",            planner_agent),
    ("internal_knowledge", internal_knowledge_agent),
    ("reasoning",          reasoning_agent),
    ("report",             report_agent),
]


async def run_workflow_streaming(
    customer_id:   str,
    customer_name: str,
    user_email:    str,
) -> AsyncGenerator[dict, None]:
    """
    Runs the agentic pipeline and yields progress events for WebSocket streaming.
    Event shape: { type, agent, message, data? }
    """
    state: AgentState = {
        "customer_id":           customer_id,
        "customer_name":         customer_name,
        "user_email":            user_email,
        "plan":                  [name for name, _ in _PIPELINE],
        "current_step":          0,
        "customer_context":      {},
        "external_intel":        {},
        "analysis":              {},
        "recommendations":       [],
        "report":                {},
        "agent_logs":            [],
        "errors":                [],
        "past_recommendations":  [],
        "status":                "running",
    }

    yield {
        "type":    "start",
        "agent":   "orchestrator",
        "message": f"Starting analysis for {customer_name} (2 Gemini calls total)",
        "data":    {"plan": state["plan"]},
    }

    total = len(_PIPELINE)

    for i, (agent_name, agent_fn) in enumerate(_PIPELINE):
        yield {
            "type":    "agent_start",
            "agent":   agent_name,
            "message": f"[{i+1}/{total}] {agent_name.replace('_',' ').title()}...",
            "data":    {"step": i + 1, "total": total, "plan": state["plan"]},
        }

        try:
            prev_count = len(state["agent_logs"])
            state      = await agent_fn(state)
            new_logs   = state["agent_logs"][prev_count:]

            for log in new_logs:
                yield {"type": "log", "agent": agent_name, "message": log}

            yield {
                "type":    "agent_complete",
                "agent":   agent_name,
                "message": f"{agent_name.replace('_',' ').title()} complete",
            }

        except Exception as e:
            err = f"Agent {agent_name} failed: {str(e)}"
            state = {**state, "errors": state.get("errors", []) + [err]}
            yield {"type": "error", "agent": agent_name, "message": err}
            # Continue pipeline — don't abort on single agent failure

    yield {
        "type":    "complete",
        "agent":   "orchestrator",
        "message": "Analysis complete — awaiting human review",
        "data": {
            "report_id":            state.get("report", {}).get("id", ""),
            "recommendation_count": len(state.get("recommendations", [])),
            "status":               state.get("status", "awaiting_approval"),
        },
    }

    # Hand final state to WS handler for MongoDB persistence
    yield {"type": "final_state", "agent": "orchestrator", "data": state}