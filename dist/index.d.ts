import events from "events";
export type Data_Format = {
    id: string;
    data_load: any;
};
export type workerFunction = (d: Data_Format) => Promise<void>;
export type Result_Format = {
    id: string;
    result: any;
    success: boolean;
};
export declare class QueueProcessor {
    data_buffer: Data_Format[];
    data_storage: Map<string, Result_Format>;
    counter: number;
    process_func: workerFunction;
    event_emitter: events.EventEmitter;
    constructor(num_of_workers: number, process_func: workerFunction);
    createProcessor(id: number): () => Promise<void>;
    addDataToBuffer(d: any): Promise<Result_Format>;
}
