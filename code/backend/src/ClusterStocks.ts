import DBAbstraction from './DBAbstraction';
import skmeans from 'skmeans'
import pl from 'nodejs-polars';
import { UMAP } from 'umap-js';
import { PCA } from 'ml-pca';

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

            if (dimensions.length > 2) {
                reducedDataFrame = await DimensionReduction(reducedDataFrame, dimensions);
            }

            console.log(reducedDataFrame.head(10).toString());

            resolve([reducedDataFrame, clusterData.centroids]);
        } catch (err) {
            console.error('Error during clustering:', err);
            reject(err);
            return;
        }
    });
}

// get rid of this function
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

async function DimensionReduction(df: pl.DataFrame, dimensions: string[]): Promise<pl.DataFrame> {
    return new Promise((resolve, reject) => {
        try {
            const subFrame: pl.DataFrame = df.select(...dimensions);
            
            // turn subFrame into only numeric values
            const values: number[][] = subFrame.toRecords().map(row => Object.values(row).map(Number));

            console.log('Starting dimension reduction');

            // reduce dimensions to 2 using UMAP
            // const umap: UMAP = new UMAP({ nComponents: 2, nNeighbors: 15, minDist: 0.1 });
            // const reducedValues: number[][] = umap.fit(values);

            const pca = new PCA(values);
            const reducedValues: number[][] = pca.predict(values, { nComponents: 2 }).to2DArray();

            // remove the original dimensions and add the reduced dimensions under the alias 'x' and 'y'
            const reducedDF: pl.DataFrame = pl.DataFrame(reducedValues, { columns: ['x', 'y']});
            const finalDF: pl.DataFrame = pl.concat([reducedDF, df.drop(dimensions)], {how: 'horizontal'});

            console.log('Successful dimension reduction');
            resolve(finalDF);
        } catch (err) {
            console.error('Error during dimension reduction:', err);
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