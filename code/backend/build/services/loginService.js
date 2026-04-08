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
exports.verifyLogin = verifyLogin;
const ApiError_1 = __importDefault(require("../errors/ApiError"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const google_auth_library_1 = require("google-auth-library");
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const client = new google_auth_library_1.OAuth2Client(GOOGLE_CLIENT_ID);
const APP_JWT_SECRET = process.env.APP_JWT_SECRET;
function verifyLogin(token) {
    return __awaiter(this, void 0, void 0, function* () {
        // Google verigies credentials
        const payload = yield verifyGoogleToken(token);
        if (!payload) {
            throw new ApiError_1.default(401, "AUTH_INVALID_TOKEN", "Invalid token");
        }
        // Google’s unique user ID
        const sub = payload.sub;
        if (!sub) {
            throw new ApiError_1.default(400, "AUTH_MISSING_USER_ID", "Missing user ID");
        }
        // create token valid for 7 days
        const appToken = jsonwebtoken_1.default.sign({ googleId: sub }, APP_JWT_SECRET, { expiresIn: '7d' });
        // Send user token that is valid for 7days
        return ({ appToken });
    });
}
function verifyGoogleToken(token) {
    return __awaiter(this, void 0, void 0, function* () {
        const ticket = yield client.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID,
        });
        return ticket.getPayload();
    });
}
