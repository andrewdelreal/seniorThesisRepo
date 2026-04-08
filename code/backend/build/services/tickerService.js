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
exports.getTickers = getTickers;
exports.updateTickers = updateTickers;
const ApiError_1 = __importDefault(require("../errors/ApiError"));
const DBAbstraction_1 = __importDefault(require("../DBAbstraction"));
const fs_1 = __importDefault(require("fs"));
;
const ExchangeSources = {
    nasdaq: 'https://raw.githubusercontent.com/rreichel3/US-Stock-Symbols/main/nasdaq/nasdaq_full_tickers.json',
    nyse: 'https://raw.githubusercontent.com/rreichel3/US-Stock-Symbols/main/nyse/nyse_full_tickers.json',
    amex: 'https://raw.githubusercontent.com/rreichel3/US-Stock-Symbols/main/amex/amex_full_tickers.json'
};
function getTickers(exchange) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = new DBAbstraction_1.default();
        let exchDBSymbol = '';
        if (exchange === 'nasdaq')
            exchDBSymbol = 'Q';
        else if (exchange === 'nyse')
            exchDBSymbol = 'N';
        else
            exchDBSymbol = 'A';
        const data = yield db.getTickers(exchDBSymbol);
        if (!data) {
            throw new ApiError_1.default(502, "TRADIER_FAILURE", "Failed to fetch tickers from database");
        }
        return data;
    });
}
function updateTickers() {
    return __awaiter(this, void 0, void 0, function* () {
        const lastTickerUpdatePath = './cache/lastUpdate.json';
        const data = JSON.parse(fs_1.default.readFileSync(lastTickerUpdatePath, 'utf8'));
        if (data.lastUpdate === new Date().toLocaleDateString('en-CA')) {
            console.log('Tickers are already up to date, skipping update');
            return;
        }
        fs_1.default.writeFileSync(`./cache/lastupdate.json`, JSON.stringify({ lastUpdate: new Date().toLocaleDateString('en-CA') }, null, 2));
        console.log('Updating tickers...');
        for (const [exchange, url] of Object.entries(ExchangeSources)) {
            const response = yield fetch(url);
            if (!response.ok) {
                throw new ApiError_1.default(500, 'TICKER_UPDATE_FAILURE', `Failed to fetch tickers for ${exchange} from github`);
            }
            const data = yield response.json();
            const parsed = parseTickers(data);
            fs_1.default.writeFileSync(`./cache/${exchange}.json`, JSON.stringify(parsed, null, 2));
            console.log(`Cached ${exchange} successfully`);
        }
    });
}
const parseTickers = (data) => {
    return data.filter((item) => item.symbol.includes('^') === false).map((item) => ({
        name: `${item.name.slice(0, 50).trim()} (${item.symbol.trim()})`,
        symbol: item.symbol.trim()
    }));
};
