"use client"

import { useState, useEffect } from "react"

function TypewriterText({ text, speed = 4 }) {
  const [displayedText, setDisplayedText] = useState("")

  useEffect(() => {
    setDisplayedText("")
    if (!text) return

    let i = 0
    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + text.charAt(i))
      i++
      if (i >= text.length) {
        clearInterval(interval)
      }
    }, speed)

    return () => clearInterval(interval)
  }, [text, speed])

  return <span className="whitespace-pre-wrap">{displayedText}</span>
}

export default function Home() {

  const [query, setQuery] = useState("")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeAgent, setActiveAgent] = useState("")

  const [plugins, setPlugins] = useState([])
  const [selectedPlugin, setSelectedPlugin] = useState("")

  const [chatQuestion, setChatQuestion] = useState("")
  const [chatResponse, setChatResponse] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  // Form states for creating custom plugin
  const [newDomain, setNewDomain] = useState("")
  const [newMinEmployees, setNewMinEmployees] = useState(100)
  const [newSignals, setNewSignals] = useState("")
  const [newPersonas, setNewPersonas] = useState("")
  const [showPluginForm, setShowPluginForm] = useState(false)


  // =====================================
  // LOAD PLUGINS
  // =====================================

  useEffect(() => {

    const loadPlugins = async () => {

      try {

        const response = await fetch(
          "http://127.0.0.1:8000/plugins"
        )

        if (!response.ok) {
          throw new Error("HTTP error " + response.status)
        }

        const data = await response.json()

        setPlugins(data.plugins)

      } catch (error) {

        console.error(error)
        setErrorMessage("Failed to load plugins from backend.")

      }

    }

    loadPlugins()

  }, [])


  // =====================================
  // RUN WORKFLOW
  // =====================================

  const runWorkflow = async () => {

    try {
      setErrorMessage("")

      setLoading(true)

      setResult(null)

      setChatResponse("")

      const agents = [

        "Planner Agent",
        "Search Agent",
        "Qualification Agent",
        "Recommendation Agent"

      ]

      for (const agent of agents) {

        setActiveAgent(agent)

        await new Promise(resolve =>
          setTimeout(resolve, 700)
        )

      }

      const response = await fetch(

        `http://127.0.0.1:8000/planner?query=${encodeURIComponent(query)}&plugin=${selectedPlugin}`

      )

      if (!response.ok) {
        throw new Error("HTTP error " + response.status)
      }

      const data = await response.json()

      setResult(data)

      setActiveAgent("Completed")

    } catch (error) {

      console.error(error)
      setErrorMessage("Backend or Gemini API failed.")
      setActiveAgent("Failed")

    } finally {

      setLoading(false)

    }

  }


  // =====================================
  // CHATBOT
  // =====================================

  const askChatbot = async () => {

    try {
      setErrorMessage("")

      const response = await fetch(
        "http://127.0.0.1:8000/chat",
        {
          method: "POST",

          headers: {
            "Content-Type":
            "application/json"
          },

          body: JSON.stringify({

            question: chatQuestion,

            context: result

          })
        }
      )

      if (!response.ok) {
        throw new Error("HTTP error " + response.status)
      }

      const data = await response.json()

      setChatResponse(data.response)

    } catch (error) {

      console.error(error)
      setErrorMessage("Chatbot clarification failed.")

    }

  }


  // =====================================
  // FEEDBACK
  // =====================================

  const sendFeedback = async (
    feedback,
    reason,
    company = {}
  ) => {

    try {
      setErrorMessage("")

      const response = await fetch(

        "http://127.0.0.1:8000/feedback",
        {
          method: "POST",

          headers: {
            "Content-Type":
            "application/json"
          },

          body: JSON.stringify({

            feedback,
            reason,
            company

          })
        }
      )

      if (!response.ok) {
        throw new Error("HTTP error " + response.status)
      }

    } catch (error) {

      console.error(error)
      setErrorMessage("Failed to send feedback to backend.")

    }

  }


  // =====================================
  // CREATE CUSTOM PLUGIN
  // =====================================

  const handleCreatePlugin = async (e) => {
    e.preventDefault()
    
    if (!newDomain.trim()) {
      setErrorMessage("Domain name cannot be empty.")
      return
    }

    try {
      setErrorMessage("")
      
      const signalsArray = newSignals
        .split(",")
        .map(s => s.trim())
        .filter(s => s.length > 0)
      
      const personasArray = newPersonas
        .split(",")
        .map(p => p.trim())
        .filter(p => p.length > 0)

      const payload = {
        domain: newDomain.trim(),
        signals: signalsArray,
        personas: personasArray,
        minimum_employee_count: parseInt(newMinEmployees) || 100
      }

      const response = await fetch("http://127.0.0.1:8000/create-plugin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error("HTTP error " + response.status)
      }

      const getResponse = await fetch("http://127.0.0.1:8000/plugins")
      if (getResponse.ok) {
        const getData = await getResponse.json()
        setPlugins(getData.plugins)
      }

      setSelectedPlugin(newDomain.trim())
      setNewDomain("")
      setNewMinEmployees(100)
      setNewSignals("")
      setNewPersonas("")
      setShowPluginForm(false)
      
      alert("Plugin created successfully!")

    } catch (error) {
      console.error(error)
      setErrorMessage("Failed to create custom plugin.")
    }
  }


  // =====================================
  // AGENT STATE & LOGS HELPERS
  // =====================================

  const getAgentStatus = (agentName) => {
    const agents = [
      "Planner Agent",
      "Search Agent",
      "Qualification Agent",
      "Recommendation Agent"
    ]
    const agentIndex = agents.indexOf(agentName)
    const activeIndex = agents.indexOf(activeAgent)

    if (activeAgent === "Completed") return "completed"
    if (activeAgent === "Failed" && activeIndex === agentIndex) return "failed"
    if (activeAgent === "Failed" && agentIndex < activeIndex) return "completed"
    if (activeAgent === "Failed") return "idle"
    if (activeAgent === agentName) return "active"
    if (activeIndex > agentIndex) return "completed"
    return "idle"
  }

  const getAgentCardStyles = (agentName) => {
    const status = getAgentStatus(agentName)
    switch(status) {
      case "active":
        return "border-emerald-400 bg-white scale-[1.02] shadow-[0_8px_24px_rgba(16,185,129,0.15)] animate-pulse-glow text-emerald-950 font-medium"
      case "completed":
        return "border-emerald-200 bg-emerald-50/40 shadow-sm opacity-100 text-emerald-900"
      case "failed":
        return "border-red-350 bg-red-50/50 shadow-[0_4px_12px_rgba(239,68,68,0.08)] text-red-900"
      default:
        return "border-zinc-200/80 bg-white/50 opacity-80 hover:opacity-100 hover:border-emerald-250 hover:bg-white/80 hover:shadow-sm"
    }
  }

  const getAgentSubtext = (agentName) => {
    const status = getAgentStatus(agentName)
    if (status === "active") {
      if (agentName === "Planner Agent") return "Synthesizing constraints and identifying target domain..."
      if (agentName === "Search Agent") return "Scanning prospects database for matching keywords..."
      if (agentName === "Qualification Agent") return "Evaluating company sizes and custom filters..."
      if (agentName === "Recommendation Agent") return "Formulating personalized outreach strategies..."
    }
    if (status === "completed") {
      if (agentName === "Planner Agent") return `Planner targets set: ${result?.domain || 'SaaS'}`
      if (agentName === "Search Agent") return `Scan finished: ${result?.matched_companies?.length || 0} companies found`
      if (agentName === "Qualification Agent") return `Scoring complete: ${result?.qualified_companies?.length || 0} passed filters`
      if (agentName === "Recommendation Agent") return "Personalized campaigns generated successfully"
    }
    if (status === "failed") return "Process execution aborted due to error"
    return "Pending pipeline trigger..."
  }

  const getAgentIcon = (agentName) => {
    switch(agentName) {
      case "Planner Agent":
        return (
          <svg className="w-5 h-5 text-cyan-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        )
      case "Search Agent":
        return (
          <svg className="w-5 h-5 text-purple-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )
      case "Qualification Agent":
        return (
          <svg className="w-5 h-5 text-pink-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        )
      case "Recommendation Agent":
        return (
          <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20" />
          </svg>
        )
      default:
        return null
    }
  }

  const getTerminalLogs = () => {
    if (!result) return []
    const logs = []
    logs.push(`[SYSTEM_MONITOR] Init B2B Orchestration Pipeline...`)
    logs.push(`[PLANNER] Detected target domain: ${result.domain}`)
    logs.push(`[PLANNER] Custom search signals: ${result.signals?.join(", ")}`)
    logs.push(`[SEARCH] Querying prospects database...`)
    
    if (result.matched_companies?.length > 0) {
      logs.push(`[SEARCH] Found ${result.matched_companies.length} prospects matching domain: ${result.domain}`)
      result.matched_companies.forEach(c => {
        logs.push(`  ├─ ${c.company} (Employees: ${c.employee_count})`)
      })
    } else {
      logs.push(`[SEARCH] No matching prospects found for domain: ${result.domain}`)
    }
    
    logs.push(`[QUALIFICATION] Executing candidate score evaluations...`)
    if (result.decision_trace && result.decision_trace.length > 0) {
      result.decision_trace.forEach(trace => {
        const passIcon = trace.decision === "Qualified" ? "PASS" : "FAIL"
        logs.push(`  ├─ ${trace.company}: [${passIcon}] Confidence Score: ${trace.confidence}%`)
        trace.reasons?.forEach(r => {
          logs.push(`  │   └─ ${r}`)
        })
      })
    }
    
    logs.push(`[RECOMMENDATION] Formulating campaign copy...`)
    if (result.final_recommendations && !result.final_recommendations.includes("failed")) {
      logs.push(`[SYSTEM_MONITOR] Orchestration completed successfully.`)
    } else {
      logs.push(`[SYSTEM_MONITOR] Execution completed with warnings/errors.`)
    }
    return logs
  }


  // =====================================
  // UI
  // =====================================

  return (

    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-indigo-50/50 to-pink-50 text-zinc-800 overflow-hidden flex flex-col font-sans relative">

      {/* Decorative Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-full bg-sky-200/20 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute top-[30%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-pink-200/20 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-10%] left-[20%] w-[35vw] h-[35vw] rounded-full bg-emerald-200/20 blur-[120px] pointer-events-none -z-10" />

      {/* Header Banner */}
      <div className="border-b border-white/50 bg-white/75 backdrop-blur-md px-6 py-4 flex items-center justify-between shrink-0 shadow-sm relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <h1 className="text-lg font-extrabold tracking-wider font-mono bg-gradient-to-r from-sky-600 via-emerald-600 to-pink-600 bg-clip-text text-transparent">
            B2B AGENT ORCHESTRATION TERMINAL
          </h1>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-zinc-500">
          <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 border border-zinc-200">
            FASTAPI RUNNING
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            LANGGRAPH WORKFLOW
          </span>
        </div>
      </div>

      <div className="
        grid
        grid-cols-12
        gap-6
        p-6
        flex-1
        overflow-hidden
      ">

        {/* ================================= */}
        {/* LEFT PANEL: INPUT & CONTROLS */}
        {/* ================================= */}

        <div className="
          col-span-3
          bg-white/80
          backdrop-blur-md
          border
          border-sky-100/80
          shadow-lg
          shadow-sky-100/20
          rounded-2xl
          p-6
          flex
          flex-col
          overflow-y-auto
          h-full
          transition-all
          hover:shadow-sky-100/40
        ">

          <h2 className="
            text-base
            font-bold
            mb-4
            flex
            items-center
            gap-2
            text-sky-700
            font-mono
            uppercase
            tracking-wider
          ">
            <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            1. Search Intent
          </h2>

          <textarea
            placeholder="Describe your ideal prospective company and product fit details..."
            value={query}
            onChange={(e) =>
              setQuery(e.target.value)
            }
            className="
              w-full
              h-48
              bg-white/90
              border
              border-sky-200/80
              focus:border-sky-400
              focus:ring-4
              focus:ring-sky-100
              sky-input-highlight
              selection:bg-sky-200
              selection:text-sky-950
              caret-sky-500
              rounded-xl
              p-4
              outline-none
              resize-none
              font-sans
              text-sm
              placeholder-zinc-400
              text-zinc-800
              transition-all
              duration-300
              shadow-inner
            "
          />

          {/* ================================= */}
          {/* PLUGIN SELECT */}
          {/* ================================= */}

          <div className="mt-6 flex flex-col gap-2">
            <label className="text-xs font-mono text-sky-600 uppercase tracking-wider">
              2. Domain Override Plugin
            </label>
            <select
              value={selectedPlugin}
              onChange={(e) =>
                setSelectedPlugin(
                  e.target.value
                )
              }
              className="
                w-full
                bg-white/90
                border
                border-sky-200/80
                focus:border-sky-400
                focus:ring-4
                focus:ring-sky-100
                p-3.5
                rounded-xl
                outline-none
                font-mono
                text-sm
                text-zinc-700
                transition-all
                duration-300
              "
            >
              <option value="">
                No Plugin (Dynamic Routing)
              </option>
              {plugins.map((plugin, index) => (
                <option
                  key={index}
                  value={plugin.domain}
                >
                  {plugin.domain} Plugin
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs font-mono border-t border-zinc-150 pt-3">
            <span className="text-zinc-500">Pipeline Config:</span>
            <span className="font-bold text-emerald-600">
              {selectedPlugin ? `${selectedPlugin}` : 'Gemini Auto'}
            </span>
          </div>

          {/* Create Custom Plugin Accordion */}
          <div className="mt-4 border-t border-zinc-150 pt-4">
            <button
              onClick={() => setShowPluginForm(!showPluginForm)}
              className="text-xs font-mono text-sky-600 hover:text-sky-500 font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              {showPluginForm ? "− Hide Plugin Creator" : "+ Create Custom Plugin"}
            </button>

            {showPluginForm && (
              <form onSubmit={handleCreatePlugin} className="mt-4 space-y-3 bg-white/90 border border-sky-100 p-4 rounded-xl shadow-inner">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-sky-500 uppercase">Domain Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Retail"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    className="bg-white/95 border border-sky-200 rounded-lg p-2 text-xs outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all duration-200 caret-sky-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-sky-500 uppercase">Min Employees</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="100"
                    value={newMinEmployees}
                    onChange={(e) => setNewMinEmployees(parseInt(e.target.value) || 100)}
                    className="bg-white/95 border border-sky-200 rounded-lg p-2 text-xs outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all duration-200 caret-sky-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-sky-500 uppercase">Signals (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="customer analytics, smart checkout"
                    value={newSignals}
                    onChange={(e) => setNewSignals(e.target.value)}
                    className="bg-white/95 border border-sky-200 rounded-lg p-2 text-xs outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all duration-200 caret-sky-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-sky-500 uppercase">Personas (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="CTO, Product Lead"
                    value={newPersonas}
                    onChange={(e) => setNewPersonas(e.target.value)}
                    className="bg-white/95 border border-sky-200 rounded-lg p-2 text-xs outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all duration-200 caret-sky-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 rounded-lg text-xs uppercase tracking-wider transition-all cursor-pointer mt-1 hover:shadow-md hover:shadow-sky-100"
                >
                  Create Plugin
                </button>
              </form>
            )}
          </div>

          <div className="mt-auto pt-6">
            <button
              onClick={runWorkflow}
              className={`
                w-full
                py-4
                rounded-xl
                font-bold
                tracking-wider
                uppercase
                text-sm
                transition-all
                duration-300
                cursor-pointer
                ${loading 
                  ? 'bg-zinc-100 text-zinc-400 border border-zinc-200 shadow-none cursor-not-allowed' 
                  : 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white hover:from-sky-600 hover:to-indigo-600 hover:shadow-[0_4px_15px_rgba(14,165,233,0.35)]'
                }
              `}
            >
              {loading ? "Searching..." : "Search for Business"}
            </button>
          </div>

        </div>


        {/* ================================= */}
        {/* CENTER PANEL: PIPELINE & TERMINAL */}
        {/* ================================= */}

        <div className="
          col-span-6
          bg-white/80
          backdrop-blur-md
          border
          border-emerald-100/80
          shadow-lg
          shadow-emerald-100/20
          rounded-2xl
          p-6
          flex
          flex-col
          overflow-y-auto
          h-full
          transition-all
          hover:shadow-emerald-100/40
        ">

          <h2 className="
            text-base
            font-bold
            mb-6
            flex
            items-center
            gap-2
            text-zinc-800
            font-mono
            uppercase
            tracking-wider
          ">
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Active Pipeline Graph
          </h2>

          {errorMessage && (
            <div className="
              bg-red-50
              border
              border-red-200
              text-red-600
              p-4
              rounded-xl
              mb-5
              font-mono
              text-xs
            ">
              [CRITICAL ERROR] {errorMessage}
            </div>
          )}


          <div className="flex flex-col gap-2">

            {[
              "Planner Agent",
              "Search Agent",
              "Qualification Agent",
              "Recommendation Agent"
            ].map((agent, index) => {
              const status = getAgentStatus(agent);
              const isActive = status === "active";
              const isCompleted = status === "completed";
              return (
                <div key={index} className="flex flex-col shrink-0">
                  <div
                    className={`
                      p-5
                      rounded-xl
                      border
                      relative
                      overflow-hidden
                      transition-all
                      duration-500
                      flex
                      flex-col
                      justify-between
                      h-28
                      ${getAgentCardStyles(agent)}
                    `}
                  >
                    {isActive && <div className="scan-line" />}
                    
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-sm flex items-center gap-2.5 text-zinc-800">
                        {getAgentIcon(agent)}
                        {agent}
                      </h3>
                      <span className="text-xs uppercase tracking-wider px-2.5 py-0.5 rounded font-mono font-bold bg-zinc-100 text-zinc-600">
                        {status}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-500 mt-2 font-mono leading-relaxed">
                      {getAgentSubtext(agent)}
                    </p>
                  </div>
                  
                  {index < 3 && (
                    <div className="flex justify-center my-1 shrink-0">
                      <div className="w-[3px] h-6 bg-zinc-200/50 rounded-full relative overflow-hidden">
                        <div 
                          className={`absolute top-0 left-0 w-full rounded-full transition-all duration-500 ${
                            isCompleted ? "h-full bg-emerald-500 shadow-[0_0_8px_#10b981]" :
                            isActive ? "h-1/2 bg-emerald-400 animate-pulse" :
                            "h-0"
                          }`} 
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

          </div>

          {/* ================================= */}
          {/* TERMINAL LOG */}
          {/* ================================= */}
          {result && (
            <div className="mt-5 bg-zinc-900/95 backdrop-blur-md border border-zinc-800 rounded-xl p-5 shadow-2xl relative shrink-0">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/80 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-[10px] text-zinc-400 font-mono ml-1.5">orchestrator_log.sh</span>
                </div>
              </div>
              <div className="font-mono text-xs text-zinc-300 space-y-1.5 h-44 overflow-y-auto pr-1 select-text selection:bg-emerald-500/30">
                {getTerminalLogs().map((log, index) => {
                  let colorClass = "text-zinc-500";
                  if (log.startsWith("[SYSTEM_MONITOR]")) colorClass = "text-cyan-400 font-semibold";
                  else if (log.startsWith("[PLANNER]")) colorClass = "text-yellow-500/70";
                  else if (log.startsWith("[SEARCH]")) colorClass = "text-purple-400/70";
                  else if (log.startsWith("[QUALIFICATION]")) colorClass = "text-pink-400/70";
                  else if (log.includes("[PASS]")) colorClass = "text-emerald-400 font-semibold";
                  else if (log.includes("[FAIL]")) colorClass = "text-red-400 font-semibold";
                  
                  return (
                    <div key={index} className={`${colorClass} leading-5 whitespace-pre-wrap`}>
                      {log}
                    </div>
                  );
                })}
              </div>
            </div>
          )}


          {/* ================================= */}
          {/* CHATBOT */}
          {/* ================================= */}

          {result && (

            <div className="
              mt-5
              bg-emerald-50/40
              border
              border-emerald-100
              p-5
              rounded-xl
              shrink-0
            ">

              <h2 className="
                text-xs
                font-bold
                mb-2.5
                text-emerald-600
                font-mono
                uppercase
                tracking-wider
              ">
                AI Clarification Assistant
              </h2>

              <div className="flex gap-3">
                <textarea
                  value={chatQuestion}
                  onChange={(e) =>
                    setChatQuestion(
                      e.target.value
                    )
                  }
                  placeholder="Ask a clarifying question about the recommendations..."
                  className="
                    flex-1
                    bg-white/95
                    border
                    border-emerald-200
                    focus:border-emerald-450
                    focus:ring-4
                    focus:ring-emerald-100
                    emerald-input-highlight
                    selection:bg-emerald-200
                    selection:text-emerald-950
                    caret-emerald-500
                    p-3
                    h-14
                    rounded-lg
                    outline-none
                    font-sans
                    text-sm
                    resize-none
                    transition-all
                    duration-300
                  "
                />

                <button
                  onClick={askChatbot}
                  className="
                    bg-emerald-500
                    text-white
                    px-5
                    rounded-lg
                    font-bold
                    text-xs
                    uppercase
                    hover:bg-emerald-600
                    hover:shadow-[0_4px_12px_rgba(16,185,129,0.25)]
                    transition-all
                    cursor-pointer
                  "
                >
                  Send
                </button>
              </div>

              {chatResponse && (

                <div className="
                  mt-3
                  bg-white/90
                  border
                  border-emerald-100
                  p-4
                  rounded-lg
                  whitespace-pre-wrap
                  text-xs
                  font-sans
                  text-zinc-700
                  leading-relaxed
                  shadow-sm
                ">
                  <span className="text-emerald-600 font-bold block mb-1">RESPONSE:</span>
                  {chatResponse}

                </div>

              )}

            </div>

          )}

        </div>


        {/* ================================= */}
        {/* RIGHT PANEL: RESULTS */}
        {/* ================================= */}

        <div className="
          col-span-3
          bg-white/80
          backdrop-blur-md
          border
          border-pink-100/80
          shadow-lg
          shadow-pink-100/20
          rounded-2xl
          p-6
          overflow-y-auto
          h-full
          transition-all
          hover:shadow-pink-100/40
        ">

          <h2 className="
            text-base
            font-bold
            mb-6
            flex
            items-center
            gap-2
            text-pink-700
            font-mono
            uppercase
            tracking-wider
          ">
            <svg className="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            3. Search Results
          </h2>

          {loading ? (

            <div className="space-y-4 animate-pulse">
              {/* Skeleton Domain */}
              <div className="bg-pink-50/30 border border-pink-100 p-4 rounded-xl h-20 relative overflow-hidden flex flex-col justify-center">
                <div className="bg-pink-100/50 h-3 w-1/4 rounded mb-2 animate-shimmer" />
                <div className="bg-pink-100/50 h-4 w-1/2 rounded animate-shimmer" />
              </div>
              {/* Skeleton Signals */}
              <div className="bg-pink-50/30 border border-pink-100 p-4 rounded-xl h-24 relative overflow-hidden flex flex-col justify-center">
                <div className="bg-pink-100/50 h-3 w-1/3 rounded mb-3 animate-shimmer" />
                <div className="flex gap-2">
                  <div className="bg-pink-100/60 h-6 w-16 rounded-full animate-shimmer" />
                  <div className="bg-pink-100/60 h-6 w-20 rounded-full animate-shimmer" />
                  <div className="bg-pink-100/60 h-6 w-24 rounded-full animate-shimmer" />
                </div>
              </div>
              {/* Skeleton Qualified Companies */}
              <div className="bg-pink-50/30 border border-pink-100 p-4 rounded-xl h-48 relative overflow-hidden flex flex-col justify-center">
                <div className="bg-pink-100/50 h-3 w-1/2 rounded mb-4 animate-shimmer" />
                <div className="bg-pink-100/60 h-10 w-full rounded-lg mb-2 animate-shimmer" />
                <div className="bg-pink-100/60 h-10 w-full rounded-lg animate-shimmer" />
              </div>
            </div>

          ) : result ? (

            <div className="space-y-6">


                            <div className="
                bg-pink-50/40
                border
                border-pink-100
                p-4
                rounded-xl
              ">

                <h3 className="
                  text-xs
                  font-mono
                  text-pink-700
                  mb-2
                  uppercase
                  tracking-wider
                ">
                  Target Domain
                </h3>

                <p className="text-sm font-bold text-pink-650 font-mono">
                  {result.domain}
                </p>

              </div>


              {/* SIGNALS */}

              <div className="
                bg-pink-50/40
                border
                border-pink-100
                p-4
                rounded-xl
              ">

                <h3 className="
                  text-xs
                  font-mono
                  text-pink-700
                  mb-2.5
                  uppercase
                  tracking-wider
                ">
                  Target Signals
                </h3>

                <div className="
                  flex
                  flex-wrap
                  gap-1.5
                ">

                  {result.signals?.map(
                    (signal, index) => (

                    <span
                      key={index}
                      className="
                        bg-pink-50
                        text-pink-600
                        border
                        border-pink-300/30
                        px-3
                        py-1
                        rounded-full
                        text-xs
                        font-mono
                      "
                    >
                      {signal}
                    </span>

                  ))}

                </div>

              </div>


              {/* QUALIFIED COMPANIES */}

              <div className="
                bg-pink-50/40
                border
                border-pink-100
                p-4
                rounded-xl
              ">

                <h3 className="
                  text-xs
                  font-mono
                  text-pink-700
                  mb-3.5
                  uppercase
                  tracking-wider
                ">
                  Qualified Prospects
                </h3>

                <div className="space-y-4">

                  {result.qualified_companies?.length > 0 ? (

                    result.qualified_companies.map(
                      (company, index) => (

                      <div
                        key={index}
                        className="
                          bg-white/95
                          border
                          border-pink-100
                          p-4
                          rounded-xl
                          shadow-sm
                          hover:shadow-md
                          hover:border-pink-200
                          transition-all
                          duration-300
                        "
                      >

                        <div className="
                          flex
                          justify-between
                          items-center
                         border-b
                         border-pink-100/50
                         pb-2
                         mb-3
                        ">

                          <h4 className="font-bold text-sm text-zinc-800">
                            {company.company}
                          </h4>

                          <span className="
                            text-xs
                            font-mono
                            font-bold
                            text-pink-600
                          ">
                            {company.confidence}%
                          </span>

                        </div>

                        <div className="
                          mt-2
                          space-y-1.5
                          font-mono
                          text-xs
                          font-medium
                        ">

                          {company.reasons?.map(
                            (reason, i) => (

                            <p
                              key={i}
                              className="
                                text-zinc-500
                                leading-relaxed
                              "
                            >
                              • {reason}
                            </p>

                          ))}

                        </div>


                        {/* ACCEPT / REJECT */}

                        <div className="
                          flex
                          gap-2
                          mt-4
                        ">

                          <button

                            onClick={async () => {

                              await sendFeedback(

                                "accept",

                                "",

                                company

                              )

                              alert(
                                `Accepted ${company.company}`
                              )

                            }}

                            className="
                              flex-1
                              bg-emerald-50
                              text-emerald-600
                              border
                              border-emerald-500/20
                              hover:bg-emerald-600
                              hover:text-white
                              hover:border-emerald-650
                              py-2
                              rounded-lg
                              text-xs
                              font-bold
                              font-mono
                              transition-all
                              cursor-pointer
                            "
                          >
                            Accept
                          </button>


                          <button

                            onClick={async () => {

                              const reason = prompt(
                                "Why are you rejecting?"
                              )

                              if (reason) {

                                await sendFeedback(
                                  "reject",
                                  reason,
                                  company
                                )

                                alert(
                                  `Rejected ${company.company}`
                                )

                              }

                            }}

                            className="
                              flex-1
                              bg-red-50
                              text-red-650
                              border
                              border-red-500/20
                              hover:bg-red-600
                              hover:text-white
                              hover:border-red-650
                              py-2
                              rounded-lg
                              text-xs
                              font-bold
                              font-mono
                              transition-all
                              cursor-pointer
                            "
                          >
                            Reject
                          </button>

                        </div>

                      </div>

                    ))

                  ) : (

                    <p className="
                      text-xs
                      font-mono
                      text-red-400
                    ">
                      No qualified companies found.
                    </p>

                  )}

                </div>

              </div>


              {/* RECOMMENDATIONS */}

              <div className="
                bg-gradient-to-br
                from-indigo-50/40
                via-purple-50/30
                to-pink-50/40
                border
                border-indigo-100
                p-5
                rounded-xl
                shadow-sm
                shadow-indigo-100/10
                hover:shadow-md
                hover:border-indigo-200
                transition-all
                duration-300
              ">

                <h3 className="
                  text-xs
                  font-mono
                  text-indigo-950/80
                  mb-2.5
                  uppercase
                  tracking-wider
                ">
                  AI Outreach Recommendation
                </h3>

                <p className="
                  text-zinc-800
                  font-sans
                  leading-relaxed
                  text-xs
                  font-medium
                ">
                  <TypewriterText text={result.final_recommendations} />
                </p>

              </div>

            </div>

          ) : (

            <div className="text-xs text-zinc-555 font-mono">
              Ready to compile recommendations...
            </div>

          )}

        </div>

      </div>

    </div>

  )

}
