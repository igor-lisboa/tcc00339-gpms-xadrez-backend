// Fails when Portuguese words from the glossary appear in code that has already been migrated.
// Only identifiers and comments are checked. Text inside string literals (messages, routes, event names)
// is the API contract and is skipped. Folders whose job is to speak that contract are listed in WIRE_CONTRACT_DIRS.
// Add a directory to MIGRATED when a module is ported. A line that must keep a legacy name
// (for example a key read from database.json) can end with the marker "names-check:ignore".
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

/** Folders that only map the API's Portuguese names. Their identifiers are not checked. */
const WIRE_CONTRACT_DIRS = ["src/http/presenters", "src/http/routes"];

const MIGRATED = ["src/shared", "src/config", "src/infrastructure", "src/domain", "src/application", "src/http", "src/ai", "tests/unit"];

const FORBIDDEN = [
    "jogo", "jogos", "jogador", "jogadores", "jogada", "jogadas",
    "tabuleiro", "casa", "casas", "peca", "pecas", "peça", "peças",
    "lado", "lados", "turno", "turnos", "rei", "rainha", "torre", "bispo", "cavalo",
    "peao", "peão", "promocao", "promoção", "empate", "cheque", "finalizado",
    "branco", "preto", "adversario", "adversário", "desistencia", "desistência", "vitoria", "vitória",
];

const pattern = new RegExp(`\\b(${FORBIDDEN.join("|")})\\b`, "iu");
const IGNORE_MARKER = "names-check:ignore";
const STRING_LITERAL = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`[^`]*`/g;

const listFiles = (dir) =>
    readdirSync(dir).flatMap((entry) => {
        const full = path.join(dir, entry);
        if (statSync(full).isDirectory()) {
            return listFiles(full);
        }
        return /\.(ts|mjs|js)$/.test(entry) ? [full] : [];
    });

const isWireContract = (file) => WIRE_CONTRACT_DIRS.some((dir) => file.startsWith(path.join(root, dir) + path.sep));

const findings = [];
for (const folder of MIGRATED) {
    const absolute = path.join(root, folder);
    try {
        statSync(absolute);
    } catch {
        continue;
    }
    for (const file of listFiles(absolute)) {
        if (isWireContract(file)) {
            continue;
        }
        readFileSync(file, "utf8")
            .split(/\r?\n/)
            .forEach((line, index) => {
                if (line.includes(IGNORE_MARKER)) {
                    return;
                }
                const match = line.replace(STRING_LITERAL, '""').match(pattern);
                if (match) {
                    findings.push(`${path.relative(root, file)}:${index + 1} uses "${match[1]}"`);
                }
            });
    }
}

if (findings.length > 0) {
    console.error("Portuguese names found in migrated code:");
    findings.forEach((finding) => console.error("  " + finding));
    process.exit(1);
}
console.log("Names check passed for: " + MIGRATED.join(", "));
