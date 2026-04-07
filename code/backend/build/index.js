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
const dotenv_1 = __importDefault(require("dotenv"));
const tickerUpdate_job_1 = require("./jobs/tickerUpdate.job");
const tradierRoutes_1 = __importDefault(require("./routes/tradierRoutes"));
const tickerRoutes_1 = __importDefault(require("./routes/tickerRoutes"));
const loginRoutes_1 = __importDefault(require("./routes/loginRoutes"));
const clusterRoutes_1 = __importDefault(require("./routes/clusterRoutes"));
const errorHandler_1 = require("./middleware/errorHandler");
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
const app = (0, express_1.default)();
const PORT = 3000;
const db = new DBAbstraction_1.default();
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(express_1.default.static('public'));
app.use(tradierRoutes_1.default);
app.use(tickerRoutes_1.default);
app.use(loginRoutes_1.default);
app.use(clusterRoutes_1.default);
app.use(errorHandler_1.errorHandler);
(0, tickerUpdate_job_1.startTickerJobs)();
// cron.schedule('30 15 * * *', () => DailyStockUpdate(db));
db.init()
    .then(() => {
    app.listen(PORT, () => __awaiter(void 0, void 0, void 0, function* () {
        // await DailyStockUpdate(db);
        console.log(`Server is running on http://localhost:${PORT}`);
    }));
}).catch((err) => {
    console.error('Failed to initialize database:', err);
});
