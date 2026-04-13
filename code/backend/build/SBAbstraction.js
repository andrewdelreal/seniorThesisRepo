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
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const SB_USER = process.env.SB_USER;
const SB_PASSWORD = process.env.SB_PASSWORD;
const SB_HOST = process.env.SB_HOST;
const SB_PORT = parseInt(process.env.SB_PORT);
const SB_DATABASE = process.env.SB_DATABASE;
class SBAbstraction {
    constructor() {
        this.pool = new pg_1.Pool({
            host: SB_HOST,
            port: SB_PORT,
            user: SB_USER,
            password: SB_PASSWORD,
            database: SB_DATABASE,
        });
    }
    getTickers(exchDBSymbol) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let client = null;
                try {
                    client = yield this.pool.connect();
                    const query = ` 
                    SELECT DISTINCT symbol, description
                    FROM public."DailyStockSnapshot"
                    WHERE exch = $1
                    ORDER BY symbol ASC;
                `;
                    const rows = yield client.query(query, [exchDBSymbol]);
                    // format rows into a list of { name: string, symbol: string } objects
                    const tickers = rows.rows.map((row) => {
                        return { name: row.description.substring(0, 100), symbol: row.symbol };
                    });
                    console.log(tickers);
                    resolve(tickers);
                }
                catch (err) {
                    console.error('Error connecting to database to get tickers:', err);
                    reject(err);
                }
                finally {
                    if (client) {
                        client.release();
                    }
                }
            }));
        });
    }
    areTodaysQuotesInDatabase() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let client = null;
                try {
                    client = yield this.pool.connect();
                    const today = new Date().toLocaleDateString('en-CA'); // Get today's date in YYYY-MM-DD format
                    const query = 'SELECT COUNT(*) FROM public."DailyStockSnapshot" WHERE date = $1';
                    const result = yield client.query(query, [today]);
                    console.log(result.rows[0].count > 0);
                    resolve(result.rows[0].count > 0);
                }
                catch (err) {
                    console.error('Error checking if today\'s quotes are in database:', err);
                    reject(err);
                }
                finally {
                    if (client) {
                        client.release();
                    }
                }
            }));
        });
    }
}
exports.default = SBAbstraction;
