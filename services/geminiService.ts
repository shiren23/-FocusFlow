import { GoogleGenAI, Type } from "@google/genai";
import { Task, Priority } from "../types";

export const parseTaskWithAI = async (text: string, apiKey: string): Promise<Partial<Task> | null> => {
  if (!apiKey) {
    console.error("No API Key provided");
    return null;
  }

  try {
    // Use the user-provided key
    const ai = new GoogleGenAI({ apiKey: apiKey });
    
    // Using flash model for speed
    const modelId = "gemini-2.5-flash-latest";

    const systemPrompt = `
      You are a personal productivity assistant. 
      Analyze the user's spoken input and extract task details.
      Current Date: ${new Date().toISOString()}
      
      Return a JSON object.
      Priority Rules:
      1: Urgent & Important (Do now)
      2: Important, Not Urgent (Schedule)
      3: Urgent, Not Important (Delegate)
      4: Not Urgent, Not Important (Delete/Later)
      
      If no deadline is mentioned, leave it null.
      Infer category from context (e.g., 'Learn' -> '学习', 'Meeting' -> '职务', 'Gym' -> '运动').
      Default category: '杂项'.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: text,
      config: {
        systemInstruction: systemPrompt,
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
      return {
        title: result.title,
        category: result.category || '杂项',
        priority: (result.priority as Priority) || 2,
        deadline: result.deadline || undefined,
        note: result.note || ''
      };
    }
    return null;

  } catch (error) {
    console.error("Gemini AI Parsing Error:", error);
    throw error;
  }
};
