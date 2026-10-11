// Vercel Serverless Function: /api/tts
// Voz natural de Gemini. Voces masculinas: Orus, Charon, Puck, Fenrir, Algenib
const VOICE = process.env.GEMINI_VOICE || 'Algenib';
const TTS_MODEL = process.env.GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  const { password, text } = req.body || {};
  if (!process.env.APP_PASSWORD || password !== process.env.APP_PASSWORD) {
    return res.status(401).json({ error: 'Clave incorrecta' });
  }
  if (!text) return res.status(400).json({ error: 'Sin texto' });
  try {
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Dilo como un hombre adulto y maduro de unos 45 años, con voz grave, gruesa y pausada, cálido y cercano, como en una llamada: ' + text.slice(0, 700) }] }],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } },
          },
        }),
      }
    );
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data?.error?.message || 'Error de voz' });
    const audio = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
    if (!audio) return res.status(502).json({ error: 'Sin audio' });
    return res.status(200).json({ audio }); // PCM 16-bit, 24 kHz, mono (base64)
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
