import express from 'express';
import path from 'path';
import DBAbstraction from './DBAbstraction';

const app = express();

const dbPath = path.join(__dirname, '..', 'data', 'database.db');

const PORT = process.env.PORT || 3000;

const db = new DBAbstraction(dbPath);

app.get('/', (req, res) => {
    res.send('Hello World!');
})

db.init()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    }).catch((err) => {
        console.error('Failed to initialize database:', err);
    });

