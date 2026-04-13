"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const supabaseStockUpdate_1 = require("../services/supabaseStockUpdate");
(0, supabaseStockUpdate_1.SupabaseDailyStockUpdate)().then(() => {
    console.log('Job completed');
    process.exit(0);
})
    .catch((err) => {
    console.error(err);
    process.exit(1);
});
