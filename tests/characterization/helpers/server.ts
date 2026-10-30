import { spawn, type ChildProcess } from "node:child_process";
import net from "node:net";
import path from "node:path";

export interface RunningServer {
    url: string;
    stop: () => Promise<void>;
}

const ROOT_DIR = path.resolve(__dirname, "..", "..", "..");

const findFreePort = (): Promise<number> =>
    new Promise((resolve, reject) => {
        const server = net.createServer();
        server.unref();
        server.on("error", reject);
        server.listen(0, () => {
            const address = server.address();
            if (address === null || typeof address === "string") {
                reject(new Error("Could not find a free port"));
                return;
            }
            const { port } = address;
            server.close(() => resolve(port));
        });
    });

const waitUntilReady = async (url: string, child: ChildProcess): Promise<void> => {
    const deadline = Date.now() + 10000;
    while (Date.now() < deadline) {
        if (child.exitCode !== null) {
            throw new Error("Server process exited before becoming ready");
        }
        try {
            const response = await fetch(url + "/");
            if (response.ok) {
                return;
            }
        } catch {
            // server not listening yet
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error("Server did not become ready in time");
};

/**
 * Starts the current application (index.js) in its own process with a fresh
 * in-memory database. Used by characterization tests, which talk to it over HTTP.
 */
export const startServer = async (): Promise<RunningServer> => {
    const port = await findFreePort();
    const url = `http://localhost:${port}`;

    const child = spawn(process.execPath, ["--import", "tsx", "index.js"], {
        cwd: ROOT_DIR,
        env: { ...process.env, PORT: String(port) },
        stdio: "ignore",
    });

    await waitUntilReady(url, child);

    return {
        url,
        stop: () =>
            new Promise<void>((resolve) => {
                if (child.exitCode !== null) {
                    resolve();
                    return;
                }
                child.once("exit", () => resolve());
                child.kill();
            }),
    };
};
