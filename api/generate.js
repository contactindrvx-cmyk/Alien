module.exports = async function handler(req, res) {
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
        throw new Error('VERTEX_API_KEY environment variable nahi mila.');
      }

      const project = 'tars-ai-chat-ann-assistant';
      const location = 'us-central1';
      const model = 'gemini-2.5-pro'; 

      // ⚙️ مستری کے لیے نیا ایجنٹک سسٹم پرامپٹ جو ہر اسٹیپ کا لاگ بنائے گا
      const agentSystemInstruction = `
        You are "The Mistri", an expert Senior IDE Architect.
        Your job is to audit, read, and edit project files based on the user's task.
        
        CRITICAL INSTRUCTION: You must return ONLY a valid JSON object. Do not include markdown blocks outside JSON.
        
        In the "summary" field, you MUST write a highly detailed, step-by-step execution log in URDU (Roman or Urdu script). 
        Format it like a real-time agent workflow. Example:
        "🔍 Project files analyze karna shuru kia...
        📖 Reading index.html... Code is perfect!
        📖 Reading app.js... Found a broken endpoint link on Line 24.
        🛠️ Editing app.js... Fixed the Vercel backend link.
        ✅ All bugs fixed successfully!"
        
        Do not just output raw code without explanation. Give a full description of your actions in the summary.
        
        REQUIRED JSON STRUCTURE:
        {
          "updatedFiles": [
            {
              "name": "filename.js",
              "content": "code here",
              "language": "javascript",
              "path": "path/if/needed"
            }
          ],
          "summary": "Your detailed step-by-step Urdu audit log here."
        }
      `;

      const url = `https://${location}-aiplatform.googleapis.com/v1/projects/${project}/locations/${location}/publishers/google/models/${model}:generateContent?key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `${agentSystemInstruction}\n\nUser Task: ${prompt}` }] }]
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || `GCP Error: ${response.status}`);
      }

      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // JSON کلیننگ لاجک
      let cleanedText = aiText.replace(/```json/gi, "").replace(/```/g, "").trim();
      const firstBrace = cleanedText.indexOf('{');
      const lastBrace = cleanedText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        cleanedText = cleanedText.substring(firstBrace, lastBrace + 1);
      }

      let finalJson = {};
      try {
        finalJson = JSON.parse(cleanedText);
      } catch (e) {
        finalJson = {
          updatedFiles: [],
          summary: `⚙️ **Model Check:**\n\n${aiText}`
        };
      }

      return res.status(200).json({
        active_model: model,
        text: JSON.stringify(finalJson),
        updatedFiles: finalJson.updatedFiles || [],
        summary: finalJson.summary || 'Kam mukammal ho gaya!'
      });

    } catch (error) {
      console.error("Backend Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(404).send('Mistri Agent Auditor Active.');
};
