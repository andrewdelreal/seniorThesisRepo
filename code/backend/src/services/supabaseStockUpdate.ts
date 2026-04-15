import SBAbstraction from '../SBAbstraction';
import { getMarketQuotes } from '../services/tradierService';
import ApiError from '../errors/ApiError';

interface Ticker {
    name: string,
    symbol: string
}

export async function SupabaseDailyStockUpdate() {
    // check if today is already in the database
    const sb = new SBAbstraction();

    if (await sb.areTodaysQuotesInDatabase()) {
        console.log('Today\'s stock data is already in the database, skipping update');
        return;
    }

    // if the time is before 3:00 pm local time, don't run this
    const now = new Date();

    const estNow = new Date(
        now.toLocaleString("en-CA", { timeZone: "America/New_York" })
    );

    const marketCloseTime = new Date(estNow);
    marketCloseTime.setHours(16, 0, 0, 0); // 4:00 PM EST/EDT

    if (estNow < marketCloseTime) {
        console.log('Market is not yet closed, skipping daily stock update');
        return;
    }

    console.log('Running daily stock update...');
    const exchanges = ['Q', 'N', 'A'];
    
    for (const exchange of exchanges) {
        try { 
            // get ticker from database
            const tickerData: Ticker[] | null = await sb.getTickers(exchange);
            
            if (!tickerData || tickerData.length === 0) {
                console.log(`No tickers found for exchange ${exchange}, skipping...`);
                continue;
            }

            // get tickers into a string for the API call
            const tickers: string = tickerData.map((item: Ticker) => item.symbol).join(',');
        
            await getMarketQuotes(tickers);
            await sb.addDailyStockSnapshot();
            // add quotes to database or process as needed
            console.log(tickerData.length + ' tickers found for daily stock update');
        }
        catch (err) {
            if (err instanceof ApiError) {
                console.error(`[Stock Update Job] API Error: ${err.message}`);
            } else {
                console.error('[Stock Update Job] Unknown Error:', err);
            }
        }
    }
      console.log('Daily stock update executed');
}

export default SupabaseDailyStockUpdate;
