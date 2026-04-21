import express, { Application } from 'express';
import path from 'path';
import DBAbstraction from './DBAbstraction';
import cors from 'cors';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

import { startStockUpdateJobs } from './jobs/dailyStockUpdate.job';

import tradierRoutes from './routes/tradierRoutes';
import tickerRoutes from './routes/tickerRoutes';
import loginRoutes from './routes/loginRoutes';
import clusterRoutes from './routes/clusterRoutes';
import databaseRoutes from './routes/databaseRoutes';

import { errorHandler } from './middleware/errorHandler';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app: Application = express();

const PORT: number = 3000;

const db: DBAbstraction = new DBAbstraction();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'))

app.use(tradierRoutes);
app.use(tickerRoutes);
app.use(loginRoutes);
app.use(clusterRoutes);
app.use(databaseRoutes);
app.use(errorHandler);

startStockUpdateJobs();

db.init()
    .then(() => {
        app.listen(PORT, async () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    }).catch((err) => {
        console.error('Failed to initialize database:', err);
    });
