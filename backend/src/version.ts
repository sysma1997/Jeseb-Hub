import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export interface AppVersion {
    version: string;
    commit: string;
}

function readPackageVersion(): string {
    try {
        const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf8")) as { version?: string };
        return pkg.version ?? "0.0.0";
    } catch {
        return "0.0.0";
    }
}

function readBakedVersion(): AppVersion | undefined {
    try {
        const candidates = [join(__dirname, "version.json"), join(process.cwd(), "version.json")];
        for (const path of candidates) {
            if (!existsSync(path)) continue;
            const data = JSON.parse(readFileSync(path, "utf8")) as AppVersion;
            if (data?.version) return { version: String(data.version).replace(/^v/, ""), commit: data.commit ?? "" };
        }
    } catch {
        return undefined;
    }
    return undefined;
}

function exec(command: string): string {
    try {
        return execSync(command, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    } catch {
        return "";
    }
}

function readGitVersion(): AppVersion | undefined {
    const describe = exec("git describe --tags --always --dirty");
    if (!describe) return undefined;
    return {
        version: describe.replace(/^v/, ""),
        commit: exec("git rev-parse --short HEAD"),
    };
}

export const APP_VERSION: AppVersion = readBakedVersion() ?? readGitVersion() ?? { version: readPackageVersion(), commit: "" };
