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
exports.startTickerJobs = startTickerJobs;
const tickerService_1 = require("../services/tickerService");
const node_cron_1 = __importDefault(require("node-cron"));
const ApiError_1 = __importDefault(require("../errors/ApiError"));
function startTickerJobs() {
    return __awaiter(this, void 0, void 0, function* () {
        const safeUpdateTickers = () => __awaiter(this, void 0, void 0, function* () {
            try {
                yield (0, tickerService_1.updateTickers)();
            }
            catch (err) {
                if (err instanceof ApiError_1.default) {
                    console.error(`[Ticker Job] API Error: ${err.message}`);
                }
                else {
                    console.error('[Ticker Job] Unknown Error:', err);
                }
            }
        });
        yield safeUpdateTickers();
        node_cron_1.default.schedule('0 0 * * *', safeUpdateTickers);
    });
}
