"use client"

import { useState, useEffect } from "react"

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
        return "border-emerald-500/80 bg-emerald-950/10 scale-[1.02] shadow-[0_0_20px_rgba(16,185,129,0.15)] animate-pulse-glow"
      case "completed":
        return "border-emerald-500/40 bg-zinc-900/60 opacity-90 shadow-sm"
      case "failed":
        return "border-red-500/80 bg-red-950/20 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
      default:
        return "border-zinc-800/80 bg-zinc-900/10 opacity-40 hover:opacity-60"
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

    <div className="min-h-screen bg-[#040407] text-[#f4f4f7] overflow-hidden flex flex-col font-sans">

      {/* Header Banner */}
      <div className="border-b border-white/5 bg-[#08080d]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <h1 className="text-md font-bold tracking-wider font-mono text-zinc-200">
            B2B AGENT ORCHESTRATION TERMINAL
          </h1>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500">
          <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/5">
            FASTAPI RUNNING
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
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
          bg-[#07070a]/60
          border
          border-white/5
          backdrop-blur-md
          rounded-2xl
          p-5
          flex
          flex-col
          overflow-y-auto
          h-full
        ">

          <h2 className="
            text-sm
            font-bold
            mb-4
            flex
            items-center
            gap-2
            text-zinc-300
            font-mono
            uppercase
            tracking-wider
          ">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            1. Query Intent
          </h2>

          <textarea
            placeholder="Describe your ideal prospective company and product fit details..."
            value={query}
            onChange={(e) =>
              setQuery(e.target.value)
            }
            className="
              w-full
              h-44
              bg-zinc-950/60
              border
              border-zinc-800/80
              focus:border-emerald-500/40
              focus:ring-1
              focus:ring-emerald-500/20
              rounded-xl
              p-4
              outline-none
              resize-none
              font-mono
              text-xs
              placeholder-zinc-600
              transition-all
            "
          />

          {/* ================================= */}
          {/* PLUGIN SELECT */}
          {/* ================================= */}

          <div className="mt-6 flex flex-col gap-2">
            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
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
                bg-zinc-950/60
                border
                border-zinc-800/80
                focus:border-emerald-500/40
                p-3
                rounded-xl
                outline-none
                font-mono
                text-xs
                transition-all
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

          <div className="mt-3 flex items-center justify-between text-[11px] font-mono border-t border-zinc-900 pt-3">
            <span className="text-zinc-500">Pipeline Config:</span>
            <span className="font-bold text-emerald-400">
              {selectedPlugin ? `${selectedPlugin}` : 'Gemini Auto'}
            </span>
          </div>

          <div className="mt-auto pt-6">
            <button
              onClick={runWorkflow}
              className="
                w-full
                bg-emerald-500
                text-black
                py-3.5
                rounded-xl
                font-bold
                tracking-wider
                uppercase
                text-[11px]
                hover:bg-emerald-400
                hover:shadow-[0_0_20px_rgba(16,185,129,0.35)]
                transition-all
                duration-300
                cursor-pointer
              "
            >
              Execute Orchestrator
            </button>
          </div>

        </div>


        {/* ================================= */}
        {/* CENTER PANEL: PIPELINE & TERMINAL */}
        {/* ================================= */}

        <div className="
          col-span-6
          bg-[#07070a]/60
          border
          border-white/5
          backdrop-blur-md
          rounded-2xl
          p-5
          flex
          flex-col
          overflow-y-auto
          h-full
        ">

          <h2 className="
            text-sm
            font-bold
            mb-4
            flex
            items-center
            gap-2
            text-zinc-300
            font-mono
            uppercase
            tracking-wider
          ">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Active Pipeline Graph
          </h2>

          {errorMessage && (
            <div className="
              bg-red-500/10
              border
              border-red-500/20
              text-red-400
              p-4
              rounded-xl
              mb-5
              font-mono
              text-[11px]
            ">
              [CRITICAL ERROR] {errorMessage}
            </div>
          )}


          <div className="grid grid-cols-2 gap-4">

            {[
              "Planner Agent",
              "Search Agent",
              "Qualification Agent",
              "Recommendation Agent"
            ].map((agent, index) => {
              const status = getAgentStatus(agent);
              return (
                <div
                  key={index}
                  className={`
                    p-4
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
                  {status === "active" && <div className="scan-line" />}
                  
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-xs flex items-center gap-2 text-zinc-200">
                      <span className={`w-2 h-2 rounded-full ${
                        status === "active" ? "bg-emerald-400 animate-pulse" :
                        status === "completed" ? "bg-emerald-500" :
                        status === "failed" ? "bg-red-500" :
                        "bg-zinc-700"
                      }`} />
                      {agent}
                    </h3>
                    <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-mono font-bold bg-white/5 text-zinc-400">
                      {status}
                    </span>
                  </div>

                  <p className="text-[10px] text-zinc-400 mt-2 font-mono leading-relaxed">
                    {getAgentSubtext(agent)}
                  </p>
                </div>
              );
            })}

          </div>

          {/* ================================= */}
          {/* TERMINAL LOG */}
          {/* ================================= */}
          {result && (
            <div className="mt-5 bg-zinc-950 border border-zinc-900 rounded-xl p-4 shadow-2xl relative shrink-0">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/30 border border-red-500/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/30 border border-yellow-500/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/30 border border-green-500/20" />
                  <span className="text-[9px] text-zinc-500 font-mono ml-1.5">orchestrator_log.sh</span>
                </div>
              </div>
              <div className="font-mono text-[10px] text-zinc-300 space-y-1 h-36 overflow-y-auto pr-1 select-text selection:bg-emerald-500/30">
                {getTerminalLogs().map((log, index) => {
                  let colorClass = "text-zinc-500";
                  if (log.startsWith("[SYSTEM_MONITOR]")) colorClass = "text-cyan-400 font-semibold";
                  else if (log.startsWith("[PLANNER]")) colorClass = "text-yellow-500/70";
                  else if (log.startsWith("[SEARCH]")) colorClass = "text-purple-400/70";
                  else if (log.startsWith("[QUALIFICATION]")) colorClass = "text-pink-400/70";
                  else if (log.includes("[PASS]")) colorClass = "text-emerald-400 font-semibold";
                  else if (log.includes("[FAIL]")) colorClass = "text-red-400 font-semibold";
                  
                  return (
                    <div key={index} className={`${colorClass} leading-4 whitespace-pre-wrap`}>
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
              bg-zinc-950/40
              border
              border-zinc-900
              p-4
              rounded-xl
              shrink-0
            ">

              <h2 className="
                text-xs
                font-bold
                mb-2.5
                text-emerald-400
                font-mono
                uppercase
                tracking-wider
              ">
                AI Clarification Assistant
              </h2>

              <div className="flex gap-2">
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
                    bg-zinc-950/80
                    border
                    border-zinc-800
                    focus:border-emerald-500/40
                    p-2.5
                    h-12
                    rounded-lg
                    outline-none
                    font-mono
                    text-[11px]
                    resize-none
                  "
                />

                <button
                  onClick={askChatbot}
                  className="
                    bg-emerald-500
                    text-black
                    px-4
                    rounded-lg
                    font-bold
                    text-[10px]
                    uppercase
                    hover:bg-emerald-400
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
                  bg-[#0a0a0f]
                  border
                  border-zinc-900
                  p-3
                  rounded-lg
                  whitespace-pre-wrap
                  text-[10px]
                  font-mono
                  text-zinc-300
                  leading-relaxed
                ">
                  <span className="text-emerald-400 font-bold block mb-1">LOG: RESPONSE</span>
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
          bg-[#07070a]/60
          border
          border-white/5
          backdrop-blur-md
          rounded-2xl
          p-5
          overflow-y-auto
          h-full
        ">

          <h2 className="
            text-sm
            font-bold
            mb-6
            flex
            items-center
            gap-2
            text-zinc-300
            font-mono
            uppercase
            tracking-wider
          ">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            3. Execution Output
          </h2>

          {loading ? (

            <div className="text-emerald-400 font-mono text-[11px] flex items-center gap-2">
              <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full" />
              Compiling Graph...
            </div>

          ) : result ? (

            <div className="space-y-5">


              {/* DOMAIN */}

              <div className="
                bg-zinc-950/40
                border
                border-zinc-900
                p-3.5
                rounded-xl
              ">

                <h3 className="
                  text-[10px]
                  font-mono
                  text-zinc-500
                  mb-1.5
                  uppercase
                  tracking-wider
                ">
                  Target Domain
                </h3>

                <p className="text-xs font-bold text-emerald-400 font-mono">
                  {result.domain}
                </p>

              </div>


              {/* SIGNALS */}

              <div className="
                bg-zinc-950/40
                border
                border-zinc-900
                p-3.5
                rounded-xl
              ">

                <h3 className="
                  text-[10px]
                  font-mono
                  text-zinc-500
                  mb-2
                  uppercase
                  tracking-wider
                ">
                  Target Signals
                </h3>

                <div className="
                  flex
                  flex-wrap
                  gap-1
                ">

                  {result.signals?.map(
                    (signal, index) => (

                    <span
                      key={index}
                      className="
                        bg-emerald-500/10
                        text-emerald-400
                        border
                        border-emerald-500/15
                        px-2
                        py-0.5
                        rounded-full
                        text-[9px]
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
                bg-zinc-950/40
                border
                border-zinc-900
                p-3.5
                rounded-xl
              ">

                <h3 className="
                  text-[10px]
                  font-mono
                  text-zinc-500
                  mb-3
                  uppercase
                  tracking-wider
                ">
                  Qualified Prospects
                </h3>

                <div className="space-y-3">

                  {result.qualified_companies?.length > 0 ? (

                    result.qualified_companies.map(
                      (company, index) => (

                      <div
                        key={index}
                        className="
                          bg-[#08080d]/85
                          border
                          border-zinc-800/60
                          p-3
                          rounded-lg
                        "
                      >

                        <div className="
                          flex
                          justify-between
                          items-center
                         border-b
                         border-zinc-900
                         pb-1.5
                         mb-2
                        ">

                          <h4 className="font-bold text-xs text-zinc-300">
                            {company.company}
                          </h4>

                          <span className="
                            text-[10px]
                            font-mono
                            font-bold
                            text-emerald-400
                          ">
                            {company.confidence}%
                          </span>

                        </div>

                        <div className="
                          mt-1
                          space-y-1
                         font-mono
                         text-[9px]
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
                          gap-1.5
                          mt-3
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
                              bg-emerald-500/10
                              text-emerald-400
                              border
                              border-emerald-500/20
                              hover:bg-emerald-500
                              hover:text-black
                              hover:border-emerald-500
                              py-1.5
                              rounded
                              text-[10px]
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
                              bg-red-500/10
                              text-red-400
                              border
                              border-red-500/20
                              hover:bg-red-500
                              hover:text-white
                              hover:border-red-500
                              py-1.5
                              rounded
                              text-[10px]
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
                      text-[10px]
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
                bg-zinc-950/40
                border
                border-zinc-900
                p-3.5
                rounded-xl
              ">

                <h3 className="
                  text-[10px]
                  font-mono
                  text-zinc-500
                  mb-2
                  uppercase
                  tracking-wider
                ">
                  AI Outreach Recommendation
                </h3>

                <p className="
                  text-zinc-300
                  font-mono
                  leading-relaxed
                  whitespace-pre-wrap
                  text-[10px]
                ">
                  {result.final_recommendations}
                </p>

              </div>

            </div>

          ) : (

            <div className="text-[10px] text-zinc-600 font-mono">
              Ready to compile recommendations...
            </div>

          )}

        </div>

      </div>

    </div>

  )

}
