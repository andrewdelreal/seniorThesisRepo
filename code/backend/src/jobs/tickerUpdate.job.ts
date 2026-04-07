import { updateTickers } from "../services/tickerService";
import cron from 'node-cron';
import ApiError from "../errors/ApiError";

export async function startTickerJobs() {

    const safeUpdateTickers = async () => {
        try {
            await updateTickers();
        } catch (err) {
            if (err instanceof ApiError) {
                console.error(`[Ticker Job] API Error: ${err.message}`);
            } else {
                console.error('[Ticker Job] Unknown Error:', err);
            }
        }
    };

    await safeUpdateTickers();
    cron.schedule('0 0 * * *', safeUpdateTickers);
}