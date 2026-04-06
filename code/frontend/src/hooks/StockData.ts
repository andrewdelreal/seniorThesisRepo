import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';



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

    const navigate = useNavigate();

    useEffect(() => {
        if (!symbol || !interval || !start || !end) {  // check all parameters are provided
            setError('All parameters (symbol, interval, start, end) are required.');
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
                        'authorization': '' + localStorage.getItem('token'),
                    },
                    body: JSON.stringify({ symbol, interval, start, end }),  // using all desired parameters
                });

                const json = await response.json();

                if (!response.ok || !json.success) {
                    navigate('/login');
                    throw new Error(`${json.code}: ${json.message}`);
                }

                setData(json.data);
            } catch (err: any) {
                navigate('/login');
                console.log(err.message || 'Failed to fetch stock data');
            } finally {
                setLoading(false);
            }
        }

        fetchStockData();
    }, [symbol, interval, start, end]);  // if any parameter changes, refetch data

    return { data, loading, error };  // return data, loading state, and error state
}

export default StockData;
