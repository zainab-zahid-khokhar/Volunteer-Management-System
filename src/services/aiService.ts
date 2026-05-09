import { GoogleGenAI } from "@google/genai";

let ai: any = null;

export async function summarizeApplication(applicationText: string) {
  try {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      return "AI Summary unavailable (API Key missing)";
    }
    
    if (!ai) {
      ai = new GoogleGenAI({ apiKey: key });
    }
    
    const prompt = `You are a professional volunteer coordinator. Summarize the following volunteer application into a punchy 2-sentence summary highlighting their key strengths and fit for the role. 
      
      Application Text:
      "${applicationText}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });

    return response.text;
  } catch (err) {
    console.error("AI Summarization failed:", err);
    return "Could not generate summary at this time.";
  }
}
