import { JSX, useState } from 'react';
import ClusterGraph from '../components/ClusterGraph';
import ClusterControls from '../components/ClusterControls';

function Clustering(): JSX.Element {
    const [data, setData] = useState<any>(null);
    const [dimensions, setDimensions] = useState<string[]>([]); 
    const [date, setDate] = useState<string | null>(null);
    const [isLog, setIsLog] = useState<boolean | null>(null);
    const [isStandardized, setIsStandardized] = useState<boolean | null>(null);

    // Need components
    // Dimensions Box select
    // date
    // Option for log calculation / standardize
    // Need the graph as well.

    // data will be here. On a button click, if the options are valid, 
    // it will attempt to cluster. It should update the data in here, and 
    // thus update the graph data, and the data should be in a nice format.
    return (
        <div className='text-center'>
            <h1 className='display-5 fw-bold text-purple mb-3'>Clustering</h1>
            <p className='lead text-muted mb-4'>
                {/*Center text */}
            </p>
            <ClusterControls
                setData={setData} 
                setDimensions={setDimensions} 
                setDate={setDate}
                setIsLog={setIsLog}
                setIsStandardized={setIsStandardized}
            />

            <ClusterGraph data={data}></ClusterGraph>
      
        </div>
    )
}

export default Clustering;