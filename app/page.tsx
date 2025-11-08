'use client'

import { useState, useRef, useEffect } from 'react'

// SVG Icons
const icons = {
  degree: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.747 0-3.332.477-4.5 1.253"
      />
    </svg>
  ),
  transfer: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
      />
    </svg>
  ),
  internship: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  ),
  exam: (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
}

interface PathwayStep {
  type: 'degree' | 'transfer' | 'internship' | 'exam'
  level: string
  name: string
  description: string
}

interface PathwayData {
  title: string
  steps: PathwayStep[]
}

export default function Home() {
  const [careerInput, setCareerInput] = useState('')
  const [showClearBtn, setShowClearBtn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('Loading...')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTitle, setModalTitle] = useState('MDC Details')
  const [modalContent, setModalContent] = useState<string>('')
  const [pathwayData, setPathwayData] = useState<PathwayData | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
  const genModel = 'gemini-2.5-flash-preview-09-2025'
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${genModel}:generateContent?key=${apiKey}`

  useEffect(() => {
    setShowClearBtn(careerInput.length > 0)
  }, [careerInput])

  useEffect(() => {
    if (modalOpen) {
      document.body.classList.add('modal-open')
    } else {
      document.body.classList.remove('modal-open')
    }
    return () => {
      document.body.classList.remove('modal-open')
    }
  }, [modalOpen])

  const showLoading = (message: string) => {
    setLoadingMessage(message || 'Loading...')
    setLoading(true)
  }

  const hideLoading = () => {
    setLoading(false)
  }

  const showModal = (title: string, content: string) => {
    setModalTitle(title)
    setModalContent(content)
    setModalOpen(true)
  }

  const hideModal = () => {
    setModalOpen(false)
  }

  const callGemini = async (payload: any, retries = 3, delay = 1000) => {
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: abortController.signal,
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()

        if (result.candidates && result.candidates.length > 0) {
          return result
        } else if (result.promptFeedback) {
          throw new Error(`Request blocked: ${result.promptFeedback.blockReason}`)
        } else {
          throw new Error('No candidates returned from API.')
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.log('Fetch aborted by user.')
          throw error
        }
        console.error(`API call attempt ${i + 1} failed:`, error)
        if (i === retries - 1) {
          throw error
        }
        await new Promise((res) => setTimeout(res, delay * Math.pow(2, i)))
      } finally {
        if (i === retries - 1) {
          abortControllerRef.current = null
        }
      }
    }
  }

  const handleGeneratePathway = async () => {
    const career = careerInput.trim()
    if (!career) {
      showModal('Error', '<p class="text-red-600">Please enter a career title.</p>')
      return
    }

    showLoading(`Generating pathway for ${career}...`)

    const systemPrompt = `You are a career and academic advisor at Miami Dade College (MDC). Your task is to generate an educational pathway for a student interested in a specific career.

When selecting an MDC degree or certificate, use your knowledge of programs listed on MDC's official program pages (associate: https://www.mdc.edu/academics/programs/associate.aspx, bachelor: https://www.mdc.edu/academics/programs/bachelor.aspx, certificate: https://www.mdc.edu/academics/programs/certificate.aspx) to ensure the recommendation is accurate and relevant.

For ANY step with type 'degree' (A.A., A.S., B.S., M.S., etc.), the 'name' field MUST contain the full, official program title, such as "Associate in Arts in Biology" or "Associate in Science in Nursing". Do not use generic names.

The pathway MUST start with an MDC degree/certificate, include a transfer step if it's an A.A./A.S., and list key internships, optional or required exams/certifications, and optional advanced degrees (M.S., Ph.D.).

You must only respond with a JSON object.`

    const userQuery = `Generate the pathway for a "${career}".`

    const pathwaySchema = {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING', description: `Pathway to becoming a ${career}` },
        steps: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              type: {
                type: 'STRING',
                enum: ['degree', 'transfer', 'internship', 'exam'],
              },
              level: {
                type: 'STRING',
                description:
                  "e.g., A.A. (MDC), B.S., M.S. (Optional), or type of step",
              },
              name: {
                type: 'STRING',
                description: 'Name of the degree, exam, or step',
              },
              description: {
                type: 'STRING',
                description: 'A 1-2 sentence description of this step.',
              },
            },
            required: ['type', 'level', 'name', 'description'],
          },
        },
      },
      required: ['title', 'steps'],
    }

    const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: pathwaySchema,
      },
    }

    try {
      const result = await callGemini(payload)
      const text = result.candidates[0].content.parts[0].text
      const generatedData = JSON.parse(text)
      setPathwayData(generatedData)
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error generating custom pathway:', error)
        showModal(
          'Generation Failed',
          `<p class="text-red-600">Sorry, I couldn't generate a pathway for that career. Please try a different prompt.<br><br><small>Error: ${error.message}</small></p>`
        )
      }
    } finally {
      hideLoading()
    }
  }

  const handleCancelLoad = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      console.log('Fetch request cancelled.')
    }
    hideLoading()
  }

  const handleHelp = () => {
    showModal(
      'How to use MyMDC Pathway?',
      `
      <div class="space-y-4 text-gray-700">
        <p>1. Type your desired career (e.g., "Software Engineer" or "Nurse") into the text box.</p>
        <p>2. Press <kbd class="px-2 py-1 bg-gray-200 rounded-md text-sm">Enter</kbd> or click the blue arrow button to generate a personalized educational pathway.</p>
        <p>3. The pathway will show you recommended degrees from MDC, potential transfer steps to universities, and other milestones like internships and exams.</p>
      </div>
    `
    )
  }

  const handleClearInput = () => {
    setCareerInput('')
    setShowClearBtn(false)
  }

  const handleClearPathway = () => {
    setPathwayData(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleGeneratePathway()
    }
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Header Section */}
      <header className="p-6 md:p-8 text-center">
        <img
          src="https://mdcwap.mdc.edu/apply/assets/mdc-logo.png"
          alt="Miami Dade College Logo"
          className="h-16 w-auto mx-auto mb-4"
        />
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
          MyMDC Pathway
        </h1>
        <p className="text-gray-600 mt-2">
          Generate an educational pathway for your career.
        </p>
      </header>

      {/* Control Section */}
      <div className="px-6 pb-6 md:px-8 md:pb-8">
        <hr className="max-w-2xl mx-auto border-gray-200 mb-8" />

        <div className="max-w-2xl mx-auto">
          <label
            htmlFor="custom-career-input"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Specify your Career Choice:
            <i
              onClick={handleHelp}
              className="fas fa-question-circle text-blue-500 hover:text-blue-700 cursor-pointer ml-1"
            />
          </label>
          <div className="flex flex-col sm:flex-row items-center sm:space-x-2 space-y-2 sm:space-y-0">
            <div className="input-container">
              <input
                type="text"
                id="custom-career-input"
                value={careerInput}
                onChange={(e) => setCareerInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., Mechanical Engineer"
                className="w-full py-3 pl-5 pr-10 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {showClearBtn && (
                <span
                  id="clear-input-btn"
                  onClick={handleClearInput}
                  title="Clear input"
                  style={{ display: 'block' }}
                >
                  <i className="fas fa-times-circle" />
                </span>
              )}
            </div>
            <button
              id="generate-pathway-btn"
              onClick={handleGeneratePathway}
              className="flex-shrink-0 w-full sm:w-12 h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full shadow-md transition duration-200 flex items-center justify-center p-0"
            >
              <i className="fas fa-arrow-right" />
            </button>
          </div>
        </div>
      </div>

      {/* Infographic Display Area */}
      <div id="pathway-display" className="p-6 md:p-8">
        {pathwayData && (
          <>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {pathwayData.title}
              </h2>
              <button
                onClick={handleClearPathway}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg shadow w-full sm:w-auto flex-shrink-0"
              >
                <i className="fas fa-times mr-2" /> Clear Pathway
              </button>
            </div>

            <div className="flowchart-container">
              {pathwayData.steps.map((step, stepIndex) => {
                const stepTypeClass = `flowchart-step-${step.type}`
                const IconComponent = icons[step.type]

                return (
                  <div key={stepIndex}>
                    {stepIndex > 0 && <div className="flowchart-connector" />}
                    <div className={`flowchart-step ${stepTypeClass}`}>
                      <div className="flowchart-step-header">
                        <div className="flowchart-step-header-icon">
                          {IconComponent}
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wider">
                          {step.level || step.type}
                        </span>
                      </div>
                      <div className="flowchart-step-content">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {step.name}
                        </h3>
                        <p className="text-gray-600 mt-2">{step.description}</p>
                        {step.type === 'transfer' && (
                          <a
                            href="https://www.mdc.edu/transfer-information/transfer-agreements/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition duration-150"
                          >
                            <i className="fas fa-external-link-alt mr-2" /> View
                            Transfer Agreements
                          </a>
                        )}
                        {step.type === 'degree' && step.level.includes('MDC') && (
                          <a
                            href={`https://www.mdc.edu/search/?q=${encodeURIComponent(step.name)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150"
                          >
                            <i className="fas fa-external-link-alt mr-2" /> View
                            Program Page
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg shadow-xl flex flex-col items-center space-y-4">
            <div className="flex items-center space-x-4">
              <div className="loader" />
              <span className="text-gray-700 font-medium">
                {loadingMessage}
              </span>
            </div>
            <button
              onClick={handleCancelLoad}
              className="mt-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm font-medium rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Message Modal for AI Content */}
      {modalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              hideModal()
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <header className="p-5 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">{modalTitle}</h2>
              <button
                onClick={hideModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </header>
            <main
              className="p-6 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: modalContent }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

