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
      if (!prompt) return res.status(400).json({ error: 'پرامپٹ خالی ہے۔' });

      const apiKey = process.env.VERTEX_API_KEY;
      if (!apiKey) {
        throw new Error('VERTEX_API_KEY انوائرمنٹ ویری ایبل ورسل پر نہیں ملا۔');
      }

      const project = 'tars-ai-chat-ann-assistant';
      const location = 'us-central1';

      // تمام ماڈلز کی لسٹ
      const modelsToTry = [
        'gemini-3.1-pro',
        'gemini-3.1-flash',
        'gemini-1.5-pro-002',
        'gemini-2.5-pro',
        'gemini-2.5-flash',
        'gemini-2.5-flash-thinking',
        'gemini-2.0-flash-thinking'
      ];

      let lastError = null;
      let successfulModel = null;
      let responseData = null;

      // آٹو سوئچ لوپ
      for (const model of modelsToTry) {
        try {
          console.log(`Trying model: ${model}...`);
          
          const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:generateContent?key=${apiKey}`;

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

          if (response.ok) {
            responseData = data;
            successfulModel = model;
            break; 
          } else {
            lastError = data.error?.message || `Status ${response.status}`;
          }
        } catch (err) {
          lastError = err.message;
        }
      }

      if (!successfulModel) {
        throw new Error(`تمام ماڈلز فیل ہو گئے۔ آخری ایرر: ${lastError}`);
      }

      // گوگل کے جواب سے اصل کوڈ نکالنا
      const aiText = responseData.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      // 🚀 جادو: ماڈل کا نام میسج کے بالکل اوپر ٹیکسٹ کے اندر شامل کرنا
      const textWithModelInfo = `⚙️ **Active Model:** \`${successfulModel}\`\n\n${aiText}`;

      // فرنٹ اینڈ کو جواب بھیجنا
      return res.status(200).json({
        active_model: successfulModel,
        text: textWithModelInfo, // اب یہ نام چیٹ باکس میں صاف نظر آئے گا
        candidates: responseData.candidates,
        ...responseData
      });

    } catch (error) {
      console.error("بیک اینڈ فائنل کریش ایرر:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(404).send('Mistri Multi-Model Fallback Backend is Active.');
};
      
