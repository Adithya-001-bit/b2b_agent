
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
  // AGENT STYLE
  // =====================================

  const getAgentClass = (agentName) => {

    if (activeAgent === agentName) {

      return `
        border-green-500
        bg-green-500/10
        scale-105
      `
    }

    return "border-zinc-700"

  }


  // =====================================
  // UI
  // =====================================

  return (

    <div className="min-h-screen bg-black text-white">

      <div className="
        grid
        grid-cols-12
        gap-4
        p-6
        h-screen
      ">


        {/* ================================= */}
        {/* LEFT PANEL */}
        {/* ================================= */}

        <div className="
          col-span-3
          bg-zinc-900
          rounded-2xl
          p-5
          overflow-auto
        ">

          <h2 className="
            text-2xl
            font-bold
            mb-6
          ">
            Domain Query
          </h2>


          <textarea
            placeholder="
            Enter business query...
            "
            value={query}
            onChange={(e) =>
              setQuery(e.target.value)
            }
            className="
              w-full
              h-40
              bg-zinc-800
              rounded-xl
              p-4
              outline-none
            "
          />


          {/* ================================= */}
          {/* PLUGIN SELECT */}
          {/* ================================= */}

          <select

            value={selectedPlugin}

            onChange={(e) =>
              setSelectedPlugin(
                e.target.value
              )
            }

            className="
              w-full
              bg-zinc-800
              p-3
              rounded-xl
              mt-4
              outline-none
            "
          >

            <option value="">
              No Plugin Selected
            </option>

            {plugins.map((plugin, index) => (

              <option
                key={index}
                value={plugin.domain}
              >
                {plugin.domain}
              </option>

            ))}

          </select>


          <p className="
            text-green-400
            mt-2
          ">

            Selected Plugin:
            {" "}
            {selectedPlugin}

          </p>


          <button
            onClick={runWorkflow}
            className="
              mt-4
              w-full
              bg-white
              text-black
              py-3
              rounded-xl
              font-semibold
              hover:bg-gray-200
              transition
            "
          >
            Run Workflow
          </button>

        </div>


        {/* ================================= */}
        {/* CENTER PANEL */}
        {/* ================================= */}

        <div className="
          col-span-6
          bg-zinc-900
          rounded-2xl
          p-5
          overflow-auto
        ">

          <h2 className="
            text-2xl
            font-bold
            mb-6
          ">
            Agent Workflow
          </h2>

          {errorMessage && (
            <div className="
              bg-red-500/20
              border
              border-red-500
              text-red-200
              p-4
              rounded-xl
              mb-6
            ">
              {errorMessage}
            </div>
          )}


          <div className="space-y-4">

            {[
              "Planner Agent",
              "Search Agent",
              "Qualification Agent",
              "Recommendation Agent"
            ].map((agent, index) => (

              <div
                key={index}
                className={`
                  p-5
                  rounded-xl
                  border
                  transition-all
                  duration-500
                  ${getAgentClass(agent)}
                `}
              >

                <h3 className="
                  font-bold
                  text-lg
                ">
                  {agent}
                </h3>

                <p className="
                  text-sm
                  text-gray-400
                  mt-2
                ">
                  AI orchestration in progress...
                </p>

              </div>

            ))}

          </div>


          {/* ================================= */}
          {/* CHATBOT */}
          {/* ================================= */}

          {result && (

            <div className="
              mt-10
              bg-zinc-800
              p-5
              rounded-2xl
            ">

              <h2 className="
                text-xl
                font-bold
                mb-4
                text-green-400
              ">
                AI Clarification Assistant
              </h2>

              <textarea
                value={chatQuestion}
                onChange={(e) =>
                  setChatQuestion(
                    e.target.value
                  )
                }
                placeholder="
                Ask about recommendations...
                "
                className="
                  w-full
                  bg-zinc-900
                  p-4
                  rounded-xl
                  outline-none
                "
              />

              <button
                onClick={askChatbot}
                className="
                  mt-4
                  bg-green-500
                  text-black
                  px-6
                  py-3
                  rounded-xl
                  font-semibold
                "
              >
                Ask AI
              </button>

              {chatResponse && (

                <div className="
                  mt-6
                  bg-black
                  p-4
                  rounded-xl
                  whitespace-pre-wrap
                  text-gray-300
                ">

                  {chatResponse}

                </div>

              )}

            </div>

          )}

        </div>


        {/* ================================= */}
        {/* RIGHT PANEL */}
        {/* ================================= */}

        <div className="
          col-span-3
          bg-zinc-900
          rounded-2xl
          p-5
          overflow-auto
        ">

          <h2 className="
            text-2xl
            font-bold
            mb-6
          ">
            Results
          </h2>

          {loading ? (

            <div className="text-green-400">
              Running AI Workflow...
            </div>

          ) : result ? (

            <div className="space-y-6">


              {/* DOMAIN */}

              <div className="
                bg-zinc-800
                p-4
                rounded-xl
              ">

                <h3 className="
                  text-lg
                  font-bold
                  mb-2
                ">
                  Domain
                </h3>

                <p className="text-green-400">
                  {result.domain}
                </p>

              </div>


              {/* SIGNALS */}

              <div className="
                bg-zinc-800
                p-4
                rounded-xl
              ">

                <h3 className="
                  text-lg
                  font-bold
                  mb-2
                ">
                  Signals
                </h3>

                <div className="
                  flex
                  flex-wrap
                  gap-2
                ">

                  {result.signals?.map(
                    (signal, index) => (

                    <span
                      key={index}
                      className="
                        bg-green-500/20
                        text-green-400
                        px-3
                        py-1
                        rounded-full
                        text-sm
                      "
                    >
                      {signal}
                    </span>

                  ))}

                </div>

              </div>


              {/* QUALIFIED COMPANIES */}

              <div className="
                bg-zinc-800
                p-4
                rounded-xl
              ">

                <h3 className="
                  text-lg
                  font-bold
                  mb-4
                ">
                  Qualified Companies
                </h3>

                <div className="space-y-4">

                  {result.qualified_companies?.length > 0 ? (

                    result.qualified_companies.map(
                      (company, index) => (

                      <div
                        key={index}
                        className="
                          bg-zinc-700
                          p-4
                          rounded-xl
                        "
                      >

                        <div className="
                          flex
                          justify-between
                          items-center
                        ">

                          <h4 className="font-bold">
                            {company.company}
                          </h4>

                          <span className="
                            text-green-400
                          ">
                            {company.confidence}%
                          </span>

                        </div>

                        <div className="
                          mt-3
                          space-y-1
                        ">

                          {company.reasons.map(
                            (reason, i) => (

                            <p
                              key={i}
                              className="
                                text-sm
                                text-gray-300
                              "
                            >
                              • {reason}
                            </p>

                          ))}

                        </div>


                        {/* ACCEPT / REJECT */}

                        <div className="
                          flex
                          gap-3
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
                              bg-green-500
                              px-4
                              py-2
                              rounded-lg
                              text-black
                              font-semibold
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
                              bg-red-500
                              px-4
                              py-2
                              rounded-lg
                              text-white
                              font-semibold
                            "
                          >
                            Reject
                          </button>

                        </div>

                      </div>

                    ))

                  ) : (

                    <p className="
                      text-red-400
                    ">
                      No qualified companies found.
                    </p>

                  )}

                </div>

              </div>


              {/* RECOMMENDATIONS */}

              <div className="
                bg-zinc-800
                p-4
                rounded-xl
              ">

                <h3 className="
                  text-lg
                  font-bold
                  mb-4
                ">
                  AI Recommendations
                </h3>

                <p className="
                  text-gray-300
                  whitespace-pre-wrap
                  text-sm
                ">
                  {result.final_recommendations}
                </p>

              </div>

            </div>

          ) : (

            <div className="text-gray-400">
              Final recommendations appear here...
            </div>

          )}

        </div>

      </div>

    </div>

  )

}

