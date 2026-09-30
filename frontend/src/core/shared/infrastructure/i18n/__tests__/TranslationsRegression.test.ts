import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

const ROOT: string = join(process.cwd(), "src");
const LOCALES: Record<string, string> = {
    es: join(ROOT, "core/shared/infrastructure/i18n/locales/es.json"),
    en: join(ROOT, "core/shared/infrastructure/i18n/locales/en.json")
};
// evita capturar t() dentro de cosas como get("token") o createElement("img")
const TRANSLATE: RegExp = /(?<![a-zA-Z0-9_.])t\(\s*"([a-zA-Z0-9_.]+)"/g;

function flatten(value: any, prefix: string = ""): Set<string> {
    const keys: Set<string> = new Set();

    for (const name of Object.keys(value)) {
        const key: string = prefix ? `${prefix}.${name}` : name;
        if (value[name] && typeof value[name] === "object") flatten(value[name], key).forEach(k => keys.add(k));
        else keys.add(key);
    }
    return keys;
}
function walk(dir: string, found: string[] = []): string[] {
    for (const name of readdirSync(dir)) {
        const full: string = join(dir, name);
        if (statSync(full).isDirectory()) walk(full, found);
        else if ((full.endsWith(".ts") || full.endsWith(".astro")) && !full.includes("/generated/")) found.push(full);
    }
    return found;
}

const dictionaries: Record<string, Set<string>> = Object.fromEntries(
    Object.entries(LOCALES).map(([lang, path]) => [lang, flatten(JSON.parse(readFileSync(path, "utf8")))])
);
const used: Map<string, string[]> = new Map();

for (const file of walk(ROOT)) {
    const source: string = readFileSync(file, "utf8");
    for (const match of source.matchAll(TRANSLATE))
        used.set(match[1], [...(used.get(match[1]) ?? []), relative(ROOT, file)]);
}

describe("Frontend translations", () => {
    it("Should have at least one translated key in the source.", () => {
        expect(used.size).toBeGreaterThan(0);
    });
    it("Should resolve every key used by the source in every locale.", () => {
        const missing: string[] = [];

        for (const [key, files] of used)
            for (const lang of Object.keys(dictionaries))
                if (!dictionaries[lang].has(key)) missing.push(`${key} (${lang}) -> ${[...new Set(files)].join(", ")}`);

        expect(missing).toEqual([]);
    });
    it("Should keep the locales in parity.", () => {
        const es: Set<string> = dictionaries.es!;
        const en: Set<string> = dictionaries.en!;

        expect([...es].filter(k => !en.has(k))).toEqual([]);
        expect([...en].filter(k => !es.has(k))).toEqual([]);
    });
});