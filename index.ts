import RocksDB from 'rocksdb';

class RocksDbCache {
    #cache: RocksDB;
    #cacheHandle: Promise<void>;

    constructor(path: string) {
        this.#cache = new RocksDB(path);
        this.#cacheHandle = this.#openDb(this.#cache);
    }

    #openDb(db: RocksDB): Promise<void> {
        return new Promise(function (resolve, reject) {
            db.open((openError) => {
                if (openError) {
                    return reject('Error opening the database:' + openError);
                }
                resolve();
            });
        });
    }

    #encodeJSON(obj: any): Buffer {
        return Buffer.from(JSON.stringify(obj));
    }

    #decodeJSON(buffer: Buffer): any {
        return JSON.parse(buffer.toString());
    }

    async close(): Promise<boolean> {
        await this.#cacheHandle;
        return new Promise((resolve, reject) => {
            this.#cache.close((closeError) => {
                if (closeError) {
                    return reject(closeError);
                }
                resolve(true);
            });
        });
    }

    async get(key: string): Promise<any> {
        await this.#cacheHandle;
        return new Promise((resolve, reject) => {
            this.#cache.get(key, (getError, value) => {
                if (getError) {
                    if (getError.message === 'NotFound: ') {
                        return resolve(undefined);
                    }
                    return reject(getError);
                }
                resolve(this.#decodeJSON(value));
            });
        });
    }

    async has(key: string): Promise<boolean> {
        await this.#cacheHandle;
        return new Promise((resolve, reject) => {
            this.#cache.get(key, (getError, value) => {
                if (getError) {
                    if (getError.message === 'NotFound: ') {
                        return resolve(false);
                    }
                    return reject(getError);
                }
                resolve(true);
            });
        });
    }

    async set(key: string, value: any): Promise<any> {
        await this.#cacheHandle;
        return new Promise((resolve, reject) => {
            this.#cache.put(key, this.#encodeJSON(value), (putError) => {
                if (putError) {
                    return reject(putError);
                }
                resolve(value);
            });
        });
    }

    async delete(key: string): Promise<boolean> {
        await this.#cacheHandle;
        return new Promise((resolve, reject) => {
            this.#cache.del(key, (deleteError) => {
                if (deleteError) {
                    return reject(deleteError);
                }
                resolve(true);
            });
        });
    }

    async clear(): Promise<void> {
        await this.#cacheHandle;
        const keys = await this.keys();
        for (let key of keys) await this.delete(key);
    }

    async entries(): Promise<[string, any][]> {
        await this.#cacheHandle;
        const keys = await this.keys();
        const entries: [string, any][] = [];
        for (let key of keys) entries.push([key, await this.get(key)]);
        return entries;
    }

    async forEach(f: (value: any, key: string, self: RocksDbCache) => void): Promise<void> {
        await this.#cacheHandle;
        const keys = await this.keys();
        for (let key of keys) await f(await this.get(key), key, this);
    }

    async values(): Promise<any[]> {
        await this.#cacheHandle;
        const keys = await this.keys();
        const values: any[] = [];
        for (let key of keys) values.push(await this.get(key));
        return values;
    }

    async keys(): Promise<string[]> {
        await this.#cacheHandle;
        const db = this.#cache;
        const keyStream = db.createKeyStream();
        return new Promise(function (resolve, reject) {
            let keys: string[] = [];
            keyStream.on('data', (key) => { keys.push(key) });
            keyStream.on('error', (streamError) => { reject(streamError); });
            keyStream.on('end', () => { resolve(keys) });
        });
    }
}
export default RocksDbCache;