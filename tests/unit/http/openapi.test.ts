import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
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

describe("socket events description (x-socket-events)", () => {
    /** The part of each documented event this test reads. */
    interface SocketEventDoc {
        readonly sentTo?: string;
        readonly sentWhen?: string;
        readonly payload: { readonly required?: readonly string[] } | null;
    }
    const events = (spec as unknown as { "x-socket-events": { events: Record<string, SocketEventDoc> } })["x-socket-events"].events;
    const serverSource = [
        "../../../src/infrastructure/socket/SocketHub.ts",
        "../../../src/domain/game/RequestedAction.ts",
    ]
        .map((file) => readFileSync(path.resolve(__dirname, file), "utf8"))
        .join("\n");
    const RECIPIENT_GROUPS = ["everyone", "bothSides", "opponent", "proposer", "actingSide", "aiPlayer"];
    const EVENT_NAMES = [
        "jogoCriado",
        "jogoResetado",
        "jogoFinalizado",
        "adversarioEntrou",
        "jogadaRealizada",
        "promocaoPeao",
        "responderPropostaEmpate",
        "empateProposto",
        "empatePropostoResposta",
        "responderPropostaReset",
        "resetProposto",
        "resetPropostoResposta",
        "forcaIa",
    ];

    it("documents every event the server sends, and nothing else", () => {
        expect(Object.keys(events).sort()).toEqual([...EVENT_NAMES].sort());
    });

    it("every documented event name is written in the server source", () => {
        const notInSource = Object.keys(events).filter((name) => !serverSource.includes(`"${name}"`));
        expect(notInSource).toEqual([]);
    });

    it("every event names a known recipient group and says when it is sent", () => {
        const incomplete = Object.entries(events)
            .filter(([, doc]) => !RECIPIENT_GROUPS.includes(doc.sentTo ?? "") || !doc.sentWhen)
            .map(([name]) => name);
        expect(incomplete).toEqual([]);
    });

    it("jogoFinalizado documents ladoIdDesistente as a required field of its payload", () => {
        expect(events.jogoFinalizado?.payload?.required).toContain("ladoIdDesistente");
    });
});
