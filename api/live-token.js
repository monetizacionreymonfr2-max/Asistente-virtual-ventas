// Vercel Serverless Function: /api/live-token
// Crea un token temporal (1 uso) para que el navegador hable con Gemini Live sin exponer tu clave.
import { GoogleGenAI } from '@google/genai';
import { SYSTEM } from './chat.js';

const MODEL = process.env.GEMINI_LIVE_MODEL || 'gemini-3.1-flash-live-preview';
const VOICE = process.env.GEMINI_VOICE || 'Orus';
const EXTRA = `

MODO LLAMADA EN VIVO: hablas por voz con Reymon. Responde corto, natural y conversacional, como una llamada (1 a 3 frases). Si Reymon te muestra una captura, dile qué entendiste y propón el mensaje de WhatsApp dictándolo de forma natural. No uses marcas ni símbolos.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  const { password } = req.body || {};
  if (!process.env.APP_PASSWORD || password !== process.env.APP_PASSWORD) {
    return res.status(401).json({ error: 'Clave incorrecta' });
  }
  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { apiVersion: 'v1alpha' },
    });
    const speechConfig = { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } };
    const text = SYSTEM + EXTRA;
    const token = await ai.authTokens.create({
      config: {
        uses: 1,
        expireTime: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        newSessionExpireTime: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
        liveConnectConstraints: {
          model: MODEL,
          config: {
            responseModalities: ['AUDIO'],
            speechConfig,
            systemInstruction: text,
            inputAudioTranscription: {},
            outputAudioTranscription: {},
          },
        },
        httpOptions: { apiVersion: 'v1alpha' },
      },
    });
    return res.status(200).json({
      token: token.name,
      url: 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained',
      setup: {
        model: 'models/' + MODEL,
        generationConfig: { responseModalities: ['AUDIO'], speechConfig },
        systemInstruction: { parts: [{ text }] },
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
    });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
