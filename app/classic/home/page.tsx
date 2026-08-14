"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { icons } from "@/app/lib/icons";
import { PathwayOption, PathwayData, CareerPathway } from "@/app/lib/types";
import { CertificationInfo } from "@/app/lib/certifications";
import {
  isMDCBachelorsProgram,
  isMDCAssociateInArtsProgram,
  isMDCAssociateInScienceProgram,
  getMDCProgramUrl,
} from "@/app/lib/mdc-programs";
import { FLORIDA_UNIVERSITIES } from "@/app/lib/universities";
import { ExamStepComponent } from "@/app/components/ExamStep";
import SchoolSelector from "@/app/components/SchoolSelector";
import { useSelectedSchoolId } from "@/app/lib/useSelectedSchool";
import { getSchoolInfo } from "@/app/lib/schoolInfo";
import { DEFAULT_SCHOOL_ID } from "@/app/lib/floridaSchools";

export default function Home() {
  const [schoolId] = useSelectedSchoolId();
  const schoolInfo = getSchoolInfo(schoolId);
  const [careerInput, setCareerInput] = useState("");
  const [showClearBtn, setShowClearBtn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("MDC Details");
  const [modalContent, setModalContent] = useState<string>("");
  const [pathwayData, setPathwayData] = useState<PathwayData | null>(null);
  const [comparisonPathways, setComparisonPathways] = useState<CareerPathway[]>([]);
  const [showAddCareerInput, setShowAddCareerInput] = useState<boolean>(false);
  const [addCareerInput, setAddCareerInput] = useState<string>("");
  const [certificationPopup, setCertificationPopup] = useState<{
    name: string;
    info: CertificationInfo;
    careerIndex?: number;
  } | null>(null);
  const [transferRecommendationsPopup, setTransferRecommendationsPopup] =
    useState<boolean>(false);
  const [selectedPathwayIndex, setSelectedPathwayIndex] = useState<number>(0);
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

      // Handle backward compatibility: if old format (with "steps"), convert to new format
      let pathwayDataToSet: PathwayData;
      if ("steps" in generatedData && !("pathways" in generatedData)) {
        // Old format - convert to new format
        pathwayDataToSet = {
          title: generatedData.title,
          pathways: [
            {
              title: generatedData.title,
              isPrimary: true,
              steps: generatedData.steps,
            },
          ],
        };
      } else {
        // New format
        pathwayDataToSet = generatedData as PathwayData;
      }
      
      // First/main pathway (always set when using main search)
      setPathwayData(pathwayDataToSet);
      // Set selected pathway to primary (or first if no primary)
      if (pathwayDataToSet.pathways && pathwayDataToSet.pathways.length > 0) {
        const primaryIndex = pathwayDataToSet.pathways.findIndex(
          (p: PathwayOption) => p.isPrimary
        );
        setSelectedPathwayIndex(primaryIndex >= 0 ? primaryIndex : 0);
      }
      // Clear any previous comparisons when starting a new main search
      setComparisonPathways([]);
      setShowAddCareerInput(false);
      setAddCareerInput("");
      setCertificationPopup(null); // Close popup when new pathway is generated
      setTransferRecommendationsPopup(false); // Close transfer popup when new pathway is generated
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
        <p><strong>Generate a Pathway:</strong></p>
        <p>1. Type your desired career (e.g., "Software Engineer" or "Nurse") into the text box.</p>
        <p>2. Press <kbd class="px-2 py-1 bg-gray-200 rounded-md text-sm">Enter</kbd> or click the arrow button to generate a personalized educational pathway.</p>
        <p>3. The pathway will show you recommended degrees from MDC, potential transfer steps to universities, and other milestones like internships and exams.</p>
        <p class="mt-4"><strong>Compare Careers:</strong></p>
        <p>1. After generating a pathway, click the "+ Compare Another Career" button below the flowchart.</p>
        <p>2. Enter another career (e.g., "Electrical Engineer") in the search bar that appears.</p>
        <p>3. The new pathway will appear below the first one, allowing you to compare them side by side.</p>
        <p>4. You can add up to 4 careers total (1 main + 3 additional).</p>
        <p>5. Click the X button on any additional career to remove it from comparison.</p>
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
    // Don't clear comparison pathways - only clear the main pathway
    setShowAddCareerInput(false);
    setAddCareerInput("");
    setCertificationPopup(null); // Close popup when pathway is cleared
    setTransferRecommendationsPopup(false); // Close transfer popup when pathway is cleared
  };

  const handleRemoveFromComparison = (index: number) => {
    setComparisonPathways(comparisonPathways.filter((_, i) => i !== index));
  };

  const handlePathwaySelectInComparison = (careerIndex: number, pathwayIndex: number) => {
    const updated = [...comparisonPathways];
    updated[careerIndex].selectedPathwayIndex = pathwayIndex;
    setComparisonPathways(updated);
  };

  const handleAddCareerClick = () => {
    setShowAddCareerInput(true);
  };

  const handleAddCareerGenerate = async () => {
    if (!addCareerInput.trim()) {
      return;
    }
    const career = addCareerInput.trim();
    await handleGeneratePathwayForCareer(career);
  };

  const handleGeneratePathwayForCareer = async (career: string) => {
    showLoading(`Generating pathway for ${career}...`);
    try {
      const generatedData = await callAPI(career);
      
      let pathwayDataToSet: PathwayData;
      
      // Handle backward compatibility
      if ((generatedData as any).steps) {
        // Old format - convert to new format
        pathwayDataToSet = {
          title: (generatedData as any).title || `Pathway to becoming a ${career}`,
          pathways: [
            {
              title: "Primary Pathway",
              isPrimary: true,
              steps: (generatedData as any).steps,
            },
          ],
        };
      } else {
        // New format
        pathwayDataToSet = generatedData as PathwayData;
      }
      
      // Adding a career to comparison
      const primaryIndex = pathwayDataToSet.pathways.findIndex(
        (p: PathwayOption) => p.isPrimary
      );
      const selectedIndex = primaryIndex >= 0 ? primaryIndex : 0;
      
      if (comparisonPathways.length < 3) { // Max 4 total (1 main + 3 additional)
        setComparisonPathways([
          ...comparisonPathways,
          {
            career: career,
            data: pathwayDataToSet,
            selectedPathwayIndex: selectedIndex,
          },
        ]);
        setAddCareerInput(""); // Clear input
        setShowAddCareerInput(false); // Hide input
      } else {
        showModal(
          "Maximum Reached",
          '<p class="text-red-600">You can compare up to 4 careers at a time. Please remove one before adding another.</p>'
        );
      }
      
      setCertificationPopup(null);
      setTransferRecommendationsPopup(false);
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Error generating pathway:", error);
        showModal(
          "Generation Failed",
          `<p class="text-red-600">Failed to generate pathway. Please try again.</p>`
        );
      }
    } finally {
      hideLoading();
    }
  };

  const handleAddCareerKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCareerGenerate();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleGeneratePathway();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Bar - Centered school selector (click the logo to change school) */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <SchoolSelector />
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 md:px-8 pt-16 md:pt-24 pb-12 md:pb-16 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Main Title - Vocation */}
          <h1 className="text-7xl md:text-9xl font-bold mb-2 select-none">
            <span className="inline-flex text-school-600">
              {"Vocation".split("").map((letter, index) => (
                <span
                  key={index}
                  className="letter-fade-in"
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  {letter === " " ? "\u00A0" : letter}
                </span>
              ))}
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-base md:text-lg text-gray-700 mb-6">
            A powerful way to explore career pathways with AI
          </p>

          {/* Start Button - disabled until a real school is picked, since
              /pathway has nothing to generate against otherwise. */}
          <div className="flex flex-col items-center gap-2">
            {schoolId === DEFAULT_SCHOOL_ID ? (
              <>
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  title="Choose your school above to get started"
                  className="px-12 py-4 bg-gray-300 text-gray-500 font-semibold rounded-lg shadow-md text-lg inline-block cursor-not-allowed"
                >
                  Start
                </button>
                <p className="text-sm text-gray-500">
                  Choose your school above to get started.
                </p>
              </>
            ) : (
              <Link
                href="/classic/pathway"
                className="px-12 py-4 bg-school-600 hover:bg-school-700 text-white font-semibold rounded-lg shadow-md transition duration-200 text-lg inline-block"
              >
                Start
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Pathway display moved to /pathway page */}
      {/* Infographic Display Area - Hidden on home page */}
      <div id="pathway-display" className="p-6 md:p-8 hidden">
        {/* Main Pathway */}
        {pathwayData && pathwayData.pathways && pathwayData.pathways.length > 0 && (
          <>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
              <h2 className="text-2xl font-bold text-gray-800">
                {pathwayData.title.replace(/^(Educational\s+)?Pathway\s+to\s+becoming\s+(a\s+|an\s+)?/i, '')}
              </h2>
              <button
                onClick={handleClearPathway}
                className="text-gray-400 hover:text-gray-600"
                title="Clear Pathway"
              >
                <i className="fas fa-times text-xl" />
              </button>
            </div>

            {/* Pathway Tabs */}
            {pathwayData.pathways.length > 1 && (
              <div className="mb-6 border-b border-gray-200">
                <nav className="flex space-x-1 overflow-x-auto" aria-label="Pathway Tabs">
                  {pathwayData.pathways.map((pathway, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedPathwayIndex(index)}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                        selectedPathwayIndex === index
                          ? "border-school-500 text-school-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {pathway.isPrimary && (
                        <span className="mr-2 text-xs bg-school-100 text-school-700 px-2 py-0.5 rounded">
                          Recommended
                        </span>
                      )}
                      {pathway.title}
                    </button>
                  ))}
                </nav>
              </div>
            )}

            {/* Selected Pathway Display */}
            <div className="flowchart-container">
              {pathwayData.pathways[selectedPathwayIndex].steps.map(
                (step, stepIndex) => {
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
                            <div className="mt-4 space-y-2">
                              <button
                                onClick={() => setTransferRecommendationsPopup(true)}
                                className="w-full text-left text-sm font-semibold text-orange-700 hover:text-orange-800 focus:outline-none focus:underline flex items-center"
                              >
                                <i className="fas fa-info-circle mr-2" />
                                Recommendations
                              </button>
                              <a
                                href="https://www.mdc.edu/transfer-information/transfer-agreements/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition duration-150"
                              >
                                <i className="fas fa-external-link-alt mr-2" /> View
                                Transfer Agreements
                              </a>
                            </div>
                          )}
                          {step.type === "degree" &&
                            ((step.level.includes("MDC") &&
                              !step.name.toLowerCase().includes("bachelor") &&
                              (isMDCAssociateInScienceProgram(step.name) ||
                                isMDCAssociateInArtsProgram(step.name))) ||
                              step.name.toLowerCase().includes("certificate") ||
                              (step.name.toLowerCase().includes("bachelor") &&
                                isMDCBachelorsProgram(step.name))) && (
                              <a
                                href={getMDCProgramUrl(step.name)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-school-600 hover:bg-school-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-school-500 transition duration-150"
                              >
                                <i className="fas fa-external-link-alt mr-2" />{" "}
                                View Program Page
                              </a>
                            )}
                          {step.type === "exam" && (
                            <ExamStepComponent 
                              examName={step.name} 
                              examDescription={step.description}
                              onShowRequirements={(name, info) => setCertificationPopup({ name, info })}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            {/* Add Career Button - Only show if no additional careers have been added yet */}
            {comparisonPathways.length === 0 && !showAddCareerInput && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={handleAddCareerClick}
                  className="flex items-center justify-center px-6 py-3 bg-school-600 hover:bg-school-700 text-white font-medium rounded-full shadow-md transition-colors"
                >
                  <i className="fas fa-plus mr-2" />
                  Compare Another Career
                </button>
              </div>
            )}

            {/* Add Career Input - Only show if no comparison pathways exist yet */}
            {showAddCareerInput && comparisonPathways.length === 0 && (
              <div className="mt-8 flex justify-center">
                <div className="w-full max-w-md">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={addCareerInput}
                      onChange={(e) => setAddCareerInput(e.target.value)}
                      onKeyDown={handleAddCareerKeyDown}
                      placeholder="Enter another career (e.g., Electrical Engineer)"
                      className="flex-1 py-2 pl-4 pr-10 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-school-500 text-sm"
                      autoFocus
                    />
                    <button
                      onClick={handleAddCareerGenerate}
                      disabled={!addCareerInput.trim()}
                      className="px-4 py-2 bg-school-600 hover:bg-school-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-full transition-colors"
                    >
                      <i className="fas fa-arrow-right" />
                    </button>
                    <button
                      onClick={() => {
                        setShowAddCareerInput(false);
                        setAddCareerInput("");
                      }}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full transition-colors"
                    >
                      <i className="fas fa-times" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Additional Career Pathways - Render independently of main pathway */}
        {comparisonPathways.length > 0 && (
          <div className={pathwayData ? "mt-12 space-y-12" : "space-y-12"}>
            {comparisonPathways.map((careerPathway, careerIndex) => (
              <div key={careerIndex} className={pathwayData ? "border-t border-gray-300 pt-8" : ""}>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    {careerPathway.career}
                  </h2>
                  <button
                    onClick={() => handleRemoveFromComparison(careerIndex)}
                    className="text-gray-400 hover:text-gray-600"
                    title="Remove from comparison"
                  >
                    <i className="fas fa-times text-xl" />
                  </button>
                </div>

                {/* Pathway Tabs for this career */}
                {careerPathway.data.pathways.length > 1 && (
                  <div className="mb-6 border-b border-gray-200">
                    <nav className="flex space-x-1 overflow-x-auto" aria-label="Pathway Tabs">
                      {careerPathway.data.pathways.map((pathway, pathwayIndex) => (
                        <button
                          key={pathwayIndex}
                          onClick={() => handlePathwaySelectInComparison(careerIndex, pathwayIndex)}
                          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                            careerPathway.selectedPathwayIndex === pathwayIndex
                              ? "border-school-500 text-school-600"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          {pathway.isPrimary && (
                            <span className="mr-2 text-xs bg-school-100 text-school-700 px-2 py-0.5 rounded">
                              Recommended
                            </span>
                          )}
                          {pathway.title}
                        </button>
                      ))}
                    </nav>
                  </div>
                )}

                {/* Pathway Flowchart */}
                <div className="flowchart-container">
                  {careerPathway.data.pathways[careerPathway.selectedPathwayIndex].steps.map(
                    (step, stepIndex) => {
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
                                <div className="mt-4 space-y-2">
                                  <button
                                    onClick={() => setTransferRecommendationsPopup(true)}
                                    className="w-full text-left text-sm font-semibold text-orange-700 hover:text-orange-800 focus:outline-none focus:underline flex items-center"
                                  >
                                    <i className="fas fa-info-circle mr-2" />
                                    Recommendations
                                  </button>
                                  <a
                                    href="https://www.mdc.edu/transfer-information/transfer-agreements/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition duration-150"
                                  >
                                    <i className="fas fa-external-link-alt mr-2" /> View
                                    Transfer Agreements
                                  </a>
                                </div>
                              )}
                              {step.type === "degree" &&
                                ((step.level.includes("MDC") &&
                                  !step.name.toLowerCase().includes("bachelor") &&
                                  (isMDCAssociateInScienceProgram(step.name) ||
                                    isMDCAssociateInArtsProgram(step.name))) ||
                                  step.name.toLowerCase().includes("certificate") ||
                                  (step.name.toLowerCase().includes("bachelor") &&
                                    isMDCBachelorsProgram(step.name))) && (
                                  <a
                                    href={getMDCProgramUrl(step.name)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-school-600 hover:bg-school-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-school-500 transition duration-150"
                                  >
                                    <i className="fas fa-external-link-alt mr-2" />{" "}
                                    View Program Page
                                  </a>
                                )}
                              {step.type === "exam" && (
                                <ExamStepComponent 
                                  examName={step.name} 
                                  examDescription={step.description} 
                                  careerIndex={careerIndex}
                                  onShowRequirements={(name, info, idx) => setCertificationPopup({ name, info, careerIndex: idx })}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>

                {/* Add Career Button after last additional pathway - Only show if under limit */}
                {careerIndex === comparisonPathways.length - 1 && comparisonPathways.length < 3 && !showAddCareerInput && (
                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={handleAddCareerClick}
                      className="flex items-center justify-center px-6 py-3 bg-school-600 hover:bg-school-700 text-white font-medium rounded-full shadow-md transition-colors"
                    >
                      <i className="fas fa-plus mr-2" />
                      Compare Another Career
                    </button>
                  </div>
                )}

                {/* Add Career Input after last pathway */}
                {careerIndex === comparisonPathways.length - 1 && showAddCareerInput && (
                  <div className="mt-8 flex justify-center">
                    <div className="w-full max-w-md">
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={addCareerInput}
                          onChange={(e) => setAddCareerInput(e.target.value)}
                          onKeyDown={handleAddCareerKeyDown}
                          placeholder="Enter another career (e.g., Electrical Engineer)"
                          className="flex-1 py-2 pl-4 pr-10 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-school-500 text-sm"
                          autoFocus
                        />
                        <button
                          onClick={handleAddCareerGenerate}
                          disabled={!addCareerInput.trim()}
                          className="px-4 py-2 bg-school-600 hover:bg-school-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-full transition-colors"
                        >
                          <i className="fas fa-arrow-right" />
                        </button>
                        <button
                          onClick={() => {
                            setShowAddCareerInput(false);
                            setAddCareerInput("");
                          }}
                          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full transition-colors"
                        >
                          <i className="fas fa-times" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* How Vocation Works Section.
          The landing-page top padding is deliberately modest: with the hero's
          own pb-16 above it, a larger gap pushed the three cards past the fold
          on ~850-950px viewports (a very common laptop/desktop size), where
          they were clipped just enough to look broken rather than clearly
          "scroll for more". Keep the combined hero-bottom + section-top gap
          under ~120px. */}
      <div className={`px-6 md:px-8 pb-12 ${pathwayData ? 'pt-16' : 'pt-12 md:pt-16'}`}>
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            How Vocation Works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 bg-school-100 rounded-full mb-4">
                <span className="text-2xl font-bold text-school-600">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Enter Your Career
              </h3>
              <p className="text-gray-600 text-sm">
                Type in the career you're interested in pursuing, such as "Mechanical Engineer" or "Registered Nurse".
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 bg-school-100 rounded-full mb-4">
                <span className="text-2xl font-bold text-school-600">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Get Your Pathway
              </h3>
              <p className="text-gray-600 text-sm">
                Vocation generates a personalized educational pathway showing all the steps needed, from degree programs to licensure exams.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 bg-school-100 rounded-full mb-4">
                <span className="text-2xl font-bold text-school-600">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Explore & Compare
              </h3>
              <p className="text-gray-600 text-sm">
                Click on program links, view exam requirements, explore transfer options, and compare multiple career paths side-by-side.
              </p>
            </div>
          </div>
        </div>
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

      {/* Transfer Recommendations Popup */}
      {transferRecommendationsPopup && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setTransferRecommendationsPopup(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="p-5 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">
                Florida (In-State) University Transfer Recommendations
              </h2>
              <button
                onClick={() => setTransferRecommendationsPopup(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <i className="fas fa-times text-xl" />
              </button>
            </header>
            <main className="p-6 overflow-y-auto">
              <p className="text-sm text-gray-600 mb-4">
                MDC has strong articulation agreements with these Florida
                universities. Consider these options for your transfer:
              </p>
              <div className="space-y-4">
                {FLORIDA_UNIVERSITIES.map((university, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {university.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {university.location} • {university.type}
                        </p>
                      </div>
                      <a
                        href={university.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center"
                      >
                        Visit{" "}
                        <i className="fas fa-external-link-alt ml-1 text-xs" />
                      </a>
                    </div>
                    {university.notes && (
                      <p className="text-sm text-gray-600 mt-2">
                        {university.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <a
                  href="https://www.mdc.edu/transfer-information/transfer-agreements/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition duration-150"
                >
                  <i className="fas fa-external-link-alt mr-2" /> View MDC
                  Transfer Agreements
                </a>
              </div>
            </main>
          </div>
        </div>
      )}

      {/* Certification Requirements Popup */}
      {certificationPopup && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={() => setCertificationPopup(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="p-5 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">
                {certificationPopup.name} - Requirements
              </h2>
              <button
                onClick={() => setCertificationPopup(null)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <i className="fas fa-times text-xl" />
              </button>
            </header>
            <main className="p-6 overflow-y-auto">
              <ul className="space-y-2 text-sm text-gray-700 pl-5">
                {certificationPopup.info.requirements.map((req, idx) => (
                  <li
                    key={idx}
                    className="leading-relaxed list-disc list-outside"
                  >
                    {req}
                  </li>
                ))}
              </ul>
              <div className="mt-6 pt-6 border-t border-gray-200">
                <a
                  href={certificationPopup.info.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition duration-150"
                >
                  <i className="fas fa-external-link-alt mr-2" /> Visit Official
                  Website
                </a>
              </div>
            </main>
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

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid md:grid-cols-3 gap-8 text-sm text-gray-600">
            {/* Resources Column */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Resources</h3>
              <ul className="space-y-2">
                {schoolInfo.resources.map((resource) => (
                  <li key={resource.url}>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-school-600 transition-colors"
                    >
                      {resource.label}
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    href="/team"
                    className="hover:text-school-600 transition-colors"
                  >
                    Meet the Team
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <a 
                    href="/privacy" 
                    className="hover:text-school-600 transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a 
                    href="/terms" 
                    className="hover:text-school-600 transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
                {schoolInfo.accessibilityUrl && (
                  <li>
                    <a
                      href={schoolInfo.accessibilityUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-school-600 transition-colors"
                    >
                      Accessibility
                    </a>
                  </li>
                )}
              </ul>
            </div>

            {/* Contact & Disclaimer Column. Some schools publish no central
                advising address at all, so the heading is dropped rather than
                left standing over an empty list. */}
            <div>
              {schoolInfo.contacts.length > 0 && (
                <>
                  <h3 className="font-semibold text-gray-800 mb-3">Contact</h3>
                  <ul className="mb-4 space-y-1">
                    {schoolInfo.contacts.map((contact) => (
                      <li key={contact.email}>
                        {schoolInfo.contacts.length > 1 && (
                          <span className="text-gray-500">{contact.label}: </span>
                        )}
                        <a
                          href={`mailto:${contact.email}`}
                          className="hover:text-school-600 transition-colors"
                        >
                          {contact.email}
                        </a>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              <p className="text-xs text-gray-500 leading-relaxed">
                <strong>Disclaimer:</strong> Pathways are AI-generated suggestions and should be verified with academic advisors. Content may contain inaccuracies.
              </p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
            <p>© {new Date().getFullYear()} Vocation. All rights reserved.</p>
            <p className="mt-1">Powered by Google Gemini AI</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
