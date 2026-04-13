import { Pool, PoolClient, QueryResult } from "pg";

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

    async getTickers(exchDBSymbol: string): Promise<Ticker[]> {
        return new Promise(async (resolve, reject) => {
            let client: PoolClient | null = null;
            try {
                client = await this.pool.connect();

                const query = ` 
                    SELECT DISTINCT symbol, description
                    FROM public."DailyStockSnapshot"
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
}

export default SBAbstraction;
