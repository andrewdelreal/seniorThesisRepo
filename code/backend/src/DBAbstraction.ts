import * as sqlite3 from 'sqlite3';
import { inherits } from 'util';

class DBAbstraction {
    filePath: string;
    db!: sqlite3.Database;

    constructor(filePath: string) {
        this.filePath = filePath;
    }

    init() {
        return new Promise<void>((resolve, reject) => { 
            this.db = new sqlite3.Database(this.filePath, async (err) => { 
                if(err) { 
                    reject(err); 
                } else { 
                    try { 
                        await this.createTables(); 
                        resolve(); 
                    } catch (err) { 
                        reject(err) 
                    } 
                } 
            }); 
        }); 
    }

    createTables(): Promise<void> {
        const sql: string = `
            CREATE TABLE IF NOT EXISTS "Test" (
                "id" INTEGER PRIMARY KEY
            );
        `;

        return new Promise<void>((resolve, reject) => { 
            this.db.exec(sql, (err) => {                 
                if(err) { 
                    reject(err); 
                } else { 
                    resolve(); 
                } 
            }); 
        }); 
    }
}

export default DBAbstraction;