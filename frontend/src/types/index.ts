export interface User {
  id: number;
  username: string;
  email?: string;
}

export interface UserModel {
  id: string;
  name: string;
  description?: string;
  color?: string;
  api_url?: string;
  api_integration?: {
    id: number;
    name: string;
    api_url: string;
  };
  user_id?: number;
  is_active?: boolean;
}

export interface UserDataset {
  id: string;
  name: string;
  description?: string;
  file_path?: string;
  row_count?: number;
  user_id?: number;
  is_active?: boolean;
}

export interface Benchmark {
  id: string;
  name: string;
  description: string;
  metrics?: string[];
  requires_api?: boolean;
  requires_datasets?: boolean;
}

export interface MetricsConfig {
  quantitative: { weight: number };
  qualitative: { weight: number };
  hallucination: { weight: number };
  safety: { weight: number };
}

export interface BenchmarkRequest {
  selectedModels: string[];
  selectedBenchmarks: string[];
  selectedDatasets: string[];
  metrics: MetricsConfig;
}

export interface BenchmarkResult {
  [key: string]: any;
}

export interface APIIntegration {
  id: number;
  name: string;
  api_url: string;
  api_key?: string;
  provider?: string;
  description?: string;
}

export interface UserSettings {
  id: number;
  user_id: number;
  judge_model_id?: number | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password2: string;
}
