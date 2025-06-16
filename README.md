# nia
Asesora virtual que realiza diagnósticos inteligentes de narrativa comercial B2B.

## Testing

Run the following command to execute the project's test script:

```bash
npm test
```

The current configuration simply prints a message indicating that no tests are specified. A real test framework can be integrated later if needed.

## Despliegue en Netlify

Sigue estos pasos para publicar la aplicación de forma segura en Netlify:

1. Crea un nuevo sitio en Netlify y vincula este repositorio.
2. En **Site settings > Environment variables** agrega la variable `OPENAI_API_KEY` con tu clave de OpenAI. La función `openai-proxy` la utiliza para comunicarse con la API y nunca se expone en el frontend.
3. Define también `WEBHOOK_URL` con la URL de tu webhook y ajusta la constante en `index.html` o modifica `openai-proxy` para leerla desde las variables de entorno.
4. Despliega el sitio y accede a la función en `/.netlify/functions/openai-proxy` para las llamadas a OpenAI.
5. No incluyas estas claves directamente en el código público del frontend.
