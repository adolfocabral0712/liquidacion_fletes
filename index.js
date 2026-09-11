const JSON_HEADERS = {
  "Content-Type": "application/json; charset=UTF-8",
  "Cache-Control": "no-store, no-cache, must-revalidate",
  Pragma: "no-cache",
};

function responderJson(datos, estado = 200) {
  return new Response(JSON.stringify(datos), {
    status: estado,
    headers: JSON_HEADERS,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/datos") {
      if (!env.LIQUIDACION_FLETES_JSON_URL) {
        return responderJson(
          {
            error:
              "No existe el Secret LIQUIDACION_FLETES_JSON_URL.",
          },
          500
        );
      }

      try {
        const respuesta = await fetch(
          env.LIQUIDACION_FLETES_JSON_URL,
          {
            headers: {
              Accept: "application/json",
              "User-Agent": "Liquidacion-Fletes/1.0",
            },
            cf: {
              cacheEverything: false,
              cacheTtl: 0,
            },
          }
        );

        if (!respuesta.ok) {
          return responderJson(
            {
              error:
                `La fuente JSON respondió con estado ${respuesta.status}.`,
            },
            502
          );
        }

        const texto = await respuesta.text();

        try {
          JSON.parse(texto);
        } catch {
          return responderJson(
            {
              error:
                "La fuente no devolvió un JSON válido.",
            },
            502
          );
        }

        return new Response(texto, {
          status: 200,
          headers: JSON_HEADERS,
        });
      } catch {
        return responderJson(
          {
            error:
              "No fue posible obtener los datos de liquidación.",
          },
          502
        );
      }
    }

    return env.ASSETS.fetch(request);
  },
};
