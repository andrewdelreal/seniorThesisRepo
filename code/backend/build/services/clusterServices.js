"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cluster = cluster;
const DBAbstraction_1 = __importDefault(require("../DBAbstraction"));
const ApiError_1 = __importDefault(require("../errors/ApiError"));
const skmeans_1 = __importDefault(require("skmeans"));
const nodejs_polars_1 = __importDefault(require("nodejs-polars"));
const umap_js_1 = require("umap-js");
const ml_pca_1 = require("ml-pca");
function cluster(date, numClusters, dimensions, isLog, isStandardized, exchanges, dimensionReduction) {
    return __awaiter(this, void 0, void 0, function* () {
        const db = new DBAbstraction_1.default();
        // get the cluster data
        const result = yield ClusterStocks(db, date, numClusters, dimensions, isLog, isStandardized, exchanges, dimensionReduction);
        if (!result) {
            throw new ApiError_1.default(500, 'CLUSTERING_FAILURE', 'Failed to cluster stocks');
        }
        // get the cluster df and centroid data
        const clusterDF = result.reducedDataFrame;
        const centroids = result.centroids;
        // return cluster data as json along with the centroids and dimensions used for clustering
        console.log('Clustering successful, returning data');
        return { points: clusterDF.toRecords(), centroids: centroids, dimensions: dimensions };
    });
}
function ClusterStocks(db, date, numClusters, dimensions, isLog, isStandardized, exchanges, dimensionReduction) {
    return __awaiter(this, void 0, void 0, function* () {
        // get the quotes of the specified date
        const quotes = yield db.getQuotes(date, exchanges);
        if (!quotes) {
            throw new ApiError_1.default(500, 'DATABASE_FAILURE', 'Failed to fetch quotes from database for clustering');
        }
        console.log(quotes.length + ' quotes found for clustering');
        // make a df for easy data manipulation
        const dataFrame = nodejs_polars_1.default.DataFrame(quotes, { columns: ['id', 'symbol', 'description', 'exch', 'date', 'last', 'volume', 'high', 'low', 'volatility', 'close', 'change', 'average_volume'] });
        let reducedDataFrame = dataFrame.select(...dimensions);
        // apply transformations if necessary
        if (isLog) {
            reducedDataFrame = yield applyLogTransformation(reducedDataFrame);
        }
        if (isStandardized) {
            reducedDataFrame = yield applyStandardization(reducedDataFrame);
        }
        // convert the df to a format suitable for clustering
        const data = yield reducedDataFrame.toRecords().map(row => Object.values(row).map(Number));
        // clustering results
        const clusterData = (0, skmeans_1.default)(data, numClusters, 'kmpp'); // cluster into k groups
        if (!clusterData) {
            throw new ApiError_1.default(500, 'CLUSTERING_FAILURE', 'Failed to cluster stocks');
        }
        // get cluster labels and add them to the original df
        reducedDataFrame = reducedDataFrame.withColumns(nodejs_polars_1.default.Series('cluster', clusterData.idxs));
        reducedDataFrame = nodejs_polars_1.default.concat([reducedDataFrame, dataFrame.select(...['symbol', 'description', 'exch'])], { how: 'horizontal' });
        // dimension reduction for dimensions.length > 2 for visual purposes
        if (dimensions.length > 2) {
            reducedDataFrame = yield DimensionReduction(reducedDataFrame, dimensions, dimensionReduction);
        }
        return { reducedDataFrame, centroids: clusterData.centroids };
    });
}
;
function DimensionReduction(df, dimensions, dimensionReduction) {
    return __awaiter(this, void 0, void 0, function* () {
        const subFrame = df.select(...dimensions);
        // turn subFrame into only numeric values
        const values = subFrame.toRecords().map(row => Object.values(row).map(Number));
        console.log('Starting dimension reduction');
        let reducedValues;
        if (dimensionReduction === 'PCA') { // reduce dimensions to 2 using PCA
            const pca = new ml_pca_1.PCA(values);
            reducedValues = pca.predict(values, { nComponents: 2 }).to2DArray();
            if (!reducedValues) {
                throw new ApiError_1.default(500, 'DIMENSION_REDUCTION_FAILURE', 'Failed to reduce dimensions using PCA');
            }
        }
        else if (dimensionReduction === 'UMAP') { // reduce dimensions to 2 using UMAP
            const umap = new umap_js_1.UMAP({ nComponents: 2, nNeighbors: 15, minDist: 0.1 });
            reducedValues = umap.fit(values);
            if (!reducedValues) {
                throw new ApiError_1.default(500, 'DIMENSION_REDUCTION_FAILURE', 'Failed to reduce dimensions using UMAP');
            }
        }
        // remove the original dimensions and add the reduced dimensions under the alias 'x' and 'y'
        const reducedDF = nodejs_polars_1.default.DataFrame(reducedValues, { columns: ['x', 'y'] });
        const finalDF = nodejs_polars_1.default.concat([reducedDF, df.drop(dimensions)], { how: 'horizontal' });
        console.log('Successful dimension reduction');
        return finalDF;
    });
}
function applyLogTransformation(df) {
    return __awaiter(this, void 0, void 0, function* () {
        return df.withColumns(nodejs_polars_1.default.all().add(1).log());
    });
}
function applyStandardization(df) {
    return __awaiter(this, void 0, void 0, function* () {
        return df.withColumns(nodejs_polars_1.default.all().sub(nodejs_polars_1.default.all().mean()).div(nodejs_polars_1.default.all().std()));
    });
}
