"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { icons } from "@/app/lib/icons";
import { PathwayStep, PathwayOption, PathwayData, CareerPathway } from "@/app/lib/types";
import { CertificationInfo } from "@/app/lib/certifications";
import {
  isMDCBachelorsProgram,
  isMDCAssociateInArtsProgram,
  isMDCAssociateInScienceProgram,
  getMDCProgramUrl,
} from "@/app/lib/mdc-programs";
import { FLORIDA_UNIVERSITIES } from "@/app/lib/universities";
import { ExamStepComponent } from "@/app/components/ExamStep";
import { calculateStepCostRange, calculatePathwayCostRange, formatCostRange } from "@/app/lib/cost";

const SUGGESTIONS = [
  "mechanical engineer",
  "nurse",
  "software developer",
  "rideshare driver",
  "MOS 09L",
  "program manager"
];

function PathwayPageContent() {
  const searchParams = useSearchParams();
  const [careerInput, setCareerInput] = useState("");
  const [showClearBtn, setShowClearBtn] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const [placeholderOpacity, setPlaceholderOpacity] = useState(1);
  const [displayedText, setDisplayedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [isFadingOut, setIsFadingOut] = useState(false);
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
  const [showEmptyError, setShowEmptyError] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [canType, setCanType] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [careerSuggestions, setCareerSuggestions] = useState<Array<{ 
    title: string; 
    description: string;
    salary?: string;
    jobOutlook?: string;
    competitiveness?: string;
  }>>([]);
  const [showCareerOptions, setShowCareerOptions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [autoGenerating, setAutoGenerating] = useState(false);
  const [showCostBreakdown, setShowCostBreakdown] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setShowClearBtn(careerInput.length > 0);
    
    // Filter suggestions based on input
    if (careerInput.length > 0) {
      const filtered = SUGGESTIONS.filter(suggestion =>
        suggestion.toLowerCase().includes(careerInput.toLowerCase())
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0 && careerInput !== filtered[0]);
    } else {
      setFilteredSuggestions(SUGGESTIONS);
      setShowSuggestions(true);
    }
  }, [careerInput]);

  // Typewriter effect for instruction text
  useEffect(() => {
    const fullText = " Generate a pathway for your career:";
    setDisplayedText("");
    setCanType(false); // block typing until animation finishes
    
    // Start typing after wave animation (1 second)
    const timeout = setTimeout(() => {
      let currentIndex = 0;
      const typingInterval = setInterval(() => {
        if (currentIndex < fullText.length) {
          setDisplayedText(fullText.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(typingInterval);
          // allow typing shortly after text finishes
          setTimeout(() => {
            setCanType(true);
            inputRef.current?.focus();
          }, 200);
        }
      }, 50); // Speed of typing (50ms per letter)

      return () => clearInterval(typingInterval);
    }, 1000);

    return () => clearTimeout(timeout);
  }, []);

  // Cycle through suggestions in placeholder with smooth fade
  useEffect(() => {
    if (careerInput.length === 0) {
      const interval = setInterval(() => {
        // Fade out
        setPlaceholderOpacity(0);
        
        // After fade out, change suggestion and fade in
        setTimeout(() => {
          setCurrentSuggestionIndex((prevIndex) => (prevIndex + 1) % SUGGESTIONS.length);
          setPlaceholderOpacity(1);
        }, 300); // Half of transition time
      }, 1000); // Change every 1 second

      return () => clearInterval(interval);
    } else {
      setPlaceholderOpacity(1);
    }
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
    // Start fade-out animation
    setIsFadingOut(true);
    // After fade-out completes, show loading state
    setTimeout(() => {
      setLoading(true);
      setIsFadingOut(false);
    }, 600); // Match fade-out animation duration
  };

  const hideLoading = () => {
    setLoading(false);
    setIsFadingOut(false);
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
          const err = new Error(
            errorData.error || `HTTP error! status: ${response.status}`
          );
          // Rate limited: retrying immediately only burns more quota, so
          // surface the "please wait" message to the user right away.
          if (response.status === 429) {
            (err as any).rateLimited = true;
          }
          throw err;
        }

        const result = await response.json();
        return result;
      } catch (error: any) {
        if (error.name === "AbortError") {
          console.log("Fetch aborted by user.");
          throw error;
        }
        if (error.rateLimited) {
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

  const getCareerSuggestions = async (input: string) => {
    setLoadingSuggestions(true);
    try {
      const response = await fetch("/api/get-career-suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input }),
      });

      if (!response.ok) {
        throw new Error("Failed to get career suggestions");
      }

      const data = await response.json();
      const suggestions = data.suggestions || [];
      setLoadingSuggestions(false);
      
      console.log("Received suggestions from API:", suggestions);
      
      // Ensure suggestions are in the correct format
      const formattedSuggestions = suggestions.map((s: any) => {
        if (typeof s === "string") {
          return { title: s, description: "", salary: "", jobOutlook: "", competitiveness: "" };
        }
        const formatted = {
          title: s.title || s.name || "",
          description: s.description || "",
          salary: s.salary || "",
          jobOutlook: s.jobOutlook || s.job_outlook || "",
          competitiveness: s.competitiveness || "",
        };
        console.log("Formatted suggestion:", formatted);
        return formatted;
      });
      
      console.log("Final formatted suggestions:", formattedSuggestions);
      return formattedSuggestions;
    } catch (error: any) {
      console.error("Error getting career suggestions:", error);
      setLoadingSuggestions(false);
      return [];
    }
  };

  const handleNextClick = async () => {
    const input = careerInput.trim();
    if (!input) {
      showModal(
        "Error",
        '<p class="text-red-600">Please enter a career title.</p>'
      );
      return;
    }

    // Clear any existing pathway data when starting new search
    setPathwayData(null);
    setShowCareerOptions(false);
    setCareerSuggestions([]);

    // First, get career suggestions
    const suggestions = await getCareerSuggestions(input);
    
    if (suggestions.length === 0) {
      // No suggestions found, show error
      showModal(
        "Invalid Input",
        '<p class="text-red-600">Please enter a valid career title.</p>'
      );
      return;
    }

    // Always show suggestions (even if just one) so user can confirm
    setCareerSuggestions(suggestions);
    setShowCareerOptions(true);
  };

  const handleGeneratePathway = async (selectedCareer?: string | { title: string; description: string }) => {
    const career = typeof selectedCareer === "string" 
      ? selectedCareer 
      : selectedCareer?.title || careerInput.trim();
    if (!career) {
      showModal(
        "Error",
        '<p class="text-red-600">Please enter a career title.</p>'
      );
      return;
    }

    // If we have suggestions showing, hide them immediately
    setShowCareerOptions(false);
    setCareerSuggestions([]);
    
    // Immediately hide search bar and show loading to prevent flash
    setIsFadingOut(true);
    setLoading(true);
    setLoadingMessage("Generating pathway");

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
      setAutoGenerating(false); // Reset auto-generating flag
    } catch (error: any) {
      if (error.name !== "AbortError") {
        console.error("Error generating custom pathway:", error);
        showModal(
          "Generation Failed",
          `<p class="text-red-600">Sorry, I couldn't generate a pathway for that career. Please try a different prompt.<br><br><small>Error: ${error.message}</small></p>`
        );
      }
      setAutoGenerating(false); // Reset auto-generating flag on error
    } finally {
      hideLoading();
    }
  };

  // Handle career parameter from URL (e.g., from career discovery page)
  useEffect(() => {
    const careerParam = searchParams.get("career");
    if (careerParam && !autoGenerating && !pathwayData) {
      const decodedCareer = decodeURIComponent(careerParam);
      setCareerInput(decodedCareer);
      // Update word and character counts
      const words = decodedCareer.trim().split(/\s+/).filter(Boolean);
      setWordCount(words.length);
      setCharCount(decodedCareer.length);
      
      // Automatically generate pathway without showing search bar
      setAutoGenerating(true);
      setIsFadingOut(true);
      // Wait for fade-out, then start generating
      setTimeout(() => {
        handleGeneratePathway(decodedCareer);
      }, 300);
    }
  }, [searchParams, autoGenerating, pathwayData]);

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
        <p>2. Press <kbd class="px-2 py-1 bg-gray-200 rounded-md text-sm">Enter</kbd> or click the blue arrow button to generate a personalized educational pathway.</p>
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
    // Navigate to /pathway to reset everything, same as the Start button on home page
    // This ensures a fresh page load with the typewriter effect and no previous input
    window.location.href = '/pathway';
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
    showLoading("Generating pathway");
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
          `<p class="text-red-600">Failed to generate pathway.<br><br><small>${error.message}</small></p>`
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
      handleNextClick(); // Go through career options first
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Bar - Centered Logo */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <Link href="/">
            <img
              src="https://mdcwap.mdc.edu/apply/assets/mdc-logo.png"
              alt="Miami Dade College Logo"
              className="h-10 w-auto cursor-pointer"
            />
          </Link>
        </div>
      </header>

      {/* Search Section / Loading / Flowchart Display Area */}
      <section className="px-6 md:px-8 pt-24 md:pt-32 pb-24 md:pb-32">
        {/* Career Options View - Shows when options are available */}
        {!pathwayData && showCareerOptions && (
          <div className="max-w-6xl mx-auto">
            {/* Centered Input at Top */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="input-container w-full relative">
                <input
                  ref={inputRef}
                  type="text"
                  id="custom-career-input"
                  value={careerInput}
                  onChange={(e) => {
                    if (!canType) return;
                    let value = e.target.value;

                    // Enforce character limit (max 50)
                    if (value.length > 50) {
                      value = value.slice(0, 50);
                    }

                    // Enforce word limit (max 5 words)
                    let words = value.trim().split(/\s+/).filter(Boolean);
                    if (words.length > 5) {
                      words = words.slice(0, 5);
                      value = words.join(" ");
                    }

                    setCareerInput(value);
                  }}
                  placeholder={careerInput.length === 0 ? SUGGESTIONS[currentSuggestionIndex] : "project manager"}
                  className={`w-full py-2 min-h-[60px] bg-transparent border-none outline-none focus:outline-none text-center text-[20px] md:text-[55px] leading-[1.1] text-gray-900 placeholder:text-gray-300 placeholder-transition ${
                    placeholderOpacity === 0 ? 'placeholder-opacity-0' : 'placeholder-opacity-50'
                  }`}
                  disabled={!canType || loading}
                />
                {showClearBtn && (
                  <span
                    id="clear-input-btn"
                    onClick={handleClearInput}
                    className="absolute top-1/2 right-3 transform -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600"
                    title="Clear input"
                  >
                    <i className="fas fa-times-circle"></i>
                  </span>
                )}
              </div>
            </div>

            {/* Loading indicator while fetching career suggestions */}
            {loadingSuggestions && (
              <div className="flex items-center justify-center space-x-3 mb-12">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-600">Finding specific career options...</span>
              </div>
            )}

            {/* Career Option Cards */}
            {!loadingSuggestions && careerSuggestions.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {careerSuggestions
                  .filter((s) => s && typeof s === "object" && s.title)
                  .map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleGeneratePathway(suggestion)}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:shadow-lg transition-all text-left group"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {suggestion.title || "Unknown Career"}
                    </h3>
                    {suggestion.description && (
                      <p className="text-sm text-gray-600 mb-3">
                        {suggestion.description}
                      </p>
                    )}
                    {(suggestion.salary || suggestion.jobOutlook || suggestion.competitiveness) && (
                      <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-gray-100">
                        {suggestion.salary && (
                          <div className="flex items-center gap-2">
                            <i className="fas fa-dollar-sign text-green-600 text-xs"></i>
                            <span className="text-sm font-medium text-gray-700">{suggestion.salary}</span>
                          </div>
                        )}
                        {suggestion.jobOutlook && (
                          <div className="flex items-center gap-2">
                            <i className="fas fa-chart-line text-blue-600 text-xs"></i>
                            <span className="text-sm text-gray-600">{suggestion.jobOutlook}</span>
                          </div>
                        )}
                        {suggestion.competitiveness && (
                          <div className="flex items-center gap-2">
                            <i className="fas fa-trophy text-purple-600 text-xs"></i>
                            <span className="text-sm text-gray-600">{suggestion.competitiveness}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Cancel Button */}
            {!loadingSuggestions && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => {
                    setShowCareerOptions(false);
                    setCareerSuggestions([]);
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}

        {/* Loading indicator while fetching career suggestions - Centered */}
        {!pathwayData && !showCareerOptions && loadingSuggestions && (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="flex items-center justify-center space-x-3 mb-4">
              {/* Gemini Star/Sparkle Icon */}
              <svg
                className="w-8 h-8 animate-spin-slow"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="gemini-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
                <path
                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  fill="url(#gemini-gradient)"
                />
              </svg>
              <span className="text-green-600 font-medium text-xl">
                Generating Careers
              </span>
            </div>
          </div>
        )}

        {/* Loading Indicator for Pathway Generation - Centered */}
        {!pathwayData && !showCareerOptions && !loadingSuggestions && loading && (
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="flex items-center justify-center space-x-3">
              {/* Gemini Star/Sparkle Icon */}
              <svg
                className="w-8 h-8 animate-spin-slow"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="gemini-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>
                <path
                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  fill="url(#gemini-gradient)"
                />
              </svg>
              <span className="text-green-600 font-medium text-xl">
                Generating pathway
              </span>
            </div>
          </div>
        )}

        {/* Overlay shown while generating an additional career to compare — the
            existing pathway is still mounted, so without this the screen would
            appear blank during the wait. */}
        {loading && pathwayData && (
          <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/85 backdrop-blur-sm">
            <svg
              className="w-10 h-10 animate-spin-slow"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="gemini-gradient-overlay" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#06b6d4" />
                </linearGradient>
              </defs>
              <path
                d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                fill="url(#gemini-gradient-overlay)"
              />
            </svg>
            <span className="text-green-600 font-medium text-xl mt-4">
              Please wait — generating pathway
            </span>
            <span className="text-gray-500 text-sm mt-1">
              This can take a few seconds.
            </span>
          </div>
        )}

        {/* Search Section - Only show when NOT showing career options, NOT loading suggestions, NOT generating pathway, and NOT auto-generating from URL */}
        {!pathwayData && !showCareerOptions && !loadingSuggestions && !loading && !autoGenerating && (
          <div className="max-w-2xl mx-auto min-h-[260px]">
            {/* Instruction Text - Fades out when loading */}
            {!loading && (
              <p className={`text-gray-700 mb-1 text-left text-xl md:text-3xl ${isFadingOut ? 'fade-out' : ''}`}>
                <span className="wave-emoji">👋</span>
                <span>{displayedText}</span>
                {displayedText.length > 0 && displayedText.length < " Generate a pathway for your career:".length && (
                  <span className="inline-block w-0.5 h-5 bg-gray-700 ml-1 animate-blink">|</span>
                )}
              </p>
            )}

            {/* Search Bar - Always visible when no pathway */}
            <div className={`relative fade-in-delay-2 ${loading ? 'mb-0' : 'mb-1'}`}>
              <div className="input-container w-full relative">
                <input
                ref={inputRef}
                  type="text"
                  id="custom-career-input"
                  value={careerInput}
                onChange={(e) => {
                  if (!canType) return; // ignore typing until intro finishes
                  let value = e.target.value;

                  // Enforce character limit (max 50)
                  if (value.length > 50) {
                    value = value.slice(0, 50);
                  }

                  // Enforce word limit (max 5 words)
                  let words = value.trim().split(/\s+/).filter(Boolean);
                  if (words.length > 5) {
                    words = words.slice(0, 5);
                    value = words.join(" ");
                  }

                  // Track counts
                  setWordCount(words.length);
                  setCharCount(value.length);

                  // If user had typed and then clears everything, show error
                  if (careerInput.length > 0 && value.trim().length === 0) {
                    setShowEmptyError(true);
                  } else if (value.trim().length > 0) {
                    setShowEmptyError(false);
                  }

                  setCareerInput(value);
                }}
                onKeyDown={(e) => {
                  if (!canType) {
                    e.preventDefault();
                    return;
                  }
                  handleKeyDown(e);
                }}
                onFocus={() => {
                  if (canType) {
                    setShowSuggestions(true);
                    setIsInputFocused(true);
                  }
                }}
                onBlur={() => {
                  setTimeout(() => setShowSuggestions(false), 200);
                  setIsInputFocused(false);
                }}
                  placeholder={careerInput.length === 0 ? SUGGESTIONS[currentSuggestionIndex] : "project manager"}
                  className={`w-full py-2 min-h-[60px] bg-transparent border-none outline-none focus:outline-none text-[20px] md:text-[55px] leading-[1.1] text-gray-900 placeholder:text-gray-300 placeholder-transition ${
                    placeholderOpacity === 0 ? 'placeholder-opacity-0' : 'placeholder-opacity-50'
                  }`}
                disabled={!canType || loading}
                />
                {!loading && showClearBtn && (
                  <span
                    id="clear-input-btn"
                    onClick={handleClearInput}
                    className="absolute top-1/2 right-3 transform -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-600"
                    title="Clear input"
                  >
                    <i className="fas fa-times-circle"></i>
                  </span>
                )}
              </div>
            </div>
            {/* Validation / helper text area - keeps spacing even when empty */}
            {/* Both messages occupy the exact same spot; opacity handles cross-fade */}
            <div className="relative min-h-[1.5rem] mt-0 mb-3 text-sm">
              {/* Error text (red) */}
              <span
                className={`absolute left-0 font-semibold text-red-400 transition-opacity duration-300 ${
                  showEmptyError && !loading ? "opacity-100" : "opacity-0"
                }`}
              >
                Please fill out this field.
              </span>

              {/* Helper text (gray counter) */}
              <span
                className={`absolute left-0 text-gray-200 transition-opacity duration-300 ${
                  !showEmptyError && charCount > 0 && isInputFocused && !loading
                    ? "opacity-100"
                    : "opacity-0"
                }`}
              >
                {wordCount}/5 words or {charCount}/50 characters
              </span>
            </div>

            {/* Next Button - Fades out when loading */}
            {!loading && (
              <button
                onClick={handleNextClick}
                disabled={!careerInput.trim() || loadingSuggestions}
                className={`px-16 py-4 rounded-lg shadow-md transition duration-200 text-base fade-in-delay-2 ${isFadingOut ? 'fade-out' : ''} ${
                  careerInput.trim()
                    ? 'bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer'
                    : 'bg-blue-200 text-white font-semibold cursor-not-allowed'
                }`}
              >
                Next
              </button>
            )}

            {/* Subtitle - Fades out when loading */}
            {!loading && (
              <div className={`mt-4 flex items-start gap-3 fade-in-delay-2 ${isFadingOut ? 'fade-out' : ''}`}>
                <i className="fas fa-lightbulb text-gray-400 mt-0.5 flex-shrink-0"></i>
                <p className="text-sm text-gray-400">
                  Undecided? Discover the right career for you by clicking{" "}
                  <Link href="/career-discovery" className="text-gray-400 hover:text-gray-500 underline">
                    here
                  </Link>
                  .
                </p>
              </div>
            )}

          </div>
        )}
        
        {/* Flowchart Display - Shows when pathway data exists and no career options are showing */}
        {pathwayData && !loading && !showCareerOptions && (
          <div id="pathway-display" className={`w-full fade-in-flowchart`}>
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
                          ? "border-blue-500 text-blue-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {pathway.isPrimary && (
                        <span className="mr-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          Recommended
                        </span>
                      )}
                      {pathway.title}
                    </button>
                  ))}
                </nav>
              </div>
            )}

            {/* Total Cost Summary */}
            {pathwayData && pathwayData.pathways[selectedPathwayIndex] && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Total Pathway Cost</h3>
                    <p className="text-sm text-gray-600">Estimated total for this pathway</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600">
                        {formatCostRange(calculatePathwayCostRange(pathwayData.pathways[selectedPathwayIndex].steps))}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">*Tuition &amp; fees only — excludes housing, books &amp; financial aid</p>
                    </div>
                    <button
                      onClick={() => setShowCostBreakdown(!showCostBreakdown)}
                      className="px-4 py-2 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors"
                    >
                      {showCostBreakdown ? (
                        <>
                          <i className="fas fa-chevron-up mr-1"></i>
                          Hide Breakdown
                        </>
                      ) : (
                        <>
                          <i className="fas fa-chevron-down mr-1"></i>
                          Show Breakdown
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Cost Breakdown */}
                {showCostBreakdown && (
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <div className="space-y-2">
                      {pathwayData.pathways[selectedPathwayIndex].steps.map((step, idx) => {
                        const stepCost = calculateStepCostRange(step);
                        if (stepCost.high === 0) return null;
                        return (
                          <div key={idx} className="flex justify-between items-center text-sm py-1">
                            <span className="text-gray-700">{step.name}</span>
                            <span className="font-semibold text-gray-900">{formatCostRange(stepCost)}</span>
                          </div>
                        );
                      })}
                      <div className="flex justify-between items-center pt-2 mt-2 border-t border-green-200 font-semibold">
                        <span className="text-gray-900">Total</span>
                        <span className="text-green-600">
                          {formatCostRange(calculatePathwayCostRange(pathwayData.pathways[selectedPathwayIndex].steps))}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 pt-2">
                        Estimates cover in-state tuition &amp; fees only. Plan on roughly $1,200–$1,600/year
                        extra for books &amp; supplies, plus living costs. Financial aid can significantly
                        lower what you actually pay — check{" "}
                        <a
                          href="https://www.mdc.edu/financialaid/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-700 underline hover:text-green-800"
                        >
                          MDC Financial Aid
                        </a>{" "}
                        and each university&apos;s net price calculator.
                      </p>
                    </div>
                  </div>
                )}
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
                          
                          {/* Cost Display */}
                          {calculateStepCostRange(step).high > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700 flex items-center">
                                  <i className="fas fa-dollar-sign text-green-600 mr-1"></i>
                                  Estimated Cost:
                                </span>
                                <span className="text-lg font-bold text-green-600">
                                  {formatCostRange(calculateStepCostRange(step))}
                                </span>
                              </div>
                            </div>
                          )}
                          
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
                                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150"
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
                  className="flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full shadow-md transition-colors"
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
                      className="flex-1 py-2 pl-4 pr-10 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      autoFocus
                    />
                    <button
                      onClick={handleAddCareerGenerate}
                      disabled={!addCareerInput.trim()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-full transition-colors"
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
                              ? "border-blue-500 text-blue-600"
                              : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                          }`}
                        >
                          {pathway.isPrimary && (
                            <span className="mr-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              Recommended
                            </span>
                          )}
                          {pathway.title}
                        </button>
                      ))}
                    </nav>
                  </div>
                )}

                {/* Total Cost Summary for Comparison Pathway */}
                {careerPathway.data.pathways[careerPathway.selectedPathwayIndex] && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Total Pathway Cost</h3>
                        <p className="text-sm text-gray-600">Estimated total for this pathway</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          {formatCostRange(calculatePathwayCostRange(careerPathway.data.pathways[careerPathway.selectedPathwayIndex].steps))}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">*Tuition &amp; fees only — excludes housing, books &amp; financial aid</p>
                      </div>
                    </div>
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
                              
                              {/* Cost Display */}
                              {calculateStepCostRange(step).high > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700 flex items-center">
                                      <i className="fas fa-dollar-sign text-green-600 mr-1"></i>
                                      Estimated Cost:
                                    </span>
                                    <span className="text-lg font-bold text-green-600">
                                      {formatCostRange(calculateStepCostRange(step))}
                                    </span>
                                  </div>
                                </div>
                              )}
                              
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
                                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150"
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
                      className="flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full shadow-md transition-colors"
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
                          className="flex-1 py-2 pl-4 pr-10 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                          autoFocus
                        />
                        <button
                          onClick={handleAddCareerGenerate}
                          disabled={!addCareerInput.trim()}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-full transition-colors"
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
        )}
      </section>


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
                <li>
                  <a 
                    href="https://www.mdc.edu/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 transition-colors"
                  >
                    Miami Dade College
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.mdc.edu/advisement/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 transition-colors"
                  >
                    Academic Advising
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.mdc.edu/academics/programs/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 transition-colors"
                  >
                    Degree Programs
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
                    className="hover:text-blue-600 transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a 
                    href="/terms" 
                    className="hover:text-blue-600 transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a 
                    href="https://www.mdc.edu/accessibility/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 transition-colors"
                  >
                    Accessibility
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact & Disclaimer Column */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Contact</h3>
              <p className="mb-4">
                <a 
                  href="mailto:advisement@mdc.edu" 
                  className="hover:text-blue-600 transition-colors"
                >
                  advisement@mdc.edu
                </a>
              </p>
              <p className="text-xs text-gray-500 leading-relaxed">
                <strong>Disclaimer:</strong> Pathways are AI-generated suggestions and should be verified with academic advisors. Content may contain inaccuracies.
              </p>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
            <p>© {new Date().getFullYear()} Miami Dade College. All rights reserved.</p>
            <p className="mt-1">Powered by Google Gemini AI</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function PathwayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PathwayPageContent />
    </Suspense>
  );
}
