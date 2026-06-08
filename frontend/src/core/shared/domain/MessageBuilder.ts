export class MessageBuilder {
    private isHtml: boolean;
    private message: string[];

    constructor(isHtml: boolean = false) {
        this.isHtml = isHtml;
        this.message = [];
    }

    add(line: string) {
        this.message.push(line);
    }

    toString(): string {
        if (this.isHtml) return this.message.join("<br>");
        return this.message.join("\n");
    }
}