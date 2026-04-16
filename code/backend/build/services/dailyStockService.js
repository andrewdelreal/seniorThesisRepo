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
exports.DailyStockUpdate = DailyStockUpdate;
const DBAbstraction_1 = __importDefault(require("../DBAbstraction"));
const tradierService_1 = require("../services/tradierService");
const ApiError_1 = __importDefault(require("../errors/ApiError"));
function DailyStockUpdate() {
    return __awaiter(this, void 0, void 0, function* () {
        // check if today is already in the database
        const db = new DBAbstraction_1.default();
        if (yield db.areTodaysQuotesInDatabase()) {
            console.log('Today\'s stock data is already in the database, skipping update');
            return;
        }
        // if the time is before 3:00 pm local time, don't run this
        const now = new Date();
        const estNow = new Date(now.toLocaleString("en-CA", { timeZone: "America/New_York" }));
        const marketCloseTime = new Date(estNow);
        marketCloseTime.setHours(16, 0, 0, 0); // 4:00 PM EST/EDT
        if (estNow < marketCloseTime) {
            console.log('Market is not yet closed, skipping daily stock update');
            return;
        }
        console.log('Running daily stock update...');
        const exchanges = ['Q', 'N', 'A'];
        for (const exchange of exchanges) {
            try {
                // get ticker from database
                const tickerData = yield db.getTickers(exchange);
                if (!tickerData || tickerData.length === 0) {
                    console.log(`No tickers found for exchange ${exchange}, skipping...`);
                    continue;
                }
                // get tickers into a string for the API call
                const tickers = tickerData.map((item) => item.symbol).join(',');
                yield (0, tradierService_1.getMarketQuotes)(tickers);
                yield db.addDailyStockSnapshot();
                // add quotes to database or process as needed
                console.log(tickerData.length + ' tickers found for daily stock update');
            }
            catch (err) {
                if (err instanceof ApiError_1.default) {
                    console.error(`[Stock Update Job] API Error: ${err.message}`);
                }
                else {
                    console.error('[Stock Update Job] Unknown Error:', err);
                }
            }
        }
        console.log('Daily stock update executed');
    });
}
