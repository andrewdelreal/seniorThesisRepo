"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const DBAbstraction_1 = __importDefault(require("./DBAbstraction"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const body_parser_1 = __importDefault(require("body-parser"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const google_auth_library_1 = require("google-auth-library");
const dotenv_1 = __importDefault(require("dotenv"));
const fs_1 = __importDefault(require("fs"));
const node_cron_1 = __importDefault(require("node-cron"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
const app = (0, express_1.default)();
const PORT = 3000;
const dbPath = path_1.default.join(__dirname, '..', 'data', 'database.db');
const db = new DBAbstraction_1.default(dbPath);
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static('public'));
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new google_auth_library_1.OAuth2Client(GOOGLE_CLIENT_ID);
const APP_JWT_SECRET = process.env.APP_JWT_SECRET;
;
const ExchangeSources = {
    nasdaq: 'https://raw.githubusercontent.com/rreichel3/US-Stock-Symbols/main/nasdaq/nasdaq_full_tickers.json',
    nyse: 'https://raw.githubusercontent.com/rreichel3/US-Stock-Symbols/main/nyse/nyse_full_tickers.json',
    amex: 'https://raw.githubusercontent.com/rreichel3/US-Stock-Symbols/main/amex/amex_full_tickers.json'
};
// Verify Google token
function verifyGoogleToken(token) {
    return __awaiter(this, void 0, void 0, function* () {
        const ticket = yield client.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID,
        });
        return ticket.getPayload();
    });
}
app.post('/api/auth/google', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token } = req.body;
    try {
        const payload = yield verifyGoogleToken(token); // Google verigies credentials
        if (!payload)
            return res.status(401).json({ error: 'Invalid token' });
        const sub = payload.sub; // Google’s unique user ID
        if (!sub)
            return res.status(400).json({ error: 'Missing user ID' });
        const appToken = jsonwebtoken_1.default.sign({ googleId: sub }, APP_JWT_SECRET, { expiresIn: '7d' }); // create token valid for 7 days
        // Send user token that is valid for 7days
        res.json({ appToken });
    }
    catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Authentication failed' });
    }
}));
app.post('/api/tradier/markets/history', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const options = { method: 'GET',
        headers: { Accept: 'application/json', Authorization: 'Bearer ' + process.env.TRADIER_BEARER_TOKEN } };
    const { symbol, interval, start, end } = req.body;
    try {
        const response = yield fetch(`https://api.tradier.com/v1/markets/history?symbol=${symbol}&interval=${interval}&start=${start}&end=${end}`, options);
        const data = yield response.json();
        res.status(200).json(data);
    }
    catch (err) {
        console.error('Tradier API error:', err);
        res.status(500).json({ error: 'Failed to fetch market history' });
    }
}));
app.post('/api/tickers', (req, res) => {
    const { exchange } = req.body;
    const filePath = `./cache/${exchange}.json`;
    const data = JSON.parse(fs_1.default.readFileSync(filePath, 'utf8'));
    if (!data)
        return res.status(500).json({ 'error': 'Failed to read from echange cache' });
    res.json(data);
});
app.get('/', (req, res) => {
    res.send('Hello World!');
});
//middleware for pretected routes
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ error: 'Missing token' });
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, APP_JWT_SECRET);
        req.googleId = decoded.googleId;
        next();
    }
    catch (_a) {
        return res.status(403).json({ error: 'Invalid token' });
    }
}
const parseTickers = (data) => {
    return data.map((item) => ({
        name: `${item.name.slice(0, 50).trimEnd()} (${item.symbol})`,
        symbol: item.symbol
    }));
};
function updateTickers() {
    return __awaiter(this, void 0, void 0, function* () {
        for (const [exchange, url] of Object.entries(ExchangeSources)) {
            try {
                const response = yield fetch(url);
                if (!response.ok) {
                    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
                }
                const data = yield response.json();
                const parsed = parseTickers(data);
                fs_1.default.writeFileSync(`./cache/${exchange}.json`, JSON.stringify(parsed, null, 2));
                console.log(`Cached ${exchange} successfully`);
            }
            catch (err) {
                console.log(`Failed to cache ${exchange} data:`, err);
            }
        }
    });
}
node_cron_1.default.schedule('0 0 * * *', updateTickers);
db.init()
    .then(() => {
    app.listen(PORT, () => {
        updateTickers();
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}).catch((err) => {
    console.error('Failed to initialize database:', err);
});
