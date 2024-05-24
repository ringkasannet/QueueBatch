"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = __importDefault(require("events"));
const uuid_by_string_1 = __importDefault(require("uuid-by-string"));
class QueueProcessor {
    constructor(num_of_workers, process_func) {
        this.counter = 0;
        this.event_emitter = new events_1.default.EventEmitter();
        this.data_buffer = [];
        this.data_storage = new Map();
        this.process_func = process_func;
        for (let i = 0; i < num_of_workers; i++) {
            this.event_emitter.on("data_added", this.createProcessor(i));
        }
    }
    createProcessor(id) {
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
                    const res = await this.process_func(dat === null || dat === void 0 ? void 0 : dat.data_load);
                    this.data_storage.set(dat === null || dat === void 0 ? void 0 : dat.id, { id: dat === null || dat === void 0 ? void 0 : dat.id, result: res, success: true });
                    this.event_emitter.emit(dat.id);
                    // console.log(`worker ${id} finished processing ${JSON.stringify(dat)}, result: ${res}, storage: ${JSON.stringify(this.data_storage.get(dat.id))}`);
                }
                catch (err) {
                    console.log(`error processing ${JSON.stringify(dat)}`, err);
                    this.data_storage.set(dat.id, { id: dat.id, result: err, success: false });
                    this.event_emitter.emit(dat.id);
                }
            }
            console.log(`worker ${id} finished processing`);
            active = false;
        };
    }
    async addDataToBuffer(d) {
        const id = (0, uuid_by_string_1.default)(new Date().getTime().toString() + String(d));
        this.data_buffer.push({ data_load: d, id: id });
        this.event_emitter.emit("data_added");
        return new Promise(resolve => {
            this.event_emitter.on(id, () => {
                resolve(this.data_storage.get(id) || { id: id, result: null, success: false });
                this.event_emitter.removeAllListeners(id);
            });
        });
    }
}
//# sourceMappingURL=index.js.map