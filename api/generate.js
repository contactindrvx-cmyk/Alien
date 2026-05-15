module.exports = async function handler(req, res) {
  // CORS سیٹنگز تاکہ آپ کا فرنٹ اینڈ اس بیک اینڈ سے بات کر سکے
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

      // آپ کی فرمائش کے مطابق تمام بیسٹ اور تھنکنگ ماڈلز کی ترجیحی لسٹ
      const modelsToTry = [
        'gemini-3.1-pro',               // ۱. سب سے پہلا ٹارگٹ
        'gemini-3.1-flash',             // ۲. دوسرا ٹارگٹ
        'gemini-2.5-pro',               // ۳. ۲.۵ پرو ماڈل
        'gemini-2.5-flash',             // ۴. ۲.۵ فلیش ماڈل
        'gemini-2.5-flash-thinking',    // ۵. ۲.۵ فلیش تھنکنگ ماڈل
        'gemini-2.0-flash-thinking'     // ۶. ۲.۰ فلیش تھنکنگ ماڈل
      ];

      let lastError = null;
      let successfulModel = null;
      let responseData = null;

      // آٹو سوئچ لوپ: ایک ایک کر کے ماڈل چیک کرے گا
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
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: {
                responseMimeType: 'application/json'
              }
            })
          });

          const data = await response.json();

          if (response.ok) {
            // اگر یہ ماڈل چل گیا تو لوپ کو یہیں روک دو
            responseData = data;
            successfulModel = model;
            break; 
          } else {
            console.error(`Model ${model} failed:`, data.error?.message);
            lastError = data.error?.message || `Status ${response.status}`;
          }
        } catch (err) {
          console.error(`Fetch error with model ${model}:`, err.message);
          lastError = err.message;
        }
      }

      // اگر خدانخواستہ کوئی بھی ماڈل نہ چل سکا
      if (!successfulModel) {
        throw new Error(`تمام ماڈلز فیل ہو گئے۔ آخری ایرر: ${lastError}`);
      }

      // فرنٹ اینڈ کو جواب بھیجیں اور ساتھ کامیاب ماڈل کا نام بھی شامل کریں
      return res.status(200).json({
        active_model: successfulModel, // یہ فرنٹ اینڈ کو بتائے گا کہ کون سا ماڈل ایکٹو ہوا ہے
        ...responseData
      });

    } catch (error) {
      console.error("بیک اینڈ فائنل کریش ایرر:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(404).send('Mistri Multi-Model Fallback Backend is Active.');
};
