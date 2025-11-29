
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { decodeBase64, pcmToWav } from "./audioUtils";
import { generateImageWithLeonardo } from "./leonardo";

const getAI = (customKey?: string) => {
    // Use custom key if provided, otherwise environment key
    const key = customKey || process.env.API_KEY;
    if (!key) throw new Error("API Key not found");
    return new GoogleGenAI({ apiKey: key });
};

export const checkAndRequestApiKey = async (): Promise<boolean> => {
    // Use the AI Studio environment helper to ensure a key is selected
    if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await window.aistudio.openSelectKey();
            // Race condition mitigation: Assume success after openSelectKey resolves
            return true;
        }
    }
    return true;
};

/**
 * Validates a Gemini API Key by making a minimal request.
 */
export const validateGeminiApiKey = async (apiKey: string): Promise<boolean> => {
    if (!apiKey) return false;
    try {
        const ai = new GoogleGenAI({ apiKey });
        // Minimal request to check validity
        await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: 'test' }] },
        });
        return true;
    } catch (error: any) {
        console.warn("Gemini Key Validation Failed:", error);
        return false;
    }
};

/**
 * Intelligently splits a story into scenes/paragraphs using Gemini.
 */
export const segmentStory = async (text: string, customApiKey?: string): Promise<string[]> => {
  // Only check environment key if no custom key is provided
  if (!customApiKey) {
     await checkAndRequestApiKey();
  }
  
  const ai = getAI(customApiKey);
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        You are a film editor. 
        Analyze the following story text and split it into distinct scenes or paragraphs suitable for video adaptation.
        Each paragraph should represent a coherent visual sequence.
        
        Story Text:
        "${text}"
        
        Return a JSON array of strings.
        Example: ["Scene 1 text...", "Scene 2 text..."]
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const jsonText = response.text || "[]";
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Story segmentation failed", error);
    // Fallback to simple split
    return text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  }
};

/**
 * Extracts multiple scene prompts (start & end) from a paragraph.
 */
export const generateScenePrompts = async (paragraphText: string, count: number, style: string, customApiKey?: string): Promise<Array<{start: string, end: string}>> => {
  if (!customApiKey) await checkAndRequestApiKey();
  const ai = getAI(customApiKey);
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        You are a visual storyboard artist.
        Read the following story paragraph and create ${count} distinct visual scenes.
        For EACH scene, describe the "Start Point" (beginning of the shot) and the "End Point" (end of the shot, showing change/motion).
        
        Style: ${style}.
        Paragraph: "${paragraphText}"
        
        Return a JSON array with exactly ${count} objects.
        Schema: [{ "start": "description...", "end": "description..." }]
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              start: { type: Type.STRING, description: "Detailed visual description of the start of the scene" },
              end: { type: Type.STRING, description: "Detailed visual description of the end of the scene" }
            },
            required: ["start", "end"]
          }
        }
      }
    });
    
    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (error) {
    console.error("Prompt generation failed", error);
    // Fallback if JSON parsing fails
    return Array(count).fill({ start: `Scene from: ${paragraphText.substring(0, 20)}...`, end: "Camera zooms out." });
  }
};

/**
 * Regenerates a single specific prompt (Start or End) for a scene
 */
export const regenerateSinglePrompt = async (
  paragraphText: string, 
  currentPrompt: string, 
  type: 'start' | 'end', 
  style: string,
  customApiKey?: string
): Promise<string> => {
  if (!customApiKey) await checkAndRequestApiKey();
  const ai = getAI(customApiKey);
  const promptType = type === 'start' ? "Start Point (Visual beginning)" : "End Point (Visual transition/end)";
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        You are a visual storyboard artist.
        Context Paragraph: "${paragraphText}"
        Current Prompt: "${currentPrompt}"
        
        Task: Rewrite the visual description for the ${promptType} of a scene derived from this paragraph.
        Make it distinct, detailed, visual, and suitable for an image generator.
        Style: ${style}.
        
        Return ONLY the plain text description, no JSON.
      `,
    });
    return response.text || currentPrompt;
  } catch (error) {
    console.error("Single prompt regeneration failed", error);
    return currentPrompt;
  }
};

/**
 * Generates an image using the selected model.
 * Handles both generateContent (Nano/Flash) and generateImages (Imagen).
 * Includes fallback logic for Imagen and Leonardo AI support.
 */
export const generateImage = async (prompt: string, aspectRatio: string, model: string = "gemini-2.5-flash-image", customApiKey?: string, leonardoKey?: string): Promise<Blob> => {
  // Handle Leonardo AI separately
  if (model === 'leonardo-ai') {
    if (!leonardoKey) {
      throw new Error("Leonardo API Key is required for Leonardo AI image generation");
    }
    // Convert aspect ratio to width/height for Leonardo
    const [w, h] = aspectRatio.split(':').map(Number);
    const baseSize = 1024;
    const width = w >= h ? baseSize : Math.round(baseSize * (w / h));
    const height = h >= w ? baseSize : Math.round(baseSize * (h / w));

    return await generateImageWithLeonardo(prompt, leonardoKey, width, height);
  }

  // Google models (Gemini/Imagen)
  if (!customApiKey) await checkAndRequestApiKey();

  const selectedModel = model; 

  const executeGeneration = async (apiKey: string): Promise<Blob> => {
      const ai = new GoogleGenAI({ apiKey });

      // Fallback function using Gemini Flash
      const generateWithGeminiFlash = async () => {
          console.log("Generating with fallback model: gemini-2.5-flash-image");
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
              parts: [{ text: prompt }],
            },
          });
      
          for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              const bytes = decodeBase64(part.inlineData.data);
              return new Blob([bytes], { type: "image/png" });
            }
          }
          throw new Error("No image data returned from Gemini Flash");
      };

      if (selectedModel.includes('imagen')) {
          // IMAGEN MODEL PATH
          try {
              const response = await ai.models.generateImages({
                  model: selectedModel,
                  prompt: prompt,
                  config: {
                    numberOfImages: 1,
                    aspectRatio: aspectRatio as any,
                    outputMimeType: 'image/png'
                  },
              });
              
              const b64 = response.generatedImages?.[0]?.image?.imageBytes;
              if (!b64) throw new Error("No image data returned from Imagen");
              
              const bytes = decodeBase64(b64);
              return new Blob([bytes], { type: "image/png" });
          } catch (e: any) {
              // If Imagen fails with 404 (Not Found) or 400 (Bad Request/Permission), fallback to Flash
              const isNotFoundOrPermission = e.message?.includes("not found") || 
                                             e.status === "NOT_FOUND" || 
                                             e.code === 404 ||
                                             e.status === "PERMISSION_DENIED" ||
                                             e.code === 403;

              if (isNotFoundOrPermission) {
                  console.warn(`Imagen model ${selectedModel} failed (${e.status || e.code}). Falling back to gemini-2.5-flash-image.`);
                  return await generateWithGeminiFlash();
              }
              throw e;
          }

      } else {
          // NANO/FLASH/GEMINI 3 PRO PATH
          return await generateWithGeminiFlash();
      }
  };

  try {
      const keyToUse = customApiKey || process.env.API_KEY;
      if (!keyToUse) throw new Error("API Key is missing for generation.");
      
      return await executeGeneration(keyToUse);

  } catch (error: any) {
    // Check for specific "Requested entity was not found" error (404)
    const isEntityNotFound = error.message?.includes("Requested entity was not found") || 
                             JSON.stringify(error).includes("Requested entity was not found") ||
                             error.status === "NOT_FOUND" ||
                             error.code === 404;

    if (isEntityNotFound && !customApiKey && window.aistudio) {
        console.warn(`Image generation failed with 404 for ${selectedModel}. Retrying with fresh key selection...`);
        
        await window.aistudio.openSelectKey();
        const newKey = process.env.API_KEY; 
        if (newKey) {
           return await executeGeneration(newKey);
        }
    }
    
    console.error(`Image generation failed with ${selectedModel}`, error);
    throw error;
  }
};

/**
 * Generates audio using Gemini TTS
 */
export const generateAudio = async (text: string, voiceName: string, customApiKey?: string): Promise<Blob> => {
  if (!customApiKey) await checkAndRequestApiKey();
  const ai = getAI(customApiKey);
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio data returned");

    const pcmData = decodeBase64(base64Audio);
    return pcmToWav(pcmData, 24000);
  } catch (error) {
    console.error("Audio generation failed", error);
    throw error;
  }
};

/**
 * Generates a video using Veo (Start Image -> End Image interpolation)
 */
export const generateVideo = async (startImageBlob: Blob, endImageBlob: Blob, prompt: string, customApiKey?: string): Promise<Blob> => {
  // Ensure we have a key (triggers prompt if using env key)
  if (!customApiKey) await checkAndRequestApiKey();

  // Define the core generation function
  const executeGeneration = async (apiKey: string): Promise<Blob> => {
      const startB64 = await blobToBase64(startImageBlob);
      const endB64 = await blobToBase64(endImageBlob);
      
      const ai = new GoogleGenAI({ apiKey });

      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        image: {
          imageBytes: startB64,
          mimeType: 'image/png',
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p', 
          aspectRatio: '16:9',
          lastFrame: {
              imageBytes: endB64,
              mimeType: 'image/png',
          }
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 5000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!videoUri) throw new Error("No video URI returned");

      // Fetch using API Key parameter for Veo. 
      const response = await fetch(`${videoUri}&key=${apiKey}`);
      
      if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Failed to download video: ${response.status} ${response.statusText} - ${errText}`);
      }
      
      return await response.blob();
  };

  // Main execution block with Retry Logic
  try {
      const keyToUse = customApiKey || process.env.API_KEY;
      if (!keyToUse) throw new Error("API Key is missing for generation.");
      
      return await executeGeneration(keyToUse);

  } catch (error: any) {
      // Check for specific "Requested entity was not found" error (404)
      const isEntityNotFound = error.message?.includes("Requested entity was not found") || 
                               JSON.stringify(error).includes("Requested entity was not found") ||
                               error.status === "NOT_FOUND" ||
                               error.code === 404;
      
      // Only retry if we are using the environment key (no custom key) and are in the AI Studio environment
      if (isEntityNotFound && !customApiKey && window.aistudio) {
          console.warn("Veo generation failed with 404 (Entity Not Found). Retrying with fresh key selection...");
          
          await window.aistudio.openSelectKey();
          
          const newKey = process.env.API_KEY; 
          if (newKey) {
             try {
                return await executeGeneration(newKey);
             } catch (retryError: any) {
                 // If it fails again, throw a more helpful error
                 if (retryError.status === "NOT_FOUND" || retryError.code === 404) {
                     throw new Error("Veo Video Generation is not enabled for this API Key/Project. Please check your Google Cloud Console permissions.");
                 }
                 throw retryError;
             }
          }
      }
      
      console.error("Video generation failed", error);
      throw error;
  }
};

async function blobToBase64(blob: Blob): Promise<string> {
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}
