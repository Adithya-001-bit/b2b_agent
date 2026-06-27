import json
import os

from services.gemini_service import ask_gemini


BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))
    )
)

PLUGINS_PATH = os.path.join(
    BASE_DIR,
    "memory",
    "domain_plugins.json"
)


def planner_agent(state):

    user_query = state["user_query"]

    selected_plugin = state.get(
        "selected_plugin",
        ""
    )

    print("\n===== PLANNER AGENT =====")
    print("Selected Plugin:", selected_plugin)

    # ====================================
    # FORCE PLUGIN DATA DIRECTLY
    # ====================================

    if selected_plugin:

        with open(PLUGINS_PATH, "r") as file:

            plugins = json.load(file)

        for plugin in plugins:

            if (
                plugin["domain"].lower()
                ==
                selected_plugin.lower()
            ):

                print("PLUGIN MATCHED")

                # FORCE EXACT VALUES

                state["domain"] = plugin["domain"]

                state["signals"] = plugin["signals"]

                state["personas"] = plugin["personas"]

                state["planner_response"] = (
                    f"Plugin enforced: {plugin['domain']}"
                )

                print("FORCED DOMAIN:",
                      state["domain"])

                print("FORCED SIGNALS:",
                      state["signals"])

                return state

    # ====================================
    # NO PLUGIN → USE GEMINI
    # ====================================

    print("NO PLUGIN -> USING GEMINI")

    prompt = f"""

    You are a Planner Agent.

    Detect:
    1. Domain (Must be one of the domains listed below)
    2. Signals (Must ONLY select from the corresponding signals listed below for that domain)
    3. Personas

    Query:
    {user_query}

    DOMAINS AND THEIR ALLOWED SIGNALS:

    * Agriculture
      Allowed signals: "AI drones", "smart farming", "precision agriculture", "smart irrigation"
    
    * Healthcare
      Allowed signals: "AI diagnostics", "telemedicine", "patient analytics", "remote monitoring", "medical imaging"
    
    * Finance
      Allowed signals: "fraud detection", "AI risk analysis", "predictive finance", "AI compliance", "algorithmic trading", "risk analytics"
    
    * Cybersecurity
      Allowed signals: "threat detection", "AI security", "endpoint protection", "AI threat intelligence"
    
    * Retail
      Allowed signals: "customer analytics", "inventory optimization", "recommendation engine"
    
    * Logistics
      Allowed signals: "route optimization", "predictive logistics", "fleet analytics", "AI route planning"
    
    * SaaS
      Allowed signals: "AI automation", "CRM optimization", "workflow automation", "AI CRM", "AI platform as a service", "Generative AI SaaS", "AI APIs", "MLOps SaaS"

    Return ONLY valid JSON.

    Example:

    {{
        "domain": "Healthcare",
        "signals": [
            "AI diagnostics",
            "telemedicine"
        ],
        "personas": [
            "Hospital CTO"
        ]
    }}

    """

    try:
        response = ask_gemini(prompt)

        response_cleaned = response.replace(
            "```json",
            ""
        ).replace(
            "```",
            ""
        ).strip()

        parsed_response = json.loads(response_cleaned)

        state["domain"] = parsed_response["domain"]

        state["signals"] = parsed_response["signals"]

        state["personas"] = parsed_response["personas"]

        state["planner_response"] = response

    except Exception as e:
        print("PLANNER GEMINI FAILURE OR PARSING ERROR:", e)
        # Fallback safely
        state["domain"] = "SaaS"
        state["signals"] = ["AI automation"]
        state["personas"] = ["CTO"]
        state["planner_response"] = "Fallback SaaS domain enforced due to Gemini/Parsing failure."

    print("DOMAIN:", state["domain"])
    print("SIGNALS:", state["signals"])

    return state

