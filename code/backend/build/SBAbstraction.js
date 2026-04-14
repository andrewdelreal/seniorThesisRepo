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
const pg_1 = require("pg");
const fs_1 = __importDefault(require("fs"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const pg_copy_streams_1 = require("pg-copy-streams");
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
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
    addDailyStockSnapshot() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let client = null;
                try {
                    client = yield this.pool.connect();
                    console.log("Connected to PostgreSQL");
                    yield client.query("BEGIN");
                    const copyQuery = `
                    COPY public."DailyStockSnapshot"
                    (symbol, description, exch, last, volume, high, low, close, change, average_volume, volatility, date)
                    FROM STDIN WITH (FORMAT CSV, HEADER true);
                `;
                    const fileStream = fs_1.default.createReadStream("./cache/dailyquotes.csv");
                    const dbStream = client.query((0, pg_copy_streams_1.from)(copyQuery));
                    // Wait for stream to finish
                    yield new Promise((resolve, reject) => {
                        fileStream
                            .pipe(dbStream)
                            .on("finish", resolve)
                            .on("error", reject);
                    });
                    yield client.query("COMMIT");
                    console.log('Inserted daily stock snapshot into database');
                    resolve();
                }
                catch (err) {
                    console.error('Error adding daily stock snapshot to database:', err);
                    reject(err); // Resolve even on error to prevent blocking future updates
                }
                finally {
                    if (client) {
                        client.release();
                        console.log('Released PostgreSQL client');
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
                    // console.log(result.rows[0].count > 0);
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
    getTickers(exchDBSymbol) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let client = null;
                try {
                    client = yield this.pool.connect();
                    const query = ` 
                    SELECT DISTINCT symbol, description 
                    FROM public."Ticker"
                    WHERE exch = $1
                    ORDER BY symbol ASC;
                `;
                    const rows = yield client.query(query, [exchDBSymbol]);
                    // format rows into a list of { name: string, symbol: string } objects
                    const tickers = rows.rows.map((row) => {
                        return { name: row.description.substring(0, 100), symbol: row.symbol };
                    });
                    // console.log(tickers);
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
    getQuotes(date, exchanges) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let client = null;
                try {
                    client = yield this.pool.connect();
                    // will not hard code this later
                    const query = `
                    SELECT * FROM public."DailyStockSnapshot"
                    WHERE date = '2026-02-26'
                    AND exch = ANY($1::text[]);
                `;
                    const rows = yield client.query(query, [exchanges]);
                    resolve(rows.rows);
                }
                catch (err) {
                    console.error('Error connecting to database to get quotes:', err);
                    reject(err);
                    return;
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
