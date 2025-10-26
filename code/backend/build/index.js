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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const google_auth_library_1 = require("google-auth-library");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "../.env") });
const app = (0, express_1.default)();
const PORT = 3000;
const dbPath = path_1.default.join(__dirname, '..', 'data', 'database.db');
const db = new DBAbstraction_1.default(dbPath);
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use(express_1.default.static('public'));
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new google_auth_library_1.OAuth2Client(GOOGLE_CLIENT_ID);
const APP_JWT_SECRET = process.env.APP_JWT_SECRET;
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
app.post("/api/auth/google", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { token } = req.body;
    try {
        const payload = yield verifyGoogleToken(token);
        if (!payload)
            return res.status(401).json({ error: "Invalid token" });
        const { sub } = payload; // Google’s unique user ID
        if (!sub)
            return res.status(400).json({ error: "Missing user ID" });
        const appToken = jsonwebtoken_1.default.sign({ googleId: sub }, APP_JWT_SECRET, { expiresIn: "7d" });
        // Send it back to frontend
        res.json({ appToken });
    }
    catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ error: "Authentication failed" });
    }
}));
app.get('/', (req, res) => {
    res.send('Hello World!');
});
//middleware for pretected routes
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ error: "Missing token" });
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, APP_JWT_SECRET);
        req.googleId = decoded.googleId;
        next();
    }
    catch (_a) {
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
