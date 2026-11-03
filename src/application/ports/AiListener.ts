/**
 * Receives the events that the AI player reacts to. The socket adapter calls it for the AI identifier,
 * so the AI sees the same events it used to receive over socket.io.
 */
export interface AiListener {
    onEvent(eventName: string, payload?: unknown): void;
}
