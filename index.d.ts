type keyType = string | number
type taskType = () => Promise<any>
type errorHandlerType = (err: Error, key: keyType) => void

export class DelaylessLruCache {
    constructor({ duration, maxEntriesAmount }: {
        duration: number;
        maxEntriesAmount: number;
    });
    setTask(key: keyType, task: taskType, errorHandler?: errorHandlerType): void | Error;

    setTaskOnce(key: keyType, task: taskType, errorHandler?: errorHandlerType): void | Error;
    get(key: keyType): Promise<any> | Error;
    isTaskRunning(key: keyType): boolean;
}
