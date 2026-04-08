import ApiError from "../errors/ApiError";
import DBAbstraction  from "../DBAbstraction";
import fs from 'fs';

interface ExchangeItems {
  [key: string]: string;
};

interface GitHubTicker {
    symbol: string,
    name: string,
    lastsale: string,
    netchange: string,
    pctchange: string,
    volume: string,
    marketCap: string,
    country: string,
    ipoyear: string,
    industry: string,
    sector: string,
    url: string
}

interface Ticker {
    name: string,
    symbol: string
}

const ExchangeSources = {
  nasdaq: 'https://raw.githubusercontent.com/rreichel3/US-Stock-Symbols/main/nasdaq/nasdaq_full_tickers.json',
  nyse: 'https://raw.githubusercontent.com/rreichel3/US-Stock-Symbols/main/nyse/nyse_full_tickers.json',
  amex: 'https://raw.githubusercontent.com/rreichel3/US-Stock-Symbols/main/amex/amex_full_tickers.json'
};

export async function getTickers(
    exchange: string
) {
    const db: DBAbstraction = new DBAbstraction();

    let exchDBSymbol: string = '';
    if (exchange === 'nasdaq') exchDBSymbol = 'Q';
    else if (exchange === 'nyse') exchDBSymbol = 'N';
    else exchDBSymbol = 'A';

    const data: Ticker[] | null = await db.getTickers(exchDBSymbol);

    if (!data) {
        throw new ApiError( 502, 
            "TRADIER_FAILURE", 
            "Failed to fetch tickers from database" 
        ); 
    }

    return data;
}

export async function updateTickers() {
    const lastTickerUpdatePath: string = './cache/lastUpdate.json';
    const data: {lastUpdate: string} = JSON.parse(fs.readFileSync(lastTickerUpdatePath, 'utf8'));

    if (data.lastUpdate === new Date().toLocaleDateString('en-CA')) {
        console.log('Tickers are already up to date, skipping update');
        return;
    }

    fs.writeFileSync(`./cache/lastupdate.json`, JSON.stringify({lastUpdate: new Date().toLocaleDateString('en-CA')}, null, 2));

    console.log('Updating tickers...');

    for (const [exchange, url] of Object.entries(ExchangeSources)) {
        // get raw ticker data from github
        const response: Response = await fetch(url);

        if (!response.ok) {
            throw new ApiError(
                500,
                'TICKER_UPDATE_FAILURE',
                `Failed to fetch tickers for ${exchange} from github`
            )
        }

        // parse ticker data to {name, string} format
        const data: GitHubTicker[] = await response.json();
        const parsed: Ticker[] = parseTickers(data);

        // cache parsed tickers
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
