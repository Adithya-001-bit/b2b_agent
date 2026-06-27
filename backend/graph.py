from langgraph.graph import StateGraph, END

from state import AgentState

from agents.planner_agent import planner_agent
from agents.search_agent import search_agent
from agents.qualification_agent import qualification_agent
from agents.recommendation_agent import recommendation_agent


workflow = StateGraph(AgentState)


workflow.add_node(
    "planner_agent",
    planner_agent
)

workflow.add_node(
    "search_agent",
    search_agent
)

workflow.add_node(
    "qualification_agent",
    qualification_agent
)

workflow.add_node(
    "recommendation_agent",
    recommendation_agent
)


workflow.set_entry_point("planner_agent")


workflow.add_edge(
    "planner_agent",
    "search_agent"
)

workflow.add_edge(
    "search_agent",
    "qualification_agent"
)

workflow.add_edge(
    "qualification_agent",
    "recommendation_agent"
)

workflow.add_edge(
    "recommendation_agent",
    END
)


app_graph = workflow.compile()