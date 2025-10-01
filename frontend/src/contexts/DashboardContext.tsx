import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MetricsConfig as MetricsConfigType } from '../types';

interface DashboardState {
  selectedModels: string[];
  selectedBenchmarks: string[];
  selectedDatasets: string[];
  metrics: MetricsConfigType;
  results: any | null;
  setSelectedModels: (models: string[]) => void;
  setSelectedBenchmarks: (benchmarks: string[]) => void;
  setSelectedDatasets: (datasets: string[]) => void;
  setMetrics: (metrics: MetricsConfigType) => void;
  setResults: (results: any) => void;
  clearResults: () => void;
}

const DashboardContext = createContext<DashboardState | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedBenchmarks, setSelectedBenchmarks] = useState<string[]>([]);
  const [selectedDatasets, setSelectedDatasets] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<MetricsConfigType>({
    quantitative: { weight: 0.5 },
    qualitative: { weight: 0.5 },
    hallucination: { weight: 0.3 },
    safety: { weight: 0.2 },
  });
  const [results, setResults] = useState<any | null>(null);

  const clearResults = () => {
    setResults(null);
  };

  return (
    <DashboardContext.Provider
      value={{
        selectedModels,
        selectedBenchmarks,
        selectedDatasets,
        metrics,
        results,
        setSelectedModels,
        setSelectedBenchmarks,
        setSelectedDatasets,
        setMetrics,
        setResults,
        clearResults,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = (): DashboardState => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
