import http from "node:http";
import type { Express } from "express";
import { Server } from "socket.io";
import { env } from "./config/env";
import { GameService } from "./application/GameService";
import { createApp } from "./http/app";
import { buildCatalog } from "./infrastructure/data/catalog";
import { InMemoryGameRepository } from "./infrastructure/persistence/InMemoryGameRepository";
import { SocketHub } from "./infrastructure/socket/SocketHub";
import { logger } from "./shared/logger";

/**
 * Composition root: builds the parts and connects them. Nothing else creates them.
 * socket.io must attach after the request handler exists, and it keeps the handler for every path
 * except its own, so the Express app is handed to the server first and filled in afterwards.
 */
const start = (): void => {
    const catalog = buildCatalog();
    const repository = new InMemoryGameRepository();

    const forward: { app?: Express } = {};
    const server = http.createServer((req, res) => forward.app?.(req, res));
    const io = new Server(server, { cors: { origin: "*" } });
    const hub = new SocketHub(io);
    io.on("connection", (socket) => hub.connect(socket));

    const service = new GameService({ repository, events: hub, catalog });
    forward.app = createApp(service, catalog);

    server.listen(env.PORT, () => {
        logger.info({ port: env.PORT }, "API listening");
    });
};

start();
