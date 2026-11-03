import { GameService } from "../src/application/GameService";
import { createApp } from "../src/http/app";
import { buildCatalog } from "../src/infrastructure/data/catalog";
import { DiscardingEventPublisher } from "../src/infrastructure/events/DiscardingEventPublisher";
import { InMemoryGameRepository } from "../src/infrastructure/persistence/InMemoryGameRepository";

/**
 * Vercel entry point: the same Express app as src/main.ts, without socket.io and without the AI player.
 * A serverless instance keeps its games only while it is warm, and it cannot run background work.
 * See docs/guides/deploying.md.
 */
const catalog = buildCatalog();
const service = new GameService({
    repository: new InMemoryGameRepository(),
    events: new DiscardingEventPublisher(),
    catalog,
});

export default createApp(service, catalog);
