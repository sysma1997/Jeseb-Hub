const Observers: Map<string, Function[]> = new Map();

export const Attach = (method: string, action: Function) => {
    if (!Observers.has(method)) 
        Observers.set(method, []);

    const list = Observers.get(method);
    list!.push(action);
    Observers.set(method, list!);
};
export const Detach = (method: string, action: Function) => {
    if (!Observers.has(method)) 
        throw new Error("Method not found or not exists.");

    let list = Observers.get(method);
    list = list!.filter(act => act != action);
    Observers.set(method, list!);
};
export const Notify = (method: string, value?: any | undefined) => {
    if (!Observers.has(method)) 
        throw new Error("Method not found or not exists.");

    let list = Observers.get(method);
    for (let i = 0; i < list!.length; i++) 
        list![i](value);
};