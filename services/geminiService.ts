
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

// Always initialize GoogleGenAI with a named parameter using process.env.API_KEY directly.
export const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export async function sendMessageWithBrowsing(prompt: string): Promise<GenerateContentResponse> {
  const ai = getAIClient();
  return await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      systemInstruction: "คุณคือ Nexus AI ผู้ช่วยอัจฉริยะที่เชี่ยวชาญการค้นหาข้อมูลบนเว็บ คุณต้องตอบเป็นภาษาเดียวกับที่ผู้ใช้ถาม (ไทยหรืออังกฤษ) และให้ข้อมูลที่ถูกต้อง ทันสมัย พร้อมระบุแหล่งที่มา",
      tools: [{ googleSearch: {} }],
    },
  });
}

export async function generateCode(task: string): Promise<string> {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Write professional code for the following task. Wrap the code in triple backticks with the language specified. If the user asks in Thai, explain the code logic in Thai. Task: ${task}`,
    config: {
      systemInstruction: "You are an expert software engineer. Provide high-quality code and explain complex logic in Thai if the request is in Thai.",
    }
  });
  return response.text || '';
}

// Audio Helpers

/**
 * Manual implementation of base64 decoding for byte arrays as per guidelines.
 * Do not use external libraries for this.
 */
export function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Manual decoding of raw PCM data into AudioBuffer. 
 * Essential for processing Gemini Live API raw audio streams as AudioContext.decodeAudioData 
 * is only for structured files (MP3/WAV).
 */
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * Manual implementation of base64 encoding for byte arrays as per guidelines.
 * Do not use external libraries for this.
 */
export function encodeAudio(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
