import { TranslatorRepository } from "./TranslatorRepository";

const FRONTEND_URL = (process.env.FRONTEND_URL) ?
    process.env.FRONTEND_URL : "http://localhost:8000";

export class EmailTemplates {
    private static Style = `* {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }
    body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        line-height: 1.5;
        color: #1e293b;
        background-color: #f1f5f9;
        margin: 0;
        padding: 20px 16px;
    }
    .container {
        max-width: 520px;
        margin: 0 auto;
        background: #ffffff;
        border-radius: 20px;
        padding: 28px 24px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    h1 {
        font-size: 26px;
        font-weight: 700;
        color: #0f172a;
        margin-bottom: 8px;
        line-height: 1.3;
    }
    .greeting {
        font-size: 18px;
        color: #334155;
        margin-bottom: 20px;
        border-left: 3px solid #151b22;
        padding-left: 14px;
    }
    p {
        font-size: 15px;
        color: #334155;
        margin-bottom: 20px;
    }
    .btn {
        display: inline-block;
        background: #00d1b2;
        color: white !important;
        text-decoration: none;
        padding: 14px 28px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 16px;
        margin: 8px 0 20px;
        text-align: center;
        transition: background 0.2s;
    }
    .btn:hover {
        background: #1a9e8a;
    }
    .link-box {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 14px;
        margin: 16px 0;
        word-break: break-all;
    }
    .link-box strong {
        font-size: 13px;
        color: #475569;
        display: block;
        margin-bottom: 8px;
    }
    .link-box a {
        color: #06816f;
        text-decoration: none;
        font-size: 13px;
        word-break: break-all;
    }
    .warning {
        background: #fffbeb;
        border-left: 4px solid #f59e0b;
        padding: 14px;
        border-radius: 10px;
        font-size: 13px;
        color: #92400e;
        margin: 20px 0;
    }
    hr {
        border: none;
        border-top: 1px solid #e2e8f0;
        margin: 24px 0 16px;
    }
    .footer {
        font-size: 12px;
        color: #64748b;
        text-align: center;
        line-height: 1.5;
    }
    .footer p {
        margin-bottom: 6px;
        font-size: 12px;
    }
    @media (max-width: 480px) {
        body {
            padding: 12px;
        }
        .container {
            padding: 20px;
        }
        h1 {
            font-size: 22px;
        }
        .greeting {
            font-size: 16px;
        }
        p, .btn {
            font-size: 14px;
        }
        .btn {
            padding: 12px 24px;
            width: 100%;
            text-align: center;
        }
        .link-box {
            padding: 12px;
        }
        .link-box a {
            font-size: 12px;
        }
    }`;

    static VerificationEmail(translator: TranslatorRepository, name: string, link: string): string {
        return `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=yes">
                    <title>${translator.translate("users.email.confirmRegister")} - Jeseb Hub</title>
                    <style>${this.Style}</style>
                </head>
                <body>
                <div class="container">
                    <h1>${translator.translate("users.email.verificationEmail.welcome")}</h1>
                    <div class="greeting">👋 ${translator.translate("users.email.shared.hi", { name })}</div>
                    <p>${translator.translate("users.email.verificationEmail.confirmation")}</p>
                    <div style="text-align: center;">
                        <a href="${link}" class="btn">${translator.translate("users.email.verificationEmail.confirmAccount")}</a>
                    </div>
                    <div class="link-box">
                        <strong>${translator.translate("users.email.shared.copyLink")}</strong>
                        <a href="${link}">${link}</a>
                    </div>
                    <div class="warning">${translator.translate("users.email.shared.warning")}</div>
                    <hr>
                    <div class="footer">
                        <p>${translator.translate("users.email.shared.footer")}</p>
                        <p style="margin-top: 8px;">${translator.translate("users.email.shared.ignore")}</p>
                    </div>
                </div>
                </body>
            </html>`;
    }
    static WelcomeEmail(translator: TranslatorRepository, name: string): string {
        return `<!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${translator.translate("users.email.verificationEmail.welcome")}</title>
                    <style>${this.Style}</style>
                </head>
                <body>
                <div class="container">
                    <h1>${translator.translate("users.email.verificationEmail.welcome")}</h1>
                    <div class="greeting">👋 ${translator.translate("users.email.shared.hi", { name })}</div>
                    <p>${translator.translate("users.email.welcomeEmail.verification")}</p>
                    <p>${translator.translate("users.email.welcomeEmail.description")}</p>
                    <ul style="margin: 16px; list-style: none;">
                        <li>${translator.translate("users.email.welcomeEmail.track")}</li>
                        <li>${translator.translate("users.email.welcomeEmail.statistics")}</li>
                        <li>${translator.translate("users.email.welcomeEmail.manage")}</li>
                        <li>${translator.translate("users.email.welcomeEmail.export")}</li>
                    </ul>
                    <div style="text-align: center;">
                        <a href="${FRONTEND_URL}" class="btn">${translator.translate("users.email.welcomeEmail.go")}</a>
                    </div>
                    <hr>
                    <div class="footer">
                        <p>${translator.translate("users.email.shared.footer")}</p>
                        <p style="margin-top: 8px;">${translator.translate("users.email.shared.ignore")}</p>
                    </div>
                </div>
                </body>
            </html>`;
    }
    static PasswordRecoveryEmail(translator: TranslatorRepository, name: string, link: string): string {
        return `<!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${translator.translate("users.email.passwordRecoveryEmail.title")}</title>
                    <style>${this.Style}</style>
                </head>
                <body>
                <div class="container">
                    <h1>${translator.translate("users.email.passwordRecoveryEmail.reset")}</h1>
                    <div class="greeting">🔐 ${translator.translate("users.email.shared.hi", { name })}</div>
                    <p>${translator.translate("users.email.passwordRecoveryEmail.description")}</p>
                    <div style="text-align: center;">
                        <a href="${link}" class="btn">${translator.translate("users.email.passwordRecoveryEmail.reset")}</a>
                    </div>
                    <div class="link-box">
                        <strong>${translator.translate("users.email.shared.copyLink")}</strong>
                        <a href="${link}">${link}</a>
                    </div>
                    <div class="warning">${translator.translate("users.email.shared.warning")}</div>
                    <hr>
                    <div class="footer">
                        <p>${translator.translate("users.email.shared.footer")}</p>
                        <p style="margin-top: 8px;">${translator.translate("users.email.shared.ignore")}</p>
                    </div>
                </div>
                </body>
            </html>`;
    }
    static TwoFactorCodeEmail(translator: TranslatorRepository, name: string, code: string): string {
        return `<!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>${translator.translate("users.email.twoFactorCode.title")}</title>
                    <style>
                        ${this.Style}
                        .code-box {
                            background: #f1f5f9;
                            font-size: 28px;
                            letter-spacing: 4px;
                            font-weight: 700;
                            text-align: center;
                            padding: 20px;
                            border-radius: 14px;
                            font-family: monospace;
                            margin: 20px 0;
                            color: #0f172a;
                            border: 1px solid #e2e8f0;
                        }
                        @media (max-width: 480px) {
                            .code-box {
                                font-size: 22px;
                                letter-spacing: 3px;
                                padding: 16px;
                            }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>${translator.translate("users.email.twoFactorCode.verification")}</h1>
                        <div class="greeting">🔑 ${translator.translate("users.email.shared.hi", { name })}</div>
                        <p>${translator.translate("users.email.twoFactorCode.description")}</p>
                        <div class="code-box">${code}</div>
                        <div class="warning">${translator.translate("users.email.twoFactorCode.warning")}</div>
                        <hr>
                        <div class="footer">
                            <p>${translator.translate("users.email.twoFactorCode.footer")}</p>
                            <p>${translator.translate("users.email.shared.footer")}</p>
                            <p style="margin-top: 8px;">${translator.translate("users.email.shared.ignore")}</p>
                        </div>
                    </div>
                </body>
            </html>`;
    }
}