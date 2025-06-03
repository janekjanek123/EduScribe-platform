export interface Note {
  id: string;
  userId: string;
  title: string;
  videoUrl: string;
  videoId: string;
  thumbnailUrl: string;
  createdAt: string;
  updatedAt: string;
  tldr: string;
  fullNotes: string;
  quiz?: {
    questions: { question: string; answer: string }[];
  };
  tags: string[];
  folderId?: string;
  isPublic: boolean;
}

export interface NotesFilter {
  userId?: string;
  folderId?: string;
  tags?: string[];
  searchTerm?: string;
  isPublic?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface NotesFolder {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  parentFolderId?: string;
  color?: string;
}

export function createEmptyNote(userId: string, videoInfo: {
  title: string;
  videoUrl: string;
  videoId: string;
  thumbnailUrl: string;
}): Note {
  const currentDate = new Date().toISOString();
  
  return {
    id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    userId,
    title: videoInfo.title,
    videoUrl: videoInfo.videoUrl,
    videoId: videoInfo.videoId,
    thumbnailUrl: videoInfo.thumbnailUrl,
    createdAt: currentDate,
    updatedAt: currentDate,
    tldr: '',
    fullNotes: '',
    tags: [],
    isPublic: false
  };
} 