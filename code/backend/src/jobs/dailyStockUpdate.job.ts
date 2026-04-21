import { DailyStockUpdate } from "../services/dailyStockService";
import cron from 'node-cron';

export async function startStockUpdateJobs() {
    await DailyStockUpdate();
    cron.schedule('30 16 * * *', () => DailyStockUpdate(), { timezone: 'America/New_York' });
}