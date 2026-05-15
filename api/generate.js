const { VertexAI } = require('@google-cloud/vertexai');

module.exports = async function handler(req, res) {
  // CORS سیٹنگز
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { prompt } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: 'پرامپٹ خالی ہے۔' });
      }

      const envCredentials = process.env.GOOGLE_CREDENTIALS_JSON;
      if (!envCredentials) {
        throw new Error('GOOGLE_CREDENTIALS_JSON انوائرمنٹ ویری ایبل نہیں ملا۔');
      }

      // ٹیکسٹ کو صاف کر کے آبجیکٹ میں تبدیل کرنا تاکہ کوئی ایرر نہ آئے
      const credentials = JSON.parse(envCredentials.trim());

      // ورٹیکس اے آئی کی کنفیگریشن
      const vertex_ai = new VertexAI({
        project: 'tars-ai-chat-ann-assistant', 
        location: 'us-central1',
        googleAuthOptions: {
          credentials: credentials
        }
      });

      // مستری انجن کا پرو ماڈل
      const generativeModel = vertex_ai.getGenerativeModel({
        model: 'gemini-1.5-pro-002', 
        generationConfig: {
          responseMimeType: 'application/json' 
        }
      });

      const result = await generativeModel.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      const response = result.response;
      return res.status(200).json(response);

    } catch (error) {
      console.error("Vertex AI Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(404).send('Mistri Engine Backend is Active.');
};
