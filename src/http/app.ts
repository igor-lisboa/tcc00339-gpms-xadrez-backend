import cors from "cors";
import express, { type Express } from "express";
import type { GameService } from "../application/GameService";
import type { Catalog } from "../domain/catalog";
import { aiRoutes } from "./routes/aiRoutes";
import { catalogRoutes } from "./routes/catalogRoutes";
import { gameRoutes } from "./routes/gameRoutes";
import { httpErrorHandler } from "./errorHandler";
import { docsRoutes } from "./routes/docsRoutes";
import { localizeMessages } from "./i18n/localizeMessages";

/** Builds the Express app. Route order matters: AI routes before the game routes. */
export const createApp = (service: GameService, catalog: Catalog): Express => {
    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use(localizeMessages);
    app.use(aiRoutes(service));
    app.use(gameRoutes(service));
    app.use(catalogRoutes(catalog));
    app.use(docsRoutes());
    app.use(httpErrorHandler);
    return app;
};
