import express, { Application } from 'express';
import path from 'path';
import DBAbstraction from './DBAbstraction';
import cors from 'cors';
import morgan from 'morgan';
import jwt from "jsonwebtoken";
import { LoginTicket, OAuth2Client, TokenPayload } from "google-auth-library";
import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app: Application = express();

const PORT: number = 3000;

const dbPath: string = path.join(__dirname, '..', 'data', 'database.db');
const db: DBAbstraction = new DBAbstraction(dbPath);

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static('public'))

const GOOGLE_CLIENT_ID: string = process.env.GOOGLE_CLIENT_ID!;
const client: OAuth2Client = new OAuth2Client(GOOGLE_CLIENT_ID);

const APP_JWT_SECRET: string = process.env.APP_JWT_SECRET!;

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

app.post("/api/tradier/markets/history", async (req: Request, res: Response) => {
  const  options  = {method: 'GET',
  headers: {Accept: 'application/json', Authorization: 'Bearer ' + process.env.TRADIER_BEARER_TOKEN}};

  try {
    const response = await fetch('https://api.tradier.com/v1/markets/history?symbol=AAPL&interval=daily&start=2020-01-02&end=2020-01-03', options );

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

db.init()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    }).catch((err) => {
        console.error('Failed to initialize database:', err);
    });

