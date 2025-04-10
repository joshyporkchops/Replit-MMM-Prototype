import { 
  users, type User, type InsertUser, 
  type InsertOnboardingData, type OnboardingData,
  type InsertUploadedFile, type UploadedFile,
  type InsertIntegration, type Integration
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Onboarding data methods
  getOnboardingData(userId: number): Promise<OnboardingData | undefined>;
  saveOnboardingStep(userId: number, step: string, data: any): Promise<OnboardingData>;
  completeOnboarding(userId: number): Promise<OnboardingData>;
  
  // File upload methods
  saveUploadedFile(userId: number, file: Omit<InsertUploadedFile, "userId">): Promise<UploadedFile>;
  getUploadedFiles(userId: number): Promise<UploadedFile[]>;
  
  // Integration methods
  saveIntegration(userId: number, integration: Omit<InsertIntegration, "userId">): Promise<Integration>;
  getUserIntegrations(userId: number): Promise<Integration[]>;
  disconnectIntegration(userId: number, integrationId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private onboardingData: Map<number, OnboardingData>;
  private uploadedFiles: Map<number, UploadedFile>;
  private integrations: Map<number, Integration>;
  private currentUserId: number;
  private currentFileId: number;
  private currentIntegrationId: number;

  constructor() {
    this.users = new Map();
    this.onboardingData = new Map();
    this.uploadedFiles = new Map();
    this.integrations = new Map();
    this.currentUserId = 1;
    this.currentFileId = 1;
    this.currentIntegrationId = 1;
    
    // Create a default user for development
    this.createUser({
      username: "testuser",
      password: "password"
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getOnboardingData(userId: number): Promise<OnboardingData | undefined> {
    // Find onboarding data for user
    const userOnboardingData = Array.from(this.onboardingData.values()).find(
      data => data.userId === userId
    );
    
    return userOnboardingData;
  }

  async saveOnboardingStep(userId: number, step: string, data: any): Promise<OnboardingData> {
    // Check if user exists
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Find existing onboarding data for user or create new
    let onboardingData = await this.getOnboardingData(userId);
    
    if (!onboardingData) {
      // Create new onboarding data
      const now = new Date();
      onboardingData = {
        id: this.onboardingData.size + 1,
        userId,
        step: step,
        primaryKpi: null,
        secondaryKpis: [],
        uploadMethod: null,
        dataStatus: null,
        externalFactors: null,
        completed: false,
        createdAt: now,
        updatedAt: now
      };
    }
    
    // Update with new data
    const updatedData = {
      ...onboardingData,
      step,
      ...data,
      updatedAt: new Date()
    };
    
    // Save updated data
    this.onboardingData.set(updatedData.id, updatedData);
    
    return updatedData;
  }

  async completeOnboarding(userId: number): Promise<OnboardingData> {
    // Find existing onboarding data for user
    const onboardingData = await this.getOnboardingData(userId);
    
    if (!onboardingData) {
      throw new Error("Onboarding data not found for user");
    }
    
    // Mark as completed
    const updatedData = {
      ...onboardingData,
      step: "complete",
      completed: true,
      updatedAt: new Date()
    };
    
    // Save updated data
    this.onboardingData.set(updatedData.id, updatedData);
    
    return updatedData;
  }

  async saveUploadedFile(userId: number, file: Omit<InsertUploadedFile, "userId">): Promise<UploadedFile> {
    const id = this.currentFileId++;
    
    const uploadedFile: UploadedFile = {
      id,
      userId,
      ...file,
      createdAt: new Date()
    };
    
    this.uploadedFiles.set(id, uploadedFile);
    
    return uploadedFile;
  }

  async getUploadedFiles(userId: number): Promise<UploadedFile[]> {
    return Array.from(this.uploadedFiles.values())
      .filter(file => file.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort by most recent first
  }

  async saveIntegration(userId: number, integration: Omit<InsertIntegration, "userId">): Promise<Integration> {
    const id = this.currentIntegrationId++;
    
    const newIntegration: Integration = {
      id,
      userId,
      ...integration,
      createdAt: new Date()
    };
    
    this.integrations.set(id, newIntegration);
    
    return newIntegration;
  }

  async getUserIntegrations(userId: number): Promise<Integration[]> {
    return Array.from(this.integrations.values())
      .filter(integration => integration.userId === userId && integration.status !== 'disconnected')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // Sort by most recent first
  }

  async disconnectIntegration(userId: number, integrationId: number): Promise<boolean> {
    const integration = this.integrations.get(integrationId);
    
    if (!integration || integration.userId !== userId) {
      return false;
    }
    
    // Update status to disconnected
    const updatedIntegration = {
      ...integration,
      status: 'disconnected'
    };
    
    this.integrations.set(integrationId, updatedIntegration);
    
    return true;
  }
}

export const storage = new MemStorage();
