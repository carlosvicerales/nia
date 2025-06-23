// Ruta completa: /netlify/functions/geminiproxy.js

const fetch = require('node-fetch');

exports.handler = async function (event) {
  // 1. Validar que el método sea POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405, // Method Not Allowed
      body: JSON.stringify({ error: 'Método no permitido. Solo se aceptan solicitudes POST.' })
    };
  }

  try {
    // 2. Procesar los datos de entrada
    const body = JSON.parse(event.body || '{}');
    const { nombre, responses } = body;

    if (!nombre || !responses || !Array.isArray(responses) || responses.length < 5) {
      return {
        statusCode: 400, // Bad Request
        body: JSON.stringify({ error: 'Faltan datos en el body. Se requieren "nombre" y un arreglo de 5 "responses".' })
      };
    }

    // 3. Construir el prompt para la API de Gemini
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

Devuelve solo y únicamente el siguiente objeto JSON, sin nada más antes ni después:

{
  "claridad": (número del 1 al 5),
  "foco_cliente": (número del 1 al 5),
  "transformacion": (número del 1 al 5),
  "diferenciacion": (número del 1 al 5),
  "autoridad": (número del 1 al 5),
  "recomendacion": "Texto de la recomendación personalizada"
}
    `.trim();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("La variable de entorno GEMINI_API_KEY no está configurada en Netlify.");
    }
    
    // 4. Llamar a la API de Gemini
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ]
      })
    });

    if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error('Respuesta de error de Gemini:', errorText);
        return {
            statusCode: geminiResponse.status,
            body: JSON.stringify({ mensaje: 'Error en la llamada a la API de Gemini.', detalles: errorText })
        };
    }
    
    const data = await geminiResponse.json();

    // 5. Extraer y limpiar la respuesta de Gemini
    if (!data.candidates || !data.candidates[0]?.content?.parts[0]?.text) {
      console.error('Estructura inesperada en la respuesta de Gemini:', data);
      return {
        statusCode: 500,
        body: JSON.stringify({ mensaje: 'Error procesando la respuesta de Gemini: estructura inesperada.', data })
      };
    }

    // A veces Gemini devuelve el JSON dentro de un bloque de código markdown (```json ... ```)
    const rawResult = data.candidates[0].content.parts[0].text;
    const cleanedResult = rawResult.replace(/```json/g, '').replace(/```/g, '').trim();

    let resultadoJson;
    try {
        resultadoJson = JSON.parse(cleanedResult);
    } catch(e) {
        console.error("No se pudo parsear el JSON de la respuesta de Gemini. Respuesta cruda:", rawResult);
        return {
            statusCode: 500,
            body: JSON.stringify({ mensaje: 'La respuesta de Gemini no era un JSON válido.', respuesta_recibida: rawResult })
        };
    }

    // 6. Devolver la respuesta final
    return {
      statusCode: 200,
      body: JSON.stringify({
        mensaje: '✅ Diagnóstico generado con éxito',
        resultado: resultadoJson
      })
    };

  } catch (error) {
    console.error('Error en el handler de la función:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        mensaje: 'Error crítico en la función serverless.',
        error: error.message
      })
    };
  }
};
