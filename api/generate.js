module.exports = async function handler(req, res) {
  // CORS Settings taaki aapka frontend is backend se secure connect ho sake
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ error: 'Prompt khali hai.' });

      const apiKey = process.env.VERTEX_API_KEY;
      if (!apiKey) {
        throw new Error('VERTEX_API_KEY environment variable Vercel par nahi mila.');
      }

      const project = 'tars-ai-chat-ann-assistant';
      const location = 'us-central1';
      
      // Purana saara loop khatam, ab sirf aapka confirmed model lock hai:
      const model = 'gemini-2.5-pro'; 

      // Google Cloud Vertex AI ka official direct REST endpoint
      const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:generateContent?key=${apiKey}`;

      // Direct single fetch request bina kisi fallback loop ke
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }]
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `Google Cloud Server Error: ${response.status}`);
      }

      // Google ke response se main code (text) bahar nikaalna
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Frontend ke liye data map karke ready response bhejna
      return res.status(200).json({
        active_model: model,
        text: aiText,                       // Frontend ki pasandida 'text' field
        candidates: data.candidates,         // Backup ke liye pura structure
        ...data                             // Pura baaki ka data
      });

    } catch (error) {
      console.error("Backend Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(404).send('Mistri Locked 2.5 Pro Backend is Active.');
};
