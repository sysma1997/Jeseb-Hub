export interface ImageFormat {
    mime: string;
    ext: string;
}

export const ImageFormats: Record<string, ImageFormat> = {
    png: { mime: "image/png", ext: ".png" },
    jpeg: { mime: "image/jpeg", ext: ".jpg" },
    gif: { mime: "image/gif", ext: ".gif" },
    webp: { mime: "image/webp", ext: ".webp" }
};

function matches(buffer: Buffer, offset: number, bytes: number[]): boolean {
    if (buffer.length < offset + bytes.length) return false;

    for (let i = 0; i < bytes.length; i++)
        if (buffer[offset + i] !== bytes[i]) return false;

    return true;
}

export function detectImageFormat(buffer: Buffer): ImageFormat | undefined {
    if (matches(buffer, 0, [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])) return ImageFormats.png;
    if (matches(buffer, 0, [0xFF, 0xD8, 0xFF])) return ImageFormats.jpeg;
    if (matches(buffer, 0, [0x47, 0x49, 0x46, 0x38])) return ImageFormats.gif;
    if (matches(buffer, 0, [0x52, 0x49, 0x46, 0x46]) && matches(buffer, 8, [0x57, 0x45, 0x42, 0x50])) return ImageFormats.webp;

    return undefined;
}
