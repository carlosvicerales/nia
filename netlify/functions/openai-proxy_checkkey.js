exports.handler = async function () {
  const keyStatus = process.env.OPENAI_API_KEY
    ? "✅ API Key está presente"
    : "❌ API Key NO está disponible";

  return {
    statusCode: 200,
    body: JSON.stringify({
      mensaje: keyStatus,
      longitud: process.env.OPENAI_API_KEY?.length || 0,
      comienzaCon: process.env.OPENAI_API_KEY?.slice(0, 5) || "n/a"
    })
  };
};
