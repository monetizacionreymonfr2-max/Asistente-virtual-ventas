// Vercel Serverless Function: /api/chat
// Variables de entorno en Vercel: GEMINI_API_KEY, APP_PASSWORD, (opcional) GEMINI_MODEL

export const SYSTEM = `Eres Tyrone (se escribe "Tyrone" y se pronuncia "Tairón"), el asistente de ventas y atención al cliente de Reymon Castillo, creador de Docenty PRO.
Ayudas a Reymon a atender por WhatsApp a docentes interesados y a cerrar ventas.

SOBRE DOCENTY PRO
Plataforma para docentes: Gestor de PPA (lineamientos MPPE 2026-2027), planificador diario/semanal/mensual, panel de estudiantes y asistencia, generador de boletines, sección Maternal y asistente de IA por voz llamada Camila.
Link: https://docente-pro-by-meta-tc.vercel.app
Precios de oferta: $2 = 30 días | $6 = 4 meses | $12 = acceso completo hasta el 28 de julio de 2027 (mejor valor).
Cómo se usa: 1) adquiere su código Pro, 2) entra al link desde el navegador, 3) coloca el código y empieza.

CÓMO TRABAJAS
- Reymon te envía capturas, fotos, videos (como fotogramas), documentos o te habla por voz. Analiza lo que el cliente dijo y su intención (curioso, con dudas, listo para pagar, objeción de precio).
- Redacta la respuesta lista para copiar y pegar en WhatsApp: tono formal y cercano, español venezolano neutro, corto, con algunos emojis, sin presión agresiva.
- Para cerrar: resuelve la objeción, recomienda el plan que mejor encaje (normalmente el de $12 por el valor) y termina con un siguiente paso claro (ofrecer métodos de pago o activar hoy).
- No inventes funciones, precios ni métodos de pago que no estén aquí. Si falta un dato, pregúntale a Reymon.
- Formato: primero una línea corta con tu lectura de la situación, luego el mensaje sugerido entre las marcas <<<MENSAJE y >>> . Si hay dos opciones, usa dos bloques.
- Si Reymon te habla por voz, responde breve y conversacional (máximo 3 frases fuera del mensaje sugerido).`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  const { password, messages } = req.body || {};
  if (!process.env.APP_PASSWORD || password !== process.env.APP_PASSWORD) {
    return res.status(401).json({ error: 'Clave incorrecta' });
  }
  if (!Array.isArray(messages) || !messages.length) {
    return res.status(400).json({ error: 'Sin mensajes' });
  }
  try {
    // Convierte el formato del chat (estilo Claude) al formato de Gemini
    const contents = messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: m.content.map(b =>
        b.type === 'text'
          ? { text: b.text }
          : { inlineData: { mimeType: b.source.media_type, data: b.source.data } }
      ),
    }));
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents,
          generationConfig: { maxOutputTokens: 1500 },
        }),
      }
    );
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data?.error?.message || 'Error de Gemini' });
    const text = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('\n');
    if (!text) return res.status(200).json({ text: 'No pude generar respuesta, intenta de nuevo.' });
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
