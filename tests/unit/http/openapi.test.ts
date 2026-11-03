import { describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import spec from "../../../src/http/docs/openapi.json";
import { GameService } from "../../../src/application/GameService";
import { createApp } from "../../../src/http/app";
import { buildCatalog } from "../../../src/infrastructure/data/catalog";
import { DiscardingEventPublisher } from "../../../src/infrastructure/events/DiscardingEventPublisher";
import { InMemoryGameRepository } from "../../../src/infrastructure/persistence/InMemoryGameRepository";

const catalog = buildCatalog();
const app: Express = createApp(
    new GameService({ repository: new InMemoryGameRepository(), events: new DiscardingEventPublisher(), catalog }),
    catalog
);

const HTTP_METHODS = ["get", "post", "put", "delete", "patch"];

/** The part of an Express router layer this test reads. */
interface Layer {
    readonly route?: { readonly path: string; readonly methods: Record<string, boolean> };
    readonly handle?: { readonly stack?: Layer[] };
}

/** Every "METHOD /path" the Express app answers, with :param written as {param}. */
const routesOf = (stack: Layer[]): string[] =>
    stack.flatMap((layer) => {
        const route = layer.route;
        if (route) {
            return Object.keys(route.methods)
                .filter((method) => route.methods[method])
                .map((method) => `${method.toUpperCase()} ${String(route.path).replace(/:(\w+)/g, "{$1}")}`);
        }
        return layer.handle?.stack ? routesOf(layer.handle.stack) : [];
    });

/** Every "METHOD /path" the description documents. */
const documentedOperations = (): string[] =>
    Object.entries(spec.paths).flatMap(([path, item]) =>
        HTTP_METHODS.filter((method) => method in (item as object)).map((method) => `${method.toUpperCase()} ${path}`)
    );

describe("API description", () => {
    const served = new Set(["GET /openapi.json", "GET /docs"]);
    const routes = routesOf((app as unknown as { _router: { stack: Layer[] } })._router.stack).filter((route) => !served.has(route));

    it("finds the routes of the app (guards the test itself)", () => {
        expect(routes.length).toBeGreaterThan(30);
    });

    it("documents every route the API answers", () => {
        const missing = routes.filter((route) => !documentedOperations().includes(route));
        expect(missing).toEqual([]);
    });

    it("documents no route the API does not answer", () => {
        const extra = documentedOperations().filter((operation) => !routes.includes(operation));
        expect(extra).toEqual([]);
    });

    it("serves the description as JSON with a relative server", async () => {
        const response = await request(app).get("/openapi.json");
        expect(response.status).toBe(200);
        expect(response.body.openapi).toBe("3.0.3");
        expect(response.body.servers).toEqual([{ url: "/" }]);
    });

    it("serves Swagger UI at /docs", async () => {
        const response = await request(app).get("/docs");
        expect(response.status).toBe(200);
        expect(response.headers["content-type"]).toMatch(/text\/html/);
        expect(response.text).toContain("SwaggerUIBundle");
        expect(response.text).toContain('url: "/openapi.json"');
    });
});
