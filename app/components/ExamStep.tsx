"use client";

import { useState, useEffect } from "react";
import { CertificationInfo, parseRequirementsFromDescription } from "@/app/lib/certifications";

// Global cache for exam info (shared across all instances)
export const examInfoGlobalCache: Record<string, CertificationInfo> = {};

// Component for exam steps that fetches info dynamically
export function ExamStepComponent({ 
  examName, 
  examDescription, 
  careerIndex,
  onShowRequirements 
}: { 
  examName: string; 
  examDescription?: string; 
  careerIndex?: number;
  onShowRequirements: (name: string, info: CertificationInfo, careerIndex?: number) => void;
}) {
  const [examInfo, setExamInfo] = useState<CertificationInfo | null>(null);
  const [loadingExamInfo, setLoadingExamInfo] = useState(false);

  const fetchExamInfo = async () => {
    const cacheKey = examName.toLowerCase();
    
    // Check global cache first
    if (examInfoGlobalCache[cacheKey]) {
      setExamInfo(examInfoGlobalCache[cacheKey]);
      return;
    }

    setLoadingExamInfo(true);
    try {
      const response = await fetch("/api/get-exam-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ examName }),
      });

      const data = await response.json();
      
      if (response.ok && !data.error) {
        setExamInfo(data);
        // Cache the result globally
        examInfoGlobalCache[cacheKey] = data;
      } else {
        // Fallback to search URL and generic requirements
        const fallbackInfo: CertificationInfo = {
          url: data.url || `https://www.google.com/search?q=${encodeURIComponent(examName + " official website")}`,
          requirements: data.requirements || parseRequirementsFromDescription(examDescription, examName)
        };
        setExamInfo(fallbackInfo);
        examInfoGlobalCache[cacheKey] = fallbackInfo;
      }
    } catch (error) {
      console.error("Error fetching exam info:", error);
      // Fallback
      const fallbackInfo: CertificationInfo = {
        url: `https://www.google.com/search?q=${encodeURIComponent(examName + " official website")}`,
        requirements: parseRequirementsFromDescription(examDescription, examName)
      };
      setExamInfo(fallbackInfo);
      examInfoGlobalCache[cacheKey] = fallbackInfo;
    } finally {
      setLoadingExamInfo(false);
    }
  };

  const handleRequirementsClick = async () => {
    const cacheKey = examName.toLowerCase();
    let infoToShow = examInfo || examInfoGlobalCache[cacheKey];
    
    if (!infoToShow) {
      // Fetch if not available
      await fetchExamInfo();
      infoToShow = examInfo || examInfoGlobalCache[cacheKey] || {
        url: `https://www.google.com/search?q=${encodeURIComponent(examName + " official website")}`,
        requirements: parseRequirementsFromDescription(examDescription, examName)
      };
    }

    onShowRequirements(examName, infoToShow, careerIndex);
  };

  // Pre-fetch exam info when component mounts
  useEffect(() => {
    fetchExamInfo();
  }, [examName]);

  const examUrl = examInfo?.url || examInfoGlobalCache[examName.toLowerCase()]?.url || `https://www.google.com/search?q=${encodeURIComponent(examName + " official website")}`;

  return (
    <div className="mt-4 space-y-2">
      <button
        onClick={handleRequirementsClick}
        disabled={loadingExamInfo}
        className="w-full text-left text-sm font-semibold text-purple-700 hover:text-purple-800 focus:outline-none focus:underline flex items-center disabled:opacity-50"
      >
        <i className="fas fa-info-circle mr-2" />
        {loadingExamInfo ? "Loading Requirements..." : "Requirements"}
      </button>
      <a
        href={examUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition duration-150"
      >
        <i className="fas fa-external-link-alt mr-2" />{" "}
        View Certification Website
      </a>
    </div>
  );
}
