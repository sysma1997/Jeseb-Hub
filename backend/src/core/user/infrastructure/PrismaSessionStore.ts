import { PrismaClient } from "../../../generated/prisma/client";

import type { SessionRecord, SessionRow, SessionStore } from "../domain/SessionService";

export class PrismaSessionStore implements SessionStore {
    constructor(private readonly prisma: PrismaClient) {}

    private static parse(row: {
        id: string,
        idUser: string,
        family: string,
        createdAt: Date,
        lastSeenAt: Date,
        expiresAt: Date,
        revokedAt: Date | null,
        rotatedAt: Date | null,
        ip: string | null,
        userAgent: string | null,
        secretHash: string
    }): SessionRow {
        return {
            secretHash: row.secretHash,
            id: row.id,
            idUser: row.idUser,
            family: row.family,
            createdAt: row.createdAt,
            lastSeenAt: row.lastSeenAt,
            expiresAt: row.expiresAt,
            revokedAt: row.revokedAt ?? undefined,
            rotatedAt: row.rotatedAt ?? undefined,
            ip: row.ip ?? undefined,
            userAgent: row.userAgent ?? undefined
        };
    }
    async create(id: string, idUser: string, family: string, secretHash: string, expiresAt: Date, ip?: string, userAgent?: string): Promise<void> {
        await this.prisma.session.create({
            data: {
                id: id,
                idUser: idUser,
                family: family,
                secretHash: secretHash,
                expiresAt: expiresAt,
                ip: ip ?? null,
                userAgent: userAgent ?? null
            }
        });
    }
    async get(id: string): Promise<SessionRow | undefined> {
        const row = await this.prisma.session.findUnique({ where: { id } });
        if (!row) return undefined;

        return PrismaSessionStore.parse(row);
    }
    async touch(id: string, lastSeenAt: Date): Promise<void> {
        await this.prisma.session.update({ where: { id }, data: { lastSeenAt: lastSeenAt } });
    }
    async revoke(id: string, revokedAt: Date): Promise<void> {
        await this.prisma.session.update({ where: { id }, data: { revokedAt: revokedAt } });
    }
    async markRotated(id: string, rotatedAt: Date): Promise<void> {
        await this.prisma.session.update({ where: { id }, data: { rotatedAt: rotatedAt } });
    }
    async revokeFamily(family: string, revokedAt: Date): Promise<number> {
        const result = await this.prisma.session.updateMany({
            where: { family: family, revokedAt: null },
            data: { revokedAt: revokedAt }
        });

        return result.count;
    }
    async revokeAllForUser(idUser: string, revokedAt: Date): Promise<number> {
        const result = await this.prisma.session.updateMany({
            where: { idUser: idUser, revokedAt: null },
            data: { revokedAt: revokedAt }
        });

        return result.count;
    }
    async deleteOlderThan(cutoff: Date): Promise<number> {
        // las filas se conservan como prueba de que un refresh ya fue canjeado, asi que
        // solo se purga lo que lleva 90 dias cerrado (revocado o rotado) o caducado
        const result = await this.prisma.session.deleteMany({
            where: {
                OR: [
                    { revokedAt: { lte: cutoff } },
                    { rotatedAt: { lte: cutoff } },
                    { expiresAt: { lte: cutoff } }
                ]
            }
        });

        return result.count;
    }
}