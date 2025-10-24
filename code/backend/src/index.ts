import express from 'express';
import path from 'path';
import DBAbstraction from './DBAbstraction';
import cors from 'cors';
import morgan from 'morgan';

const app = express();

const PORT = 3000;

const dbPath = path.join(__dirname, '..', 'data', 'database.db');
const db = new DBAbstraction(dbPath);

app.use(cors());
app.use(morgan('dev'));

app.use(express.static('public'))

app.get('/', (req, res) => {
    res.send('Hello World!');
});

db.init()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    }).catch((err) => {
        console.error('Failed to initialize database:', err);
    });

