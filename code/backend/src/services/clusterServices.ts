import DBAbstraction from "../DBAbstraction";
import ApiError from "../errors/ApiError";
import skmeans from 'skmeans'
import pl from 'nodejs-polars';
import { UMAP } from 'umap-js';
import { PCA } from 'ml-pca';

export async function cluster(
    date: string, 
    numClusters: number, 
    dimensions: string[], 
    isLog: boolean, 
    isStandardized: boolean, 
    exchanges: string[], 
    dimensionReduction: string
) {
    const db: DBAbstraction = new DBAbstraction();

    // get the cluster data
    const result = await ClusterStocks(
        db, 
        date, 
        numClusters, 
        dimensions, 
        isLog, 
        isStandardized, 
        exchanges, 
        dimensionReduction
    );

    if (!result) {
        throw new ApiError(
            500,
            'CLUSTERING_FAILURE',
            'Failed to cluster stocks'
        );
    }

    // get the cluster df and centroid data
    const clusterDF: pl.DataFrame = result.reducedDataFrame;
    const centroids: number[][] = result.centroids;

    // return cluster data as json along with the centroids and dimensions used for clustering
    console.log('Clustering successful, returning data');
    return {points: clusterDF.toRecords(), centroids: centroids, dimensions: dimensions};
}

async function ClusterStocks(
    db: DBAbstraction, 
    date: string, 
    numClusters: number, 
    dimensions: string[], 
    isLog: boolean, 
    isStandardized: boolean, 
    exchanges: string[], 
    dimensionReduction: string
) {
    // get the quotes of the specified date
    const quotes = await db.getQuotes(date, exchanges);
    
    if (!quotes) {
        throw new ApiError(
            500,
            'DATABASE_FAILURE',
            'Failed to fetch quotes from database for clustering'
        );
    }

    if (quotes.length === 0) {
        throw new ApiError(
            404,
            'NO_DATA',
            'No stock data found for the specified date and exchanges'
        );
    }

    console.log(quotes.length + ' quotes found for clustering');

    // make a df for easy data manipulation
    let dataFrame: pl.DataFrame = pl.DataFrame(quotes, { columns: ['id', 'symbol', 'description', 'exch', 'date', 'last', 'volume', 'high', 'low', 'volatility', 'close', 'change', 'average_volume'] });
    
    // apply transformations if necessary
    if (isLog) {
        dataFrame = await applyLogTransformation(dataFrame);
    }

    console.log(dataFrame.head());

    if (isStandardized) {
        dataFrame = await applyStandardization(dataFrame);
    }

    console.log(dataFrame.head());

    let reducedDataFrame: pl.DataFrame = dataFrame.select(...dimensions);
    
    // convert the df to a format suitable for clustering
    const data = await reducedDataFrame.toRecords().map(row => Object.values(row).map(Number));
    
    // clustering results
    const clusterData = skmeans(data, numClusters, 'kmpp'); // cluster into k groups

    if (!clusterData) {
        throw new ApiError(
            500,
            'CLUSTERING_FAILURE',
            'Failed to cluster stocks'
        );
    }

    // get cluster labels and add them to the original df
    reducedDataFrame = reducedDataFrame.withColumns(pl.Series('cluster', clusterData.idxs));
    reducedDataFrame = pl.concat([reducedDataFrame, dataFrame.select(...['symbol', 'description', 'exch'])], {how: 'horizontal'});

    // dimension reduction for dimensions.length > 2 for visual purposes
    if (dimensions.length > 2) {
        reducedDataFrame = await DimensionReduction(reducedDataFrame, dimensions, dimensionReduction);
    }

    return {reducedDataFrame, centroids: clusterData.centroids};
};

async function DimensionReduction(df: pl.DataFrame, dimensions: string[], dimensionReduction: string) {
    const subFrame: pl.DataFrame = df.select(...dimensions);
    
    // turn subFrame into only numeric values
    const values: number[][] = subFrame.toRecords().map(row => Object.values(row).map(Number));

    console.log('Starting dimension reduction');

    let reducedValues!: number[][];

    if (dimensionReduction === 'PCA') { // reduce dimensions to 2 using PCA
        const pca: PCA = new PCA(values);
        reducedValues = pca.predict(values, { nComponents: 2 }).to2DArray();

        if (!reducedValues) {
            throw new ApiError(
                500,
                'DIMENSION_REDUCTION_FAILURE',
                'Failed to reduce dimensions using PCA'
            );
        }
    } else if (dimensionReduction === 'UMAP') {// reduce dimensions to 2 using UMAP
        const umap: UMAP = new UMAP({ nComponents: 2, nNeighbors: 15, minDist: 0.1 });
        reducedValues = umap.fit(values);

        if (!reducedValues) {
            throw new ApiError(
                500,
                'DIMENSION_REDUCTION_FAILURE',
                'Failed to reduce dimensions using UMAP'
            );
        }
    }

    // remove the original dimensions and add the reduced dimensions under the alias 'x' and 'y'
    const reducedDF: pl.DataFrame = pl.DataFrame(reducedValues, { columns: ['x', 'y']});
    const finalDF: pl.DataFrame = pl.concat([reducedDF, df.drop(dimensions)], {how: 'horizontal'});

    console.log('Successful dimension reduction');
    return finalDF;
}

async function applyLogTransformation(df: pl.DataFrame) {
    return df.withColumns(...[
        pl.col('volume').add(1).log(),
        pl.col('average_volume').add(1).log(),
        pl.col('last').add(1).log(),
        pl.col('close').add(1).log(),
        pl.col('high').add(1).log(),
        pl.col('low').add(1).log(),
    ]);
}

async function applyStandardization(df: pl.DataFrame) {
    const numericCols = [
        'volume',
        'average_volume',
        'last',
        'close',
        'high',
        'low',
        'volatility',
        'change'
    ].filter(col => df.columns.includes(col));

    return df.withColumns(...
        numericCols.map(col =>
            pl.col(col)
              .sub(pl.col(col).mean())
              .div(pl.col(col).std())
              .alias(col)
        )
    );
}