/// <reference types="node" />
import events from "node:events";
export type Data_Format = {
    id: string;
    data_load: any;
};
export type workerFunction = (d: Data_Format) => Promise<any>;
export type Result_Format = {
    id: string;
    result: any;
    success: boolean;
};
export declare class QueueProcessor {
    data_buffer: Data_Format[];
    data_storage: Map<string, Result_Format>;
    counter: number;
    event_emitter: events<[never]>;
    processor_list: Map<workerFunction, number>;
    constructor();
    addProcessor(f: workerFunction, num_of_workers: number): void;
    removeProcessor(f: workerFunction): void;
    createProcessor(f: workerFunction, id: number): () => Promise<void>;
    addDataToBuffer(d: any): Promise<Result_Format>;
}
