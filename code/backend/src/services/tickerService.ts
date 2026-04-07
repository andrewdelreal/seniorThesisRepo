import ApiError from "../errors/ApiError";
import DBAbstraction  from "../DBAbstraction";
import fs from 'fs';

interface ExchangeItems {
  [key: string]: string;
};

const ExchangeSources = {
  nasdaq: 'https://raw.githubusercontent.com/rreichel3/US-Stock-Symbols/main/nasdaq/nasdaq_full_tickers.json',
  nyse: 'https://raw.githubusercontent.com/rreichel3/US-Stock-Symbols/main/nyse/nyse_full_tickers.json',
  amex: 'https://raw.githubusercontent.com/rreichel3/US-Stock-Symbols/main/amex/amex_full_tickers.json'
};

export async function getTickers(
    exchange: string
) {
    const db = new DBAbstraction();

    let exchDBSymbol: string = '';
    if (exchange === 'nasdaq') exchDBSymbol = 'Q';
    else if (exchange === 'nyse') exchDBSymbol = 'N';
    else exchDBSymbol = 'A';

    const data = await db.getTickers(exchDBSymbol);

    if (!data) {
        throw new ApiError( 502, 
            "TRADIER_FAILURE", 
            "Failed to fetch tickers from database" 
        ); 
    }

    return data;
}

export async function updateTickers() {
    console.log('Updating tickers...');

    for (const [exchange, url] of Object.entries(ExchangeSources)) {
        const response = await fetch(url);

        if (!response.ok) {
            throw new ApiError(
                500,
                'TICKER_UPDATE_FAILURE',
                `Failed to fetch tickers for ${exchange} from github`
            )
        }

        const data: any = await response.json();
        const parsed = parseTickers(data);

        fs.writeFileSync(`./cache/${exchange}.json`, JSON.stringify(parsed, null, 2));
        console.log(`Cached ${exchange} successfully`);
    }
}

const parseTickers = (data: any) => {
  return data.filter((item: ExchangeItems) => item.symbol.includes('^') === false).map((item: ExchangeItems) => ({
    name: `${item.name.slice(0, 50).trim()} (${item.symbol.trim()})`,
    symbol: item.symbol.trim()
  }));
}
