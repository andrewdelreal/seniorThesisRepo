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
exports.getTickers = getTickers;
const ApiError_1 = __importDefault(require("../errors/ApiError"));
const DBAbstraction_1 = __importDefault(require("../DBAbstraction"));
function getTickers(exchange) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = new DBAbstraction_1.default();
        let exchDBSymbol = '';
        if (exchange === 'nasdaq')
            exchDBSymbol = 'Q';
        else if (exchange === 'nyse')
            exchDBSymbol = 'N';
        else
            exchDBSymbol = 'A';
        const data = yield db.getTickers(exchDBSymbol);
        if (!data) {
            throw new ApiError_1.default(502, "TRADIER_FAILURE", "Failed to fetch tickers from database");
        }
        return data;
    });
}
