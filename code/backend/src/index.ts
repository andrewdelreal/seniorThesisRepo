import express, { Application } from 'express';
import path from 'path';
import DBAbstraction from './DBAbstraction';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser, { json } from 'body-parser';
import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import cron from 'node-cron';
import DailyStockUpdate from './DailyStockUpdate';

import tradierRoutes from './routes/tradierRoutes';
import tickerRoutes from './routes/tickerRoutes';
import loginRoutes from './routes/loginRoutes';
import clusterRoutes from './routes/clusterRoutes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app: Application = express();

const PORT: number = 3000;

const db: DBAbstraction = new DBAbstraction();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'))

app.use(tradierRoutes);
app.use(tickerRoutes);
app.use(loginRoutes);
app.use(clusterRoutes);
app.use(errorHandler);

interface ExchangeItems {
  [key: string]: string;
};

const ExchangeSources = {
  nasdaq: 'https://raw.githubusercontent.com/rreichel3/US-Stock-Symbols/main/nasdaq/nasdaq_full_tickers.json',
  nyse: 'https://raw.githubusercontent.com/rreichel3/US-Stock-Symbols/main/nyse/nyse_full_tickers.json',
  amex: 'https://raw.githubusercontent.com/rreichel3/US-Stock-Symbols/main/amex/amex_full_tickers.json'
};

app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!');
});

const parseTickers = (data: any) => {
  return data.filter((item: ExchangeItems) => item.symbol.includes('^') === false).map((item: ExchangeItems) => ({
    name: `${item.name.slice(0, 50).trim()} (${item.symbol.trim()})`,
    symbol: item.symbol.trim()
  }));
}

async function updateTickers() {
  for (const [exchange, url] of Object.entries(ExchangeSources)) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const data: any = await response.json();

      const parsed = parseTickers(data);

      fs.writeFileSync(`./cache/${exchange}.json`, JSON.stringify(parsed, null, 2));
      console.log(`Cached ${exchange} successfully`);
    } catch (err) {
      console.log(`Failed to cache ${exchange} data:`, err);
    }
  }
}

cron.schedule('0 0 * * *', () => updateTickers());
cron.schedule('30 15 * * *', () => DailyStockUpdate(db));

db.init()
    .then(() => {
        app.listen(PORT, async () => {
            // await updateTickers();
            // await DailyStockUpdate(db);
            // await ClusterStocks(db);
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    }).catch((err) => {
        console.error('Failed to initialize database:', err);
    });
