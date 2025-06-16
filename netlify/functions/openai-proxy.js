const https = require('https');

exports.handler = async (event, context) => {
  // Solo permitir POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { responses, nombre } = JSON.parse(event.body);
    
    // Construir el prompt para OpenAI
    const prompt = `
Eres NIA, asesora virtual experta en narrativa comercial entrenada por Carlos Henríquez.

Analiza estas respuestas de una empresa B2B:

1. Tipo de clientes: ${responses[0] || 'No especificado'}
2. Problema que resuelve: ${responses[1] || 'No especificado'}
3. Resultado/transformación: ${responses[2] || 'No especificado'}
4. Diferenciación: ${responses[3] || 'No especificado'}
5. Narrativa actual: ${responses[4] || 'No especificado'}

Evalúa la narrativa (pregunta 5) en estas 5 dimensiones con puntaje 1-5:

1. **Claridad** - ¿Se entiende fácilmente lo que hacen y para quién?
2. **Foco en cliente** - ¿Está centrada en el cliente, no solo en la empresa?
3. **Transformación** - ¿Hay un cambio o resultado claro para el cliente?
4. **Diferenciación** - ¿Muestra algo único frente a competidores?
5. **Autoridad** - ¿Hay evidencia de experiencia o resultados?

Responde EXACTAMENTE en este formato JSON:
{
  "claridad": 3,
  "foco_cliente": 2,
  "transformacion": 4,
  "diferenciacion": 2,
  "autoridad": 3,
  "total": 14,
  "recomendacion": "Recomendación personalizada específica basada en las respuestas, dirigida a ${nombre}. Sé empática pero directa, sugiere mejoras concretas."
}`;

    // Llamada a OpenAI
    const openaiData = JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Eres NIA, experta en narrativa comercial. Responde siempre en formato JSON válido."
        },
        {
          role: "user", 
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });

    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Length': Buffer.byteLength(openaiData)
      }
    };

    const response = await new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve({ statusCode: res.statusCode, data }));
      });
      
      req.on('error', reject);
      req.write(openaiData);
      req.end();
    });

    if (response.statusCode !== 200) {
      throw new Error(`OpenAI API error: ${response.statusCode}`);
    }

    const openaiResponse = JSON.parse(response.data);
    const content = openaiResponse.choices[0].message.content;
    
    // Intentar parsear la respuesta JSON
    let result;
    try {
      result = JSON.parse(content);
    } catch (e) {
      // Si no es JSON válido, crear respuesta por defecto
      result = {
        claridad: 3,
        foco_cliente: 3,
        transformacion: 3,
        diferenciacion: 3,
        autoridad: 3,
        total: 15,
        recomendacion: `${nombre}, tu narrativa tiene elementos positivos pero puede fortalecerse. Te recomiendo ser más específico sobre los resultados que generas y cómo te diferencias en tu mercado.`
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};
