// Fails when Portuguese words from the glossary appear in code that has already been migrated.
// Add a directory to MIGRATED when a module is ported. Lines that must keep a legacy name
// (for example keys read from database.json) can end with the marker "names-check:ignore".
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

const MIGRATED = ["src/shared", "src/config", "src/infrastructure", "tests/unit"];

const FORBIDDEN = [
    "jogo", "jogos", "jogador", "jogadores", "jogada", "jogadas",
    "tabuleiro", "casa", "casas", "peca", "pecas", "peça", "peças",
    "lado", "lados", "turno", "turnos", "rei", "rainha", "torre", "bispo", "cavalo",
    "peao", "peão", "promocao", "promoção", "empate", "cheque", "finalizado",
    "branco", "preto", "adversario", "adversário", "desistencia", "desistência", "vitoria", "vitória",
];

const pattern = new RegExp(`\\b(${FORBIDDEN.join("|")})\\b`, "iu");
const IGNORE_MARKER = "names-check:ignore";

const listFiles = (dir) =>
    readdirSync(dir).flatMap((entry) => {
        const full = path.join(dir, entry);
        if (statSync(full).isDirectory()) {
            return listFiles(full);
        }
        return /\.(ts|mjs|js)$/.test(entry) ? [full] : [];
    });

const findings = [];
for (const folder of MIGRATED) {
    const absolute = path.join(root, folder);
    try {
        statSync(absolute);
    } catch {
        continue;
    }
    for (const file of listFiles(absolute)) {
        readFileSync(file, "utf8")
            .split(/\r?\n/)
            .forEach((line, index) => {
                if (line.includes(IGNORE_MARKER)) {
                    return;
                }
                const match = line.match(pattern);
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
