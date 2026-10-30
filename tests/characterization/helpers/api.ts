export interface ApiResponse {
    status: number;
    body: any;
}

export interface ApiClient {
    get: (path: string, headers?: Record<string, string>) => Promise<ApiResponse>;
    post: (path: string, body?: unknown, headers?: Record<string, string>) => Promise<ApiResponse>;
    put: (path: string, body?: unknown, headers?: Record<string, string>) => Promise<ApiResponse>;
    delete: (path: string, headers?: Record<string, string>) => Promise<ApiResponse>;
}

/**
 * Minimal HTTP client used by the characterization tests. It always returns the
 * status and parsed JSON body, so tests can assert on both.
 */
export const createApiClient = (baseUrl: string): ApiClient => {
    const send = async (
        method: string,
        path: string,
        body?: unknown,
        headers: Record<string, string> = {}
    ): Promise<ApiResponse> => {
        const init: RequestInit = { method, headers: { ...headers } };
        if (body !== undefined) {
            (init.headers as Record<string, string>)["Content-Type"] = "application/json";
            init.body = JSON.stringify(body);
        }
        const response = await fetch(baseUrl + path, init);
        const text = await response.text();
        return {
            status: response.status,
            body: text.length > 0 ? JSON.parse(text) : null,
        };
    };

    return {
        get: (path, headers) => send("GET", path, undefined, headers),
        post: (path, body, headers) => send("POST", path, body, headers),
        put: (path, body, headers) => send("PUT", path, body, headers),
        delete: (path, headers) => send("DELETE", path, undefined, headers),
    };
};

/** Board rows use the same notation as the API: "Tipo-ladoId", rank 8 first. */
export const emptyRows = (): (string | null)[][] => Array.from({ length: 8 }, () => Array(8).fill(null));
