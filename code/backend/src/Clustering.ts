import DBAbstraction from './DBAbstraction';
import skmeans from 'skmeans'
import pl from 'nodejs-polars';

async function ClusterStocks(db: DBAbstraction, date: string, dimensions: string[]): Promise<[pl.DataFrame, number[]] | null> {
    return new Promise(async (resolve, reject) => {
        try {
            // get the quotes of the specified date
            const quotes = await db.getQuotes(date);
            
            if (!quotes) {
                console.error('No quotes found for clustering');
                reject(new Error('No quotes found for clustering'));
                return;
            }

            console.log(quotes.length + ' quotes found for clustering');
            // console.log(quotes[0]);

            // make a df for easy data manipulation
            const dataFrame = pl.DataFrame(quotes, { columns: ['id', 'symbol', 'description', 'exch', 'date', 'last', 'volume', 'change_percent', 'high', 'low', 'volatility', 'close', 'change', 'average_volume'] });
            const reducedDataFrame = dataFrame.select(dimensions);

            // convert the df to a format suitable for clustering
            const data = reducedDataFrame.toRecords().map((record: any) => [Number(record.change), Number(record.volatility)]);
            console.log(data);

            // clustering results
            const clusterData = await KMeans(data, 10); // cluster into 10 groups

            if (!clusterData) {
                console.error('Clustering failed');
                reject(new Error('Clustering failed'));
                return;
            }

            // get cluster labels and add them to the original df
            const finalDataFrame = reducedDataFrame.withColumns(pl.Series('cluster', clusterData.idxs));
            console.log(finalDataFrame.head(10).toString());

            resolve([finalDataFrame, clusterData.centroids]);
        } catch (err) {
            console.error('Error during clustering:', err);
            reject(err);
            return;
        }
    });
}

async function KMeans(data: any, k: number): Promise<any> {
    // run the K-means algorithm and return the clusters
    return new Promise((resolve, reject) => { 
        try {
            const clusters = skmeans(data, k, "kmpp");
            console.log(clusters);
            resolve(clusters);
        } catch (err) {
            console.error('Error during K-means clustering:', err);
            reject(err);
        }
    });
}

export default ClusterStocks;