import express from 'express';
import path from 'path';
import DBAbstraction from './DBAbstraction';
import cors from 'cors';
import morgan from 'morgan';
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();

const PORT = 3000;

const dbPath = path.join(__dirname, '..', 'data', 'database.db');
const db = new DBAbstraction(dbPath);

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.static('public'))

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const APP_JWT_SECRET = process.env.APP_JWT_SECRET!;

// Verify Google token
async function verifyGoogleToken(token: string) {
  const ticket = await client.verifyIdToken({ // verify credentials with Google
    idToken: token,
    audience: GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
}

app.post("/api/auth/google", async (req, res) => {
  const { token } = req.body;

  try {
    const payload = await verifyGoogleToken(token); // Google verigies credentials
    if (!payload) return res.status(401).json({ error: "Invalid token" });

    const { sub } = payload; // Google’s unique user ID
    if (!sub) return res.status(400).json({ error: "Missing user ID" });

    const appToken = jwt.sign({ googleId: sub }, APP_JWT_SECRET, { expiresIn: "7d" });  // create token valid for 7 days

    // Send user token that is valid for 7days
    res.json({ appToken });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Authentication failed" });
  }
});

app.get('/', (req, res) => {
    res.send('Hello World!');
});

//middleware for pretected routes
function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Missing token" });

  const token = authHeader.split(" ")[1];
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

