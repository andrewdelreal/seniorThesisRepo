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
exports.SupabaseDailyStockUpdate = SupabaseDailyStockUpdate;
const SBAbstraction_1 = __importDefault(require("../SBAbstraction"));
const fs_1 = __importDefault(require("fs"));
const tradierService_1 = require("../services/tradierService");
const ApiError_1 = __importDefault(require("../errors/ApiError"));
function SupabaseDailyStockUpdate() {
    return __awaiter(this, void 0, void 0, function* () {
        // check if today is already in the database
        const sb = new SBAbstraction_1.default();
        if (yield sb.areTodaysQuotesInDatabase()) {
            console.log('Today\'s stock data is already in the database, skipping update');
            return;
        }
        // if the time is before 3:00 pm local time, don't run this
        const now = new Date();
        const marketCloseTime = new Date();
        marketCloseTime.setHours(15, 0, 0, 0); // Set to 3:00 PM local time
        if (now < marketCloseTime) {
            console.log('Market is not yet closed, skipping daily stock update');
            return;
        }
        console.log('Running daily stock update...');
        const exchanges = ['nasdaq', 'nyse', 'amex'];
        for (const exchange of exchanges) {
            try {
                const filePath = `./cache/${exchange}.json`;
                const data = JSON.parse(fs_1.default.readFileSync(filePath, 'utf8'));
                const tickers = data.map((item) => item.symbol).join(',');
                yield (0, tradierService_1.getMarketQuotes)(tickers);
                yield sb.addDailyStockSnapshot();
                // add quotes to database or process as needed
                console.log(data.length + ' tickers found for daily stock update');
            }
            catch (err) {
                if (err instanceof ApiError_1.default) {
                    console.error(`[Ticker Job] API Error: ${err.message}`);
                }
                else {
                    console.error('[Ticker Job] Unknown Error:', err);
                }
            }
        }
        console.log('Daily stock update executed');
    });
}
exports.default = SupabaseDailyStockUpdate;
