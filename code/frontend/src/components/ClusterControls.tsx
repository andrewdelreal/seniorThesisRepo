import { JSX, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import Select from "react-select";
import styles from '../css/ClusterControls.module.css';
import GetClusterData from '../hooks/GetClusterData';

interface ClusterControlsProps {
    setData: (value: any) => void;
    setDimensions: (value: string[]) => void;
    setDate: (value: string) => void;
    setIsLog: (value: boolean) => void;
    setIsStandardized: (value: boolean) => void; 
}

const numClustersLength = 18;

// add multi dimensions
// check to see the no data once doing log and standardized
// fix graph labels

const trueFalseOptions = [
    { label: 'True', value: 'true'},
    { label: 'False', value: 'false'}
];

const dimensionOptions = [
    { label: 'Change', value: 'change'},
    { label: 'Volatility', value: 'volatility'},
    { label: 'Close', value: 'close'},
    { label: 'High', value: 'high'},
    { label: 'Low', value: 'low'},
    { label: 'Volume', value: 'volume'},
    { label: 'Average Volume', value: 'average_volume'},
    { label: 'Last', value: 'last'},
];

const numClustersOptions = Array.from({ length: numClustersLength}, (_, i) => i + 3).map(num => ({ label: num.toString(), value: num}));

function ClusterControls({
    setData,
    setDimensions,
    setDate,
    setIsLog,
    setIsStandardized
}: ClusterControlsProps): JSX.Element {
    const [selectedDimensions, setSelectedDimensions] = useState<any[]>([
        dimensionOptions[0],
        dimensionOptions[1]
    ]);

    const now = new Date;
    now.setHours(now.getHours() - 15);
    const defaultDate = now.toLocaleDateString('en-CA');

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const form = event.currentTarget.elements;

        const dimensions = selectedDimensions.map(d => d.value).join(',');
        const date = (form.namedItem('Date') as HTMLInputElement).value;
        const isLog = (form.namedItem('IsLog') as HTMLInputElement).value;
        const isStandardized = (form.namedItem('IsStandardized') as HTMLInputElement).value;
        const numClusters = (form.namedItem('NumClusters') as HTMLInputElement).value;

        const data = await GetClusterData(date, parseInt(numClusters), dimensions, isLog, isStandardized);
        setData(data);
    }

    return (
        <div className={styles.clusterControls}>
            <form className={styles.formInline} onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                    <label htmlFor="DimensionsSelect">Dimensions</label>
                    <Select 
                        id='DimensionsSelect'
                        name='DimensionsSelect'
                        options={dimensionOptions}
                        isMulti
                        classNamePrefix='select'
                        className={styles.select}
                        isSearchable={false}
                        value={selectedDimensions}
                        onChange={(value) => setSelectedDimensions(value as any[])}
                        defaultValue={[dimensionOptions[0], dimensionOptions[1]]}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor={"Date"}>Date</label>
                    <input
                        id='Date'
                        name='Date'
                        type='date'
                        defaultValue={defaultDate}
                        className='input'
                    />
                </div>
                {/* add num clusters */}

                <div className={styles.formGroup}>
                    <label htmlFor={"IsLog"}>Logarithmic Scale?</label>
                    <Select
                        id='IsLog'
                        name='IsLog'
                        options={trueFalseOptions}
                        classNamePrefix='select'
                        className={styles.select}
                        isSearchable={false}
                        defaultValue={trueFalseOptions[0]}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor={"IsStandardized"}>Standardized Scale?</label>
                    <Select
                        id='IsStandardized'
                        name='IsStandardized'
                        options={trueFalseOptions}
                        classNamePrefix='select'
                        className={styles.select}
                        isSearchable={false}
                        defaultValue={trueFalseOptions[0]}
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor={"NumClusters"}>Number of Clusters</label>
                    <Select
                        id='NumClusters'
                        name='NumClusters'
                        options={numClustersOptions}
                        classNamePrefix='select'
                        className={styles.select}
                        isSearchable={false}
                        defaultValue={numClustersOptions.find(option => option.value === 10)}
                    />
                </div>
                
                <label htmlFor={"SubmitButton"}></label>
                <button type="submit" id="SubmitButton" name="SubmitButton">Submit</button>
            </form>
        </div>
    );
}

export default ClusterControls;
