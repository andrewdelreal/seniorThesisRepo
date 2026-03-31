import { Connection, Pool, PoolClient, Client } from 'pg';
import dotenv from 'dotenv';
import path, { resolve } from 'path';
import fs from 'fs';
import { from as copyFrom} from 'pg-copy-streams';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const POSTGRES_USER: string = process.env.POSTGRES_USER!;
const POSTGRES_PASSWORD: string = process.env.POSTGRES_PASSWORD!;
const POSTGRES_HOST: string = process.env.POSTGRES_HOST!;
const POSTGRES_PORT: number = parseInt(process.env.POSTGRES_PORT!);
const POSTGRES_DB: string = process.env.POSTGRES_DB!;

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

                const copyQuery = `
                    COPY public."DailyStockSnapshot"
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

                await client.query("COMMIT");

                console.log('Inserted daily stock snapshot into database');
                resolve();
            } catch (err) {
                console.error('Error adding daily stock snapshot to database:', err);
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
            // const today = new Date().toLocaleDateString('en-CA'); // Get today's date in YYYY-MM-DD format
            // const cutoffDate = new Date();
            // cutoffDate.setDate(cutoffDate.getDate() - 1); // Set cutoff date to 1 day ago
            // can be used once the backend is online and we have daily snapshots in the database to ensure 
            // we only pull tickers for stocks that have data for the current day 
            // (prevents stale tickers from showing up if a stock was delisted or something)

            try {
                client = await this.pool.connect();

                const query = ` 
                    SELECT DISTINCT symbol, description
                    FROM public."DailyStockSnapshot"
                    WHERE exch = $1
                    ORDER BY symbol ASC;
                `;

                const rows = await client.query(query, [exchDBSymbol]);
                // format rows into a list of { name: string, symbol: string } objects
                const tickers = rows.rows.map((row: any) => {
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
                    SELECT * FROM public."DailyStockSnapshot"
                    WHERE date = '2026-02-26'
                    AND exch = ANY($1::text[]);
                `;

                const rows = await client.query(query, [exchanges]);
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