import { JSX } from "react";
import '../css/StockControls.module.css';

interface StockControlsProps {
  symbol: string;
  setSymbol: (value: string) => void;
  interval: string;
  setInterval: (value: string) => void;
  start: string;
  setStart: (value: string) => void;
  end: string;
  setEnd: (value: string) => void;
}

const intervalOptions = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

const tickerOptions = [
  { label: "Apple (AAPL)", value: "AAPL" },
  { label: "Microsoft (MSFT)", value: "MSFT" },
  { label: "Amazon (AMZN)", value: "AMZN" },
  { label: "Google (GOOG)", value: "GOOG" },
  { label: "NVIDIA (NVDA)", value: "NVDA" },
  { label: "Tesla (TSLA)", value: "TSLA" },
];

function StockControls({
  symbol,
  setSymbol,
  interval,
  setInterval,
  start,
  setStart,
  end,
  setEnd,
}: StockControlsProps): JSX.Element {
    return (
        <div className="stock-controls">
            {/* Symbol dropdown */}
            <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="p-2 rounded-xl border border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
                {tickerOptions.map((t) => (
                <option key={t.value} value={t.value}>
                    {t.label}
                </option>
                ))}
            </select>

            {/* Interval dropdown */}
            <select
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                className="p-2 rounded-xl border border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
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
                className="p-2 rounded-xl border border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />

            {/* End date */}
            <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="p-2 rounded-xl border border-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
        </div>
    );
}

export default StockControls;
