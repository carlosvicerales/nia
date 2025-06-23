const fetch = require('node-fetch');

exports.handler = async function (event) {
  try {
    const { nombre, responses } = JSON.parse(event.body);

    const prompt = `
Actúa como NIA, asesora virtual experta en narrativa comercial para empresas B2B.

Analiza las respuestas siguientes de un cliente llamado ${nombre} y califica las siguientes dimensiones del 1 al 5:

1. Claridad
2. Foco en el cliente
3. Promesa de transformación
4. Diferenciación
5. Autoridad / prueba social

Entregando también una recomendación personalizada.

Respuestas:
1. ${responses[0]}
2. ${responses[1]}
3. ${responses[2]}
4. ${responses[3]}
5. ${responses[4]}

Devuelve este JSON:

{
  "claridad": (número),
  "foco_cliente": (número),
  "transformacion": (número),
  "diferenciacion": (número),
  "autoridad": (número),
  "recomendacion": "texto personalizado"
}
`;

    if (!process.env.GEMINI_API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Falta la API Key de Gemini" })
      };
    }

    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const result = await geminiResponse.json();

    const raw = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!raw) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Gemini no devolvió contenido útil", dump: result })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        mensaje: "🧠 Gemini procesó el diagnóstico",
        resultado: raw
      })
    };

  } catch (error) {
    console.error("❌ Error en Gemini:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        mensaje: "Error generando diagnóstico con Gemini",
        error: error.message
      })
    };
  }
};
