import { JSX, useState, useEffect } from 'react';
import Select from "react-select";
import styles from '../css/StockTableControls.module.css';

const columnOptions = [
    { label: 'Symbol', value: 'symbol'},
    { label: 'Exchange', value: 'exch'},
    { label: 'Last', value: 'last'},
    { label: 'Volume', value: 'volume'},
    { label: 'High', value: 'high'},
    { label: 'Low', value: 'low'},
    { label: 'Volatility', value: 'volatility'},
    { label: 'Change', value: 'change'},
    { label: 'Avg Volume', value: 'average_volume'},
    { label: 'Close', value: 'close'},
]

function StockTableControls({ handleColumnsChange, setTableDate }: { handleColumnsChange: (columns: { label: string; value: string }[]) => void; setTableDate: (date: string) => void }): JSX.Element {
    const [selectedColumns, setSelectedColumns] = useState<{ label: string; value: string }[]>(columnOptions);

    const now = new Date();

    // if the time is past 5:00 pm CST, show today's date, otherwise show yesterday's date as the default for the date input.
    if (now.getHours() < 17) {
        now.setDate(now.getDate() - 1);
    }

    const dateString = now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' });

    useEffect(() => {
        setTableDate(dateString);
    }, []);
    
    return (
        <div className={styles.clusterControls}>
            <form className={styles.formInline}>
                <div className={styles.formGroup}>
                    <label htmlFor="TableDate">Date</label>
                    <input
                        id='Date'
                        name='Date'
                        type='date'
                        defaultValue={dateString}
                        onChange={(e) => setTableDate(e.target.value)}
                        className='input'
                    />
                </div>
                <div className={styles.formGroup}>
                    <label htmlFor="ColumnSelect">Columns</label>
                    <Select 
                        id='ColumnSelect'
                        name='ColumnSelect'
                        options={columnOptions}
                        isMulti
                        classNamePrefix='select'
                        className={styles.select}
                        isSearchable={false}
                        onChange={(value) => {
                            handleColumnsChange(value as { label: string; value: string }[]);
                            setSelectedColumns(value as { label: string; value: string }[]);
                        }}
                        defaultValue={columnOptions}
                        value={selectedColumns}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="ResetColumns"></label>
                    <button type="button" onClick={() => {
                        handleColumnsChange(columnOptions)
                        setSelectedColumns(columnOptions);
                        }}
                    >
                        Reset
                    </button>
                </div>
            </form>
        </div>
    )
};

export default StockTableControls;