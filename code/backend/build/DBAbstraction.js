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
const POSTGRES_USER = process.env.POSTGRES_USER;
const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD;
const POSTGRES_HOST = process.env.POSTGRES_HOST;
const POSTGRES_PORT = parseInt(process.env.POSTGRES_PORT);
const POSTGRES_DB = process.env.POSTGRES_DB;
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
                let client;
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
                        last numeric,
                        volume bigint,
                        change_percent numeric,
                        high numeric,
                        low numeric,
                        volatility numeric,
                        close numeric,
                        change numeric,
                        average_volume numeric
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
                let client;
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
                let client;
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
