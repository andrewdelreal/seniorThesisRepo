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
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const pg_copy_streams_1 = require("pg-copy-streams");
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
let POSTGRES_USER;
let POSTGRES_PASSWORD;
let POSTGRES_HOST;
let POSTGRES_PORT;
let POSTGRES_DB;
if (String(process.env.USE_SUPABASE).trim() === 'true') {
    POSTGRES_USER = process.env.SB_USER;
    POSTGRES_PASSWORD = process.env.SB_PASSWORD;
    POSTGRES_HOST = process.env.SB_HOST;
    POSTGRES_PORT = parseInt(process.env.SB_PORT);
    POSTGRES_DB = process.env.SB_DATABASE;
}
else {
    POSTGRES_USER = process.env.POSTGRES_USER;
    POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD;
    POSTGRES_HOST = process.env.POSTGRES_HOST;
    POSTGRES_PORT = parseInt(process.env.POSTGRES_PORT);
    POSTGRES_DB = process.env.POSTGRES_DB;
}
class DBAbstraction {
    constructor() {
        this.pool = new pg_1.Pool({
            user: POSTGRES_USER,
            host: POSTGRES_HOST,
            password: POSTGRES_PASSWORD,
            port: POSTGRES_PORT,
            database: POSTGRES_DB
        });
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let client = null;
                try {
                    client = yield this.pool.connect();
                    console.log('Connected to PostgreSQL database');
                    yield client.query('BEGIN');
                    const createTableQuery = `
                    CREATE TABLE IF NOT EXISTS public."DailyStockSnapshot"
                    (
                        id BIGSERIAL NOT NULL PRIMARY KEY,
                        symbol text COLLATE pg_catalog."default" NOT NULL,
                        description text COLLATE pg_catalog."default",
                        exch text COLLATE pg_catalog."default",
                        date date,
                        last real,
                        volume real,
                        high real,
                        low real,
                        volatility real,
                        close real,
                        change real,
                        average_volume real
                    ) 
                        
                    TABLESPACE pg_default;

                    ALTER TABLE IF EXISTS public."DailyStockSnapshot"
                        OWNER to postgres;

                    COMMENT ON TABLE public."DailyStockSnapshot"
                        IS 'Holds daily stock data as a cache';
                `;
                    yield client.query(createTableQuery);
                    yield client.query('COMMIT');
                    console.log('Ensured DailyStockSnapshot table exists');
                    resolve();
                }
                catch (err) {
                    console.error('Failed Error initializing database tables connect to PostgreSQL database:', err);
                    reject(err);
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
    addDailyStockSnapshot() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let client = null;
                try {
                    client = yield this.pool.connect();
                    console.log("Connected to PostgreSQL");
                    yield client.query("BEGIN");
                    console.log("Creating temp table...");
                    yield client.query(`
                    CREATE TABLE IF NOT EXISTS public."daily_snapshot_staging" (
                        symbol TEXT,
                        description TEXT,
                        exch TEXT,
                        last NUMERIC,
                        volume BIGINT,
                        high NUMERIC,
                        low NUMERIC,
                        close NUMERIC,
                        change NUMERIC,
                        average_volume BIGINT,
                        volatility NUMERIC,
                        date DATE
                    );
                `);
                    // need to change this for it to work
                    console.log("Starting COPY...");
                    const copyQuery = `
                    COPY public."daily_snapshot_staging"
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
                    console.log("Running INSERT...");
                    yield client.query(`
                    INSERT INTO public."DailyStockSnapshot" (
                        ticker_id,
                        last,
                        volume,
                        high,
                        low,
                        close,
                        change,
                        average_volume,
                        volatility,
                        date
                    )
                    SELECT 
                        t.id,
                        s.last,
                        s.volume,
                        s.high,
                        s.low,
                        s.close,
                        s.change,
                        s.average_volume,
                        s.volatility,
                        s.date
                    FROM public."daily_snapshot_staging" s
                    JOIN public."Ticker" t
                    ON s.symbol = t.symbol
                    AND s.exch = t.exch
                    AND s.description = t.description;
                `);
                    console.log('Clearing temp table...');
                    yield client.query(`DELETE FROM public."daily_snapshot_staging";`);
                    yield client.query("COMMIT");
                    console.log('Inserted daily stock snapshot into database');
                    resolve();
                }
                catch (err) {
                    try {
                        yield (client === null || client === void 0 ? void 0 : client.query("ROLLBACK"));
                        console.log("Transaction rolled back");
                    }
                    catch (rollbackErr) {
                        console.error("Rollback failed:", rollbackErr);
                    }
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
                    SELECT s.id, t.symbol, t.description, t.exch, s.date, s.last, s.volume, s.high, s.low, s.volatility, s.close, s.change, s.average_volume
                    FROM public."DailyStockSnapshot" s, public."Ticker" t
                    WHERE s.ticker_id = t.id
                    AND s.date = '2026-02-26'
                    AND t.exch = ANY($1::text[]);
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
exports.default = DBAbstraction;
/* Example of creating multiple tables in one query (for future reference)
CREATE TABLE IF NOT EXISTS public."DailyStockSnapshot"
    (
        id integer NOT NULL,
        symbol text COLLATE pg_catalog."default" NOT NULL,
        description text COLLATE pg_catalog."default",
        exch text COLLATE pg_catalog."default",
        date date,
        last numeric,
        volume bigint,
        change_percent numeric,
        high numeric,
        low numeric,
        volatility numeric,
        close numeric,
        change numeric,
        average_volume numeric,
        CONSTRAINT "DailyStockSnapshot_pkey" PRIMARY KEY (id)
    ) TABLESPACE pg_default;

    CREATE TABLE IF NOT EXISTS public."test"
    (
        id integer NOT NULL,
        name text NOT NULL,
        CONSTRAINT "test_pkey" PRIMARY KEY (id)
    ) TABLESPACE pg_default;

    ALTER TABLE IF EXISTS public."DailyStockSnapshot"
        OWNER to postgres;

    COMMENT ON TABLE public."DailyStockSnapshot"
        IS 'Holds daily stock data as a cache';
`;
*/ 
