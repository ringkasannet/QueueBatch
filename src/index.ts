
import events from "node:events";
import getUuid from 'uuid-by-string';


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

export class QueueProcessor {
    data_buffer: Data_Format[];
    data_storage: Map<string, Result_Format>;
    counter = 0;
    // process_func: workerFunction;
    event_emitter = new events.EventEmitter();
    processor_list= new Map<workerFunction, number>();

    constructor() {
        this.data_buffer = [];
        this.data_storage = new Map();
        // this.process_func = process_func;
    }

    addProcessor(f:workerFunction, num_of_workers: number){
        for (let i = 0; i < num_of_workers; i++) {
            this.event_emitter.on("data_added", this.createProcessor(f, i));            
        }
        this.processor_list.set(f, num_of_workers);
    }

    removeProcessor(f:workerFunction){
        const num_of_workers = this.processor_list.get(f);
        if(num_of_workers){
            for (let i = 0; i < num_of_workers; i++) {
                this.event_emitter.removeListener("data_added", f);
            }
            this.processor_list.delete(f);
        }
    }

    createProcessor(f:workerFunction, id: number){ {
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
                // console.log(`in worker processor, ${f.name}, worker number: ${id}, processing ${JSON.stringify(dat)}`);
                try {
                    const res = await f(dat?.data_load);
                    this.data_storage.set(dat?.id, { id: dat?.id, result: res, success: true });
                    this.event_emitter.emit(dat.id);
                    // console.log(`worker ${id} finished processing ${JSON.stringify(dat)}, result: ${res}, storage: ${JSON.stringify(this.data_storage.get(dat.id))}`);
                } catch (err) {
                    console.log(`error processing ${JSON.stringify(dat)}`, err);
                    this.data_storage.set(dat.id, { id: dat.id, result: err, success: false });
                    this.event_emitter.emit(dat.id);
                }
            }
            // console.log(`worker ${id} finished processing`);
            active = false;
        };
    }}

    async addDataToBuffer(d: any): Promise<Result_Format> {
        // console.log(`adding data to buffer ${JSON.stringify(d)}`);
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