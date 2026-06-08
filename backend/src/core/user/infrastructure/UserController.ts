import { v4 as Uuid } from "uuid";
import path from "path";
import jwt from "jsonwebtoken";
import dayjs from "dayjs";
import "dayjs/plugin/utc";
import { Resend } from "resend";

import { ControllerBase } from "../../shared/infrastructure/ControllerBase";
import { User } from "../domain/User";
import type { UserConfig } from "../domain/User";
import { UserRepository } from "../domain/UserRepository";
import { UserAuthenticate } from "./UserAuthenticate";
import { FileStorage } from "../../shared/infrastructure/FileStorage";
import { EmailTemplates } from "../../shared/domain/EmailTemplate";
import { TranslatorRepository } from "../../shared/domain/TranslatorRepository";
import { MessageBuilder } from "../../shared/domain/MessageBuilder";

const FRONTEND_URL = (process.env.FRONTEND_URL) ? 
    process.env.FRONTEND_URL : "http://localhost:8000";
const RESEND_API_KEY = (process.env.RESEND_API_KEY) ? 
    process.env.RESEND_API_KEY : "no_api_key";
const resend = new Resend(RESEND_API_KEY);

export class UserController extends ControllerBase {
    private readonly repository: UserRepository;
    private readonly translator: TranslatorRepository;

    private static CodesVerifications: Map<string, {
        code: number, 
        expires: number
    }> = new Map();

    constructor(repository: UserRepository, translator: TranslatorRepository) {
        super();
        this.repository = repository;
        this.translator = translator;
    }

    private cleanExpiresCodesVerificatons() {
        const now: number = new Date().getTime();

        for (const [id, code] of UserController.CodesVerifications.entries()) {
            if (now > code.expires) 
                UserController.CodesVerifications.delete(id);
        }
    }
    private generateCodeVerification(id: string): number {
        UserController.CodesVerifications.delete(id);

        const code = Math.floor(100000 + Math.random() * 900000);
        UserController.CodesVerifications.set(id, {
            code: code, 
            expires: dayjs.utc().add(10, "minutes").toDate().getTime()
        });

        return code;
    }
    private validateCodeVerification(id: string, code: number): boolean {
        this.cleanExpiresCodesVerificatons();
        const item = UserController.CodesVerifications.get(id);
        if (!item) throw new Error(this.translator.translate("users.errors.codeNotFound"));
        if (code !== item.code) 
            throw new Error(this.translator.translate("users.errors.codeNotMatch"));

        UserController.CodesVerifications.delete(id);
        return true;
    }

    setup() {
        this.router.post("/register", async (req, res) => {
            if (!req.body.name || 
                !req.body.email || 
                !req.body.password) {
                const message = new MessageBuilder(true);

                if (!req.body.name) message.add(this.translator.translate("users.errors.nameRequired"));
                if (!req.body.email) message.add(this.translator.translate("users.errors.emailRequired"));
                if (!req.body.password) message.add(this.translator.translate("users.errors.passwordRequired"));

                return res.status(400).send(message.toString());
            }
            if (!User.IsValidEmail(req.body.email)) 
                return res.status(400).send(this.translator.translate("users.errors.emailNotValid", { email: req.body.email }));

            
            const { name, email, password, id } = req.body;
            try {
                const userExists = await this.repository.getWithEmail(email);
                if (userExists) return res.status(400).send(this.translator.translate("users.errors.emailAlreadyExists", { email }));

                const cryptoPassword = User.ConvertPassword(password);
                const user = new User(this.translator, name, email, cryptoPassword, dayjs.utc().toDate(), id ?? Uuid());
                const jwtParams: any = {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    password: user.password,
                };
                const token = jwt.sign(jwtParams, process.env.JWT_SECRET!, {
                    expiresIn: "1d"
                });
                const { data, error } = await resend.emails.send({
                    from: "no-reply@jeseb.com", 
                    to: [email], 
                    subject: `Jeseb Hub - ${this.translator.translate("users.email.confirmRegister")}`, 
                    html: EmailTemplates.VerificationEmail(this.translator, name, 
                        `${FRONTEND_URL}/${this.translator.getLocale()}/validation?token=${token}`)
                });
                if (error) return res.status(400).json({ error });

                res.send(this.translator.translate("users.success.registrationSend", { email }));
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.get("/validate/:token", async (req, res) => {
            const { token } = req.params;
            try {
                const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
                const user = new User(this.translator, payload.name, payload.email, payload.password, dayjs.utc().toDate());
                
                await this.repository.register(user);
                const { data, error } = await resend.emails.send({
                    from: "no-reply@jeseb.com", 
                    to: [user.email], 
                    subject: `Jeseb Hub - ${this.translator.translate("users.email.validateToken")}`, 
                    html: EmailTemplates.WelcomeEmail(this.translator, user.name)
                });
                if (error) return res.status(400).json({ error });

                res.status(201).send(this.translator.translate("users.success.userAdded"));
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.post("/login", async (req, res) => {
            if (!req.body.email || 
                !req.body.password) {
                const message = new MessageBuilder(true);

                if (!req.body.email) message.add(this.translator.translate("users.errors.emailRequired"));
                if (!req.body.password) message.add(this.translator.translate("users.errors.passwordRequired"));

                return res.status(400).send(message.toString());
            }
            if (!User.IsValidEmail(req.body.email)) 
                return res.status(400).send(this.translator.translate("users.errors.emailInvalid", { email: req.body.email }));
            
            const { email, password, code } = req.body;
            try {
                const cryptoPassword = User.ConvertPassword(password);
                const user: User = await this.repository.login(email, cryptoPassword);

                if (!code && user.config && user.config.twoStep && user.config.twoStep.active) {
                    if (user.config.twoStep.type === "Email") {
                        const codeV = this.generateCodeVerification(user.id!);
    
                        const { data, error } = await resend.emails.send({
                            from: "no-reply@jeseb.com",  
                            to: [user.email], 
                            subject: `Jeseb Hub - ${this.translator.translate("users.email.twoFactor")}`, 
                            html: EmailTemplates.TwoFactorCodeEmail(this.translator, user.name, codeV.toString())
                        });
                        if (error) return res.status(400).json({ error });
                        
                        return res.json({ 
                            token: undefined, 
                            message: this.translator.translate("users.success.loginTwoFactor", { email: email }) 
                        });
                    }
                }
                else if (user.config && user.config.twoStep && user.config.twoStep.active) 
                    this.validateCodeVerification(user.id!, code);
    
                const jwtParams: any = {
                    id: user.id, 
                    expiresToken: dayjs.utc().add(7, "days").toDate().toString()
                };
                const token = jwt.sign(
                    jwtParams, 
                    process.env.JWT_SECRET!, {
                    expiresIn: "7d"
                });
    
                res.json({ token });
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.get("/recover/password/:email", async (req, res) => {
            const { email } = req.params;
            
            if (!User.IsValidEmail(email)) 
                return res.status(400).send(this.translator.translate("users.errors.emailInvalid", { email }));

            try {
                const user: User | undefined = await this.repository.getWithEmail(email);
                if (!user) 
                    return res.status(400).send(this.translator.translate("users.errors.emailNotFound", { email }));

                const token = jwt.sign({ 
                    id: user.id 
                    }, process.env.JWT_SECRET!, {
                        expiresIn: "1d"
                    });
                
                const { data, error } = await resend.emails.send({
                    from: "no-reply@jeseb.com",  
                    to: [user.email], 
                    subject: `Jeseb Hub - ${this.translator.translate("users.email.passwordRecovery")}`, 
                    html: EmailTemplates.PasswordRecoveryEmail(this.translator, user.name, 
                        `${FRONTEND_URL}/${this.translator.getLocale()}/recover?token=${token}`)
                });
                if (error) return res.status(400).json({ error });

                res.send(this.translator.translate("users.success.passwordRecovery", { email: email }));
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.put("/recover/password", async (req, res) => {
            if (!req.body.token || 
                !req.body.password) {
                const message = new MessageBuilder(true);

                if (!req.body.token) message.add(this.translator.translate("users.errors.tokenRequired"));
                if (!req.body.password) message.add(this.translator.translate("users.errors.passwordRequired"));

                return res.status(400).send(message.toString());
            }
            
            const { token, password } = req.body;
            try {
                const cryptoPassword = User.ConvertPassword(password);
                const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;
                const id: string = payload.id;
                
                await this.repository.recoverPassword(id, cryptoPassword);
                res.status(201).send(this.translator.translate("users.success.passwordUpdated"));
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });

        this.router.get("/request/update/email/:email", UserAuthenticate, async (req, res) => {
            if (!req.params.email) 
                return res.status(400).send(this.translator.translate("users.errors.emailRequired"));

            const { email } = req.params;
            const _email: string = this.getQueryString(email);
            if (!User.IsValidEmail(_email)) 
                return res.status(400).send(this.translator.translate("users.errors.emailInvalid", { email: _email }));

            try {
                const code = this.generateCodeVerification(req.user!.id);
                
                const { data, error } = await resend.emails.send({
                    from: "no-reply@jeseb.com", 
                    to: [_email], 
                    subject: `Jeseb Hub - ${this.translator.translate("users.email.updateEmail")}`, 
                    html: EmailTemplates.TwoFactorCodeEmail(this.translator, _email, code.toString())
                });
                if (error) return res.status(400).json({ error });

                res.send(this.translator.translate("users.success.emailUpdated", { email: _email }));
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });

        this.router.put("/update/profile", UserAuthenticate, FileStorage.single("image"), async (req, res) => {
            try {
                if (!req.file) return res.status(400).send(this.translator.translate("users.errors.imageRequired"));

                const ext = path.extname(req.file!.originalname).toLocaleLowerCase();
                const filePath = `/uploads/${req.user!.id}/profile${ext}`;
                await this.repository.updateProfile(req.user!.id, filePath);

                res.status(201).send(filePath);
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.put("/update/name", UserAuthenticate, async (req, res) => {
            const { name } = req.body;
            if (!name) res.status(400).send(this.translator.translate("users.errors.nameRequired"));

            try {
                await this.repository.updateName(req.user!.id, name);
                res.status(201).send(this.translator.translate("users.success.nameUpdated"));
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.put("/update/email", UserAuthenticate, async (req, res) => {
            const { email, code } = req.body;
            if (!email || !code) {
                const message = new MessageBuilder(true);

                if (!email) message.add(this.translator.translate("users.errors.emailRequired"));
                if (!code) message.add(this.translator.translate("users.errors.codeRequired"));
                
                return res.status(400).send(message.toString());
            }
            if (!User.IsValidEmail(email)) return res.status(400).send(this.translator.translate("users.errors.emailInvalid", { email }));
            if (code.toString().length !== 6) return res.status(400).send(this.translator.translate("users.errors.codeInvalid"));
            
            try {
                this.validateCodeVerification(req.user!.id, code);
                await this.repository.updateEmail(req.user!.id, email);

                res.status(201).send(this.translator.translate("users.success.emailUpdateSuccessful"));
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.put("/update/password", UserAuthenticate, async (req, res) => {
            if (!req.body.currentPassword || 
                !req.body.newPassword) {
                const message = new MessageBuilder(true);

                if (!req.body.currentPassword) message.add(this.translator.translate("users.errors.currentPasswordRequired"));
                if (!req.body.newPassword) message.add(this.translator.translate("users.errors.newPasswordRequired"));

                return res.status(400).send(message);
            }
            
            const { currentPassword, newPassword } = req.body;
            try {
                const cryptoCurrentPassword = User.ConvertPassword(currentPassword);
                const cryptoNewPassword = User.ConvertPassword(newPassword);
                await this.repository.updatePassword(req.user!.id, cryptoCurrentPassword, cryptoNewPassword);

                res.status(201).send(this.translator.translate("users.success.passwordUpdateSuccessful"));
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.put("/update/two-step", UserAuthenticate, async (req, res) => {
            const { active, type } = req.body;
            if ((active === undefined || active === null) || !type) {
                const message = new MessageBuilder(true);

                if (active === undefined || active === null) 
                    message.add(this.translator.translate("users.errors.activeRequired"));
                if (!type) message.add(this.translator.translate("users.errors.typeRequired"));

                return res.status(400).send(message.toString());
            }

            try {
                const config: UserConfig = {
                    twoStep: {
                        active: active, 
                        type: type
                    }
                };
                await this.repository.updateTwoStep(req.user!.id, config);

                res.status(201).send(this.translator.translate("users.success.twoFactorUpdated"));
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });

        this.router.get("/", UserAuthenticate, async (req, res) => {
            const expireIn = dayjs.utc(req.user!.expiresToken);
            const current = dayjs.utc();
            const diff = expireIn.diff(current, "days");
            
            const user: User = await this.repository.get(req.user!.id);
            if (!user) throw new Error(this.translator.translate("users.errors.currentUserError"));

            let token: string | undefined = undefined;
            if (diff <= 3) {
                const jwtParams: any = {
                    id: user.id, 
                    expiresToken: dayjs.utc().add(7, "days").toDate().toString()
                };
                token = jwt.sign(
                    jwtParams, 
                    process.env.JWT_SECRET!, {
                    expiresIn: "7d"
                });
            }
            
            const result: any = user.toDto();
            if (token) result.newToken = token;
            res.json(result);
        });
    }
}