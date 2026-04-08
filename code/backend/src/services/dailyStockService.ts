import DBAbstraction from '../DBAbstraction';
import fs from 'fs';
import { getMarketQuotes } from '../services/tradierService';
import ApiError from '../errors/ApiError';

export async function DailyStockUpdate() {
    // check if today is already in the database
    const db = new DBAbstraction();

    if (await db.areTodaysQuotesInDatabase()) {
        console.log('Today\'s stock data is already in the database, skipping update');
        return;
    }

    // if the time is before 3:00 pm local time, don't run this
    const now = new Date();
    const marketCloseTime = new Date();
    marketCloseTime.setHours(15, 0, 0, 0); // Set to 3:00 PM local time

    if (now < marketCloseTime) {
        console.log('Market is not yet closed, skipping daily stock update');
        return;
    }

    console.log('Running daily stock update...');
    const exchanges = ['nasdaq', 'nyse', 'amex'];
    
    for (const exchange of exchanges) {
        try { 
            const filePath = `./cache/${exchange}.json`;
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            const tickers = data.map((item: any) => item.symbol).join(',');
        
            await getMarketQuotes(tickers, db);
        
            // add quotes to database or process as needed
            console.log(data.length + ' tickers found for daily stock update');
        }
        catch (err) {
            if (err instanceof ApiError) {
                console.error(`[Ticker Job] API Error: ${err.message}`);
            } else {
                console.error('[Ticker Job] Unknown Error:', err);
            }
        }
    }
      console.log('Daily stock update executed');
}

export default DailyStockUpdate;
