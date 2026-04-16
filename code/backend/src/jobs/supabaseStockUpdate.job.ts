import { DailyStockUpdate } from '../services/dailyStockService';

DailyStockUpdate().then(() => {
    console.log('Job completed');
    process.exit(0);
})
.catch((err) => {
    console.error(err);
    process.exit(1);
});