// this is what will call the db route, send the data, parse it to be something readable, then
// return the data  and send it to home, once the data changes, the Cluster Graph will handle the data
// event change, grab the actual points, and then

async function GetClusterData(date: string, numClusters: number, dimensionsCSV: string, isLog: string, isStandardized: string, exchanges: string[], dimensionReduction: string) {
    console.log(date, numClusters, dimensionsCSV, isLog, isStandardized, exchanges, dimensionReduction);
    const boolIsLog = isLog === 'true';
    const boolIsStandardized = isStandardized === 'true';

    try {
        const res: Response = await fetch('http://localhost:3000/api/cluster', { // get market data from backend
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'authorization': '' + localStorage.getItem('token'),
            },
            body: JSON.stringify({ date, numClusters, dimensionsCSV, boolIsLog, boolIsStandardized, exchanges, dimensionReduction }),  // using all desired parameters
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
            console.error('Failed to fetch cluster data:', res.status, json);
            throw new Error('Failed to fetch cluster data');
        }

        // return data from the backend
        return json.data; 
    } catch (err){
        console.log('Could not fetch cluster data');
    }
}

export default GetClusterData;