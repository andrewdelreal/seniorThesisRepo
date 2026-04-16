import ApiError from "../errors/ApiError";
import fs from 'fs';
import { json2csv } from 'json-2-csv';

interface RawHistoryData {
    history: {
        day: [
            {
                date: string,
                open: number,
                high: number,
                low: number,
                close: number,
                volume: number
            }
        ],
        symbol: string
     }
};

interface MarketHistoryData {
    xValues: number[], 
    yValues: number[]
};

export async function getMarketHistory(
    symbol: string, 
    interval: string, 
    start: string, 
    end: string
) {
    const options = {
        method: 'GET',
        headers: {
            Accept: 'application/json', 
            Authorization: 'Bearer ' + process.env.TRADIER_BEARER_TOKEN
        }
    };

    const response = await fetch(
        `https://api.tradier.com/v1/markets/history?symbol=${symbol}&interval=${interval}&start=${start}&end=${end}`, 
        options
    );

    const jsonData: RawHistoryData = await response.json();

    if (!response.ok || !jsonData || !jsonData.history || !jsonData.history.day) { 
        throw new ApiError( 502, 
            "TRADIER_API_FAILED", 
            "Failed to fetch market history" 
        ); 
    }
    
    const parsedData: MarketHistoryData = await ParseStockData(jsonData);

    return parsedData;
}

export async function getMarketQuotes(symbols: string) {
    const options  = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
            Authorization: 'Bearer ' + process.env.TRADIER_BEARER_TOKEN,
        },
        body: new URLSearchParams({symbols: symbols}),
    };

    const response = await fetch('https://api.tradier.com/v1/markets/quotes', options );

    if (!response.ok) {
        throw new ApiError( 502, 
            "TRADIER_API_FAILED", 
            "Failed to fetch market quotes" 
        ); 
    }

    let jsondata = await response.json();
    jsondata = jsondata.quotes.quote; // Extract the array of quotes from the response
    jsondata = await cleanQuotes(jsondata);
    jsondata = await addVolatilityAndDateToQuotes(jsondata);
    console.log(jsondata.length + ' quotes fetched from Tradier API');

    const data = await json2csv(jsondata);
    await fs.writeFileSync('./cache/dailyquotes.csv', data);
}

async function cleanQuotes(data: any) {
  function isValidEquity(quote: any) {
    return (
      quote.type === "stock" &&
      quote.close !== null &&
      quote.high !== null &&
      quote.low !== null &&
      quote.last !== null &&
      quote.change !== null &&
      quote.average_volume !== null &&
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
    return { ...quote, volatility, date: new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York' }) };
  });
}

async function ParseStockData(data: {history: {day: Object[]}}): Promise<{xValues: number[], yValues: number[]}> {
    // args: raw stock data
    // returns: Promise of parsed x and y values for graphing

    const xValues: number[] = data.history.day.map((d: any) => d.date); // get timestamps as x values
    const yValues: number[] = data.history.day.map((d: any) => d.close); // use closing prices as y values

    return Promise.resolve({ xValues, yValues });
}
