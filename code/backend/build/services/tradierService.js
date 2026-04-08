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
exports.getMarketHistory = getMarketHistory;
exports.getMarketQuotes = getMarketQuotes;
const ApiError_1 = __importDefault(require("../errors/ApiError"));
const fs_1 = __importDefault(require("fs"));
const json_2_csv_1 = require("json-2-csv");
;
;
function getMarketHistory(symbol, interval, start, end) {
    return __awaiter(this, void 0, void 0, function* () {
        const options = {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                Authorization: 'Bearer ' + process.env.TRADIER_BEARER_TOKEN
            }
        };
        const response = yield fetch(`https://api.tradier.com/v1/markets/history?symbol=${symbol}&interval=${interval}&start=${start}&end=${end}`, options);
        const jsonData = yield response.json();
        if (!response.ok || !jsonData || !jsonData.history || !jsonData.history.day) {
            throw new ApiError_1.default(502, "TRADIER_API_FAILED", "Failed to fetch market history");
        }
        const parsedData = yield ParseStockData(jsonData);
        return parsedData;
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
        const response = yield fetch('https://api.tradier.com/v1/markets/quotes', options);
        if (!response.ok) {
            throw new ApiError_1.default(502, "TRADIER_API_FAILED", "Failed to fetch market quotes");
        }
        let jsondata = yield response.json();
        jsondata = jsondata.quotes.quote; // Extract the array of quotes from the response
        jsondata = yield cleanQuotes(jsondata);
        jsondata = yield addVolatilityAndDateToQuotes(jsondata);
        console.log(jsondata.length + ' quotes fetched from Tradier API');
        const data = yield (0, json_2_csv_1.json2csv)(jsondata);
        yield fs_1.default.writeFileSync('./cache/dailyquotes.csv', data);
        yield db.addDailyStockSnapshot();
    });
}
function cleanQuotes(data) {
    return __awaiter(this, void 0, void 0, function* () {
        function isValidEquity(quote) {
            return (quote.type === "stock" &&
                quote.close !== null &&
                quote.high !== null &&
                quote.low !== null &&
                quote.last !== null &&
                quote.change !== null &&
                quote.average_volume !== null &&
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
function ParseStockData(data) {
    return __awaiter(this, void 0, void 0, function* () {
        // args: raw stock data
        // returns: Promise of parsed x and y values for graphing
        const xValues = data.history.day.map((d) => d.date); // get timestamps as x values
        const yValues = data.history.day.map((d) => d.close); // use closing prices as y values
        return Promise.resolve({ xValues, yValues });
    });
}
