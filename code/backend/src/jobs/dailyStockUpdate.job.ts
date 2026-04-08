import { DailyStockUpdate } from "../services/dailyStockService";
import cron from 'node-cron';
import ApiError from "../errors/ApiError";

export async function startStockUpdateJobs() {
    await DailyStockUpdate();
    cron.schedule('0 0 * * *', () => DailyStockUpdate());
}