import {SupabaseDailyStockUpdate} from '../services/supabaseStockUpdate';

SupabaseDailyStockUpdate().then(() => {
    console.log('Job completed');
    process.exit(0);
})
.catch((err) => {
    console.error(err);
    process.exit(1);
});