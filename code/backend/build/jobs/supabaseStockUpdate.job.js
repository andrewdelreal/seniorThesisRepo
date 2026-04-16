"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dailyStockService_1 = require("../services/dailyStockService");
(0, dailyStockService_1.DailyStockUpdate)().then(() => {
    console.log('Job completed');
    process.exit(0);
})
    .catch((err) => {
    console.error(err);
    process.exit(1);
});
