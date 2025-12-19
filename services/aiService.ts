import { GoogleGenAI, Type } from "@google/genai";
import { Task, Priority, Settings } from "../types";

const SYSTEM_PROMPT = `
  You are a personal productivity assistant. 
  Analyze the user's spoken input and extract task details.
  Current Date: ${new Date().toISOString()}
  
  Return a purely JSON object. Do not include markdown formatting (like \`\`\`json).
  
  Priority Rules:
  1: Urgent & Important (Do now)
  2: Important, Not Urgent (Schedule)
  3: Urgent, Not Important (Delegate)
  4: Not Urgent, Not Important (Delete/Later)
  
  If no deadline is mentioned, leave it null.
  Infer category from context (e.g., 'Learn' -> '学习', 'Meeting' -> '职务', 'Gym' -> '运动').
  Default category: '杂项'.

  Schema:
  {
    "title": "string",
    "category": "string",
    "priority": number (1-4),
    "deadline": "ISO 8601 Date String or null",
    "note": "string"
  }
`;

export const parseTaskWithAI = async (text: string, settings: Settings): Promise<Partial<Task> | null> => {
  if (!settings.aiApiKey) {
    console.error("No API Key provided");
    return null;
  }

  try {
    if (settings.aiProvider === 'gemini') {
      return await parseWithGemini(text, settings);
    } else {
      return await parseWithOpenAICompatible(text, settings);
    }
  } catch (error) {
    console.error("AI Parsing Error:", error);
    throw error;
  }
};

const parseWithGemini = async (text: string, settings: Settings): Promise<Partial<Task> | null> => {
  const ai = new GoogleGenAI({ apiKey: settings.aiApiKey });
  const modelId = settings.aiModel || "gemini-2.5-flash-latest";

  const response = await ai.models.generateContent({
    model: modelId,
    contents: text,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          category: { type: Type.STRING },
          priority: { type: Type.INTEGER },
          deadline: { type: Type.STRING, description: "ISO 8601 Date String or null" },
          note: { type: Type.STRING }
        },
        required: ["title", "priority"]
      }
    }
  });

  if (response.text) {
    const result = JSON.parse(response.text);
    return mapResultToTask(result);
  }
  return null;
};

const parseWithOpenAICompatible = async (text: string, settings: Settings): Promise<Partial<Task> | null> => {
  // Remove trailing slash if present
  const baseUrl = settings.aiBaseUrl.replace(/\/$/, "");
  const url = `${baseUrl}/chat/completions`;

  const payload = {
    model: settings.aiModel,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: text }
    ],
    response_format: { type: "json_object" }, // Enforce JSON for supported models
    temperature: 0.7
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${settings.aiApiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API Error: ${response.status} - ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (content) {
    // Some models wrap in markdown despite instructions
    const cleanJson = content.replace(/```json\n?|\n?```/g, '');
    const result = JSON.parse(cleanJson);
    return mapResultToTask(result);
  }
  return null;
};

const mapResultToTask = (result: any): Partial<Task> => {
  return {
    title: result.title,
    category: result.category || '杂项',
    priority: (result.priority as Priority) || 2,
    deadline: result.deadline || undefined,
    note: result.note || ''
  };
};
