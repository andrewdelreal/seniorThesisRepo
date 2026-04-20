import { Pool, PoolClient, QueryResult } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { from as copyFrom} from 'pg-copy-streams';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

let POSTGRES_USER: string;
let POSTGRES_PASSWORD: string;
let POSTGRES_HOST: string;
let POSTGRES_PORT: number;
let POSTGRES_DB: string;

if (String(process.env.USE_SUPABASE).trim() === 'true') {
    POSTGRES_USER = process.env.SB_USER!;
    POSTGRES_PASSWORD = process.env.SB_PASSWORD!;
    POSTGRES_HOST = process.env.SB_HOST!;
    POSTGRES_PORT = parseInt(process.env.SB_PORT!);
    POSTGRES_DB = process.env.SB_DATABASE!;
} else {
    POSTGRES_USER = process.env.POSTGRES_USER!;
    POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD!;
    POSTGRES_HOST = process.env.POSTGRES_HOST!;
    POSTGRES_PORT = parseInt(process.env.POSTGRES_PORT!);
    POSTGRES_DB = process.env.POSTGRES_DB!;
}

interface Ticker {
    name: string,
    symbol: string
}

class DBAbstraction {
    pool!: Pool;

    constructor() {
        this.pool = new Pool({
            user: POSTGRES_USER,
            host: POSTGRES_HOST,
            password: POSTGRES_PASSWORD,
            port: POSTGRES_PORT,
            database: POSTGRES_DB
        });
    }

    async init(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            let client: PoolClient | null = null;

            try {
                client = await this.pool.connect();
                console.log('Connected to PostgreSQL database');

                await client.query('BEGIN');

                const createTableQuery: string = `
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
                    
                await client.query(createTableQuery);

                await client.query('COMMIT');
                console.log('Ensured DailyStockSnapshot table exists');
                resolve();
            } catch (err) {
                console.error('Failed Error initializing database tables connect to PostgreSQL database:', err);
                reject(err);
            } finally {
                if (client) {
                    client.release();
                    console.log('Released PostgreSQL client');
                }
            }
        });
    }

    async addDailyStockSnapshot(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            let client: PoolClient | null = null;

            try { 
                client = await this.pool.connect();
                console.log("Connected to PostgreSQL");

                await client.query("BEGIN");

                console.log("Creating temp table...");
                await client.query(`
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

                const fileStream = fs.createReadStream("./cache/dailyquotes.csv");
                const dbStream = client.query(copyFrom(copyQuery));

                // Wait for stream to finish
                await new Promise((resolve, reject) => {
                    fileStream
                        .pipe(dbStream)
                        .on("finish", resolve)
                        .on("error", reject);
                });

                console.log("Running INSERT...");
                await client.query(`
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
                await client.query(`DELETE FROM public."daily_snapshot_staging";`);

                await client.query("COMMIT");

                console.log('Inserted daily stock snapshot into database');
                resolve();
            } catch (err) {
                try {
                    await client?.query("ROLLBACK");
                    console.log("Transaction rolled back");
                } catch (rollbackErr) {
                    console.error("Rollback failed:", rollbackErr);
                }
                reject(err); // Resolve even on error to prevent blocking future updates
            } finally {
                if (client) {
                    client.release();
                    console.log('Released PostgreSQL client');
                }
            }
        });
    }

    async areTodaysQuotesInDatabase(): Promise<boolean> {
        return new Promise(async (resolve, reject) => {
            let client: PoolClient | null = null;

            try {
                client = await this.pool.connect();
                const today = new Date().toLocaleDateString('en-CA'); // Get today's date in YYYY-MM-DD format
                const query = 'SELECT COUNT(*) FROM public."DailyStockSnapshot" WHERE date = $1';
                const result = await client.query(query, [today]);
                resolve(result.rows[0].count > 0);
            } catch (err) {
                console.error('Error checking if today\'s quotes are in database:', err);
                reject(err);
            } finally {
                if (client) {
                    client.release();
                }
            }
        });
    }

    async getTickers(exchDBSymbol: string): Promise<{ name: string, symbol: string }[] | null> {
        return new Promise(async (resolve, reject) => {
            let client: PoolClient | null = null;

            try {
                client = await this.pool.connect();

                const query = ` 
                    SELECT DISTINCT symbol, description 
                    FROM public."Ticker"
                    WHERE exch = $1
                    ORDER BY symbol ASC;
                `;

                const rows: QueryResult = await client.query(query, [exchDBSymbol]);
                // format rows into a list of { name: string, symbol: string } objects
                const tickers: Ticker[] = rows.rows.map((row: any) => {
                    return { name: row.description.substring(0, 100), symbol: row.symbol}
                });

                resolve(tickers);
            } catch (err) {
                console.error('Error connecting to database to get tickers:', err);
                reject(err);
            } finally {
                if (client) {
                    client.release();
                }
            }
        });
    }

    async getQuotes(date: string, exchanges: string[]): Promise<any[] | null> {
        return new Promise(async (resolve, reject) => {
            let client: PoolClient | null = null;

            try { 
                client = await this.pool.connect();

                // will not hard code this later
                const query = `
                    SELECT s.id, t.symbol, t.description, t.exch, s.date, s.last, s.volume, s.high, s.low, s.volatility, s.close, s.change, s.average_volume
                    FROM public."DailyStockSnapshot" s, public."Ticker" t
                    WHERE s.ticker_id = t.id
                    AND s.date = $1
                    AND t.exch = ANY($2::text[]);
                `;

                const rows: QueryResult = await client.query(query, [date, exchanges]);
                resolve(rows.rows);
            } catch (err) {
                console.error('Error connecting to database to get quotes:', err);
                reject(err);
                return;
            } finally {
                if (client) {
                    client.release();
                }       
            }
        });
    }
}

export default DBAbstraction;

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