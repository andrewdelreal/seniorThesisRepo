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
exports.clusterController = void 0;
const ApiError_1 = __importDefault(require("../errors/ApiError"));
const clusterServices_1 = require("../services/clusterServices");
const clusterController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { date, numClusters, dimensionsCSV, boolIsLog, boolIsStandardized, exchanges, dimensionReduction } = req.body;
    if (!date || !numClusters || !dimensionsCSV || boolIsLog === undefined || boolIsStandardized === undefined || !exchanges || !dimensionReduction) {
        throw new ApiError_1.default(400, "INVALID_REQUEST", "Missing required parameters");
    }
    const data = yield (0, clusterServices_1.cluster)(date, numClusters, dimensionsCSV, boolIsLog, boolIsStandardized, exchanges, dimensionReduction);
    res.status(200).json({
        success: true,
        data,
    });
});
exports.clusterController = clusterController;
