export class Pagination<T> {
    public list: Array<T>;
    public pages: number;

    constructor() {
        this.list = new Array<T>();
        this.pages = 0;
    }

    static PageLength(size: number, limit: number): number {
        const result = parseFloat(size.toString()) / parseFloat(limit.toString());
        let iResult = parseInt(result.toString());
        if ((result - iResult) > 0) 
            iResult++;

        return iResult;
    }
}