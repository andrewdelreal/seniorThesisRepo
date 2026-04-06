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
exports.getMarketHistory = getMarketHistory;
const ApiError_1 = __importDefault(require("../errors/ApiError"));
function getMarketHistory(symbol, interval, start, end) {
    return __awaiter(this, void 0, void 0, function* () {
        const options = {
            method: 'GET',
            headers: { Accept: 'application/json', Authorization: 'Bearer ' + process.env.TRADIER_BEARER_TOKEN }
        };
        const response = yield fetch(`https://api.tradier.com/v1/markets/history?symbol=${symbol}&interval=${interval}&start=${start}&end=${end}`, options);
        if (!response.ok) {
            const text = yield response.text();
            console.error("Tradier API error:", response.status, text);
            throw new ApiError_1.default(502, "TRADIER_API_FAILED", "Failed to fetch market history");
        }
        return response.json();
    });
}
