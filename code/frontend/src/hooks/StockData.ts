import { useState, useEffect } from "react";

interface StockHistoryParams {
  symbol: string;
  interval: string;
  start: string;
  end: string;
}

function StockData({ symbol, interval, start, end }: StockHistoryParams) {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(false); 
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!symbol || !interval || !start || !end) {  // check all parameters are provided
            setError("All parameters (symbol, interval, start, end) are required.");
            return;
        }

        const fetchStockData = async () => {
            setLoading(true);
            setError(null);

            try {
                const response: Response = await fetch('http://localhost:3000/api/tradier/markets/history', { // get market data from backend
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ symbol, interval, start, end }),  // using all desired parameters
                });

                if (!response.ok) {
                    throw new Error(`Error fetching stock data: ${response.statusText}`);
                }

                const json = await response.json();
                setData(json);
            } catch (err: any) {
                setError(err.message || "Unknown error occurred");
            } finally {
                setLoading(false);
            }
        }

        fetchStockData();
    }, [symbol, interval, start, end]);  // if any parameter changes, refetch data

    return { data, loading, error };  // return data, loading state, and error state
}

export default StockData;
