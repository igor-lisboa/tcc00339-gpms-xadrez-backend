// Converts docs/api/openapi.yaml (the source) into src/http/docs/openapi.json, which the API serves.
// Run `npm run docs:openapi` after every change to the YAML.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

const root = path.resolve(import.meta.dirname, "..");
const source = path.join(root, "docs", "api", "openapi.yaml");
const target = path.join(root, "src", "http", "docs", "openapi.json");

const spec = yaml.load(readFileSync(source, "utf8"));
mkdirSync(path.dirname(target), { recursive: true });
writeFileSync(target, JSON.stringify(spec, null, 4) + "\n");
console.log(`Wrote ${path.relative(root, target)} from ${path.relative(root, source)}`);
