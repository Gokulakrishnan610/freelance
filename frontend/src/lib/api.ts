// API client for Django backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Get token from localStorage on client side
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('access_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.detail || data.message || 'An error occurred' };
      }

      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  // Authentication methods
  async register(userData: {
    email: string;
    password: string;
    password_confirm: string;
    name: string;
    role: 'client' | 'freelancer';
    username: string;
  }) {
    const response = await this.request<{
      user: any;
      tokens: { access: string; refresh: string };
    }>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.data?.tokens) {
      this.setToken(response.data.tokens.access);
      if (typeof window !== 'undefined') {
        localStorage.setItem('refresh_token', response.data.tokens.refresh);
      }
    }
    
    return response;
  }

  async login(email: string, password: string) {
    const response = await this.request<{
      user: any;
      tokens: { access: string; refresh: string };
    }>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (response.data?.tokens) {
      this.setToken(response.data.tokens.access);
      if (typeof window !== 'undefined') {
        localStorage.setItem('refresh_token', response.data.tokens.refresh);
      }
    }
    
    return response;
  }

  async logout() {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
    
    const response = await this.request('/auth/logout/', {
      method: 'POST',
      body: JSON.stringify({ refresh: refreshToken }),
    });
    
    this.clearToken();
    return response;
  }

  async getUserProfile() {
    return this.request<{
      user: any;
      profile: any;
    }>('/auth/profile/');
  }

  // Project methods
  async getProjects(params?: URLSearchParams) {
    const query = params ? `?${params.toString()}` : '';
    return this.request<any[]>(`/projects/${query}`);
  }

  async getProject(id: string) {
    return this.request<any>(`/projects/${id}/`);
  }

  async createProject(projectData: any) {
    return this.request<any>('/projects/', {
      method: 'POST',
      body: JSON.stringify(projectData),
    });
  }

  async updateProject(id: string, projectData: any) {
    return this.request<any>(`/projects/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(projectData),
    });
  }

  async deleteProject(id: string) {
    return this.request(`/projects/${id}/`, {
      method: 'DELETE',
    });
  }

  async getMyProjects() {
    return this.request<any[]>('/projects/my-projects/');
  }

  async getMyProposals() {
    return this.request<any[]>('/projects/my-proposals/');
  }

  async getMyActiveProjects() {
    return this.request<any[]>('/projects/my-active-projects/');
  }

  async getProjectProposals(projectId: string) {
    return this.request<any[]>(`/projects/${projectId}/proposals/`);
  }

  async submitProposal(projectId: string, proposalData: {
    cover_letter: string;
    proposed_budget: number;
    estimated_duration: string;
  }) {
    return this.request<any>(`/projects/${projectId}/proposals/`, {
      method: 'POST',
      body: JSON.stringify(proposalData),
    });
  }

  // Profile methods
  async getProfile(id: string) {
    return this.request<any>(`/profiles/${id}/`);
  }

  async getMyProfile() {
    return this.request<any>('/profiles/me/');
  }

  async updateMyProfile(profileData: any) {
    return this.request<any>('/profiles/me/update/', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async getTopFreelancers() {
    return this.request<any[]>('/profiles/top-freelancers/');
  }

  async getNewcomerFreelancers() {
    return this.request<any[]>('/profiles/newcomers/');
  }

  async getFeaturedFreelancers() {
    return this.request<any[]>('/profiles/featured/');
  }

  // Messaging methods
  async getConversations() {
    return this.request<any[]>('/messaging/conversations/');
  }

  async getConversation(id: number) {
    return this.request<any>(`/messaging/conversations/${id}/`);
  }

  async startConversation(userId: number, projectId?: number) {
    return this.request<any>('/messaging/conversations/start/', {
      method: 'POST',
      body: JSON.stringify({ 
        user_id: userId,
        project_id: projectId 
      }),
    });
  }

  async sendMessage(conversationId: number, content: string) {
    return this.request<any>(`/messaging/conversations/${conversationId}/send/`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async getUnreadMessagesCount() {
    return this.request<{ unread_count: number }>('/messaging/unread-count/');
  }

  async getVideoDemos() {
    return this.request<any[]>('/profiles/demos/');
  }

  async createVideoDemo(demoData: FormData) {
    // For file uploads, don't set Content-Type to let browser set it with boundary
    const headers: Record<string, string> = {};
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const url = `${this.baseURL}/profiles/demos/`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: demoData,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.detail || data.message || 'An error occurred' };
      }

      return { data };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Network error' };
    }
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient; 