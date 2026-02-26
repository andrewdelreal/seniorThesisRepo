import DBAbstraction from './DBAbstraction';
import fs from 'fs';
import { json2csv } from 'json-2-csv';

async function DailyStockUpdate(db: DBAbstraction) {
    // check if today is already in the database
    if (await db.areTodaysQuotesInDatabase()) {
      console.log('Today\'s stock data is already in the database, skipping update');
      return;
    }

    // if the time is before 3:30 pm local time, don't run this
    const now = new Date();
    const marketCloseTime = new Date();
    marketCloseTime.setHours(15, 30, 0, 0); // Set to 3:30 PM local time

    if (now < marketCloseTime) {
      console.log('Market is not yet closed, skipping daily stock update');
      return;
    }

    console.log('Running daily stock update...');
    const exchange = 'nasdaq'; // Example exchange
    
      const filePath = `./cache/${exchange}.json`;
      try { 
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const tickers = data.map((item: any) => item.symbol).join(',');
    
        await getMarketQuotes(tickers, db);
    
        // add quotes to database or process as needed
        console.log(data.length + ' tickers found for daily stock update');
      }
      catch (err) {
        console.error('Failed to read ticker data for daily stock update');
        return;
      }
    
      console.log('Daily stock update executed');
}

async function getMarketQuotes(symbols: string, db: DBAbstraction) {
   const options  = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      Authorization: 'Bearer ' + process.env.TRADIER_BEARER_TOKEN,
    },
    body: new URLSearchParams({symbols: symbols}),
  };

  try {
    const response = await fetch('https://api.tradier.com/v1/markets/quotes', options );

    if (!response.ok) {
      const text = await response.text();
      console.error("Tradier error:", response.status, text);
      throw new Error("Tradier API failed");
    }

    let jsondata = await response.json();
    jsondata = jsondata.quotes.quote; // Extract the array of quotes from the response
    jsondata = await cleanQuotes(jsondata);
    jsondata = await addVolatilityAndDateToQuotes(jsondata);
    console.log(jsondata.length + ' quotes fetched from Tradier API');

    const data = await json2csv(jsondata);
    await fs.writeFileSync('./cache/dailyquotes.csv', data);
    await db.addDailyStockSnapshot();
  } catch (err) {
    console.error('Tradier Quotes API error:', err);
    throw new Error('Failed to fetch market quotes');
  }
}

async function cleanQuotes(data: any) {
  function isValidEquity(quote: any) {
    return (
      quote.type === "stock" &&
      quote.close !== null &&
      quote.high !== null &&
      quote.low !== null &&
      quote.volume > 10000
    );
  }

  data = data.filter(isValidEquity);

  const keysToKeep = ["symbol", "description", "exch", "last", "volume", "change_percent", "high", "low", "close", "change", "average_volume"];

  const filteredData = data.map((item: any) => {
      const newItem: any = {};
      keysToKeep.forEach(key => {
          if (item.hasOwnProperty(key)) {
              newItem[key] = item[key];
          }
      });
      return newItem;
  });

  return filteredData;
}

async function addVolatilityAndDateToQuotes(data: any) {
  return data.map((quote: any) => {
    const volatility = (quote.high - quote.low) / quote.last;
    return { ...quote, volatility, date: new Date().toLocaleDateString('en-CA') };
  });
}

export default DailyStockUpdate;