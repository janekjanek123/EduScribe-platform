declare module 'youtube-transcript-api' {
  export default class TranscriptAPI {
    static getTranscript(
      videoId: string, 
      config?: { lang?: string; country?: string }
    ): Promise<Array<{
      text: string;
      offset: number;
      duration: number;
    }>>;
    
    static validateID(videoId: string): boolean;
  }
} 