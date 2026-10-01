import { Money } from "./src/core/shared/domain/Money";
const casos: [any, number][] = [
    ["15523.43", 1552343], [15523.43, 1552343], ["10000.00", 1000000],
    ["0.1", 10], ["0.005", 1], ["-67000", -6700000], ["1825714.68", 182571468],
    ["0", 0], [".5", 50], ["7.999", 800]
];
let fallos = 0;
for (const [inp, esp] of casos) {
    const got = Money.toCents(inp);
    if (got !== esp) { console.log("  FALLO", inp, "->", got, "esperado", esp); fallos++; }
}
console.log(`  toCents: ${casos.length - fallos}/${casos.length} correctos`);
// ida y vuelta
const c = Money.toCents(1552343);
console.log("  fromCents(1552343) =", Money.fromCents(c));
console.log("  toDecimalString(1552343) =", Money.toDecimalString(1552343));
console.log("  toDecimalString(-5) =", Money.toDecimalString(-5));
console.log("  toDecimalString(5) =", Money.toDecimalString(5));
// el error de coma flotante que se evita
const coma = 0.1 + 0.2;
console.log("  con coma flotante 0.1+0.2 =", Money.fromCents(Money.toCents(0.1) + Money.toCents(0.2)), "vs", coma);
