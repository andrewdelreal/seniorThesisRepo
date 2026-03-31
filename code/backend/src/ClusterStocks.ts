import DBAbstraction from './DBAbstraction';
import skmeans from 'skmeans'
import pl from 'nodejs-polars';

async function ClusterStocks(db: DBAbstraction, date: string, numClusters: number, dimensions: string[], isLog: boolean, isStandardized: number, exchanges: string[]): Promise<[pl.DataFrame, number[]] | null> {
    return new Promise(async (resolve, reject) => {
        try {
            // get the quotes of the specified date
            const quotes = await db.getQuotes(date, exchanges);
            
            if (!quotes) {
                console.error('No quotes found for clustering');
                reject(new Error('No quotes found for clustering'));
                return;
            }

            console.log(quotes.length + ' quotes found for clustering');
            console.log(quotes[0]);

            // make a df for easy data manipulation
            const dataFrame = pl.DataFrame(quotes, { columns: ['id', 'symbol', 'description', 'exch', 'date', 'last', 'volume', 'high', 'low', 'volatility', 'close', 'change', 'average_volume'] });
            let reducedDataFrame = dataFrame.select(dimensions);
            
            if (isLog) {
                reducedDataFrame = await applyLogTransformation(reducedDataFrame);
            }

            if (isStandardized) {
                reducedDataFrame = await applyStandardization(reducedDataFrame);
            }
            
            // convert the df to a format suitable for clustering
            const data = await reducedDataFrame.toRecords().map(row => Object.values(row).map(Number));
            
            // clustering results
            const clusterData = await KMeans(data, numClusters); // cluster into k groups

            if (!clusterData) {
                console.error('Clustering failed');
                reject(new Error('Clustering failed'));
                return;
            }

            // get cluster labels and add them to the original df
            
            reducedDataFrame = reducedDataFrame.withColumns(pl.Series('cluster', clusterData.idxs));
            reducedDataFrame = pl.concat([reducedDataFrame, dataFrame.select(['symbol', 'description', 'exch'])], {how: 'horizontal'});
            console.log(reducedDataFrame.head(10).toString());

            resolve([reducedDataFrame, clusterData.centroids]);
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

function applyLogTransformation(df: pl.DataFrame): pl.DataFrame {
    return df.withColumns(
        pl.all().add(1).log()
    );
}

function applyStandardization(df: pl.DataFrame): pl.DataFrame {
    return df.withColumns(
        pl.all().sub(pl.all().mean()).div(pl.all().std())
    );
}

export default ClusterStocks;