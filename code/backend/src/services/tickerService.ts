import ApiError from "../errors/ApiError";
import DBAbstraction  from "../DBAbstraction";

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