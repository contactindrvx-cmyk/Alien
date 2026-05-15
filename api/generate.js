module.exports = async function handler(req, res) {
  // CORS سیٹنگز تاکہ آپ کا فرنٹ اینڈ اس بیک اینڈ سے رابطہ کر سکے
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

      const project = 'tars-ai-chat-ann-assistant';
      const location = 'us-central1';
      
      // صرف اور صرف وہی جو آپ کا فائنل ماڈل ہے، کوئی سمجھوتہ نہیں:
      const model = 'gemini-3.1-pro-preview'; 

      // گوگل کلاؤڈ ورٹیکس اے آئی کا آفیشل ڈائریکٹ REST اینڈ پوائنٹ
      const url = `https://us-central1-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:generateContent?key=${apiKey}`;

      // بغیر کسی لائبریری کے، براہ راست گوگل سرور کو کال
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json'
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `گوگل کلاؤڈ سرور ایرر: ${response.status}`);
      }

      // فائنل ڈیٹا واپس فرنٹ اینڈ کو بھیجیں
      return res.status(200).json(data);

    } catch (error) {
      console.error("بیک اینڈ کریش ایرر:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(404).send('Mistri Engine 3.1 Pro Direct REST Backend is Active.');
};
