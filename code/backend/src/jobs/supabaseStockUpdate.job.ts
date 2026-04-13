import {SupabaseDailyStockUpdate} from '../services/supabaseStockUpdate';

async function startSupabaseStockUpdateJob() {
    await SupabaseDailyStockUpdate();
}

startSupabaseStockUpdateJob();