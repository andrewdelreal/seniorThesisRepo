import { JSX, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import DataTable from "react-data-table-component";
import styles from "../css/StockTable.module.css";
import GetStockTableData from '../hooks/GetStockTableData';

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

const columns = [
    {
        name: "Symbol",
        selector: (row: Stock) => row.symbol,
        sortable: true,
    },
    { name: "Exchange",
        selector: (row: Stock) => row.exch,
        sortable: true,
    },
    {
        name: "Last",
        selector: (row: Stock) => row.last,
        sortable: true,
    },
    {
        name: "Volume",
        selector: (row: Stock) => row.volume,
        sortable: true,
    },
    {
        name: "High",
        selector: (row: Stock) => row.high,
        sortable: true,
    },
    {
        name: "Low",
        selector: (row: Stock) => row.low,
        sortable: true,
    },
    {
        name: "Volatility",
        selector: (row: Stock) => row.volatility,
        sortable: true,
    },
    {
        name: "Change",
        selector: (row: Stock) => row.change,
        sortable: true,
    },
    {
        name: "Avg Volume",
        selector: (row: Stock) => row.average_volume,
        sortable: true,
    },
    {
        name: "Close",
        selector: (row: Stock) => row.close,
        sortable: true,
    },
];

function StockTable({ date, columnOptions }: { date: string; columnOptions: { label: string; value: string }[] }): JSX.Element {
    const [tableData, setData] = useState<Stock[]>([
        { symbol: "AAPL", exch: "Q", last: 175, volume: 1000, high: 178, low: 169, volatility: 2.5, change: 5, average_volume: 1500, close: 175 },
        { symbol: "TSLA", exch: "Q", last: 260, volume: 2000, high: 4000, low: 248, volatility: 3.0, change: 12, average_volume: 2500, close: 260 },
    ]);
    const [columnsSelected, setColumnsSelected] = useState(columns);

    useEffect(() => {
        const fetchData = async () => {
            const data = await GetStockTableData(date);

            if (data === undefined) {
                console.error('Failed to fetch stock table data');
                return;
            }

            setData(data);
        }

        fetchData();
    }, [date]);

    // if the column name changes, update the columns used
    useEffect(() => {
        if (columnOptions.length === 0) {
            setColumnsSelected(columns);
            return;
        }

        const newColumns = columns.filter((column) => {
            return columnOptions.find((option) => option.label === column.name);
        });
        setColumnsSelected(newColumns);
    }, [columnOptions]);

    

    return (
        <div className={styles.tableContainer}>
            <h3>Stock Data for {date}</h3>

            <DataTable
                columns={columnsSelected}
                data={tableData}
                pagination
                highlightOnHover
                striped
            />
        </div>
    );
}

export default StockTable;