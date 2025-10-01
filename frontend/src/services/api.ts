import axios from 'axios';
import {
  User,
  UserModel,
  UserDataset,
  Benchmark,
  BenchmarkRequest,
  BenchmarkResult,
  APIIntegration,
  UserSettings,
  LoginCredentials,
  RegisterData
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth API
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<User> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.get('/auth/logout');
  },

  register: async (data: RegisterData): Promise<User> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/current-user');
    return response.data;
  },
};

// Benchmarks API
export const benchmarksAPI = {
  getAll: async (): Promise<Benchmark[]> => {
    const response = await api.get('/api/benchmarks');
    return response.data;
  },

  runBenchmark: async (request: BenchmarkRequest): Promise<BenchmarkResult> => {
    const response = await api.post('/api/run-benchmark', request);
    return response.data;
  },

  voteBlindTest: async (data: any): Promise<any> => {
    const response = await api.post('/api/blind-test/vote', data);
    return response.data;
  },

  revealBlindTest: async (data: any): Promise<any> => {
    const response = await api.post('/api/blind-test/reveal', data);
    return response.data;
  },
};

// Models API
export const modelsAPI = {
  getUserModels: async (): Promise<UserModel[]> => {
    const response = await api.get('/api/user-models');
    return response.data;
  },

  getAllModels: async (): Promise<UserModel[]> => {
    const response = await api.get('/api/all-models');
    return response.data;
  },

  getJudgeModel: async (): Promise<UserModel | null> => {
    const response = await api.get('/api/judge-model');
    return response.data;
  },

  addModel: async (data: any): Promise<UserModel> => {
    const response = await api.post('/user/models/add', data);
    return response.data;
  },

  updateModel: async (modelId: number, data: any): Promise<UserModel> => {
    const response = await api.post(`/user/models/update/${modelId}`, data);
    return response.data;
  },

  deleteModel: async (modelId: number): Promise<void> => {
    await api.post(`/user/models/delete/${modelId}`);
  },

  testModel: async (modelId: number): Promise<any> => {
    const response = await api.post('/user/models/test', { model_id: modelId });
    return response.data;
  },

  testIntegration: async (integrationId: number, modelName: string): Promise<any> => {
    const response = await api.post('/user/models/test-integration', {
      integration_id: integrationId,
      model_name: modelName,
    });
    return response.data;
  },
};

// Datasets API
export const datasetsAPI = {
  getUserDatasets: async (): Promise<UserDataset[]> => {
    const response = await api.get('/api/user-datasets');
    return response.data;
  },

  addDataset: async (formData: FormData): Promise<UserDataset> => {
    const response = await api.post('/user/datasets/add', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteDataset: async (datasetId: number): Promise<void> => {
    await api.post(`/user/datasets/delete/${datasetId}`);
  },

  addDatasetFromWeb: async (data: { name: string; description: string; rows: Array<{prompt: string; reference: string}> }): Promise<UserDataset> => {
    const response = await api.post('/user/datasets/add-from-web', data);
    return response.data;
  },

  updateDataset: async (datasetId: number, data: { name: string; description: string }): Promise<UserDataset> => {
    const response = await api.post(`/user/datasets/update/${datasetId}`, data);
    return response.data;
  },
};

// Settings API
export const settingsAPI = {
  getSettings: async (): Promise<UserSettings> => {
    // Return mock data since there's no specific endpoint
    return { id: 1, user_id: 1, judge_model_id: null };
  },

  updateSettings: async (data: any): Promise<UserSettings> => {
    const response = await api.post('/user/judge-model/save', data);
    return response.data;
  },

  getIntegrations: async (): Promise<APIIntegration[]> => {
    const response = await api.get('/user/api-integrations');
    return response.data;
  },

  addIntegration: async (data: any): Promise<APIIntegration> => {
    const response = await api.post('/user/api-integrations/add', data);
    return response.data;
  },

  deleteIntegration: async (integrationId: number): Promise<void> => {
    await api.post(`/user/api-integrations/delete/${integrationId}`);
  },

  changePassword: async (data: any): Promise<void> => {
    await api.post('/user/change-password', data);
  },
};

export default api;
