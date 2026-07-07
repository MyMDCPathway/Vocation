// Shared domain types for the pathway / career-planning features.

export interface PathwayStep {
  type: "degree" | "transfer" | "internship" | "exam";
  level: string;
  name: string;
  description: string;
}

export interface PathwayOption {
  title: string;
  isPrimary: boolean;
  steps: PathwayStep[];
}

export interface PathwayData {
  title: string;
  pathways: PathwayOption[];
}

export interface CareerPathway {
  career: string;
  data: PathwayData;
  selectedPathwayIndex: number;
}
