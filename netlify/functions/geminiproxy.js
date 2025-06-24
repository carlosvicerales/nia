// Ruta: /netlify/functions/geminiproxy.js
const { GoogleAuth } = require('google-auth-library');

// --- Helper para obtener el token de autenticación ---
async function getAuthToken() {
  const credentialsBase64 = process.env.GOOGLE_CREDENTIALS_BASE64;
  if (!credentialsBase64) {
    throw new Error("La variable de entorno GOOGLE_CREDENTIALS_BASE64 no está configurada.");
  }
  
  // Decodificar las credenciales de Base64 a JSON
  const credentialsJson = Buffer.from(credentialsBase64, 'base64').toString('utf-8');
  const credentials = JSON.parse(credentialsJson);

  const auth = new GoogleAuth({
    credentials,
    scopes: 'https://www.googleapis.com/auth/cloud-platform',
  });

  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  return accessToken.token;
}


// --- Handler principal de la función ---
exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Método no permitido.' })
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { nombre, responses } = body;

    if (!nombre || !responses || !Array.isArray(responses) || responses.length < 5) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Faltan datos en el body.' })
      };
    }

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
  "claridad": 1,
  "foco_cliente": 1,
  "transformacion": 1,
  "diferenciacion": 1,
  "autoridad": 1,
  "recomendacion": "Texto de la recomendación personalizada"
}
    `.trim();

    // Obtener el token de autenticación
    const authToken = await getAuthToken();

    const projectId = 'nia-asistente-de-narrativa'; // Tu Project ID
    const modelId = 'gemini-1.5-flash-001'; // Usamos un modelo específico de Vertex
    const location = 'us-central1';

    // URL del endpoint de Vertex AI
    const vertexAPI_URL = `https://us-central1-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:generateContent`;

    // Usamos la librería 'node-fetch' que ya teníamos
    const fetch = (await import('node-fetch')).default;
    
    const vertexResponse = await fetch(vertexAPI_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      })
    });

    if (!vertexResponse.ok) {
      const errorText = await vertexResponse.text();
      console.error('Respuesta de error de Vertex AI:', errorText);
      return {
        statusCode: vertexResponse.status,
        body: JSON.stringify({ mensaje: 'Error en la llamada a la API de Vertex AI.', detalles: errorText })
      };
    }
    
    const data = await vertexResponse.json();

    if (!data.candidates || !data.candidates[0]?.content?.parts[0]?.text) {
      console.error('Estructura inesperada en la respuesta de Vertex AI:', data);
      return {
        statusCode: 500,
        body: JSON.stringify({ mensaje: 'Error procesando la respuesta de Vertex AI.', data })
      };
    }

    const rawResult = data.candidates[0].content.parts[0].text;
    const cleanedResult = rawResult.replace(/```json/g, '').replace(/```/g, '').trim();

    let resultadoJson;
    try {
        resultadoJson = JSON.parse(cleanedResult);
    } catch(e) {
        console.error("No se pudo parsear el JSON de la respuesta de Vertex AI:", rawResult);
        return {
            statusCode: 500,
            body: JSON.stringify({ mensaje: 'La respuesta de Vertex AI no era un JSON válido.', respuesta_recibida: rawResult })
        };
    }

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
        error: error.message || error.toString()
      })
    };
  }
};
