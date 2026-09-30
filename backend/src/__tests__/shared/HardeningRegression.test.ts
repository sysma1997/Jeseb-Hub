import { describe, it, expect, beforeAll, beforeEach } from "@jest/globals";

import { ActivationToken } from "../../core/user/domain/ActivationToken";
import { detectImageFormat } from "../../core/shared/domain/ImageSignature";
import { UserToken, TokenType } from "../../core/user/infrastructure/UserToken";
import { mockTranslator } from "./TranslatorMock";

const ID: string = "00000000-0000-0000-0000-000000000000";
const HASH: string = "$2b$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123";

function signed(extra: Record<string, any>): string {
    return UserToken.sign({ id: ID, ...extra }, TokenType.Activation, "1d");
}

describe("Activation token must not expose the password hash", () => {
    beforeAll(() => {
        process.env.JWT_SECRET = "test_secret_for_activation_token";
    });
    beforeEach(() => {
        ActivationToken.reset();
    });

    it("The token payload carries only the id, never the password hash.", () => {
        const token = signed({});

        const payload: any = UserToken.verify(token);

        expect(payload.id).toBe(ID);
        expect(payload.password).toBeUndefined();
        expect(payload.name).toBeUndefined();
        expect(payload.email).toBeUndefined();
        expect(JSON.stringify(payload)).not.toContain(HASH);
    });

    it("The raw token text does not contain the password hash.", () => {
        const token = signed({});

        expect(token).not.toContain(HASH);
        expect(Buffer.from(token.split(".")[1]!, "base64").toString()).not.toContain(HASH);
    });

    it("Saving keeps the pending data on the server and consume returns it once.", () => {
        const token = signed({});

        ActivationToken.save(token, { id: ID, name: "Tester", email: "t@e.co", password: HASH });

        const first = ActivationToken.consume(mockTranslator, token);
        expect(first.id).toBe(ID);
        expect(first.name).toBe("Tester");
        expect(first.email).toBe("t@e.co");
        expect(first.password).toBe(HASH);

        expect(() => ActivationToken.consume(mockTranslator, token)).toThrow();
    });

    it("An unknown token is rejected even when it is a valid signed activation token.", () => {
        const never = signed({});

        expect(() => ActivationToken.consume(mockTranslator, never)).toThrow();
    });

    it("A malformed or empty token is rejected.", () => {
        expect(() => ActivationToken.consume(mockTranslator, "")).toThrow();
        expect(() => ActivationToken.consume(mockTranslator, "no.es.un.token")).toThrow();
    });

    it("An expired pending entry is discarded.", async () => {
        const token = signed({});
        ActivationToken.save(token, { id: ID, name: "Tester", email: "t@e.co", password: HASH });

        const realNow = Date.now;
        Date.now = () => realNow() + ((ActivationToken.ExpiresHours * 60 * 60 * 1000) + 1000);
        try {
            expect(() => ActivationToken.consume(mockTranslator, token)).toThrow();
        } finally {
            Date.now = realNow;
        }
    });
});

describe("Image signature detection", () => {
    const png: Buffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const jpeg: Buffer = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
    const gif: Buffer = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
    const webp: Buffer = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]);

    it("Recognises the allowed image formats by their real bytes.", () => {
        expect(detectImageFormat(png)?.ext).toBe(".png");
        expect(detectImageFormat(jpeg)?.ext).toBe(".jpg");
        expect(detectImageFormat(gif)?.ext).toBe(".gif");
        expect(detectImageFormat(webp)?.ext).toBe(".webp");
    });

    it("Rejects a script that lies about its mime type.", () => {
        const script = Buffer.from("<script>alert(1)</script>", "utf8");
        const html = Buffer.from("<!DOCTYPE html><html></html>", "utf8");
        const php = Buffer.from("<?php system($_GET['c']); ?>", "utf8");

        expect(detectImageFormat(script)).toBeUndefined();
        expect(detectImageFormat(html)).toBeUndefined();
        expect(detectImageFormat(php)).toBeUndefined();
    });

    it("Rejects a RIFF container that is not WEBP.", () => {
        const wav: Buffer = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x41, 0x56, 0x45]);

        expect(detectImageFormat(wav)).toBeUndefined();
    });

    it("Rejects truncated or empty buffers.", () => {
        expect(detectImageFormat(Buffer.alloc(0))).toBeUndefined();
        expect(detectImageFormat(Buffer.from([0x89]))).toBeUndefined();
        expect(detectImageFormat(Buffer.from([0xFF, 0xD8]))).toBeUndefined();
    });

    it("Classifies by container header, so a GIF carrying a script block is still a GIF.", () => {
        const polyglot = Buffer.concat([Buffer.from("GIF87a"), Buffer.from("<script>alert(1)</script>")]);

        expect(detectImageFormat(polyglot)?.ext).toBe(".gif");
    });
});
