const { VertexAI } = require('@google-cloud/vertexai');

module.exports = async function handler(req, res) {
  // CORS سیٹنگز: تاکہ آپ کا فرنٹ اینڈ (.pages.dev) اس سے رابطہ کر سکے
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

      // ورٹیکس اے آئی کی کنفیگریشن
      // یہاں ہم نے سروس اکاؤنٹ کی تفصیلات براہ راست نہیں ڈالیں تاکہ سیکیورٹی بنی رہے
      const vertex_ai = new VertexAI({
        project: 'tars-ai-chat-ann-assistant', 
        location: 'us-central1'
      });

      // مستری انجن 3.1 پرو کے لیے سب سے جدید ماڈل
      const generativeModel = vertex_ai.getGenerativeModel({
        model: 'gemini-1.5-pro-002', // یہ اس وقت کا بہترین پرو ماڈل ہے
        generationConfig: {
          responseMimeType: 'application/json' 
        }
      });

      // جیمنی سے رابطہ اور ٹوکن کا خودکار انتظام
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

  return res.status(404).send('Mistri Engine 3.1 Pro Backend is active.');
};
