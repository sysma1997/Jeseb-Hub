// Los importes se guardan en la base como DECIMAL(65,2) y viajan por la API como
// decimales, pero el arithmetic se hace aqui en centavos enteros.
//
// El motivo: un number de JavaScript no puede representar cualquier decimal. Con
// coma flotante, 0.1 + 0.2 da 0.30000000000000004, y un saldo acumulado de miles de
// operaciones acumula ese error hasta mostrar centavos falsos. Un entero de centavos
// (1552343) es exacto mientras quepa en 2^53, que para dinero sobra.
//
// Postgres sigue sumando sobre numeric, que si es exacto: por eso los agregados
// (_sum) siguen siendo seguros y solo se redondea al cruzar a JavaScript.

const CENTS = 100;

// por encima de esto los centavos dejarian de caber en un entero exacto de JS
const MAX_SAFE_CENTS = Number.MAX_SAFE_INTEGER;

export class Money {
    // Convierte un importe decimal a centavos enteros. Acepta number, string o el
    // Decimal de Prisma.
    static toCents(value: number | string | { toString(): string }): number {
        if (typeof value === "number" && !Number.isFinite(value))
            throw new Error(`Money: "${value}" no es un importe valido.`);

        const text = String(value).trim();
        // los grupos 2 y 3 son la parte entera y la decimal
        const match = /^(-)?(\d*)(?:\.(\d*))?$/.exec(text);
        // ambas partes son opcionales en la regex, asi que se exige al menos un
        // digito: de lo contrario "" y "." pasarian y valdrian cero
        if (!match || !(match[2] || match[3]))
            throw new Error(`Money: "${text}" no es un importe valido.`);

        const sign = match[1] ? "-" : "";
        const whole = match[2] === "" ? "0" : match[2];
        const fraction = match[3] ?? "";

        // se redondea (no se trunca) el tercer decimal, para que 0.005 sea 1 centavo
        const first = fraction.charAt(0) === "" ? 0 : Number(fraction.charAt(0));
        const second = fraction.charAt(1) === "" ? 0 : Number(fraction.charAt(1));
        const third = fraction.charAt(2) === "" ? 0 : Number(fraction.charAt(2));
        const rounded = second + (third >= 5 ? 1 : 0);
        const extra = first * 10 + rounded;

        const cents = Number(whole) * CENTS + extra;
        if (!Number.isSafeInteger(Math.abs(cents)))
            throw new Error(`Money: "${text}" excede el rango seguro.`);

        return sign === "-" ? -cents : cents;
    }

    // Convierte centavos enteros al decimal que espera la API y la base.
    static fromCents(cents: number): number {
        if (!Number.isSafeInteger(cents))
            throw new Error(`Money: "${cents}" no es un numero de centavos valido.`);

        return cents / CENTS;
    }

    // Convierte un Decimal de Prisma (o similar) a centavos enteros.
    static fromDecimal(value: { toString(): string } | null | undefined): number {
        if (value === null || value === undefined) return 0;

        return Money.toCents(value);
    }

    // Formato decimal exacto, sin pasar por coma flotante: 1552343 -> "15523.43".
    // Se usa al escribir en la base para no introducir el error de 1.005 que
    // haría Number(1552343) / 100 = 15523.430000000001.
    static toDecimalString(cents: number): string {
        const negative = cents < 0;
        const absolute = Math.abs(cents);
        const whole = Math.trunc(absolute / CENTS);
        const fraction = absolute % CENTS;

        return `${negative ? "-" : ""}${whole}.${String(fraction).padStart(2, "0")}`;
    }
}