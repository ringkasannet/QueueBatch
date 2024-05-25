"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueProcessor = void 0;
const node_events_1 = __importDefault(require("node:events"));
const uuid_by_string_1 = __importDefault(require("uuid-by-string"));
class QueueProcessor {
    constructor() {
        this.counter = 0;
        // process_func: workerFunction;
        this.event_emitter = new node_events_1.default.EventEmitter();
        this.processor_list = new Map();
        this.data_buffer = [];
        this.data_storage = new Map();
        // this.process_func = process_func;
    }
    addProcessor(f, num_of_workers) {
        for (let i = 0; i < num_of_workers; i++) {
            this.event_emitter.on("data_added", this.createProcessor(f, i));
        }
        this.processor_list.set(f, num_of_workers);
    }
    removeProcessor(f) {
        const num_of_workers = this.processor_list.get(f);
        if (num_of_workers) {
            for (let i = 0; i < num_of_workers; i++) {
                this.event_emitter.removeListener("data_added", f);
            }
            this.processor_list.delete(f);
        }
    }
    createProcessor(f, id) {
        {
            let active = false;
            return () => __awaiter(this, void 0, void 0, function* () {
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
                    console.log(`in worker processor, ${f.name}, worker number: ${id}, processing ${JSON.stringify(dat)}`);
                    try {
                        const res = yield f(dat === null || dat === void 0 ? void 0 : dat.data_load);
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
            });
        }
    }
    addDataToBuffer(d) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`adding data to buffer ${JSON.stringify(d)}`);
            const id = (0, uuid_by_string_1.default)(new Date().getTime().toString() + String(d));
            this.data_buffer.push({ data_load: d, id: id });
            this.event_emitter.emit("data_added");
            return new Promise(resolve => {
                this.event_emitter.on(id, () => {
                    resolve(this.data_storage.get(id) || { id: id, result: null, success: false });
                    this.event_emitter.removeAllListeners(id);
                });
            });
        });
    }
}
exports.QueueProcessor = QueueProcessor;
