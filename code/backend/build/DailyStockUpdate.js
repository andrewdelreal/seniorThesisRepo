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
const fs_1 = __importDefault(require("fs"));
const json_2_csv_1 = require("json-2-csv");
function DailyStockUpdate(db) {
    return __awaiter(this, void 0, void 0, function* () {
        // On server reset, if today is not in the database, add it
        // otherwise cron job will handle it.
        // When the backend goes online, we don't have to worry about the timing of the cron job, we just need to make sure we have the latest data in the database.
        // check if today is already in the database
        if (yield db.areTodaysQuotesInDatabase()) {
            console.log('Today\'s stock data is already in the database, skipping update');
            return;
        }
        // if the time is before 3:30 pm local time, don't run this
        const now = new Date();
        const marketCloseTime = new Date();
        marketCloseTime.setHours(15, 30, 0, 0); // Set to 3:30 PM local time
        if (now < marketCloseTime) {
            console.log('Market is not yet closed, skipping daily stock update');
            return;
        }
        console.log('Running daily stock update...');
        const exchange = 'nasdaq'; // Example exchange
        const filePath = `./cache/${exchange}.json`;
        try {
            const data = JSON.parse(fs_1.default.readFileSync(filePath, 'utf8'));
            const tickers = data.map((item) => item.symbol).join(',');
            yield getMarketQuotes(tickers, db);
            // add quotes to database or process as needed
            console.log(data.length + ' tickers found for daily stock update');
        }
        catch (err) {
            console.error('Failed to read ticker data for daily stock update');
            return;
        }
        console.log('Daily stock update executed');
    });
}
function getMarketQuotes(symbols, db) {
    return __awaiter(this, void 0, void 0, function* () {
        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: 'application/json',
                Authorization: 'Bearer ' + process.env.TRADIER_BEARER_TOKEN,
            },
            body: new URLSearchParams({ symbols: symbols }),
        };
        try {
            const response = yield fetch('https://api.tradier.com/v1/markets/quotes', options);
            if (!response.ok) {
                const text = yield response.text();
                console.error("Tradier error:", response.status, text);
                throw new Error("Tradier API failed");
            }
            let jsondata = yield response.json();
            jsondata = jsondata.quotes.quote; // Extract the array of quotes from the response
            jsondata = yield cleanQuotes(jsondata);
            jsondata = yield addVolatilityAndDateToQuotes(jsondata);
            console.log(jsondata.length + ' quotes fetched from Tradier API');
            const data = yield (0, json_2_csv_1.json2csv)(jsondata);
            yield fs_1.default.writeFileSync('./cache/dailyquotes.csv', data);
            yield db.addDailyStockSnapshot();
        }
        catch (err) {
            console.error('Tradier Quotes API error:', err);
            throw new Error('Failed to fetch market quotes');
        }
    });
}
function cleanQuotes(data) {
    return __awaiter(this, void 0, void 0, function* () {
        function isValidEquity(quote) {
            return (quote.type === "stock" &&
                quote.close !== null &&
                quote.high !== null &&
                quote.low !== null &&
                quote.volume > 10000);
        }
        data = data.filter(isValidEquity);
        const keysToKeep = ["symbol", "description", "exch", "last", "volume", "change_percent", "high", "low", "close", "change", "average_volume"];
        const filteredData = data.map((item) => {
            const newItem = {};
            keysToKeep.forEach(key => {
                if (item.hasOwnProperty(key)) {
                    newItem[key] = item[key];
                }
            });
            return newItem;
        });
        return filteredData;
    });
}
function addVolatilityAndDateToQuotes(data) {
    return __awaiter(this, void 0, void 0, function* () {
        return data.map((quote) => {
            const volatility = (quote.high - quote.low) / quote.last;
            return Object.assign(Object.assign({}, quote), { volatility, date: new Date().toLocaleDateString('en-CA') });
        });
    });
}
exports.default = DailyStockUpdate;
