import path from "path";
import fs from "fs";
import multer from "multer";

const storage = multer.diskStorage({
    destination: (req, _, cb) => {
        const userId = req.user!.id;
        const dir = path.join("uploads", userId.toString());

        if (!fs.existsSync(dir))
            fs.mkdirSync(dir, { recursive: true });

        cb(null, dir);
    }, 
    filename: (_, file, cb) => {
        const ext = path.extname(file.originalname).toLocaleLowerCase();
        cb(null, `profile${ext}`);
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