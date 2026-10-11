# Tyrone · Asistente de ventas Docenty PRO

Estructura:
- `index.html` → la app (chat, adjuntos, dictado, modo llamada)
- `api/chat.js` → función de Vercel que habla con Claude (la clave nunca llega al navegador)

## Desplegar
1. Crea un repo nuevo en GitHub y sube estas carpetas tal cual.
2. En Vercel: Add New → Project → importa el repo (Framework: Other).
3. En Settings → Environment Variables agrega:
   - `GEMINI_API_KEY` = tu clave de aistudio.google.com/apikey
   - `APP_PASSWORD` = la clave que usarás para entrar
   - `GEMINI_MODEL` (opcional) = `gemini-2.5-flash`
   - `GEMINI_VOICE` (opcional) = `Orus` (otras masculinas: Charon, Puck, Fenrir, Algenib)
   - `GEMINI_LIVE_MODEL` (opcional) = `gemini-3.1-flash-live-preview` (cámbialo si Google renombra el modelo)

Archivos: `api/chat.js` (chat), `api/tts.js` (voz del modo básico), `api/live-token.js` (llamada en vivo), `package.json` (instala el SDK de Gemini; Vercel lo hace solo).

El botón 📞 abre la llamada en vivo. Si falla, cae al modo básico (dictado + voz de Gemini).
4. Redeploy y abre el link desde el celular. Usa Chrome o Safari para la voz.
