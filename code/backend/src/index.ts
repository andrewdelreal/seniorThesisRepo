import express, { Application } from 'express';
import path from 'path';
import DBAbstraction from './DBAbstraction';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import jwt from "jsonwebtoken";
import { LoginTicket, OAuth2Client, TokenPayload } from "google-auth-library";
import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import fs from 'fs';
import cron from 'node-cron';

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app: Application = express();

const PORT: number = 3000;

const dbPath: string = path.join(__dirname, '..', 'data', 'database.db');
const db: DBAbstraction = new DBAbstraction(dbPath);

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'))

const GOOGLE_CLIENT_ID: string = process.env.GOOGLE_CLIENT_ID!;
const client: OAuth2Client = new OAuth2Client(GOOGLE_CLIENT_ID);

const APP_JWT_SECRET: string = process.env.APP_JWT_SECRET!;

interface ExchangeItems {
  [key: string]: string;
};

const ExchangeSources = {
  nasdaq: 'https://github.com/rreichel3/US-Stock-Symbols/blob/main/nasdaq/nasdaq_full_tickers.json',
  nyse: 'https://github.com/rreichel3/US-Stock-Symbols/blob/main/nyse/nyse_full_tickers.json',
  amex: 'https://github.com/rreichel3/US-Stock-Symbols/tree/main/amex'
};

// Verify Google token
async function verifyGoogleToken(token: string) {
  const ticket: LoginTicket = await client.verifyIdToken({ // verify credentials with Google
    idToken: token,
    audience: GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
}

app.post("/api/auth/google", async (req: Request<{}, {}, {token: string}>, res: Response) => {
  const { token } = req.body;

  try {
    const payload: TokenPayload | undefined = await verifyGoogleToken(token); // Google verigies credentials
    if (!payload) return res.status(401).json({ error: "Invalid token" });

    const sub: string = payload.sub; // Google’s unique user ID
    if (!sub) return res.status(400).json({ error: "Missing user ID" });

    const appToken: string = jwt.sign({ googleId: sub }, APP_JWT_SECRET, { expiresIn: "7d" });  // create token valid for 7 days

    // Send user token that is valid for 7days
    res.json({ appToken });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Authentication failed" });
  }
});

app.post("/api/tradier/markets/history", async (req: Request<{}, {}, {symbol: string, interval: string, start: string, end: string}>, res: Response) => {
  const  options  = {method: 'GET',
  headers: {Accept: 'application/json', Authorization: 'Bearer ' + process.env.TRADIER_BEARER_TOKEN}};

  const { symbol, interval, start, end } = req.body;

  try {
    const response = await fetch(`https://api.tradier.com/v1/markets/history?symbol=${symbol}&interval=${interval}&start=${start}&end=${end}`, options );

    const data = await response.json();
    res.status(200).json(data);
  } catch (err) {
    console.error("Tradier API error:", err);
    res.status(500).json({ error: "Failed to fetch market history" });  
  }
});

app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!');
});

//middleware for pretected routes
function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader: string | undefined = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Missing token" });

  const token: string = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, APP_JWT_SECRET) as { googleId: string };
    (req as any).googleId = decoded.googleId;
    next();
  } catch {
    return res.status(403).json({ error: "Invalid token" });
  }
}

const parseTickers = (data: any) => {
  return data.map((item: ExchangeItems) => ({
    name: `${item.name} (${item.symbol})`,
    symbol: item.symbol
  }));
}

async function updateTickers() {
  for (const [exchange, url] of Object.entries(ExchangeSources)) {
    try {
      const response = await fetch(url);
      const data: any = response.json();

      const parsed = parseTickers(data);

      fs.writeFileSync(`../cache/${exchange}.json`, JSON.stringify(parsed, null, 2));
      console.log(`Cached ${exchange} successfully`);
    } catch (err) {
      console.log(`Failed to cache ${exchange} data:`, err);
    }
  }
}

cron.schedule('0 0 * * *', updateTickers);

db.init()
    .then(() => {
        app.listen(PORT, () => {
            updateTickers();
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    }).catch((err) => {
        console.error('Failed to initialize database:', err);
    });

