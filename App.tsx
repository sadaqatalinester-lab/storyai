
import React, { useState, useEffect } from 'react';
import { Step1Input } from './components/Step1Input';
import { Step2Paragraphs } from './components/Step2Paragraphs';
import { Step3Settings } from './components/Step3Settings';
import { Step4Prompts } from './components/Step4Prompts';
import { Step5Generation } from './components/Step5Generation';
import { AppStep, ParagraphData, AppSettings, DEFAULT_SETTINGS, GenerationStatus, SceneData, UserProfile } from './types';
import { Wand2, LogOut } from 'lucide-react';

function App() {
  const [step, setStep] = useState<AppStep>(AppStep.INPUT_STORY);
  const [storyText, setStoryText] = useState("");
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [paragraphData, setParagraphData] = useState<ParagraphData[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  // Load saved 3rd party API keys on mount
  useEffect(() => {
    const keys: any = {};
    ['google', 'leonardo', 'elevenlabs', 'kling', 'hailuo', 'sora'].forEach(k => {
       const keyName = k === 'google' ? 'api_key_google_gemini' : `api_key_${k}`; 
       // Note: Step3 saves google key as 'api_key_google_gemini' effectively due to replace(' ', '_') logic on "Google Gemini" or "google"
       // Actually in Step3Settings I used 'google', so it saves as `api_key_google`.
       const val = localStorage.getItem(`api_key_${k}`);
       if (val) keys[k] = val;
    });
    
    if (Object.keys(keys).length > 0) {
      setSettings(prev => ({ ...prev, apiKeys: { ...prev.apiKeys, ...keys } }));
    }
  }, []);

  const goToNextStep = (calculatedParagraphs?: string[]) => {
    if (step === AppStep.INPUT_STORY) {
      if (calculatedParagraphs) {
        setParagraphs(calculatedParagraphs);
      }
      setStep(AppStep.SEGMENTATION);
    } else if (step === AppStep.SEGMENTATION) {
      setStep(AppStep.SETTINGS);
    } else if (step === AppStep.SETTINGS) {
      // Initialize Scenes based on Image Count
      const newData: ParagraphData[] = paragraphs.map((text, pIdx) => {
         // Check if we have existing data for this paragraph to preserve audio blobs etc if coming back
         const existing = paragraphData.find(pd => pd.text === text); 
         
         // Generate empty scenes based on count
         const scenes: SceneData[] = Array.from({ length: settings.imageCount }).map((_, sIdx) => ({
            id: `scene_${pIdx}_${sIdx}_${Date.now()}`,
            startPrompt: "",
            endPrompt: "",
            startImageStatus: GenerationStatus.IDLE,
            endImageStatus: GenerationStatus.IDLE,
            videoStatus: GenerationStatus.IDLE
         }));
         
         return {
           id: existing?.id || `para_${Date.now()}_${pIdx}`,
           text,
           scenes: scenes, 
           audioStatus: existing?.audioStatus || GenerationStatus.IDLE,
           audioBlob: existing?.audioBlob
         };
      });
      
      setParagraphData(newData);
      setStep(AppStep.PROMPT_REVIEW);
    } else if (step === AppStep.PROMPT_REVIEW) {
      setStep(AppStep.GENERATION);
    }
  };

  const goToPreviousStep = () => {
    if (step > AppStep.INPUT_STORY) {
      setStep(step - 1);
    }
  };

  const updateParagraphData = (id: string, updates: Partial<ParagraphData>) => {
    setParagraphData(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  // --- Render Main App ---
  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-blue-500/30">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-2 rounded-lg">
              <Wand2 size={20} className="text-white" />
            </div>
            <h1 className="font-bold text-xl tracking-tight text-white hidden sm:block">StoryToMedia <span className="text-blue-400">AI</span></h1>
          </div>
          
          <div className="flex items-center space-x-6">
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map(s => (
                <div 
                    key={s} 
                    className={`h-1 w-6 sm:w-8 rounded-full transition-colors ${s <= step ? 'bg-blue-500' : 'bg-slate-700'}`}
                />
                ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {step === AppStep.INPUT_STORY && (
          <Step1Input 
            value={storyText} 
            onChange={setStoryText} 
            onNext={goToNextStep} 
          />
        )}
        
        {step === AppStep.SEGMENTATION && (
          <Step2Paragraphs 
            paragraphs={paragraphs} 
            setParagraphs={setParagraphs} 
            onNext={() => goToNextStep()}
            onBack={goToPreviousStep}
          />
        )}

        {step === AppStep.SETTINGS && (
          <Step3Settings 
            settings={settings} 
            onChange={setSettings} 
            onNext={() => goToNextStep()}
            onBack={goToPreviousStep}
            user={null}
          />
        )}

        {step === AppStep.PROMPT_REVIEW && (
          <Step4Prompts 
            data={paragraphData} 
            settings={settings}
            updateData={updateParagraphData}
            onNext={() => goToNextStep()} 
            onBack={goToPreviousStep}
          />
        )}

        {step === AppStep.GENERATION && (
          <Step5Generation 
            data={paragraphData} 
            settings={settings}
            updateData={updateParagraphData}
            onBack={goToPreviousStep}
          />
        )}
      </main>
    </div>
  );
}

export default App;
