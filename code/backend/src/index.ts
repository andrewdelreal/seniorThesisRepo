import express, { Application } from 'express';
import path from 'path';
import DBAbstraction from './DBAbstraction';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser, { json } from 'body-parser';
import jwt from 'jsonwebtoken';
import { LoginTicket, OAuth2Client, TokenPayload } from 'google-auth-library';
import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import fs from 'fs';
import cron from 'node-cron';
import pl from 'nodejs-polars';
import DailyStockUpdate from './DailyStockUpdate';
import ClusterStocks from './ClusterStocks';

import tradierRoutes from './routes/tradierRoutes';
import tickerRoutes from './routes/tickerRoutes';
import { errorHandler } from './middleware/errorHandler';

// Add rest of stock exchanges

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
app.use(errorHandler);

const GOOGLE_CLIENT_ID: string = process.env.GOOGLE_CLIENT_ID!;
const client: OAuth2Client = new OAuth2Client(GOOGLE_CLIENT_ID);

const APP_JWT_SECRET: string = process.env.APP_JWT_SECRET!;

interface ExchangeItems {
  [key: string]: string;
};

const ExchangeSources = {
  nasdaq: 'https://raw.githubusercontent.com/rreichel3/US-Stock-Symbols/main/nasdaq/nasdaq_full_tickers.json',
  nyse: 'https://raw.githubusercontent.com/rreichel3/US-Stock-Symbols/main/nyse/nyse_full_tickers.json',
  amex: 'https://raw.githubusercontent.com/rreichel3/US-Stock-Symbols/main/amex/amex_full_tickers.json'
};

// Verify Google token
async function verifyGoogleToken(token: string) {
  const ticket: LoginTicket = await client.verifyIdToken({ // verify credentials with Google
    idToken: token,
    audience: GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
}

app.post('/api/auth/google', async (req: Request<{}, {}, {token: string}>, res: Response) => {
  const { token } = req.body;

  try {
    const payload: TokenPayload | undefined = await verifyGoogleToken(token); // Google verigies credentials
    if (!payload) return res.status(401).json({ error: 'Invalid token' });

    const sub: string = payload.sub; // Google’s unique user ID
    if (!sub) return res.status(400).json({ error: 'Missing user ID' });

    const appToken: string = jwt.sign({ googleId: sub }, APP_JWT_SECRET, { expiresIn: '7d' });  // create token valid for 7 days

    // Send user token that is valid for 7days
    res.json({ appToken });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// app.post('/api/tradier/markets/history', authenticate, async (req: Request<{}, {}, {symbol: string, interval: string, start: string, end: string}>, res: Response) => {
//   const  options  = {
//     method: 'GET',
//     headers: {Accept: 'application/json', Authorization: 'Bearer ' + process.env.TRADIER_BEARER_TOKEN}
//   };

//   const { symbol, interval, start, end } = req.body;

//   try {
//     const response = await fetch(`https://api.tradier.com/v1/markets/history?symbol=${symbol}&interval=${interval}&start=${start}&end=${end}`, options );
//      if (!response.ok) {
//       const text = await response.text();
//       console.error("Tradier error:", response.status, text);
//       return res.status(500).json({ error: 'Failed to fetch market history' });
//     }
//     const data = await response.json();
//     res.status(200).json(data);
//   } catch (err) {
//     console.error('Tradier API error:', err);
//     res.status(500).json({ error: 'Failed to fetch market history' });  
//   }
// });

// app.post('/api/tickers', authenticate, async (req: Request, res: Response) => {
//   const { exchange } = req.body;
  
//   let exchDBSymbol: string; // assign exchange value to correct db symbol for query
//   if (exchange === 'nasdaq') exchDBSymbol = 'Q';
//   else if (exchange === 'nyse') exchDBSymbol = 'N';
//   else exchDBSymbol = 'A';

//   const data = await db.getTickers(exchDBSymbol); // get tickers from database

//   if (!data) return res.status(500).json({'error': 'Failed to read from exchange cache'});

//   res.json(data);
// });

app.post('/api/cluster', async (req: Request, res: Response) => {
  const { date, numClusters, dimensionsCSV, boolIsLog, boolIsStandardized, exchanges, dimensionReduction } = req.body;

  const dimensions = dimensionsCSV.split(',');

  try {
    const result = await ClusterStocks(db, date, numClusters, dimensions, boolIsLog, boolIsStandardized, exchanges, dimensionReduction);

    if (!result) {
      console.error('Failed to cluster stocks');
      return res.status(500).json({ error: 'Failed to cluster stocks' });
    }

    const clusterDF: pl.DataFrame = result[0];
    const centroids: number[] = result[1];

    // otherwise, just use the original dimension names for 2 dimensions.
    res.status(200).json({points: clusterDF.toRecords(), centroids: centroids, dimensions: dimensions});
  } catch (err) {
    console.error('Failed to cluster stocks');
    res.status(500).json({ error: 'Failed to cluster stocks' });  
  }

});

app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!');
});

//middleware for pretected routes
function authenticate(req: Request, res: Response, next: NextFunction) {
  const token: string | undefined = req.headers.authorization;

  if (!token) return res.status(401).json({ error: 'Missing token' });

  // const token: string = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, APP_JWT_SECRET) as { googleId: string };
    (req as any).googleId = decoded.googleId;
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid token' });
  }
}

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
