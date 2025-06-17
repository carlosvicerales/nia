const fetch = require("node-fetch");

exports.handler = async function (event) {
  try {
    const { responses, nombre } = JSON.parse(event.body);

    const prompt = `
Actúa como NIA, una asesora virtual experta en narrativa comercial para empresas B2B.

Analiza las siguientes respuestas de un cliente y califica las siguientes dimensiones del 1 al 5:

1. Claridad
2. Foco en el cliente
3. Promesa de transformación
4. Diferenciación
5. Autoridad / prueba social

Además, entrega una recomendación personalizada para mejorar su narrativa comercial.

Nombre del cliente: ${nombre}
Respuestas:
1. Tipo de cliente: ${responses[0]}
2. Problema que resuelve: ${responses[1]}
3. Transformación lograda: ${responses[2]}
4. Diferenciación: ${responses[3]}
5. Narrativa actual: ${responses[4]}

Devuelve solo este JSON:

{
  "claridad": (número del 1 al 5),
  "foco_cliente": (número del 1 al 5),
  "transformacion": (número del 1 al 5),
  "diferenciacion": (número del 1 al 5),
  "autoridad": (número del 1 al 5),
  "recomendacion": "Texto de la recomendación personalizada"
}
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "Eres una asesora virtual experta en narrativa comercial B2B, llamada NIA." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7
      }),
    });

    const data = await response.json();

    const aiMessage = data.choices[0].message.content;

    const parsed = JSON.parse(aiMessage);

    return {
      statusCode: 200,
      body: JSON.stringify(parsed),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Hubo un error al generar el diagnóstico." }),
    };
  }
};
