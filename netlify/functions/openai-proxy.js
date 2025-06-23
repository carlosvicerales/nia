const fetch = require("node-fetch");

exports.handler = async function () {
  const responses = [
    "Empresas del sector salud con más de 100 empleados",
    "Reducimos la rotación laboral conectando emocionalmente a sus equipos",
    "Logran mayor compromiso interno y mejoras en clima organizacional",
    "Nuestra metodología combina neurociencia y arte vivencial",
    "Somos facilitadores certificados con experiencia en +80 empresas"
  ];
  const nombre = "Carlos";

  const prompt = `
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

  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    return {
      statusCode: 200,
      body: JSON.stringify({
        modelo: "gemini-pro",
        resultado: rawText
      })
    };
  } catch (error) {
    console.error("❌ Error al usar Gemini:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Error al llamar a la API de Gemini",
        details: error.message
      })
    };
  }
};
