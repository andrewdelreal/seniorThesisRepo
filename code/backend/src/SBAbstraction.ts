import { Pool, PoolClient, QueryResult } from "pg";
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';
import { from as copyFrom} from 'pg-copy-streams';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const SB_USER: string = process.env.SB_USER!;
const SB_PASSWORD: string = process.env.SB_PASSWORD!;
const SB_HOST: string = process.env.SB_HOST!;
const SB_PORT: number = parseInt(process.env.SB_PORT!);
const SB_DATABASE: string = process.env.SB_DATABASE!;

interface Ticker {
    name: string,
    symbol: string,
}

class SBAbstraction {
    pool!: Pool;

    constructor() {
        this.pool = new Pool({
            host: SB_HOST,
            port: SB_PORT,
            user: SB_USER,
            password: SB_PASSWORD,
            database: SB_DATABASE,
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
                // console.log(result.rows[0].count > 0);
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

    async getTickers(exchDBSymbol: string): Promise<Ticker[]> {
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

                // console.log(tickers);

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

                const rows: QueryResult = await client.query(query, [exchanges]);
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

export default SBAbstraction;
