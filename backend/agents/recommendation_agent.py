
from services.gemini_service import ask_gemini


def recommendation_agent(state):

    qualified_companies = state[
        "qualified_companies"
    ]

    print("\n===== RECOMMENDATION AGENT =====")
    print(
        "Qualified Companies:",
        qualified_companies
    )

    # ==================================
    # NO COMPANIES FOUND
    # ==================================

    if len(qualified_companies) == 0:

        state["final_recommendations"] = (
            "No qualified companies found "
            "for this query and plugin."
        )

        return state

    # ==================================
    # NORMAL FLOW
    # ==================================

    prompt = f"""

    You are a Recommendation Agent.

    Generate concise B2B recommendations.

    Qualified Companies:
    {qualified_companies}

    For each company:
    1. Why selected
    2. Confidence
    3. Outreach angle

    Keep the response concise.

    """

    try:

        response = ask_gemini(prompt)

        state[
            "final_recommendations"
        ] = response

    except Exception as e:

        print(
            "RECOMMENDATION ERROR:",
            e
        )

        state[
            "final_recommendations"
        ] = (
            "Gemini recommendation generation failed."
        )

    return state