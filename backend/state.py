from typing import TypedDict, List


class AgentState(TypedDict):

    user_query: str

    selected_plugin: str

    domain: str

    signals: List[str]

    personas: List[str]

    planner_response: str

    matched_companies: List[dict]

    qualified_companies: List[dict]

    decision_trace: List[dict]

    final_recommendations: str

