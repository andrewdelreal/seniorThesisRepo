import { JSX, useState, useEffect } from "react";
import '../css/StockControls.module.css';

interface StockControlsProps {
    exchange: string;
    setExchange: (value: string) => void;
    symbol: string;
    setSymbol: (value: string) => void;
    interval: string;
    setInterval: (value: string) => void;
    start: string;
    setStart: (value: string) => void;
    end: string;
    setEnd: (value: string) => void;
}

interface ExchangeItems {
  [key: string]: string;
};

const exchangeOptions = [
    { label: "NASDAQ", value: "nasdaq" },
    { label: "NYSE", value: "nyse" },
    { label: "AMEX", value: "amex" },
];

const intervalOptions = [
    { label: "Daily", value: "daily" },
    { label: "Weekly", value: "weekly" },
    { label: "Monthly", value: "monthly" },
];

// const tickerOptions = [
//     { label: "Apple (AAPL)", value: "AAPL" },
//     { label: "Microsoft (MSFT)", value: "MSFT" },
//     { label: "Amazon (AMZN)", value: "AMZN" },
//     { label: "Google (GOOG)", value: "GOOG" },
//     { label: "NVIDIA (NVDA)", value: "NVDA" },
//     { label: "Tesla (TSLA)", value: "TSLA" },
// ];

function StockControls({
    exchange,
    setExchange,
    symbol,
    setSymbol,
    interval,
    setInterval,
    start,
    setStart,
    end,
    setEnd,
}: StockControlsProps): JSX.Element {
    const [tickers, setTickers] = useState<ExchangeItems[]>([]);

    useEffect(() => {
        const getTickers = async () => {
            const response = await fetch('http://localhost:3000/api/tickers', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({exchange})
            });

            if (!response.ok) {
                throw new Error(`Error fetching ticker data: ${response.statusText}`);
            }

            const tickerData = await response.json();
            setTickers(tickerData);
        };

        getTickers();
    }, [exchange]);

    return (
        <div className="stock-controls">
            {/* Exchange dropdown */}
            <select
                value={exchange}
                onChange={(e) => setExchange(e.target.value)}
                className="select"
            >
                {exchangeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
                ))}
            </select>

            {/* Symbol dropdown */}
            <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="select"
            >
                {tickers.map((t) => (
                <option key={t.symbol} value={t.symbol}>
                    {t.name}
                </option>
                ))}
            </select>

            {/* Interval dropdown */}
            <select
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                className="select"
            >
                {intervalOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                    {opt.label}
                </option>
                ))}
            </select>

            {/* Start date */}
            <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="imput"
            />

            {/* End date */}
            <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="input"
            />
        </div>
    );
}

export default StockControls;
