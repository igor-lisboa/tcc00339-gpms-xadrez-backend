import type { ApiClient } from "./api";

export const WHITE = "0";
export const BLACK = "1";

export const HUMAN = 0;
export const AI = 1;

/** Creates a game and returns its id. Optional board rows use the "Tipo-ladoId" notation. */
export const createGame = async (
    api: ApiClient,
    body: Record<string, unknown> = { tipoJogo: 0 }
): Promise<number> => {
    const response = await api.post("/jogos", body);
    if (response.status !== 200) {
        throw new Error("Could not create game: " + JSON.stringify(response.body));
    }
    return response.body.data.id;
};

/** Seats a human on both sides, which starts the first turn. */
export const seatBothHumans = async (api: ApiClient, jogoId: number): Promise<void> => {
    await api.post(`/jogos/${jogoId}/jogadores`, { ladoId: 0, tipoId: HUMAN });
    await api.post(`/jogos/${jogoId}/jogadores`, { ladoId: 1, tipoId: HUMAN });
};

export const createGameWithHumans = async (
    api: ApiClient,
    body: Record<string, unknown> = { tipoJogo: 0 }
): Promise<number> => {
    const jogoId = await createGame(api, body);
    await seatBothHumans(api, jogoId);
    return jogoId;
};

/** Plays a move for the given side and fails the test loudly if the API refuses it. */
export const move = async (
    api: ApiClient,
    jogoId: number,
    ladoId: string,
    origem: string,
    destino: string
) => {
    const response = await api.post(`/jogos/${jogoId}/pecas/${origem}/move/${destino}`, undefined, { lado: ladoId });
    if (response.status !== 200) {
        throw new Error(`Move ${origem}-${destino} failed: ` + JSON.stringify(response.body));
    }
    return response;
};

/**
 * Board rows: index 0 is rank 8 and index 7 is rank 1; columns go from A to H.
 * Each cell is either null or "Tipo-ladoId", e.g. "Rei-0" for a white king.
 */
export const boardWith = (placements: Record<string, string>): (string | null)[][] => {
    const rows: (string | null)[][] = Array.from({ length: 8 }, () => Array(8).fill(null));
    for (const [casa, peca] of Object.entries(placements)) {
        const coluna = casa.charCodeAt(0) - "A".charCodeAt(0);
        const linha = 8 - Number(casa[1]);
        rows[linha][coluna] = peca;
    }
    return rows;
};
