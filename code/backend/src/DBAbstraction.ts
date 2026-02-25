import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
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

    async init() {
        let client;
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
                
            await client.query(createTableQuery);

            await client.query('COMMIT');
            console.log('Ensured DailyStockSnapshot table exists');
        } catch (err) {
            console.error('Failed Error initializing database tables connect to PostgreSQL database:', err);
        } finally {
            if (client) {
                client.release();
                console.log('Released PostgreSQL client');
            }
        }
    }

    async addDailyStockSnapshot() {
        let client;
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

        } catch (err) {
            console.error('Error adding daily stock snapshot to database:', err);
        } finally {
            if (client) {
                client.release();
                console.log('Released PostgreSQL client');
            }
        }

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