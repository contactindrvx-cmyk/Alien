const { VertexAI } = require('@google-cloud/vertexai');

module.exports = async function handler(req, res) {
  // CORS سیٹنگز تاکہ آپ کی ویب سائٹ (.pages.dev) اس بیک اینڈ سے جڑ سکے
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { prompt } = req.body;
      if (!prompt) return res.status(400).json({ error: 'پرامپٹ خالی ہے۔' });

      const apiKey = process.env.VERTEX_API_KEY;
      if (!apiKey) {
        throw new Error('VERTEX_API_KEY انوائرمنٹ ویری ایبل ورسل پر نہیں ملا۔');
      }

      // ایجنٹ پلیٹ فارم (Vertex AI) کو آپ کی نئی چابی کے ساتھ لانچ کرنا
      const vertex_ai = new VertexAI({
        project: 'tars-ai-chat-ann-assistant', 
        location: 'us-central1',
        apiKey: apiKey
      });

      // فائنل اور طاقتور ترین 3.1 پرو ماڈل
      const generativeModel = vertex_ai.getGenerativeModel({
        model: 'gemini-3.1-pro-preview', 
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
      console.error("Agent Platform Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(404).send('Mistri Engine 3.1 Pro Agent Platform is Active.');
};
