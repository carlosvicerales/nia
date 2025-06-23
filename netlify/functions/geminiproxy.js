const fetch = require('node-fetch');

exports.handler = async function (event) {
  try {
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: 'Método no permitido' })
      };
    }

    const body = JSON.parse(event.body || '{}');
    const { nombre, responses } = body;

    if (!nombre || !responses || responses.length < 5) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Faltan datos en el body. Se requieren nombre y 5 respuestas.' })
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

Devuelve solo este JSON:

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
    // CÓDIGO MODIFICADO PARA DEPURAR
    const responseStatus = geminiResponse.status;
    const responseText = await geminiResponse.text(); // ¡Obtén la respuesta como TEXTO!
    
    // Registra en la consola de tu función lo que realmente llegó
    console.log('Status de la respuesta de Gemini:', responseStatus);
    console.log('Texto de la respuesta de Gemini:', responseText);
    
    if (!geminiResponse.ok) {
      // Si la respuesta no fue exitosa (ej: 401, 403, 500)
      return {
        statusCode: responseStatus,
        body: JSON.stringify({ 
          mensaje: 'Error en la llamada a la API de Gemini.',
          respuesta_recibida: responseText
        })
      };
    }
    
    let data;
    try {
      // Solo intenta convertir a JSON si la llamada fue exitosa
      data = JSON.parse(responseText); 
    } catch (parseError) {
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          mensaje: 'La respuesta de Gemini no es un JSON válido.',
          error_parseo: parseError.message,
          respuesta_recibida: responseText
        })
      };
    }

// Ahora el resto de tu lógica puede continuar de forma segura
    if (!data.candidates || !data.candidates[0]?.content?.parts[0]?.text) {
      return {
      statusCode: 500,
      body: JSON.stringify({ mensaje: 'Error: La respuesta de Gemini no tiene la estructura esperada.', data })
      };
    }
// ... resto del código ...
    

    const resultado = data.candidates[0].content.parts[0].text;

    return {
      statusCode: 200,
      body: JSON.stringify({
        mensaje: '✅ Respuesta válida recibida de Gemini',
        resultado
      })
    };
  } catch (error) {
    console.error('Error en geminiproxy:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        mensaje: 'Error generando diagnóstico con Gemini',
        error: error.message || error.toString()
      })
    };
  }
};
