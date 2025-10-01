import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MetricsConfig as MetricsConfigType, UserModel, Benchmark, UserDataset } from '../types';

interface DashboardState {
  selectedModels: UserModel[];
  selectedBenchmark: Benchmark | null;
  selectedDatasets: UserDataset[];
  metrics: MetricsConfigType;
  results: any | null;
  resultsVisible: boolean;
  setSelectedModels: (models: UserModel[]) => void;
  setSelectedBenchmark: (benchmark: Benchmark | null) => void;
  setSelectedDatasets: (datasets: UserDataset[]) => void;
  setMetrics: (metrics: MetricsConfigType) => void;
  setResults: (results: any) => void;
  setResultsVisible: (visible: boolean) => void;
  clearResults: () => void;
}

const DashboardContext = createContext<DashboardState | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedModels, setSelectedModels] = useState<UserModel[]>([]);
  const [selectedBenchmark, setSelectedBenchmark] = useState<Benchmark | null>(null);
  const [selectedDatasets, setSelectedDatasets] = useState<UserDataset[]>([]);
  const [metrics, setMetrics] = useState<MetricsConfigType>({
    quantitative: { weight: 0.5 },
    qualitative: { weight: 0.5 },
    hallucination: { weight: 0.3 },
    safety: { weight: 0.2 },
  });
  const [results, setResults] = useState<any | null>(null);
  const [resultsVisible, setResultsVisible] = useState<boolean>(false);

  const clearResults = () => {
    setResults(null);
    setResultsVisible(false);
  };

  return (
    <DashboardContext.Provider
      value={{
        selectedModels,
        selectedBenchmark,
        selectedDatasets,
        metrics,
        results,
        resultsVisible,
        setSelectedModels,
        setSelectedBenchmark,
        setSelectedDatasets,
        setMetrics,
        setResults,
        setResultsVisible,
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
