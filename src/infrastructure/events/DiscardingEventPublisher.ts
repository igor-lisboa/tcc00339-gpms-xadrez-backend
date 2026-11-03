import type { EventPublisher } from "../../application/ports/EventPublisher";

/**
 * Used where no socket clients can stay connected (a serverless deployment). Events are dropped,
 * so real-time notifications are not sent in that setup.
 */
export class DiscardingEventPublisher implements EventPublisher {
    publish(): void {
        // nothing listens in this deployment
    }
}
