import type { Request, Response, NextFunction } from "express";
import i18next from "../i18next/index";

export const translateMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const language = req.headers["accept-language"]?.split(",")[0]?.split("-")[0]?.toLocaleLowerCase() || "en";
    if (language === "es") i18next.changeLanguage("es");
    else i18next.changeLanguage("en");

    next();
};