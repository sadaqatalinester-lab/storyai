

export enum AppStep {
  INPUT_STORY = 1,
  SEGMENTATION = 2,
  SETTINGS = 3,
  PROMPT_REVIEW = 4,
  GENERATION = 5,
  DOWNLOAD = 6,
}

export enum GenerationStatus {
  IDLE = 'idle',
  PENDING = 'pending',
  SUCCESS = 'success',
  ERROR = 'error',
  SKIPPED = 'skipped',
}

export interface SceneData {
  id: string;
  startPrompt: string;
  endPrompt: string;

  // Statuses
  startImageStatus: GenerationStatus;
  endImageStatus: GenerationStatus;
  videoStatus: GenerationStatus;

  // Assets
  startImageBlob?: Blob;
  endImageBlob?: Blob;
  videoBlob?: Blob;
  
  errorMsg?: string;
}

export interface ParagraphData {
  id: string;
  text: string;
  
  // A paragraph is now a collection of scenes
  scenes: SceneData[];
  
  // Audio is typically per-paragraph (narration)
  audioStatus: GenerationStatus;
  audioBlob?: Blob;
  audioErrorMsg?: string;
}

export type ImageEngineType = 'gemini-2.5-flash-image' | 'imagen-3.0-generate-001' | 'imagen-4.0-generate-001' | 'leonardo-ai';
export type AudioEngineType = 'gemini-tts' | 'elevenlabs';
export type VideoEngineType = 'veo' | 'kling' | 'hailuo' | 'sora';
export type SegmentationMethod = 'simple' | 'gemini' | 'gpt4';

export interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

export interface AppSettings {
  imageCount: number; 
  aspectRatio: string;
  style: string;
  consistency: boolean;
  
  // Engines
  imageEngine: ImageEngineType;
  audioEngine: AudioEngineType;
  videoEngine: VideoEngineType;
  
  // Toggle Features
  generateAudio: boolean;
  generateVideo: boolean;
  
  // API Keys for external services
  apiKeys: {
    google?: string; // Manual Google/Gemini Key
    leonardo?: string;
    elevenlabs?: string;
    kling?: string;
    hailuo?: string;
    sora?: string;
  };

  // Specific settings
  audioVoice: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  imageCount: 3, // Default to 3 scenes per paragraph
  aspectRatio: '16:9',
  style: 'Cinematic',
  consistency: true,
  imageEngine: 'gemini-2.5-flash-image', 
  audioEngine: 'gemini-tts',
  videoEngine: 'veo',
  generateAudio: true,
  generateVideo: true,
  apiKeys: {},
  audioVoice: 'Fenrir',
};

export const ASPECT_RATIOS = ["1:1", "16:9", "9:16", "4:3", "3:4"];
export const STYLES = [
  "Cinematic", "Realistic", "Anime", "3D Render", "Pixar", 
  "Illustration", "Oil Painting", "Watercolor", "Cyberpunk", "Sketch", "Fantasy", "Drawing", "Line Art", "Vintage"
];
export const VOICES = ["Fenrir", "Kore", "Puck", "Charon", "Zephyr"];

// Extend Window for Google AI Studio environment and GSI
declare global {
  interface AIStudio {
    openSelectKey: () => Promise<void>;
    hasSelectedApiKey: () => Promise<boolean>;
  }

  interface Window {
    aistudio?: AIStudio;
    google?: any;
  }
}