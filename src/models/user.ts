export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  isPro: boolean;
  createdAt: string;
  lastLoginAt: string;
  usageCount: number; // ile razy użytkownik wygenerował notatki (limit dla darmowego planu)
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'pl' | 'en';
  defaultQuizEnabled: boolean;
  defaultExportFormat: 'pdf' | 'docx' | 'markdown';
}

export function isProUser(user: User | null): boolean {
  if (!user) return false;
  return user.isPro;
}

export function canGenerateMoreNotes(user: User | null): boolean {
  if (!user) return true; // Dla niezalogowanych, limit jest sprawdzany w innym miejscu
  
  // Użytkownicy PRO nie mają limitu
  if (user.isPro) return true;
  
  // Darmowy plan: 5 generacji na miesiąc
  return user.usageCount < 5;
} 