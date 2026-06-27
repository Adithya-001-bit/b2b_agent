import json
import os


BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.dirname(os.path.abspath(__file__))
    )
)

PROSPECTS_PATH = os.path.join(
    BASE_DIR,
    "data",
    "prospects.json"
)


def search_agent(state):

    domain = state["domain"]

    signals = state["signals"]

    print("\n===== SEARCH AGENT =====")
    print("Domain:", domain)
    print("Signals:", signals)

    with open(PROSPECTS_PATH, "r") as file:

        prospects = json.load(file)

    matched_companies = []

    for company in prospects:

        print("\nChecking:", company["company"])

        # EXACT DOMAIN MATCH

        if company["domain"].lower() != domain.lower():

            print("Domain mismatch")
            continue

        print("Domain matched")

        signal_match_found = False

        for company_signal in company["signals"]:

            for planner_signal in signals:

                # PARTIAL SIGNAL MATCH

                if (
                    planner_signal.lower() in company_signal.lower()
                    or
                    company_signal.lower() in planner_signal.lower()
                ):

                    signal_match_found = True

        if signal_match_found:

            print("Signal matched")

            matched_companies.append({

                "company": company["company"],

                "domain": company["domain"],

                "signals": company["signals"],

                "personas": company["personas"],

                "employee_count": company["employee_count"]

            })

        else:

            print("No signal match")

    print("\nFINAL MATCHED COMPANIES:")
    print(matched_companies)

    state["matched_companies"] = matched_companies

    return state

