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
const skmeans_1 = __importDefault(require("skmeans"));
const nodejs_polars_1 = __importDefault(require("nodejs-polars"));
function ClusterStocks(db, date, numClusters, dimensions, isLog, isStandardized, exchanges) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                // get the quotes of the specified date
                const quotes = yield db.getQuotes(date, exchanges);
                if (!quotes) {
                    console.error('No quotes found for clustering');
                    reject(new Error('No quotes found for clustering'));
                    return;
                }
                console.log(quotes.length + ' quotes found for clustering');
                console.log(quotes[0]);
                // make a df for easy data manipulation
                const dataFrame = nodejs_polars_1.default.DataFrame(quotes, { columns: ['id', 'symbol', 'description', 'exch', 'date', 'last', 'volume', 'high', 'low', 'volatility', 'close', 'change', 'average_volume'] });
                let reducedDataFrame = dataFrame.select(dimensions);
                if (isLog) {
                    reducedDataFrame = yield applyLogTransformation(reducedDataFrame);
                }
                if (isStandardized) {
                    reducedDataFrame = yield applyStandardization(reducedDataFrame);
                }
                // convert the df to a format suitable for clustering
                const data = yield reducedDataFrame.toRecords().map(row => Object.values(row).map(Number));
                // clustering results
                const clusterData = yield KMeans(data, numClusters); // cluster into k groups
                if (!clusterData) {
                    console.error('Clustering failed');
                    reject(new Error('Clustering failed'));
                    return;
                }
                // get cluster labels and add them to the original df
                reducedDataFrame = reducedDataFrame.withColumns(nodejs_polars_1.default.Series('cluster', clusterData.idxs));
                reducedDataFrame = nodejs_polars_1.default.concat([reducedDataFrame, dataFrame.select(['symbol', 'description', 'exch'])], { how: 'horizontal' });
                console.log(reducedDataFrame.head(10).toString());
                resolve([reducedDataFrame, clusterData.centroids]);
            }
            catch (err) {
                console.error('Error during clustering:', err);
                reject(err);
                return;
            }
        }));
    });
}
function KMeans(data, k) {
    return __awaiter(this, void 0, void 0, function* () {
        // run the K-means algorithm and return the clusters
        return new Promise((resolve, reject) => {
            try {
                const clusters = (0, skmeans_1.default)(data, k, "kmpp");
                console.log(clusters);
                resolve(clusters);
            }
            catch (err) {
                console.error('Error during K-means clustering:', err);
                reject(err);
            }
        });
    });
}
function applyLogTransformation(df) {
    return df.withColumns(nodejs_polars_1.default.all().add(1).log());
}
function applyStandardization(df) {
    return df.withColumns(nodejs_polars_1.default.all().sub(nodejs_polars_1.default.all().mean()).div(nodejs_polars_1.default.all().std()));
}
exports.default = ClusterStocks;
