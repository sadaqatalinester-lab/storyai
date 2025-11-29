

import { ParagraphData } from "../types";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const checkOpenAiKey = (apiKey: string): boolean => {
  return apiKey.startsWith("sk-") && apiKey.length > 20;
};

export const validateOpenAIApiKey = async (apiKey: string): Promise<boolean> => {
    try {
        const res = await fetch("https://api.openai.com/v1/models", {
            headers: { Authorization: `Bearer ${apiKey}` }
        });
        return res.ok;
    } catch {
        return false;
    }
};

export const chatWithOpenAI = async (
  messages: ChatMessage[], 
  apiKey: string, 
  model: string = "gpt-4o-mini"
): Promise<string> => {
  if (!apiKey) throw new Error("OpenAI API Key is missing");

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "OpenAI API request failed");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
};

export const segmentStoryWithOpenAI = async (text: string, apiKey: string, model: string = "gpt-4o"): Promise<string[]> => {
  if (!apiKey) throw new Error("OpenAI API Key is missing");

  const prompt = `
    You are a professional film editor. 
    Analyze the following story text and split it into distinct scenes or paragraphs suitable for video adaptation.
    Each paragraph should represent a coherent visual sequence.
    
    Story Text:
    "${text}"
    
    Return a STRICT JSON array of strings. Do not add markdown formatting.
    Example: ["Scene 1 text...", "Scene 2 text..."]
  `;

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
       // Fallback to text split if API fails
       throw new Error("API Error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);
    
    // Handle cases where AI returns { "scenes": [...] } or just [...]
    if (Array.isArray(parsed)) return parsed;
    if (parsed.scenes && Array.isArray(parsed.scenes)) return parsed.scenes;
    if (parsed.paragraphs && Array.isArray(parsed.paragraphs)) return parsed.paragraphs;
    
    return [text]; // Fail safe
  } catch (e) {
    console.error("OpenAI Segmentation failed", e);
    return text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  }
};
