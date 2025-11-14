import { GoogleGenAI, Chat, Part } from "@google/genai";
import { SYSTEM_PROMPT } from '../constants';
import { Message, InitialSettings, ImageFile, Language } from '../types';

let ai: GoogleGenAI | null = null;

const getAI = () => {
  if (!ai) {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set");
    }
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
}

function fileToGenerativePart(dataUrl: string, mimeType: string): Part {
  return {
    inlineData: {
      data: dataUrl.split(',')[1],
      mimeType
    },
  };
}

export const analyzeImage = async (image: ImageFile): Promise<string> => {
    const genAI = getAI();
    const model = 'gemini-2.5-pro';
    const prompt = 'Analyze this image and describe its style, scene, cinematography details, and potential actions in a concise paragraph. This will be used as an idea for generating a video prompt.';
    const imagePart = fileToGenerativePart(image.dataUrl, image.type);

    const response = await genAI.models.generateContent({
      model: model,
      contents: { parts: [imagePart, { text: prompt }] },
    });
    
    return response.text;
}

export const getNewTitleForSession = async (messages: Message[], language: Language): Promise<string> => {
    const genAI = getAI();
    const model = 'gemini-2.5-flash';
    
    const titleLanguage = language === 'zh' ? 'Chinese' : 'English';
    const titleConstraint = language === 'zh' ? '13 Chinese characters' : '6 English words';
    const systemInstruction = `You are an expert at summarizing conversations into concise titles. Based on the following chat history, generate a short title. The title must be in ${titleLanguage} and no longer than ${titleConstraint}. Respond with ONLY the title text, nothing else.`;
    
    const geminiHistory = messages.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));

    geminiHistory.push({ role: 'user', parts: [{ text: 'Please summarize this conversation into a title.' }] });
      
    const response = await genAI.models.generateContent({
        model,
        contents: geminiHistory,
        config: { systemInstruction }
    });

    return response.text.trim().replace(/"/g, '');
};


export const getStreamingResponse = async (
  history: Message[],
  settings: { debugMode: boolean, language: Language },
  initialSettings: InitialSettings
) => {
  const genAI = getAI();

  const geminiHistory = history.slice(0, -1).map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content }]
  }));

  const lastMessage = history[history.length - 1];
  const lastMessageParts: (string | Part)[] = [{ text: lastMessage.content }];
  let isFirstMessageProcessed = false;
  
  // Only try to parse JSON if this is the first message
  if (history.length === 1) {
    try {
      const parsedContent = JSON.parse(lastMessage.content);
      if (parsedContent.idea && parsedContent.images) {
        const uiLanguage = settings.language === 'zh' ? '中文' : 'English';
        let textContent = `Generate a sora-2 prompt based on user provided idea: ${parsedContent.idea}\n\n(System Note: Language for prompt: ${parsedContent.promptLanguage}\nOrientation: ${parsedContent.orientation}\nDuration: ${parsedContent.duration} seconds.\nLanguage for conversational response: ${uiLanguage}. Don't describe them in prompt directly, just use them as context.)`;
        if (parsedContent.images.length > 0) {
            textContent += `\n\nI have also provided ${parsedContent.images.length} reference image${parsedContent.images.length > 1 ? 's' : ''}.`;
        }
        const textPart = { text: textContent };
        const imageParts = parsedContent.images.map((img: {dataUrl: string, type: string}) => fileToGenerativePart(img.dataUrl, img.type));
        lastMessageParts.splice(0, 1, textPart, ...imageParts);
        isFirstMessageProcessed = true;
      }
    } catch (e) {
      // JSON parse failed, will be handled below
    }
  }
  
  // If not first message or first message processing failed, add context
  if (!isFirstMessageProcessed) {
    const uiLanguage = settings.language === 'zh' ? '中文' : 'English';
    const contextText = `(System Note: Language for prompt: ${initialSettings.promptLanguage}\nOrientation: ${initialSettings.orientation}\nDuration: ${initialSettings.duration} seconds.\nLanguage for conversational response: ${uiLanguage}. Don't describe them in prompt directly, just use them as context.)`;
    lastMessageParts.push({ text: contextText });
  }

  // FIX: The `systemInstruction` must be a string and placed inside the `config` object.
  const chat: Chat = genAI.chats.create({
    model: 'gemini-2.5-pro',
    config: {
      systemInstruction: SYSTEM_PROMPT
    },
    history: geminiHistory,
  });

  if (settings.debugMode) {
    console.log("---GEMINI REQUEST---");
    console.log("System Prompt:", SYSTEM_PROMPT);
    console.log("History:", geminiHistory);
    console.log("New Message:", lastMessageParts);
  }

  const result = await chat.sendMessageStream({ 
    message: lastMessageParts
  });

  return result;
};
