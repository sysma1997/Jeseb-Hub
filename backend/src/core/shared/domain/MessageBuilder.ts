export class MessageBuilder {
    private message: string[];

    constructor() {
        this.message = [];
    }

    add(line: string) {
        this.message.push(line);
    }

    toString(): string {
        return this.message.join("\n");
    }
}
