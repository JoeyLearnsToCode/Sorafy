import { GoogleGenAI, Chat, Part } from "@google/genai";
import { SYSTEM_PROMPT } from '../constants';
import { Message, InitialSettings, ImageFile } from '../types';

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

export const getStreamingResponse = async (
  history: Message[],
  settings: { debugMode: boolean },
  initialSettings: InitialSettings
) => {
  const genAI = getAI();

  const geminiHistory = history.slice(0, -1).map(msg => ({
    role: msg.role,
    parts: [{ text: msg.content }]
  }));

  const lastMessage = history[history.length - 1];
  
  const lastMessageParts: (string | Part)[] = [{ text: lastMessage.content }];

  try {
    const parsedContent = JSON.parse(lastMessage.content);
    if (parsedContent.idea && parsedContent.images) {
        let textContent = `Generate a sora-2 prompt based on the following requirements:\nIdea: ${parsedContent.idea}\nLanguage for response: ${parsedContent.promptLanguage}\nOrientation: ${parsedContent.orientation}\nDuration: ${parsedContent.duration} seconds.`;
        if (parsedContent.images.length > 0) {
            textContent += `\nI have also provided ${parsedContent.images.length} reference image(s).`;
        }
        const textPart = { text: textContent };
        const imageParts = parsedContent.images.map((img: {dataUrl: string, type: string}) => fileToGenerativePart(img.dataUrl, img.type));
        
        lastMessageParts.splice(0, 1, textPart, ...imageParts);
    }
  } catch (e) {
    // Not a special JSON message, treat as plain text and add context
    const contextText = `\n\n(System Note: Remember the initial settings: Language for response: ${initialSettings.promptLanguage}, Orientation: ${initialSettings.orientation}, Duration: ${initialSettings.duration} seconds.)`;
    const lastPart = lastMessageParts[0] as Part;
    if (lastPart.text) {
        lastPart.text += contextText;
    }
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
