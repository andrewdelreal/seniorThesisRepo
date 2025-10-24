"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const DBAbstraction_1 = __importDefault(require("./DBAbstraction"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const app = (0, express_1.default)();
const PORT = 3000;
const dbPath = path_1.default.join(__dirname, '..', 'data', 'database.db');
const db = new DBAbstraction_1.default(dbPath);
app.use((0, cors_1.default)());
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.static('public'));
app.get('/', (req, res) => {
    res.send('Hello World!');
});
db.init()
    .then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}).catch((err) => {
    console.error('Failed to initialize database:', err);
});
