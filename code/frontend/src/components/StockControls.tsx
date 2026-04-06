import { JSX, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import Select from "react-select";
import styles from '../css/StockControls.module.css';
import { VirtualizedMenuList } from './VirtualizedMenuList';

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
    { label: 'NASDAQ', value: 'nasdaq' },
    { label: 'NYSE', value: 'nyse' },
    { label: 'AMEX', value: 'amex' },
];

const intervalOptions = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
];

interface Option {
  value: string;
  label: string;
}

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

    const navigate = useNavigate();

    useEffect(() => {
        const getTickers = async () => {
            const response = await fetch('http://localhost:3000/api/tickers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': '' + localStorage.getItem('token'),
                },
                body: JSON.stringify({exchange})
            });

            const json = await response.json();

            if (!response.ok || !json.success) {
                navigate('/login');
                throw new Error(`${json.code}: ${json.message}`);
            }

            setTickers(json.data);
        };

        getTickers();
    }, [exchange]);

    return (
        <div className={styles.stockControls}>
            {/* Exchange dropdown */}
             <Select
                value={exchangeOptions.find((opt) => opt.value === exchange)}
                onChange={(selected) => setExchange(selected ? selected.value : '')}
                options={exchangeOptions}
                classNamePrefix='select'
                className={styles.select}
                isSearchable={false}
            />

            <Select<Option>
                components={{ MenuList: VirtualizedMenuList }}
                value={
                    tickers
                    .map(t => ({ value: t.symbol, label: `${t.name} (${t.symbol})` }))
                    .find(o => o.value === symbol) || null
                }
                onChange={(selected) => {
                    setSymbol(selected?.value ?? "");
                }}
                options={tickers.map(t => ({
                    value: t.symbol,
                    label: `${t.name} (${t.symbol})`
                }))}
                className={styles.select}
                isSearchable
            />  

            {/* Interval dropdown */}
            <Select
                value={intervalOptions.find((opt) => opt.value === interval)}
                onChange={(selected) => setInterval(selected ? selected.value : '')}
                options={intervalOptions}
                classNamePrefix='select'
                className={styles.select}
                isSearchable={false}
            />

            {/* Start date */}
            <input
                type='date'
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className='input'
            />

            {/* End date */}
            <input
                type='date'
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className='input'
            />
        </div>
    );
}

export default StockControls;
