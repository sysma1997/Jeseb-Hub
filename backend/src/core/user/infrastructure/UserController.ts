import { v4 as Uuid } from "uuid";
import path from "path";
import dayjs from "dayjs";
import "dayjs/plugin/utc";
import { Resend } from "resend";

import { ControllerBase } from "../../shared/infrastructure/ControllerBase";
import { User } from "../domain/User";
import type { UserConfig } from "../domain/User";
import { VerificationCode } from "../domain/VerificationCode";
import type { VerificationPurpose } from "../domain/VerificationCode";
import { EmailChange } from "../domain/EmailChange";
import { ActivationToken } from "../domain/ActivationToken";
import type { PendingUser } from "../domain/ActivationToken";
import { UserRepository } from "../domain/UserRepository";
import { UserAuthenticate } from "./UserAuthenticate";
import { SessionContext } from "./SessionContext";
import { SessionService } from "../domain/SessionService";
import { UserToken, TokenType } from "./UserToken";
import { FileStorage, ValidateImageUpload } from "../../shared/infrastructure/FileStorage";
import { AuthRateLimit, EmailRateLimit } from "../../shared/infrastructure/RateLimit";
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

    constructor(repository: UserRepository, translator: TranslatorRepository) {
        super();
        this.repository = repository;
        this.translator = translator;
    }

    private sendEmailCode = async (idUser: string, name: string, to: string, purpose: VerificationPurpose, subjectKey: string, messageKey: string = "users.email.twoFactorCode"): Promise<void> => {
        const code = VerificationCode.build();
        const { error } = await resend.emails.send({
            from: "no-reply@jeseb.com",
            to: [to],
            subject: `Jeseb Hub - ${this.translator.translate(subjectKey)}`,
            html: EmailTemplates.TwoFactorCodeEmail(this.translator, name, code, messageKey)
        });
        if (error) throw new Error(this.translator.translate("users.errors.emailSendFailed"));

        VerificationCode.save(purpose, idUser, code);
    }

    setup() {
        this.router.post("/register", EmailRateLimit, async (req, res) => {
            if (!req.body.name || 
                !req.body.email || 
                !req.body.password) {
                const message = new MessageBuilder();

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
                const token = UserToken.sign({ id: user.id }, TokenType.Activation, "1d");
                ActivationToken.save(token, {
                    id: user.id!,
                    name: user.name,
                    email: user.email,
                    password: user.password
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
                const payload = UserToken.verify(token);
                if (payload.typ !== TokenType.Activation)
                    return res.status(400).send(this.translator.translate("users.errors.invalidToken"));

                const pending: PendingUser = ActivationToken.consume(this.translator, token);
                const user = new User(this.translator, pending.name, pending.email, pending.password, dayjs.utc().toDate(), pending.id);
                
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
        this.router.post("/login", AuthRateLimit, async (req, res) => {
            if (!req.body.email || 
                !req.body.password) {
                const message = new MessageBuilder();

                if (!req.body.email) message.add(this.translator.translate("users.errors.emailRequired"));
                if (!req.body.password) message.add(this.translator.translate("users.errors.passwordRequired"));

                return res.status(400).send(message.toString());
            }
            if (!User.IsValidEmail(req.body.email)) 
                return res.status(400).send(this.translator.translate("users.errors.emailInvalid", { email: req.body.email }));
            
            const { email, password, code } = req.body;
            const hasCode: boolean = !((code === undefined) || (code === null) || (String(code).trim() === ""));
            try {
                const cryptoPassword = User.ConvertPassword(password);
                const user: User = await this.repository.login(email, cryptoPassword);

                if (user.config && user.config.twoStep && user.config.twoStep.active) {
                    if (user.config.twoStep.type !== "Email") 
                        return res.status(400).send(this.translator.translate("users.errors.twoStepTypeNotSupported"));

                    if (!hasCode) {
                        const codeV = VerificationCode.build();

                        const { data, error } = await resend.emails.send({
                            from: "no-reply@jeseb.com",  
                            to: [user.email], 
                            subject: `Jeseb Hub - ${this.translator.translate("users.email.twoFactor")}`, 
                            html: EmailTemplates.TwoFactorCodeEmail(this.translator, user.name, codeV)
                        });
                        if (error) return res.status(400).json({ error });

                        VerificationCode.save("login", user.id!, codeV);

                        return res.json({ 
                            token: undefined, 
                            message: this.translator.translate("users.success.loginTwoFactor", { email: email }) 
                        });
                    }

                    VerificationCode.validate(this.translator, "login", user.id!, code);
                }

                const session = await SessionContext.get().open(user.id!, req.ip, req.get("user-agent") ?? undefined);
                const token = UserToken.sign({
                    id: user.id,
                    sid: session.id
                }, TokenType.Session, SessionService.accessExpiry());

                res.json({ accessToken: token, refreshToken: session.token });
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.post("/refresh", async (req, res) => {
            const { refreshToken } = req.body;
            if (!refreshToken)
                return res.status(401).send(this.translator.translate("users.errors.invalidToken"));

            try {
                const result = await SessionContext.get().redeem(refreshToken, req.ip, req.get("user-agent") ?? undefined);

                if (result.status === "reused") {
                    const killed: number = await SessionContext.get().revokeFamily(result.session.family);
                    console.warn(`Refresh token reuse detected for user ${result.session.idUser}; revoked ${killed} session(s) in family ${result.session.family}.`);

                    return res.status(401).send(this.translator.translate("users.errors.invalidToken"));
                }
                if (result.status !== "rotated")
                    return res.status(401).send(this.translator.translate("users.errors.invalidToken"));

                const token = UserToken.sign({
                    id: result.session.idUser,
                    sid: result.id
                }, TokenType.Session, SessionService.accessExpiry());

                res.json({ accessToken: token, refreshToken: result.token });
            } catch (err: any) {
                if (err instanceof Error) res.status(401).send(this.translator.translate("users.errors.invalidToken"));
            }
        });
        this.router.post("/logout", UserAuthenticate, async (req, res) => {
            const { refreshToken } = req.body;
            if (!refreshToken)
                return res.status(400).send(this.translator.translate("users.errors.refreshTokenRequired"));

            try {
                await SessionContext.get().revoke(refreshToken);
                res.status(201).send(this.translator.translate("users.success.logout"));
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.get("/recover/password/:email", EmailRateLimit, async (req, res) => {
            const _email: string = this.getQueryString(req.params.email);
            
            if (!User.IsValidEmail(_email)) 
                return res.status(400).send(this.translator.translate("users.errors.emailInvalid", { email: _email }));

            try {
                const user: User | undefined = await this.repository.getWithEmail(_email);
                if (!user) 
                    return res.status(400).send(this.translator.translate("users.errors.emailNotFound", { email: _email }));

                const token = UserToken.sign({ 
                    id: user.id 
                    }, TokenType.Recovery, "1d");
                
                const { data, error } = await resend.emails.send({
                    from: "no-reply@jeseb.com",  
                    to: [user.email], 
                    subject: `Jeseb Hub - ${this.translator.translate("users.email.passwordRecovery")}`, 
                    html: EmailTemplates.PasswordRecoveryEmail(this.translator, user.name, 
                        `${FRONTEND_URL}/${this.translator.getLocale()}/recover?token=${token}`)
                });
                if (error) return res.status(400).json({ error });

                res.send(this.translator.translate("users.success.passwordRecovery", { email: _email }));
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.put("/recover/password", async (req, res) => {
            if (!req.body.token || 
                !req.body.password) {
                const message = new MessageBuilder();

                if (!req.body.token) message.add(this.translator.translate("users.errors.tokenRequired"));
                if (!req.body.password) message.add(this.translator.translate("users.errors.passwordRequired"));

                return res.status(400).send(message.toString());
            }
            
            const { token, password } = req.body;
            try {
                const cryptoPassword = User.ConvertPassword(password);
                const payload = UserToken.verify(token);
                if (payload.typ !== TokenType.Recovery)
                    return res.status(400).send(this.translator.translate("users.errors.invalidToken"));

                const id: string = payload.id;
                
                await this.repository.recoverPassword(id, cryptoPassword);
                const revoked: number = await SessionContext.get().revokeAllForUser(id);
                console.log(`Password recovered for user ${id}; revoked ${revoked} active session(s).`);

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
                const idUser: string = req.user!.id;
                const user: User = await this.repository.get(idUser);

                if (_email.toLocaleLowerCase() === user.email.toLocaleLowerCase())
                    return res.status(400).send(this.translator.translate("users.errors.emailSameAsCurrent", { email: user.email }));

                const exists: User | undefined = await this.repository.getWithEmail(_email);
                if (exists) 
                    return res.status(400).send(this.translator.translate("users.errors.emailAlreadyExists", { email: _email }));

                VerificationCode.clear("emailCurrent", idUser);
                VerificationCode.clear("emailNew", idUser);
                EmailChange.start({ idUser: idUser, currentEmail: user.email, newEmail: _email });
                await this.sendEmailCode(idUser, user.name, user.email, "emailCurrent", "users.email.updateEmailCurrent");

                res.send(this.translator.translate("users.success.emailCodeSentCurrent", { email: user.email }));
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });

        this.router.get("/update/email/status", UserAuthenticate, async (req, res) => {
            try {
                const challenge = EmailChange.get(this.translator, req.user!.id);

                res.json({ step: challenge.step, email: challenge.newEmail });
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });

        this.router.post("/request/update/email/resend", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;
                const challenge = EmailChange.get(this.translator, idUser);
                const user: User = await this.repository.get(idUser);

                if (challenge.currentEmail !== user.email)
                    throw new Error(this.translator.translate("users.errors.emailChangeRestart"));

                if (challenge.step === "current") {
                    await this.sendEmailCode(idUser, user.name, user.email, "emailCurrent", "users.email.updateEmailCurrent");

                    return res.send(this.translator.translate("users.success.emailCodeSentCurrent", { email: user.email }));
                }

                await this.sendEmailCode(idUser, user.name, challenge.newEmail, "emailNew", "users.email.updateEmailNew", "users.email.emailChangeCode");

                res.send(this.translator.translate("users.success.emailCodeSentNew", { email: challenge.newEmail }));
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });

        this.router.put("/update/profile", UserAuthenticate, FileStorage.single("image"), ValidateImageUpload, async (req, res) => {
            try {
                if (!req.file) return res.status(400).send(this.translator.translate("users.errors.imageRequired"));

                const ext = path.extname(req.file!.path).toLocaleLowerCase();
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
            const { code, step } = req.body;
            const hasCode: boolean = !((code === undefined) || (code === null) || (String(code).trim() === ""));
            if (!hasCode) 
                return res.status(400).send(this.translator.translate("users.errors.codeRequired"));

            try {
                const idUser: string = req.user!.id;
                const challenge = EmailChange.get(this.translator, idUser);
                const expected: "current" | "new" = (step === "new") ? "new" : "current";

                if (challenge.step !== expected)
                    return res.status(400).send(this.translator.translate(
                        (challenge.step === "current") ? "users.errors.emailStepCurrentRequired" : "users.errors.emailStepNewRequired"));

                if (expected === "current") {
                    VerificationCode.validate(this.translator, "emailCurrent", idUser, code);

                    const user: User = await this.repository.get(idUser);
                    if (challenge.currentEmail !== user.email)
                        throw new Error(this.translator.translate("users.errors.emailChangeRestart"));

                    const advanced = EmailChange.advance(this.translator, idUser, "new");
                    VerificationCode.clear("emailNew", idUser);
                    await this.sendEmailCode(idUser, user.name, advanced.newEmail, "emailNew", "users.email.updateEmailNew", "users.email.emailChangeCode");

                    return res.send(this.translator.translate("users.success.emailCodeSentNew", { email: advanced.newEmail }));
                }

                VerificationCode.validate(this.translator, "emailNew", idUser, code);

                const user: User = await this.repository.get(idUser);
                if (challenge.currentEmail !== user.email)
                    throw new Error(this.translator.translate("users.errors.emailChangeRestart"));

                await this.repository.updateEmail(idUser, challenge.newEmail);
                EmailChange.clear(idUser);
                VerificationCode.clear("emailCurrent", idUser);

                res.status(201).send(this.translator.translate("users.success.emailUpdateSuccessful"));
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.put("/update/password", UserAuthenticate, async (req, res) => {
            if (!req.body.currentPassword || 
                !req.body.newPassword) {
                const message = new MessageBuilder();

                if (!req.body.currentPassword) message.add(this.translator.translate("users.errors.currentPasswordRequired"));
                if (!req.body.newPassword) message.add(this.translator.translate("users.errors.newPasswordRequired"));

                return res.status(400).send(message.toString());
            }
            
            const { currentPassword, newPassword } = req.body;
            try {
                const cryptoCurrentPassword = User.ConvertPassword(currentPassword);
                const cryptoNewPassword = User.ConvertPassword(newPassword);
                await this.repository.updatePassword(req.user!.id, cryptoCurrentPassword, cryptoNewPassword);
                const revoked: number = await SessionContext.get().revokeAllForUser(req.user!.id);
                console.log(`Password changed for user ${req.user!.id}; revoked ${revoked} active session(s).`);

                res.status(201).send(this.translator.translate("users.success.passwordUpdateSuccessful"));
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
        this.router.post("/request/two-step/code", UserAuthenticate, async (req, res) => {
            try {
                const idUser: string = req.user!.id;
                const user: User = await this.repository.get(idUser);

                await this.sendEmailCode(idUser, user.name, user.email, "twoStep", "users.email.disableTwoStep", "users.email.twoStepCode");

                res.send(this.translator.translate("users.success.twoStepCodeSent", { email: user.email }));
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });

        this.router.put("/update/two-step", UserAuthenticate, async (req, res) => {
            const { active, type, code } = req.body;
            if ((active === undefined || active === null) || !type) {
                const message = new MessageBuilder();

                if (active === undefined || active === null) 
                    message.add(this.translator.translate("users.errors.activeRequired"));
                if (!type) message.add(this.translator.translate("users.errors.typeRequired"));

                return res.status(400).send(message.toString());
            }

            const hasCode: boolean = !((code === undefined) || (code === null) || (String(code).trim() === ""));
            if (!active && !hasCode)
                return res.status(400).send(this.translator.translate("users.errors.codeRequiredToDisableTwoStep"));

            try {
                if (!active)
                    VerificationCode.validate(this.translator, "twoStep", req.user!.id, code);

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
            const user: User = await this.repository.get(req.user!.id);
            if (!user) throw new Error(this.translator.translate("users.errors.currentUserError"));

            res.json(user.toDto());
        });

        this.router.delete("/delete/all/data", UserAuthenticate, async (req, res) => {
            try {
                const id: string = req.user!.id;

                await this.repository.deleteAllData(id);
                
                res.status(201).send("All data delete success.");
            } catch (err: any) {
                if (err instanceof Error) res.status(400).send(err.message);
            }
        });
    }
}