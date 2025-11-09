"use client";

import { useState, useRef, useEffect } from "react";

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
};

interface PathwayStep {
  type: "degree" | "transfer" | "internship" | "exam";
  level: string;
  name: string;
  description: string;
}

interface PathwayData {
  title: string;
  steps: PathwayStep[];
}

// List of MDC's actual bachelor's programs (from https://www.mdc.edu/academics/programs/bachelors.aspx)
const MDC_BACHELORS_PROGRAMS = [
  "Bachelor of Science in Nursing",
  "Bachelor of Applied Sciences in Leadership and Management Innovation",
  "Bachelor of Applied Sciences in Supply Chain Management",
  "Bachelor of Science in Early Childhood Education",
  "Bachelor of Science in Exceptional Student Education",
  "Bachelor of Science in Secondary Mathematics Education",
  "Bachelor of Science in Secondary Science Education",
  "Bachelor of Science in Applied Artificial Intelligence",
  "Bachelor of Science in Cybersecurity",
  "Bachelor of Science in Data Analytics",
  "Bachelor of Science in Electrical and Computer Engineering Technology",
  "Bachelor of Applied Science in Film, Television & Digital Production",
  "Bachelor of Science in Information Systems Technology",
  "Bachelor of Applied Sciences in Health Sciences",
  "Bachelor of Applied Sciences in Public Safety Management",
  "Bachelor of Science in Biological Sciences",
];

// Helper function to check if a program is an MDC bachelor's program
function isMDCBachelorsProgram(programName: string): boolean {
  const normalizedName = programName.toLowerCase().trim();
  return MDC_BACHELORS_PROGRAMS.some((program) =>
    normalizedName.includes(program.toLowerCase())
  );
}

// Helper function to check if a program is a valid MDC Associate in Arts (A.A.) program
// A.A. programs follow the pattern: "Associate in Arts in [Subject]" or "Associate in Arts in Engineering - [Specialization]"
function isMDCAssociateInArtsProgram(programName: string): boolean {
  const normalizedName = programName.toLowerCase().trim();
  
  // Must start with "Associate in Arts"
  if (!normalizedName.startsWith("associate in arts")) {
    return false;
  }
  
  // Must have a subject after "Associate in Arts in"
  // Valid patterns:
  // - "Associate in Arts in [Subject]"
  // - "Associate in Arts in Engineering - [Specialization]"
  if (normalizedName.includes("associate in arts in")) {
    // Extract the part after "Associate in Arts in"
    const afterPrefix = normalizedName.replace(/^associate in arts in\s*/, "");
    
    // Must have some content after the prefix
    if (afterPrefix.trim().length === 0) {
      return false;
    }
    
    // For engineering programs, must have a specialization after the dash
    if (afterPrefix.includes("engineering -")) {
      const specialization = afterPrefix.split("engineering -")[1]?.trim();
      return specialization && specialization.length > 0;
    }
    
    // For other programs, just need a subject name
    return afterPrefix.trim().length > 0;
  }
  
  return false;
}

// Mapping of program name variations to their preferred MDC URLs
// When multiple options exist, this selects the most appropriate one
const PROGRAM_URL_MAPPINGS: Record<string, string> = {
  // Engineering programs - prefer the specific engineering specialization
  "mechanical engineering": "mechanicalengineering",
  "civil engineering": "civilengineering",
  "electrical engineering": "electricalengineering",
  "computer engineering": "computerengineering",
  "industrial engineering": "industrialengineering",
  "ocean engineering": "oceanengineering",
  "geomatics engineering": "geomaticsengineering",
  "surveying and mapping": "geomaticsengineering",
  
  // Common program name variations
  "nursing": "nursing",
  "computer science": "computerscience",
  "information systems technology": "informationsystemstechnology",
  "information technology": "informationsystemstechnology",
  "cybersecurity": "cybersecurity",
  "data analytics": "dataanalytics",
  "biological sciences": "biologicalsciences",
  "biology": "biology",
  "early childhood education": "earlychildhoodeducation",
  "exceptional student education": "exceptionalstudenteducation",
  "secondary mathematics education": "secondarymathematicseducation",
  "secondary science education": "secondaryscienceeducation",
  "health sciences": "healthsciences",
  "public safety management": "publicsafetymanagement",
  "leadership and management innovation": "leadershipandmanagementinnovation",
  "supply chain management": "supplychainmanagement",
  "film television digital production": "filmtvdigitalproduction",
  "applied artificial intelligence": "appliedartificialintelligence",
  "electrical and computer engineering technology": "electricalandcomputerengineeringtechnology",
};

// Helper function to extract the first program option when multiple are listed
// Handles patterns like: "Engineering - Mechanical or Civil" or "Biology or Chemistry"
function extractFirstProgramOption(programName: string): string {
  // Check for common separators: " or ", " and ", ", "
  const separators = [/\s+or\s+/i, /\s+and\s+/i, /,\s+/];
  
  for (const separator of separators) {
    if (separator.test(programName)) {
      // Split and take the first option
      const parts = programName.split(separator);
      if (parts.length > 1) {
        // Return the first part, which should be the first program option
        return parts[0].trim();
      }
    }
  }
  
  // If no separator found, return the original name
  return programName.trim();
}

// Helper function to find the best matching URL for a program
function findBestProgramUrl(programName: string): string | null {
  const normalized = programName.toLowerCase().trim();
  
  // Check for exact matches in mapping
  for (const [key, url] of Object.entries(PROGRAM_URL_MAPPINGS)) {
    if (normalized.includes(key)) {
      return `https://www.mdc.edu/${url}/`;
    }
  }
  
  return null;
}

// Helper function to convert program name to MDC URL slug
function getMDCProgramUrl(programName: string): string {
  // Extract the first program option if multiple are listed
  // This allows the title to show all options, but the link goes to one specific program
  const singleProgram = extractFirstProgramOption(programName);
  
  // First, try to find a mapped URL (handles multiple options)
  const mappedUrl = findBestProgramUrl(singleProgram);
  if (mappedUrl) {
    return mappedUrl;
  }
  
  // Remove common prefixes
  let slug = singleProgram
    .replace(/^Associate in Arts in /i, "")
    .replace(/^Associate in Science in /i, "")
    .replace(/^Associate in /i, "")
    .replace(/^Bachelor of Science in /i, "")
    .replace(/^Bachelor of Arts in /i, "")
    .replace(/^Bachelor of Applied Sciences in /i, "")
    .replace(/^Bachelor of Applied Science in /i, "")
    .replace(/^Bachelor of /i, "")
    .replace(/^Certificate in /i, "")
    .replace(/^Certificate /i, "")
    .trim();

  // Handle special cases for engineering programs
  // Extract the engineering specialization (e.g., "Engineering - Mechanical" -> "Mechanical Engineering")
  if (slug.includes("Engineering - ")) {
    const specialization = slug.split("Engineering - ")[1]?.trim();
    if (specialization) {
      // Handle cases like "Mechanical or Civil" - take the first one
      const firstSpecialization = extractFirstProgramOption(specialization);
      slug = `${firstSpecialization} Engineering`;
    }
  }

  // Convert to URL-friendly format: lowercase, remove spaces and special characters
  slug = slug
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters except spaces and hyphens
    .replace(/\s+/g, "") // Remove all spaces
    .replace(/-/g, ""); // Remove hyphens

  // Return the MDC program URL
  return `https://www.mdc.edu/${slug}/`;
}

export default function Home() {
  const [careerInput, setCareerInput] = useState("");
  const [showClearBtn, setShowClearBtn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("MDC Details");
  const [modalContent, setModalContent] = useState<string>("");
  const [pathwayData, setPathwayData] = useState<PathwayData | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setShowClearBtn(careerInput.length > 0);
  }, [careerInput]);

  useEffect(() => {
    if (modalOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [modalOpen]);

  const showLoading = (message: string) => {
    setLoadingMessage(message || "Loading...");
    setLoading(true);
  };

  const hideLoading = () => {
    setLoading(false);
  };

  const showModal = (title: string, content: string) => {
    setModalTitle(title);
    setModalContent(content);
    setModalOpen(true);
  };

  const hideModal = () => {
    setModalOpen(false);
  };

  const callAPI = async (career: string, retries = 3, delay = 1000) => {
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch("/api/generate-pathway", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ career }),
          signal: abortController.signal,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`
          );
        }

        const result = await response.json();
        return result;
      } catch (error: any) {
        if (error.name === "AbortError") {
          console.log("Fetch aborted by user.");
          throw error;
        }
        console.error(`API call attempt ${i + 1} failed:`, error);
        if (i === retries - 1) {
          throw error;
        }
        await new Promise((res) => setTimeout(res, delay * Math.pow(2, i)));
      } finally {
        if (i === retries - 1) {
          abortControllerRef.current = null;
        }
      }
    }
  };

  const handleGeneratePathway = async () => {
    const career = careerInput.trim();
    if (!career) {
      showModal(
        "Error",
        '<p class="text-red-600">Please enter a career title.</p>'
      );
      return;
    }

    showLoading(`Generating pathway for ${career}...`);

    try {
      const generatedData = await callAPI(career);
      setPathwayData(generatedData);
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Error generating custom pathway:", error);
        showModal(
          "Generation Failed",
          `<p class="text-red-600">Sorry, I couldn't generate a pathway for that career. Please try a different prompt.<br><br><small>Error: ${error.message}</small></p>`
        );
      }
    } finally {
      hideLoading();
    }
  };

  const handleCancelLoad = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log("Fetch request cancelled.");
    }
    hideLoading();
  };

  const handleHelp = () => {
    showModal(
      "How to use MyMDC Pathway?",
      `
      <div class="space-y-4 text-gray-700">
        <p>1. Type your desired career (e.g., "Software Engineer" or "Nurse") into the text box.</p>
        <p>2. Press <kbd class="px-2 py-1 bg-gray-200 rounded-md text-sm">Enter</kbd> or click the blue arrow button to generate a personalized educational pathway.</p>
        <p>3. The pathway will show you recommended degrees from MDC, potential transfer steps to universities, and other milestones like internships and exams.</p>
      </div>
    `
    );
  };

  const handleClearInput = () => {
    setCareerInput("");
    setShowClearBtn(false);
  };

  const handleClearPathway = () => {
    setPathwayData(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleGeneratePathway();
    }
  };

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
                  style={{ display: "block" }}
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
                const stepTypeClass = `flowchart-step-${step.type}`;
                const IconComponent = icons[step.type];

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
                        {step.type === "transfer" && (
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
                        {step.type === "degree" &&
                          ((step.level.includes("MDC") &&
                            !step.name.toLowerCase().includes("bachelor") &&
                            (step.name.toLowerCase().includes("associate in science") ||
                              isMDCAssociateInArtsProgram(step.name))) ||
                            step.name.toLowerCase().includes("certificate") ||
                            (step.name.toLowerCase().includes("bachelor") &&
                              isMDCBachelorsProgram(step.name))) && (
                            <a
                              href={getMDCProgramUrl(step.name)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150"
                            >
                              <i className="fas fa-external-link-alt mr-2" />{" "}
                              View Program Page
                            </a>
                          )}
                      </div>
                    </div>
                  </div>
                );
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
              hideModal();
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
  );
}
