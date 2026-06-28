import json
import os


BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))
    )
)

FEEDBACK_MEMORY_PATH = os.path.join(
    BASE_DIR,
    "memory",
    "feedback_memory.json"
)


def qualification_agent(state):

    print("\n===== QUALIFICATION AGENT =====")

    matched_companies = state["matched_companies"]

    planner_signals = state["signals"]

    print("Planner Signals:", planner_signals)

    print("Matched Companies:", matched_companies)

    with open(FEEDBACK_MEMORY_PATH, "r") as file:

        feedback_memory = json.load(file)

    minimum_employee_count = feedback_memory[
        "minimum_employee_count"
    ]

    print("Minimum Employee Count:",
          minimum_employee_count)

    qualified_companies = []

    decision_trace = []

    for company in matched_companies:

        print("\nChecking Company:",
              company["company"])

        confidence = 0

        reasons = []

        # EMPLOYEE SCORE

        if company["employee_count"] >= minimum_employee_count:

            confidence += 40

            reasons.append(
                f"Employee count above {minimum_employee_count}"
            )

        if not planner_signals:
            confidence += 40
            reasons.append("No specific target signals specified, matched domain baseline")
        else:
            matched_signal_count = 0
            for company_signal in company["signals"]:
                for planner_signal in planner_signals:
                    if (
                        planner_signal.lower() in company_signal.lower()
                        or
                        company_signal.lower() in planner_signal.lower()
                    ):
                        matched_signal_count += 1
            print("Matched Signal Count:", matched_signal_count)
            confidence += matched_signal_count * 20
            reasons.append(f"{matched_signal_count} matching signals detected")

        print("Confidence:", confidence)

        if confidence >= 40:

            print("QUALIFIED")

            qualified_companies.append({

                "company": company["company"],

                "domain": company["domain"],

                "signals": company["signals"],

                "personas": company["personas"],

                "confidence": confidence,

                "reasons": reasons

            })

            decision_trace.append({

                "agent": "Qualification Agent",

                "company": company["company"],

                "decision": "Qualified",

                "confidence": confidence,

                "reasons": reasons

            })

        else:

            print("REJECTED")

    print("\nFINAL QUALIFIED COMPANIES:")
    print(qualified_companies)

    state["qualified_companies"] = qualified_companies

    state["decision_trace"] = decision_trace

    return state
