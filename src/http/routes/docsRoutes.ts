import { Router } from "express";
import spec from "../docs/openapi.json";

/** Swagger UI pinned to a released version; the page loads it from a CDN. */
const SWAGGER_UI_VERSION = "5.33.3";

const page = `<!doctype html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Xadrez API</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui.css">
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@${SWAGGER_UI_VERSION}/swagger-ui-bundle.js"></script>
    <script>
        window.onload = () => {
            window.ui = SwaggerUIBundle({ url: "/openapi.json", dom_id: "#swagger-ui" });
        };
    </script>
</body>
</html>
`;

/**
 * Serves the API description: the JSON at /openapi.json and Swagger UI at /docs.
 * The server URL is relative, so "Try it out" calls the host the page was loaded from.
 */
export const docsRoutes = (): Router => {
    const router = Router();

    router.get("/openapi.json", (_req, res) => {
        res.json({ ...spec, servers: [{ url: "/" }] });
    });

    router.get("/docs", (_req, res) => {
        res.type("html").send(page);
    });

    return router;
};
