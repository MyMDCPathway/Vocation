"use client";

import { useState, useMemo, useEffect } from "react";

interface PathwayStep {
  type: "degree" | "transfer" | "internship" | "exam";
  level: string;
  name: string;
  description: string;
}

interface Scholarship {
  id: string;
  name: string;
  amount: {
    min: number;
    max: number;
    type: "annual" | "one-time" | "percentage";
    coverage?: string;
  };
  eligibility: {
    gpa?: number;
    financialNeed?: boolean;
    enrollment?: string;
    residency?: string;
    major?: string[];
    transferFrom?: string;
    serviceHours?: number;
    sat?: number;
    act?: number;
    efc?: number;
  };
  deadline: string;
  url: string;
  description: string;
  categories: string[];
}

interface FinancialTrackerProps {
  pathwaySteps: PathwayStep[];
  careerName: string;
  totalCost: number;
}

// Calculate step cost
const calculateStepCost = (step: PathwayStep): number => {
  if (!step || !step.type) return 0;
  
  if (step.type === "degree" && step.level?.includes("MDC")) {
    if (step.name.toLowerCase().includes("associate")) {
      return 7200;
    }
    if (step.name.toLowerCase().includes("certificate")) {
      return 3000;
    }
    if (step.name.toLowerCase().includes("bachelor")) {
      return 13500;
    }
  }
  
  if (step.type === "transfer") {
    return 0;
  }
  
  if (step.type === "degree" && (step.name.toLowerCase().includes("b.s") || 
      step.name.toLowerCase().includes("b.a") || 
      step.name.toLowerCase().includes("bachelor"))) {
    if (!step.level?.includes("MDC")) {
      return 13000;
    }
  }
  
  if (step.type === "exam") {
    const examName = step.name.toLowerCase();
    if (examName.includes("nclex")) return 200;
    if (examName.includes("pe exam") || examName.includes("principles and practice")) return 375;
    if (examName.includes("fe exam") || examName.includes("fundamentals")) return 175;
    if (examName.includes("are") || examName.includes("architect registration")) return 1200;
    if (examName.includes("bar exam")) return 1000;
    if (examName.includes("cpa")) return 800;
    return 300;
  }
  
  if (step.type === "internship") {
    return 0;
  }
  
  return 0;
};

export default function FinancialTracker({ pathwaySteps, careerName, totalCost }: FinancialTrackerProps) {
  // Validate inputs with better error handling
  const isValidPathwaySteps = pathwaySteps && Array.isArray(pathwaySteps) && pathwaySteps.length > 0;
  const isValidCareerName = careerName && typeof careerName === 'string' && careerName.trim().length > 0;
  const isValidTotalCost = typeof totalCost === 'number' && !isNaN(totalCost) && totalCost >= 0;
  
  // Use safe defaults if validation fails
  const safePathwaySteps = isValidPathwaySteps ? pathwaySteps : [];
  const safeCareerName = isValidCareerName ? careerName.trim() : "Your Career";
  const safeTotalCost = isValidTotalCost ? totalCost : 0;
  
  // If all inputs are invalid, show a message instead of returning null
  if (!isValidPathwaySteps && !isValidCareerName && !isValidTotalCost) {
    return (
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
        <p className="text-yellow-800">Financial information will appear here once a pathway is generated.</p>
      </div>
    );
  }
  
  const [activeTab, setActiveTab] = useState<"scholarships" | "aid" | "comparison" | "roi">("scholarships");
  const [efc, setEfc] = useState<number>(3000);
  const [gpa, setGpa] = useState<number>(3.5);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [financialAid, setFinancialAid] = useState<any>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  
  useEffect(() => {
    Promise.all([
      fetch("/data/scholarships.json")
        .then(res => {
          if (!res.ok) throw new Error("Failed to load scholarships");
          return res.json();
        })
        .catch(() => []),
      fetch("/data/financial-aid.json")
        .then(res => {
          if (!res.ok) throw new Error("Failed to load financial aid");
          return res.json();
        })
        .catch(() => null)
    ]).then(([scholarshipsData, aidData]) => {
      setScholarships(Array.isArray(scholarshipsData) ? scholarshipsData : []);
      setFinancialAid(aidData);
      setDataLoaded(true);
    });
  }, []);
  
  // Match scholarships to pathway
  const matchedScholarships = useMemo(() => {
    if (!scholarships || scholarships.length === 0) return [];
    if (!safeCareerName || safeCareerName === "Your Career") return scholarships.slice(0, 3); // Show some general scholarships
    
    return scholarships.filter(scholarship => {
      if (!scholarship || !scholarship.eligibility) return false;
      
      // Check major match
      if (scholarship.eligibility.major && Array.isArray(scholarship.eligibility.major)) {
        const careerLower = safeCareerName.toLowerCase();
        const matchesMajor = scholarship.eligibility.major.some(major => 
          careerLower.includes(major.toLowerCase()) || 
          major.toLowerCase().includes(careerLower.split(" ")[0])
        );
        if (!matchesMajor) return false;
      }
      
      // Check GPA
      if (scholarship.eligibility.gpa && typeof scholarship.eligibility.gpa === 'number' && gpa < scholarship.eligibility.gpa) {
        return false;
      }
      
      // Check if transfer scholarship matches
      if (scholarship.eligibility.transferFrom) {
        const hasTransfer = safePathwaySteps.some(step => step && step.type === "transfer");
        if (!hasTransfer) return false;
      }
      
      return true;
    });
  }, [safeCareerName, safePathwaySteps, gpa, scholarships]);
  
  // Calculate financial aid
  const estimatedAid = useMemo(() => {
    if (!financialAid) {
      return {
        pellGrant: 0,
        workStudy: 0,
        floridaGrant: 0,
        loans: 0,
        total: 0
      };
    }
    
    const pellGrant = financialAid.calculation?.efcRanges?.find((range: any) => efc <= range.max)?.pellGrant || 0;
    const workStudy = 2000;
    const floridaGrant = 2000;
    const loans = 5500;
    
    return {
      pellGrant,
      workStudy,
      floridaGrant,
      loans,
      total: pellGrant + workStudy + floridaGrant + loans
    };
  }, [efc, financialAid]);
  
  // Calculate potential scholarship savings
  const scholarshipSavings = useMemo(() => {
    if (!matchedScholarships || matchedScholarships.length === 0) return 0;
    
    return matchedScholarships.reduce((total, scholarship) => {
      if (!scholarship || !scholarship.amount) return total;
      
      if (scholarship.amount.type === "percentage") {
        return total + (safeTotalCost * (scholarship.amount.max / 100));
      }
      if (scholarship.amount.type === "annual") {
        return total + (scholarship.amount.max * 2);
      }
      return total + (scholarship.amount.max || 0);
    }, 0);
  }, [matchedScholarships, safeTotalCost]);
  
  // Calculate net cost
  const netCost = Math.max(0, safeTotalCost - estimatedAid.total - scholarshipSavings);
  
  // Calculate ROI
  const careerSalaries: Record<string, number> = {
    "engineer": 75000,
    "nurse": 72000,
    "architect": 80000,
    "teacher": 50000,
    "accountant": 55000,
    "lawyer": 120000,
    "doctor": 200000,
    "software": 85000,
    "developer": 85000,
    "mechanical": 75000,
    "civil": 70000,
    "electrical": 78000,
    "computer": 85000,
  };
  
  const startingSalary = useMemo(() => {
    if (!safeCareerName || safeCareerName === "Your Career") return 60000;
    const careerLower = safeCareerName.toLowerCase();
    for (const [key, salary] of Object.entries(careerSalaries)) {
      if (careerLower.includes(key)) {
        return salary;
      }
    }
    return 60000;
  }, [safeCareerName]);
  
  const roi = useMemo(() => {
    if (!startingSalary || startingSalary <= 0 || netCost <= 0) {
      return {
        year1: 60000,
        year5: 81000,
        year10: 118200,
        total10Year: 600000,
        roiPercentage: 0,
        breakEvenMonths: 0
      };
    }
    
    const year1Earnings = startingSalary;
    const year5Earnings = startingSalary * 1.35;
    const year10Earnings = startingSalary * 1.97;
    const total10YearEarnings = year1Earnings + year5Earnings + year10Earnings + (startingSalary * 7);
    const roiPercentage = ((total10YearEarnings - netCost) / netCost) * 100;
    const breakEvenMonths = Math.round(netCost / (year1Earnings / 12));
    
    return {
      year1: year1Earnings,
      year5: year5Earnings,
      year10: year10Earnings,
      total10Year: total10YearEarnings,
      roiPercentage: Math.round(roiPercentage),
      breakEvenMonths
    };
  }, [startingSalary, netCost]);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    if (isNaN(amount) || amount < 0) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    } catch {
      return "N/A";
    }
  };
  
  // Days until deadline
  const daysUntil = (dateString: string) => {
    if (!dateString) return 0;
    try {
      const deadline = new Date(dateString);
      const today = new Date();
      const diff = deadline.getTime() - today.getTime();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  };
  
  return (
    <div className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Tabs */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="flex overflow-x-auto">
          <button
            onClick={() => setActiveTab("scholarships")}
            className={`px-6 py-4 text-sm font-semibold whitespace-nowrap transition-colors ${
              activeTab === "scholarships"
                ? "text-blue-900 border-b-2 border-blue-900 bg-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            💰 Scholarships
          </button>
          <button
            onClick={() => setActiveTab("aid")}
            className={`px-6 py-4 text-sm font-semibold whitespace-nowrap transition-colors ${
              activeTab === "aid"
                ? "text-blue-900 border-b-2 border-blue-900 bg-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            💳 Financial Aid
          </button>
          <button
            onClick={() => setActiveTab("comparison")}
            className={`px-6 py-4 text-sm font-semibold whitespace-nowrap transition-colors ${
              activeTab === "comparison"
                ? "text-blue-900 border-b-2 border-blue-900 bg-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            📊 Comparison
          </button>
          <button
            onClick={() => setActiveTab("roi")}
            className={`px-6 py-4 text-sm font-semibold whitespace-nowrap transition-colors ${
              activeTab === "roi"
                ? "text-blue-900 border-b-2 border-blue-900 bg-white"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            📈 ROI
          </button>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {!dataLoaded && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
            <p className="mt-2 text-gray-600">Loading financial information...</p>
          </div>
        )}
        
        {dataLoaded && (
          <>
            {/* Scholarships Tab */}
            {activeTab === "scholarships" && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Scholarships for Your Pathway
                </h3>
                {matchedScholarships.length === 0 ? (
                  <p className="text-gray-600">No matching scholarships found. Try adjusting your GPA or career path.</p>
                ) : (
                  <>
                    <div className="space-y-4 mb-6">
                      {matchedScholarships.map((scholarship) => {
                        const days = daysUntil(scholarship.deadline);
                        const isUrgent = days <= 30 && days > 0;
                        
                        return (
                          <div
                            key={scholarship.id}
                            className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <h4 className="font-bold text-gray-900 text-lg mb-1">
                                  {scholarship.name}
                                </h4>
                                <p className="text-gray-600 text-sm mb-3">
                                  {scholarship.description}
                                </p>
                              </div>
                              <div className="text-right ml-4">
                                <div className="text-2xl font-bold text-green-600">
                                  {scholarship.amount?.type === "percentage"
                                    ? `Up to ${scholarship.amount?.max || 0}%`
                                    : formatCurrency(
                                        scholarship.amount?.type === "annual"
                                          ? (scholarship.amount?.max || 0) * 2
                                          : (scholarship.amount?.max || 0)
                                      )}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {scholarship.amount?.type === "annual" ? "per year" : "one-time"}
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                              <div>
                                <span className="text-gray-500">Eligibility:</span>
                                <ul className="mt-1 space-y-1">
                                  {scholarship.eligibility.gpa && (
                                    <li className="text-gray-700">• GPA: {scholarship.eligibility.gpa}+</li>
                                  )}
                                  {scholarship.eligibility.major && (
                                    <li className="text-gray-700">• Major: {scholarship.eligibility.major.join(", ")}</li>
                                  )}
                                  {scholarship.eligibility.serviceHours && (
                                    <li className="text-gray-700">• Service Hours: {scholarship.eligibility.serviceHours}+</li>
                                  )}
                                </ul>
                              </div>
                              <div>
                                <span className="text-gray-500">Deadline:</span>
                                <div className={`mt-1 font-semibold ${isUrgent ? "text-red-600" : "text-gray-700"}`}>
                                  {formatDate(scholarship.deadline)}
                                </div>
                                {days > 0 && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {days} days remaining
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <a
                              href={scholarship.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors text-sm font-semibold"
                            >
                              Apply Now
                              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm text-gray-600">Total Potential Savings</div>
                          <div className="text-3xl font-bold text-green-700">
                            {formatCurrency(scholarshipSavings)}
                          </div>
                        </div>
                        <div className="text-4xl">💰</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            
            {/* Financial Aid Tab */}
            {activeTab === "aid" && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Estimated Financial Aid
                </h3>
                
                <div className="mb-6 space-y-4">
                  <div className="border border-gray-200 rounded-xl p-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Estimated Family Contribution (EFC)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10000"
                      step="500"
                      value={efc}
                      onChange={(e) => setEfc(Number(e.target.value))}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>$0</span>
                      <span className="font-semibold text-blue-900">{formatCurrency(efc)}</span>
                      <span>$10,000</span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                      <div>
                        <div className="font-semibold text-gray-900">Federal Pell Grant</div>
                        <div className="text-sm text-gray-600">Doesn't need to be repaid</div>
                      </div>
                      <div className="text-xl font-bold text-blue-900">
                        {formatCurrency(estimatedAid.pellGrant)}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                      <div>
                        <div className="font-semibold text-gray-900">Florida Student Grant</div>
                        <div className="text-sm text-gray-600">State grant (Florida residents)</div>
                      </div>
                      <div className="text-xl font-bold text-green-700">
                        {formatCurrency(estimatedAid.floridaGrant)}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                      <div>
                        <div className="font-semibold text-gray-900">Work-Study</div>
                        <div className="text-sm text-gray-600">Part-time work on campus</div>
                      </div>
                      <div className="text-xl font-bold text-purple-700">
                        {formatCurrency(estimatedAid.workStudy)}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
                      <div>
                        <div className="font-semibold text-gray-900">Federal Loans</div>
                        <div className="text-sm text-gray-600">Subsidized (interest-free while in school)</div>
                      </div>
                      <div className="text-xl font-bold text-yellow-700">
                        {formatCurrency(estimatedAid.loans)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-xl p-6">
                  <div className="flex justify-between items-center mb-2">
                    <div className="text-lg font-semibold text-gray-700">Total Aid Available</div>
                    <div className="text-3xl font-bold text-blue-900">
                      {formatCurrency(estimatedAid.total)}
                    </div>
                  </div>
                  <div className="border-t border-gray-300 pt-4 mt-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-gray-600">After Aid, You Pay</div>
                        <div className="text-xs text-gray-500">vs. {formatCurrency(safeTotalCost)} without aid</div>
                      </div>
                      <div className="text-2xl font-bold text-green-700">
                        {formatCurrency(Math.max(0, safeTotalCost - estimatedAid.total))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-center">
                  <a
                    href="https://studentaid.gov/h/apply-for-aid/fafsa"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors font-semibold"
                  >
                    Complete FAFSA
                    <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            )}
            
            {/* Comparison Tab */}
            {activeTab === "comparison" && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Cost Comparison
                </h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="border-2 border-blue-200 rounded-xl p-6 bg-blue-50">
                    <div className="text-sm text-gray-600 mb-2">Your Pathway</div>
                    <div className="text-2xl font-bold text-blue-900 mb-4">
                      MDC → Transfer
                    </div>
                    <div className="space-y-2 text-sm">
                      {safePathwaySteps
                        .filter(step => calculateStepCost(step) > 0)
                        .map((step, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span className="text-gray-700">{step.name.substring(0, 30)}...</span>
                            <span className="font-semibold">{formatCurrency(calculateStepCost(step))}</span>
                          </div>
                        ))}
                      <div className="border-t border-blue-300 pt-2 mt-2 flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-blue-900">{formatCurrency(safeTotalCost)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-2 border-gray-200 rounded-xl p-6 bg-gray-50">
                    <div className="text-sm text-gray-600 mb-2">Alternative</div>
                    <div className="text-2xl font-bold text-gray-900 mb-4">
                      Direct to 4-Year
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-700">4-Year University (4 years)</span>
                        <span className="font-semibold">{formatCurrency(26000)}</span>
                      </div>
                      <div className="border-t border-gray-300 pt-2 mt-2 flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-gray-900">{formatCurrency(26000)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
                  <div className="text-sm text-gray-600 mb-1">You Save</div>
                  <div className="text-4xl font-bold text-green-700">
                    {formatCurrency(Math.max(0, 26000 - safeTotalCost))}
                  </div>
                  <div className="text-sm text-gray-600 mt-2">
                    by starting at MDC
                  </div>
                </div>
              </div>
            )}
            
            {/* ROI Tab */}
            {activeTab === "roi" && (
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  Return on Investment
                </h3>
                
                <div className="mb-6 p-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Total Education Cost</div>
                      <div className="text-3xl font-bold text-gray-900">
                        {formatCurrency(netCost)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        After scholarships & aid
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Starting Salary</div>
                      <div className="text-3xl font-bold text-green-700">
                        {formatCurrency(startingSalary)}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Average for {safeCareerName}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="border border-gray-200 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-700">Year 1 Earnings</span>
                      <span className="text-xl font-bold text-gray-900">
                        {formatCurrency(roi.year1)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-700">Year 5 Earnings</span>
                      <span className="text-xl font-bold text-gray-900">
                        {formatCurrency(Math.round(roi.year5))}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">7% annual growth</div>
                  </div>
                  
                  <div className="border border-gray-200 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gray-700">Year 10 Earnings</span>
                      <span className="text-xl font-bold text-gray-900">
                        {formatCurrency(Math.round(roi.year10))}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
                    <div className="text-sm text-gray-600 mb-2">ROI</div>
                    <div className="text-4xl font-bold text-green-700">
                      {roi.roiPercentage}%
                    </div>
                    <div className="text-xs text-gray-500 mt-1">over 10 years</div>
                  </div>
                  
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center">
                    <div className="text-sm text-gray-600 mb-2">Break-Even</div>
                    <div className="text-4xl font-bold text-blue-700">
                      {roi.breakEvenMonths}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">months after graduation</div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

