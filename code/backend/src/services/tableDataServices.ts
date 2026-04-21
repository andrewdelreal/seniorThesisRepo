import DBAbstraction from "../DBAbstraction";
import ApiError from "../errors/ApiError";

interface Stock {
    symbol: string;
    exch: string;
    last: number;
    volume: number;
    high: number;
    low: number;
    volatility: number;
    change: number;
    average_volume: number;
    close: number;
};

export async function getStockTableData(date: string) {
    const db: DBAbstraction = new DBAbstraction();

    const tableData = await db.getQuotesForTable(date);

    if (!tableData) {
        throw new ApiError(
            500,
            'DATABASE_FAILURE',
            'Failed to fetch stock table data from database'
        )
    }

    const rows: Stock[] = tableData;

    return rows;
}