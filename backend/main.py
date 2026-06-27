
from fastapi import FastAPI
from fastapi import Body
from fastapi.middleware.cors import CORSMiddleware

import json
import os

from graph import app_graph
from services.gemini_service import ask_gemini


# =========================================
# PATHS
# =========================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

PROJECT_ROOT = os.path.dirname(
    BASE_DIR
)

MEMORY_DIR = os.path.join(
    PROJECT_ROOT,
    "memory"
)

FEEDBACK_MEMORY_PATH = os.path.join(
    MEMORY_DIR,
    "feedback_memory.json"
)

PLUGINS_PATH = os.path.join(
    MEMORY_DIR,
    "domain_plugins.json"
)


# =========================================
# FASTAPI
# =========================================

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================
# HOME
# =========================================

@app.get("/")
def home():

    return {
        "message": "B2B Agent Platform Running"
    }


# =========================================
# MAIN WORKFLOW
# =========================================

@app.get("/planner")
def run_planner(
    query: str,
    plugin: str = ""
):

    print("\n===== MAIN API =====")
    print("QUERY:", query)
    print("PLUGIN:", plugin)

    initial_state = {

        "user_query": query,

        "selected_plugin": plugin,

        "domain": "",

        "signals": [],

        "personas": [],

        "planner_response": "",

        "matched_companies": [],

        "qualified_companies": [],

        "decision_trace": [],

        "final_recommendations": ""

    }

    result = app_graph.invoke(
        initial_state
    )

    return result


# =========================================
# FEEDBACK
# =========================================

@app.post("/feedback")
def collect_feedback(
    data: dict = Body(...)
):

    feedback = data["feedback"]

    reason = data.get(
        "reason",
        ""
    )

    company = data.get(
        "company",
        {}
    )

    with open(
        FEEDBACK_MEMORY_PATH,
        "r"
    ) as file:

        memory = json.load(file)

    # Initialize keys defensively if they don't exist
    if "accepted_domains" not in memory:
        memory["accepted_domains"] = []
    if "accepted_signals" not in memory:
        memory["accepted_signals"] = []
    if "accepted_personas" not in memory:
        memory["accepted_personas"] = []
    if "rejected_reasons" not in memory:
        memory["rejected_reasons"] = []
    if "minimum_employee_count" not in memory:
        memory["minimum_employee_count"] = 0

    # =====================================
    # ACCEPT FEEDBACK
    # =====================================

    if feedback == "accept":

        domain = company.get(
            "domain",
            ""
        )

        signals = company.get(
            "signals",
            []
        )

        personas = company.get(
            "personas",
            []
        )

        if (
            domain
            and
            domain not in memory[
                "accepted_domains"
            ]
        ):

            memory[
                "accepted_domains"
            ].append(domain)

        for signal in signals:

            if (
                signal
                not in memory[
                    "accepted_signals"
                ]
            ):

                memory[
                    "accepted_signals"
                ].append(signal)

        for persona in personas:

            if (
                persona
                not in memory[
                    "accepted_personas"
                ]
            ):

                memory[
                    "accepted_personas"
                ].append(persona)

    # =====================================
    # REJECT FEEDBACK
    # =====================================

    elif feedback == "reject":

        memory["minimum_employee_count"] += 10

        memory["rejected_reasons"].append(reason)

    # =====================================
    # SAVE MEMORY
    # =====================================

    with open(
        FEEDBACK_MEMORY_PATH,
        "w"
    ) as file:

        json.dump(
            memory,
            file,
            indent=4
        )

    return {

        "message":
        "Feedback stored successfully",

        "updated_memory":
        memory

    }


# =========================================
# CHATBOT
# =========================================

@app.post("/chat")
def recommendation_chat(
    data: dict = Body(...)
):

    question = data["question"]

    recommendation_context = data["context"]

    prompt = f"""

    You are an AI assistant helping users
    understand B2B recommendations.

    Recommendation Context:
    {recommendation_context}

    User Question:
    {question}

    Explain clearly.

    """

    try:
        response = ask_gemini(prompt)
    except Exception as e:
        print("CHATBOT ERROR:", e)
        response = "Gemini clarification failed."

    return {
        "response": response
    }


# =========================================
# CREATE PLUGIN
# =========================================

@app.post("/create-plugin")
def create_plugin(
    data: dict = Body(...)
):

    with open(
        PLUGINS_PATH,
        "r"
    ) as file:

        plugins = json.load(file)

    plugins.append(data)

    with open(
        PLUGINS_PATH,
        "w"
    ) as file:

        json.dump(
            plugins,
            file,
            indent=4
        )

    return {

        "message":
        "Plugin created successfully",

        "plugin":
        data

    }


# =========================================
# GET PLUGINS
# =========================================

@app.get("/plugins")
def get_plugins():

    with open(
        PLUGINS_PATH,
        "r"
    ) as file:

        plugins = json.load(file)

    return {
        "plugins": plugins
    }
