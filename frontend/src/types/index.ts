export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  contractsAnalyzed: number;
  token?: string;
}

export interface Risk {
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: 'legal' | 'financial' | 'compliance' | 'operational';
  description: string;
  mitigation: string;
  clauseLocation: string;
}

export interface Analysis {
  risks: Risk[];
  summary: string;
  score: number;
  riskCategories: {
    legal: number;
    financial: number;
    compliance: number;
    operational: number;
  };
}

export interface Contract {
  _id: string;
  userId: string;
  filename: string;
  content?: string;
  analysis: Analysis;
  createdAt: string;
  updatedAt?: string;
}

export interface DashboardStats {
  totalContracts: number;
  avgScore: number;
  highCriticalCount: number;
  growthPercentage: number;
  severityDistribution: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  dailyData: { date: string; count: number }[];
  avgCategoryScores: {
    legal: number;
    financial: number;
    compliance: number;
    operational: number;
  };
}

export interface ContractListResponse {
  contracts: Contract[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}
