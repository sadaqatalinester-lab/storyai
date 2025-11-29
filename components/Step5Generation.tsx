
import React, { useEffect, useState, useRef } from 'react';
import { Download, CheckCircle, AlertCircle, Loader2, Play, ArrowLeft, Image as ImageIcon, Music, ZoomIn, RefreshCw, X } from 'lucide-react';
import { ParagraphData, AppSettings, GenerationStatus, SceneData } from '../types';
import { generateImage, generateAudio, generateVideo, checkAndRequestApiKey } from '../services/gemini';
import JSZip from 'jszip';

interface Props {
  data: ParagraphData[];
  settings: AppSettings;
  updateData: (id: string, updates: Partial<ParagraphData>) => void;
  onBack: () => void;
}

export const Step5Generation: React.FC<Props> = ({ data, settings, updateData, onBack }) => {
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [progress, setProgress] = useState(0);
  const processingRef = useRef(false);

  // Lightbox state
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!started && !processingRef.current) {
      processingRef.current = true;
      runGeneration();
    }
  }, []);

  const runGeneration = async () => {
    setStarted(true);
    
    // Only check if we are MISSING a custom key and using a service that needs one
    const hasCustomKey = !!settings.apiKeys.google;
    const needsKey = !hasCustomKey && (
                     (settings.generateVideo && settings.videoEngine === 'veo') || 
                     (settings.imageEngine.includes('imagen')) || 
                     (settings.imageEngine.includes('pro')));
                     
    if (needsKey) {
      await checkAndRequestApiKey();
    }

    let totalTasks = 0;
    data.forEach(p => {
       if (settings.generateAudio) totalTasks++;
       p.scenes.forEach(s => {
          totalTasks += 2; // Start Image + End Image
          if (settings.generateVideo) totalTasks++;
       });
    });

    let completedTasks = 0;
    
    // Init status
    data.forEach(p => {
        if (settings.generateAudio && (p.audioStatus === GenerationStatus.SUCCESS || p.audioStatus === GenerationStatus.SKIPPED)) completedTasks++;
        p.scenes.forEach(s => {
           if (s.startImageStatus === GenerationStatus.SUCCESS) completedTasks++;
           if (s.endImageStatus === GenerationStatus.SUCCESS) completedTasks++;
           if (settings.generateVideo && (s.videoStatus === GenerationStatus.SUCCESS || s.videoStatus === GenerationStatus.SKIPPED)) completedTasks++;
        });
    });

    setProgress(totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0);

    const updateProgress = () => {
      completedTasks++;
      setProgress(totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0);
    };

    const updateScene = (paraId: string, sceneId: string, updates: Partial<SceneData>) => {
       const p = data.find(item => item.id === paraId);
       if (!p) return;
       const newScenes = p.scenes.map(s => s.id === sceneId ? { ...s, ...updates } : s);
       updateData(paraId, { scenes: newScenes });
    };

    const processParagraph = async (p: ParagraphData) => {
      // Pass the manual key if available
      const customKey = settings.apiKeys.google;

      if (settings.generateAudio) {
        if (p.audioStatus !== GenerationStatus.SUCCESS) {
          updateData(p.id, { audioStatus: GenerationStatus.PENDING });
          try {
             const blob = await generateAudio(p.text, settings.audioVoice, customKey);
             updateData(p.id, { audioStatus: GenerationStatus.SUCCESS, audioBlob: blob });
          } catch (e: any) {
            updateData(p.id, { audioStatus: GenerationStatus.ERROR, audioErrorMsg: e.message });
          } finally {
            updateProgress();
          }
        }
      } else {
        if (p.audioStatus !== GenerationStatus.SKIPPED) updateData(p.id, { audioStatus: GenerationStatus.SKIPPED });
      }

      for (const scene of p.scenes) {
         // A. Start Image
         let startBlob = scene.startImageBlob;
         if (scene.startImageStatus !== GenerationStatus.SUCCESS) {
            updateScene(p.id, scene.id, { startImageStatus: GenerationStatus.PENDING });
            try {
               startBlob = await generateImage(scene.startPrompt, settings.aspectRatio, settings.imageEngine, customKey);
               updateScene(p.id, scene.id, { startImageStatus: GenerationStatus.SUCCESS, startImageBlob: startBlob });
            } catch (e: any) {
               updateScene(p.id, scene.id, { startImageStatus: GenerationStatus.ERROR, errorMsg: e.message });
            } finally {
               updateProgress();
            }
         }

         // B. End Image
         let endBlob = scene.endImageBlob;
         if (scene.endImageStatus !== GenerationStatus.SUCCESS) {
            updateScene(p.id, scene.id, { endImageStatus: GenerationStatus.PENDING });
            try {
               endBlob = await generateImage(scene.endPrompt, settings.aspectRatio, settings.imageEngine, customKey);
               updateScene(p.id, scene.id, { endImageStatus: GenerationStatus.SUCCESS, endImageBlob: endBlob });
            } catch (e: any) {
               updateScene(p.id, scene.id, { endImageStatus: GenerationStatus.ERROR, errorMsg: e.message });
            } finally {
               updateProgress();
            }
         }

         // C. Video
         if (settings.generateVideo) {
            if (startBlob && endBlob && scene.videoStatus !== GenerationStatus.SUCCESS) {
               updateScene(p.id, scene.id, { videoStatus: GenerationStatus.PENDING });
               try {
                  const vBlob = await generateVideo(startBlob, endBlob, scene.startPrompt, customKey);
                  updateScene(p.id, scene.id, { videoStatus: GenerationStatus.SUCCESS, videoBlob: vBlob });
               } catch (e: any) {
                  updateScene(p.id, scene.id, { videoStatus: GenerationStatus.ERROR, errorMsg: e.message });
               } finally {
                  updateProgress();
               }
            } else if ((!startBlob || !endBlob) && scene.videoStatus !== GenerationStatus.ERROR) {
               updateScene(p.id, scene.id, { videoStatus: GenerationStatus.SKIPPED });
               updateProgress();
            }
         } else {
            if (scene.videoStatus !== GenerationStatus.SKIPPED) {
               updateScene(p.id, scene.id, { videoStatus: GenerationStatus.SKIPPED });
            }
         }
      }
    };

    for (const p of data) {
      await processParagraph(p);
    }

    setCompleted(true);
    processingRef.current = false;
  };

  const regenerateAsset = async (paraId: string, sceneId: string, type: 'start' | 'end') => {
     // Reset status to PENDING/IDLE and rerun generation
     const p = data.find(item => item.id === paraId);
     if (!p) return;
     
     const newScenes = p.scenes.map(s => {
         if (s.id === sceneId) {
             return {
                 ...s,
                 [type === 'start' ? 'startImageStatus' : 'endImageStatus']: GenerationStatus.IDLE,
                 videoStatus: GenerationStatus.IDLE // Reset video too as it depends on images
             };
         }
         return s;
     });
     
     updateData(paraId, { scenes: newScenes });
     
     // Trigger generation again safely
     if (!processingRef.current) {
        setCompleted(false);
        processingRef.current = true;
        setTimeout(runGeneration, 100);
     }
  };

  const handleDownloadZip = async () => {
    const zip = new JSZip();
    const root = zip.folder(`Story_Output_${Date.now()}`);

    data.forEach((p, pIdx) => {
      const pFolder = root?.folder(`paragraph_${(pIdx + 1).toString().padStart(2, '0')}`);
      
      if (p.audioBlob instanceof Blob) pFolder?.file(`audio.wav`, p.audioBlob);
      pFolder?.file(`text.txt`, p.text);

      p.scenes.forEach((s, sIdx) => {
         const sPrefix = `scene_${(sIdx + 1).toString().padStart(2, '0')}`;
         // Ensure we are adding blobs, not undefined
         if (s.startImageBlob instanceof Blob) pFolder?.file(`${sPrefix}_start.png`, s.startImageBlob);
         if (s.endImageBlob instanceof Blob) pFolder?.file(`${sPrefix}_end.png`, s.endImageBlob);
         if (s.videoBlob instanceof Blob) pFolder?.file(`${sPrefix}_video.mp4`, s.videoBlob);
      });
    });

    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = "story_assets.zip";
    link.click();
  };

  return (
    <div className="space-y-8 pb-20 relative">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-bold text-white">Generating Media</h2>
        
        <div className="w-full max-w-xl mx-auto bg-slate-800 rounded-full h-4 overflow-hidden border border-slate-700">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-slate-400 font-mono text-sm">{progress}% Complete</p>
      </div>

      <div className="space-y-6">
        {data.map((item, idx) => (
          <div key={item.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
             <div className="p-3 bg-slate-900/50 border-b border-slate-700 flex items-center justify-between">
                <span className="font-semibold text-slate-300">Paragraph {idx + 1}</span>
                {settings.generateAudio && (
                   <div className="flex items-center space-x-2">
                      <Music size={14} className={item.audioStatus === GenerationStatus.SUCCESS ? "text-green-400" : "text-slate-500"} />
                      {item.audioStatus === GenerationStatus.SUCCESS && item.audioBlob && <audio controls src={URL.createObjectURL(item.audioBlob)} className="h-6 w-24" />}
                      {item.audioStatus === GenerationStatus.ERROR && <span className="text-xs text-red-400">{item.audioErrorMsg}</span>}
                   </div>
                )}
             </div>
             
             <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {item.scenes.map((scene, sIdx) => (
                   <div key={scene.id} className="bg-slate-900 border border-slate-700 rounded-lg p-3 space-y-2">
                      <div className="text-xs text-slate-500 font-mono mb-2">Scene {sIdx + 1}</div>
                      
                      <div className="flex gap-2">
                         {/* START IMAGE */}
                         <div className="flex-1 aspect-square bg-slate-800 rounded flex items-center justify-center relative border border-slate-700 group overflow-hidden">
                            {scene.startImageBlob ? (
                               <>
                                <img src={URL.createObjectURL(scene.startImageBlob)} className="w-full h-full object-cover rounded" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                                    <button onClick={() => setLightboxUrl(URL.createObjectURL(scene.startImageBlob!))} className="p-1 bg-slate-800 rounded text-white hover:bg-slate-700"><ZoomIn size={14}/></button>
                                    <button onClick={() => regenerateAsset(item.id, scene.id, 'start')} className="p-1 bg-slate-800 rounded text-white hover:bg-slate-700"><RefreshCw size={14}/></button>
                                </div>
                               </>
                            ) : (
                               <StatusIcon status={scene.startImageStatus} label="Start" />
                            )}
                            {scene.startImageStatus === GenerationStatus.ERROR && (
                                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-2 text-[10px] text-red-400 text-center">
                                    <AlertCircle size={16} className="mb-1" />
                                    <span>{scene.errorMsg || "Failed"}</span>
                                    <button onClick={() => regenerateAsset(item.id, scene.id, 'start')} className="mt-2 text-blue-400 hover:underline">Retry</button>
                                </div>
                            )}
                         </div>

                         {/* END IMAGE */}
                         <div className="flex-1 aspect-square bg-slate-800 rounded flex items-center justify-center relative border border-slate-700 group overflow-hidden">
                            {scene.endImageBlob ? (
                               <>
                                <img src={URL.createObjectURL(scene.endImageBlob)} className="w-full h-full object-cover rounded" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                                    <button onClick={() => setLightboxUrl(URL.createObjectURL(scene.endImageBlob!))} className="p-1 bg-slate-800 rounded text-white hover:bg-slate-700"><ZoomIn size={14}/></button>
                                    <button onClick={() => regenerateAsset(item.id, scene.id, 'end')} className="p-1 bg-slate-800 rounded text-white hover:bg-slate-700"><RefreshCw size={14}/></button>
                                </div>
                               </>
                            ) : (
                               <StatusIcon status={scene.endImageStatus} label="End" />
                            )}
                            {scene.endImageStatus === GenerationStatus.ERROR && (
                                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-2 text-[10px] text-red-400 text-center">
                                    <AlertCircle size={16} className="mb-1" />
                                    <span>{scene.errorMsg || "Failed"}</span>
                                    <button onClick={() => regenerateAsset(item.id, scene.id, 'end')} className="mt-2 text-blue-400 hover:underline">Retry</button>
                                </div>
                            )}
                         </div>
                      </div>

                      {settings.generateVideo && (
                         <div className="aspect-video bg-black rounded flex items-center justify-center relative border border-slate-700 overflow-hidden">
                            {scene.videoBlob ? (
                               <video controls src={URL.createObjectURL(scene.videoBlob)} className="w-full h-full object-cover" />
                            ) : (
                               <StatusIcon status={scene.videoStatus} label="Video" />
                            )}
                            {scene.videoStatus === GenerationStatus.ERROR && (
                                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-2 text-[10px] text-red-400 text-center">
                                    <AlertCircle size={16} className="mb-1" />
                                    <span>{scene.errorMsg || "Failed"}</span>
                                    <button onClick={() => regenerateAsset(item.id, scene.id, 'start')} className="mt-2 text-blue-400 hover:underline">Retry (All)</button>
                                </div>
                            )}
                         </div>
                      )}
                   </div>
                ))}
             </div>
          </div>
        ))}
      </div>

      {completed && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur border-t border-slate-700 p-6 flex justify-center items-center z-50 animate-slide-up">
           <button
             onClick={handleDownloadZip}
             className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-blue-500/30 transition-all transform hover:scale-105"
           >
             <Download size={20} />
             <span>Download All Assets (ZIP)</span>
           </button>
        </div>
      )}
      
      <div className="flex justify-start pt-4">
        <button
            onClick={onBack}
            className="flex items-center space-x-2 text-slate-400 hover:text-white px-4 py-2 rounded-lg font-semibold transition-all mb-10"
        >
            <ArrowLeft size={18} />
            <span>Back</span>
        </button>
      </div>

      {/* Lightbox Modal */}
      {lightboxUrl && (
         <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 animate-fade-in" onClick={() => setLightboxUrl(null)}>
            <button className="absolute top-4 right-4 text-white hover:text-red-400"><X size={32} /></button>
            <img src={lightboxUrl} className="max-w-full max-h-[90vh] rounded shadow-2xl" onClick={e => e.stopPropagation()} />
         </div>
      )}
    </div>
  );
};

const StatusIcon = ({ status, label }: { status: GenerationStatus, label: string }) => {
   if (status === GenerationStatus.PENDING) return <Loader2 className="animate-spin text-blue-500" />;
   if (status === GenerationStatus.SKIPPED) return <span className="text-xs text-slate-600">Skipped</span>;
   return <span className="text-xs text-slate-600">{label}</span>;
};
