import { readFileSync } from "fs";
import { join } from "path";

export interface AppVersion {
    version: string;
}

// la version vive en package.json y no en el historial de git a proposito: copiar
// .git dentro de la imagen invalidaba todas las capas en cada commit y hacia que
// git describe devolviera "1.1.2-12-gb515725-dirty" en lugar de un tag limpio
function readPackageVersion(): string {
    try {
        const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf8")) as { version?: string };
        return (pkg.version ?? "0.0.0").replace(/^v/, "");
    } catch {
        return "0.0.0";
    }
}

export const APP_VERSION: AppVersion = { version: readPackageVersion() };