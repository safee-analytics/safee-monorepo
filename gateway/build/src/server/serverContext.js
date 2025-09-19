let instance = undefined;
export function initServerContext(context) {
    instance = context;
}
export function getServerContext() {
    if (instance === undefined)
        throw new Error("No previous call to 'initServerSingletons'");
    return instance;
}
