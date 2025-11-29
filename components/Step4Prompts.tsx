
import React, { useEffect, useState } from 'react';
import { Wand2, Loader2, RefreshCw, ArrowLeft, Film, Image } from 'lucide-react';
import { ParagraphData, AppSettings, GenerationStatus, SceneData } from '../types';
import { generateScenePrompts, regenerateSinglePrompt } from '../services/gemini';

interface Props {
  data: ParagraphData[];
  settings: AppSettings;
  updateData: (id: string, updates: Partial<ParagraphData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step4Prompts: React.FC<Props> = ({ data, settings, updateData, onNext, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  
  // Track specific buttons loading: Set<"pId-sceneIdx-type">
  const [regeneratingIds, setRegeneratingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Only generate if we have scenes that are empty (initially created in App.tsx)
    const needsGeneration = data.some(p => p.scenes.some(s => !s.startPrompt));
    if (needsGeneration) {
      generateAllPrompts();
    } else {
      setGenerated(true);
    }
  }, []);

  const generateAllPrompts = async () => {
    setLoading(true);
    const customKey = settings.apiKeys.google;

    // Process paragraphs sequentially to avoid overwhelming rate limits, or small batches
    for (const p of data) {
       // Check if this paragraph already has prompts (skip if so, unless forced)
       if (p.scenes.every(s => s.startPrompt)) continue;

       try {
         const prompts = await generateScenePrompts(p.text, settings.imageCount, settings.style, customKey);
         
         // Merge generated prompts into existing scene structures
         const newScenes = p.scenes.map((scene, idx) => ({
           ...scene,
           startPrompt: prompts[idx]?.start || "Scene start...",
           endPrompt: prompts[idx]?.end || "Scene end..."
         }));
         
         updateData(p.id, { scenes: newScenes });
       } catch (e) {
         console.error("Failed prompt gen for", p.id, e);
       }
    }

    setLoading(false);
    setGenerated(true);
  };

  const regenerateParagraph = async (p: ParagraphData) => {
    // Set temp loading state for UI (optional, or just reuse main loading)
    updateData(p.id, { 
      scenes: p.scenes.map(s => ({ ...s, startPrompt: "Regenerating...", endPrompt: "Regenerating..." })) 
    });
    
    const customKey = settings.apiKeys.google;
    const prompts = await generateScenePrompts(p.text, settings.imageCount, settings.style, customKey);
    
    const newScenes = p.scenes.map((scene, idx) => ({
       ...scene,
       startPrompt: prompts[idx]?.start || scene.startPrompt,
       endPrompt: prompts[idx]?.end || scene.endPrompt,
       // Reset statuses
       startImageStatus: GenerationStatus.IDLE,
       endImageStatus: GenerationStatus.IDLE,
       videoStatus: GenerationStatus.IDLE
    }));
    
    updateData(p.id, { scenes: newScenes });
  };

  const handleSingleRegenerate = async (p: ParagraphData, sIdx: number, type: 'start' | 'end') => {
    const key = `${p.id}-${sIdx}-${type}`;
    if (regeneratingIds.has(key)) return;

    setRegeneratingIds(prev => new Set(prev).add(key));
    const scene = p.scenes[sIdx];
    const currentPrompt = type === 'start' ? scene.startPrompt : scene.endPrompt;
    const customKey = settings.apiKeys.google;

    try {
      const newPrompt = await regenerateSinglePrompt(p.text, currentPrompt, type, settings.style, customKey);
      
      const newScenes = [...p.scenes];
      newScenes[sIdx] = {
        ...scene,
        [type === 'start' ? 'startPrompt' : 'endPrompt']: newPrompt,
        // Reset status for the affected part so it regenerates in Step 5
        [type === 'start' ? 'startImageStatus' : 'endImageStatus']: GenerationStatus.IDLE,
        videoStatus: GenerationStatus.IDLE // Changing either affects video
      };

      updateData(p.id, { scenes: newScenes });

    } catch (e) {
      console.error("Single regen failed", e);
    } finally {
      setRegeneratingIds(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  };

  return (
    <div className="space-y-6 pb-10">
       <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">Scene Storyboard</h2>
        <p className="text-slate-400">Review the Start and End points for each scene.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
           <Loader2 className="animate-spin text-blue-500 w-12 h-12" />
           <p className="text-slate-300 animate-pulse">Designing {data.length * settings.imageCount} scenes...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {data.map((item, idx) => (
             <div key={item.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
               <div className="bg-slate-900/50 p-4 border-b border-slate-700 flex justify-between items-center">
                 <h4 className="font-semibold text-slate-200">Paragraph {idx + 1}</h4>
                 <button 
                  onClick={() => regenerateParagraph(item)}
                  className="text-xs flex items-center space-x-1 text-blue-400 hover:text-blue-300"
                 >
                   <RefreshCw size={12} />
                   <span>Regenerate Scenes</span>
                 </button>
               </div>
               
               <div className="p-4 bg-slate-900/30 text-sm text-slate-400 mb-4 border-b border-slate-800">
                  {item.text}
               </div>

               <div className="p-4 space-y-6">
                 {item.scenes.map((scene, sIdx) => (
                   <div key={scene.id} className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-3 text-xs font-mono text-slate-500">
                         <span className="bg-slate-800 px-2 py-1 rounded">Scene {sIdx + 1}</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {/* Start Prompt */}
                         <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <label className="text-xs font-bold text-green-400 flex items-center gap-1">
                                <Image size={10} /> Start Point
                              </label>
                              <button 
                                onClick={() => handleSingleRegenerate(item, sIdx, 'start')}
                                disabled={regeneratingIds.has(`${item.id}-${sIdx}-start`)}
                                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-2 py-0.5 rounded border border-slate-700 flex items-center gap-1 transition-colors"
                                title="Regenerate this prompt"
                              >
                                <RefreshCw size={10} className={regeneratingIds.has(`${item.id}-${sIdx}-start`) ? "animate-spin" : ""} />
                                <span>Refine</span>
                              </button>
                            </div>
                            <textarea
                              value={scene.startPrompt}
                              onChange={(e) => {
                                const newScenes = [...item.scenes];
                                newScenes[sIdx] = { ...scene, startPrompt: e.target.value };
                                updateData(item.id, { scenes: newScenes });
                              }}
                              className="w-full h-20 bg-slate-800 border border-slate-600 rounded p-2 text-xs text-slate-300 focus:ring-1 focus:ring-green-500 outline-none"
                            />
                         </div>

                         {/* End Prompt */}
                         <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <label className="text-xs font-bold text-purple-400 flex items-center gap-1">
                                <Film size={10} /> End Point (Transition)
                              </label>
                              <button 
                                onClick={() => handleSingleRegenerate(item, sIdx, 'end')}
                                disabled={regeneratingIds.has(`${item.id}-${sIdx}-end`)}
                                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white px-2 py-0.5 rounded border border-slate-700 flex items-center gap-1 transition-colors"
                                title="Regenerate this prompt"
                              >
                                <RefreshCw size={10} className={regeneratingIds.has(`${item.id}-${sIdx}-end`) ? "animate-spin" : ""} />
                                <span>Refine</span>
                              </button>
                            </div>
                            <textarea
                              value={scene.endPrompt}
                              onChange={(e) => {
                                const newScenes = [...item.scenes];
                                newScenes[sIdx] = { ...scene, endPrompt: e.target.value };
                                updateData(item.id, { scenes: newScenes });
                              }}
                              className="w-full h-20 bg-slate-800 border border-slate-600 rounded p-2 text-xs text-slate-300 focus:ring-1 focus:ring-purple-500 outline-none"
                            />
                         </div>
                      </div>
                   </div>
                 ))}
               </div>
             </div>
          ))}
        </div>
      )}

      <div className="flex justify-between pt-4">
         <button
          onClick={onBack}
          className="flex items-center space-x-2 text-slate-400 hover:text-white px-6 py-3 rounded-lg font-semibold transition-all"
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>

        <button
          onClick={onNext}
          disabled={loading}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold transition-all transform hover:scale-105"
        >
          <span>Start Generation</span>
          <Wand2 size={18} />
        </button>
      </div>
    </div>
  );
};
