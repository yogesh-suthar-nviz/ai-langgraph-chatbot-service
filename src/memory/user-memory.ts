export interface UserPreferences {
  favoriteCategories?: string[];
  shoeSize?: string;
  preferredCurrency?: string;
  tone?: 'concise' | 'detailed';
}

export class UserMemoryService {
  private memoryMap: Map<string, UserPreferences> = new Map([
    [
      'user_external_cust_ext_1001',
      {
        favoriteCategories: ['running_shoes'],
        shoeSize: '9',
        preferredCurrency: 'INR',
        tone: 'concise',
      },
    ],
  ]);

  async getPreferences(userId: string): Promise<UserPreferences> {
    return this.memoryMap.get(userId) || { preferredCurrency: 'INR' };
  }

  async updatePreferences(userId: string, prefs: Partial<UserPreferences>): Promise<UserPreferences> {
    const existing = await this.getPreferences(userId);
    const updated = { ...existing, ...prefs };
    this.memoryMap.set(userId, updated);
    return updated;
  }
}

export const userMemoryService = new UserMemoryService();
