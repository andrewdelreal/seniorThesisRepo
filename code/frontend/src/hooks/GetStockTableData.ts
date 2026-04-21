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

async function GetStockTableData(date: string): Promise<Stock[] | undefined> {
    try {
        const res: Response = await fetch('http://localhost:3000/api/tabledata', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'authorization': '' + localStorage.getItem('token'),
            },
            body: JSON.stringify({ date}),
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
            console.error('Failed to fetch cluster data:', res.status, json);
            throw new Error('Failed to fetch cluster data');
        }

        // return data from the backend
        return json.data;
    } catch (err) {
        console.log('Could not fetch stock table data');
    }
}

export default GetStockTableData;