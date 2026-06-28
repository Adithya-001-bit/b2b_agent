# B2B Agent Orchestration Terminal

An advanced, adaptive agentic AI platform designed to automate high-intent B2B prospect identification, qualification, and outreach campaign generation. Powered by **LangGraph**, **FastAPI**, and **Next.js**, the platform leverages a collaborative multi-agent architecture and a real-time user feedback loop that dynamically optimizes target lead profiles.

---

## 🎯 Business Value & Use Case (30% Evaluation Weight)

In enterprise sales and business development, identifying relevant business leads and personalizing outreach takes hours of manual research. Traditional databases (like static CRM exports) are:
1. **Outdated:** Company headcounts and hiring requirements change daily.
2. **Inflexible:** Searches are limited to generic keyword matching.
3. **Static:** Search filters do not adapt to user preferences over time.

### The Solution: Agentic B2B Orchestration
Our terminal solves this by orchestrating a pipeline of specialized AI agents. Sales teams can type natural language search queries (e.g., *"startups building AI drone solutions for agriculture"*), and the system dynamically:
- Translates natural language requests into specific industry domains, hiring keywords, and buyer personas.
- Runs dynamic queries on self-enriching prospect datasets.
- Automatically scores company matches and filters them using dynamic constraints.
- Generates tailored outbound campaigns.
- **Learns in Real-Time:** If a user rejects a lead, the agentic engine recalculates thresholds (e.g. increasing the minimum employee counts or logging rejected keywords), immediately modifying subsequent searches.

---

## 🏗️ Platform Architecture (70% Evaluation Weight)

The platform is designed around a decoupled, microservice-ready architecture that isolates front-end rendering, API routing, agent state machine orchestration, and persistent storage.

```
                  ┌──────────────────────────────┐
                  │   Next.js Front-End Client    │
                  └──────────────┬───────────────┘
                                 │ HTTP / REST
                  ┌──────────────▼───────────────┐
                  │    FastAPI Gateway Server    │
                  └──────────────┬───────────────┘
                                 │ State Loop
┌────────────────────────────────┼────────────────────────────────┐
│ LangGraph Orchestration Layer  │                                │
│                                ▼                                │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ 1. PLANNER AGENT (Gemini)                               │   │
│   │    Parses search queries into domains & signals.        │   │
│   └────────────────────────────┬────────────────────────────┘   │
│                                │ State passing                  │
│   ┌────────────────────────────▼────────────────────────────┐   │
│   │ 2. SEARCH AGENT                                         │   │
│   │    Queries prospect databases using active signals.     │   │
│   └────────────────────────────┬────────────────────────────┘   │
│                                │ State passing                  │
│   ┌────────────────────────────▼────────────────────────────┐   │
│   │ 3. QUALIFICATION AGENT                                  │   │
│   │    Scores prospects based on employee size & history.   │   │
│   └────────────────────────────┬────────────────────────────┘   │
│                                │ State passing                  │
│   ┌────────────────────────────▼────────────────────────────┐   │
│   │ 4. RECOMMENDATION AGENT (Gemini)                        │   │
│   │    Generates personalized outreach campaign email copy. │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 1. Collaborative Multi-Agent Network (LangGraph)
* **Planner Agent (Gemini):** Takes user query text and extracts target industries (e.g. Healthcare, Finance, Agriculture), active market signals (e.g. telemedicine, smart farming), and buyer personas (e.g. Chief Medical Officer, VP of AI). It supports manual **Domain Override Plugins** that bypass NLP extraction when rigid scoping is required.
* **Search Agent:** Coordinates queries against the prospect dataset based on domain and signal array intersections.
* **Qualification Agent:** Evaluates candidate fits. It checks the live memory logs for user constraints (e.g., minimum employee size and previously blacklisted reasons) and calculates a confidence score.
* **Recommendation Agent (Gemini):** Generates targeted outbound email templates for selected buyer personas based on company-specific signals.

### 2. Ingestion & Web Engineering Pipeline (Production Roadmap)
In production, prospects are gathered dynamically by a separate data ingestion engine:
- **Crawlers (Playwright & Scrapy):** Scan corporate websites, news outlets, and job postings for key hiring signals.
- **Enrichment Services:** Integrates with clearbit/Apollo API endpoints to fetch live headcount distributions and executive emails.
- **Bulk Loader:** Normalizes and upserts records into the B2B Prospect Database.

### 3. Persistent Database State & Caching
Our design specifies a relational database (PostgreSQL with JSONB) replacing local file mockups. This ensures:
- **Atomicity & Consistency:** Thread-safe feedback writes.
- **JSONB Querying:** Dynamic signal array intersection (`?|` operator) to filter prospects efficiently.
- **Real-Time State Retention:** Allows multiple sales reps to run queries simultaneously while sharing a single, learning feedback memory model.

---

## 🛠️ Setup & Local Execution Guide

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** (3.10 or higher)
- **Gemini API Key** (Set as environment variable)

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   # Windows
   python -m venv venv
   venv\Scripts\activate

   # macOS / Linux
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the `backend` folder and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
5. Start the FastAPI development server:
   ```bash
   uvicorn main:app --reload
   ```
   The backend API will be running at `http://127.0.0.1:8000`.

### 2. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm packages:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser to access the dashboard terminal.

---

## 💡 Key Design Decisions & Best Practices

1. **Decoupled Architecture:** Frontend React components only communicate with FastAPI endpoints. The agentic pipeline is fully modular, allowing developer testing of individual agents in isolation.
2. **LangGraph State Tracking:** LangGraph handles agent execution state sequentially and loops back/redirects execution based on query parameters. State is never lost between agents.
3. **Adaptive Thresholding:** The qualification engine retrieves user feedback from previous runs, making the terminal's scoring intelligence reactive and custom-tailored to specific business constraints over time.
