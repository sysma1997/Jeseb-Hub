import { Router } from "express";

interface IControllerBase {
    setup(): void;
    getRouter(): Router;
}
export class ControllerBase implements IControllerBase {
    protected readonly router: Router;

    constructor() {
        this.router = Router();
    }

    setup(): void {
        throw new Error("Method not implemented.");
    }
    getRouter(): Router {
        return this.router;
    }
}