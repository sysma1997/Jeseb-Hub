import path from "path";
import fs from "fs";
import multer from "multer";
import type express from "express";

import { detectImageFormat } from "../domain/ImageSignature";
import { TranslatorI18nRepository } from "./i18next";

const translator = new TranslatorI18nRepository();

const MESSAGE: string = "users.errors.invalidImage";

const storage = multer.diskStorage({
    destination: (req, _, cb) => {
        const userId = req.user!.id;
        const dir = path.join("uploads", userId.toString());

        if (!fs.existsSync(dir))
            fs.mkdirSync(dir, { recursive: true });

        cb(null, dir);
    }, 
    filename: (_, file, cb) => {
        cb(null, `profile${path.extname(file.originalname).toLocaleLowerCase()}`);
    }
});

export const FileStorage = multer({ 
    storage, 
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    }, 
    fileFilter: (req, file, cb) => {
        const allowed = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];
        if (!allowed.includes(file.mimetype)) 
            return cb(new Error(`Invalid mime, only valid: ${allowed.join(", ")}`));
        cb(null, true);
    }
});

async function readHead(file: string, length: number): Promise<Buffer> {
    const handle = await fs.promises.open(file, "r");

    try {
        const buffer = Buffer.alloc(length);
        const { bytesRead } = await handle.read(buffer, 0, length, 0);

        return buffer.subarray(0, bytesRead);
    } finally {
        await handle.close();
    }
}

export function ValidateImageUpload(req: express.Request, res: express.Response, next: express.NextFunction): void {
    const file = req.file;
    if (!file) return next();

    readHead(file.path, 12)
        .then((head: Buffer) => {
            const format = detectImageFormat(head);

            if (!format) {
                fs.unlink(file.path, () => {});
                return res.status(400).send(translator.translate(MESSAGE));
            }

            const target: string = path.join(path.dirname(file.path), `profile${format.ext}`);

            fs.rename(file.path, target, (err: NodeJS.ErrnoException | null) => {
                if (err) return res.status(400).send(err.message);

                req.file!.path = target;
                next();
            });
        })
        .catch((err: any) => {
            if (err instanceof Error) return res.status(400).send(err.message);

            res.status(400).send(translator.translate(MESSAGE));
        });
}
