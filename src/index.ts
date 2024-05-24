
import events from "node:events";
import getUuid from 'uuid-by-string';


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

export class QueueProcessor {
    data_buffer: Data_Format[];
    data_storage: Map<string, Result_Format>;
    counter = 0;
    process_func: workerFunction;
    event_emitter = new events.EventEmitter();

    constructor(num_of_workers: number, process_func: workerFunction) {
        this.data_buffer = [];
        this.data_storage = new Map();
        this.process_func = process_func;
        for (let i = 0; i < num_of_workers; i++) {
            this.event_emitter.on("data_added", this.createProcessor(i));
        }
    }

    createProcessor(id: number) {
        let active = false;
        return async () => {
            if (active) {
                return;
            }
            active = true;
            while (this.data_buffer.length > 0) {
                const dat = this.data_buffer.shift();
                if (!dat) {
                    console.log(`worker ${id} finished processing`);
                    active = false;
                    return;
                }
                console.log(`in worker processor ${id}, processing ${JSON.stringify(dat)}`);
                try {
                    const res = await this.process_func(dat?.data_load);
                    this.data_storage.set(dat?.id, { id: dat?.id, result: res, success: true });
                    this.event_emitter.emit(dat.id);
                    // console.log(`worker ${id} finished processing ${JSON.stringify(dat)}, result: ${res}, storage: ${JSON.stringify(this.data_storage.get(dat.id))}`);
                } catch (err) {
                    console.log(`error processing ${JSON.stringify(dat)}`, err);
                    this.data_storage.set(dat.id, { id: dat.id, result: err, success: false });
                    this.event_emitter.emit(dat.id);
                }
            }
            console.log(`worker ${id} finished processing`);
            active = false;
        };
    }

    async addDataToBuffer(d: any): Promise<Result_Format> {
        console.log(`adding data to buffer ${JSON.stringify(d)}`);
        const id = getUuid(new Date().getTime().toString() + String(d));
        this.data_buffer.push({ data_load: d, id: id });
        this.event_emitter.emit("data_added");
        return new Promise(resolve => {
            this.event_emitter.on(id, () => {
                resolve(this.data_storage.get(id)||{id: id, result: null, success: false});
                this.event_emitter.removeAllListeners(id);
            });
        });
    }
}