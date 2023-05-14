import levelup from 'levelup';
import RocksDB from 'rocksdb';
// import { compress as lz4compress, uncompress as lz4uncompress } from 'lz4-napi';
// import { Sia, DeSia, constructors as builtins } from '@valentech/sializer';
import { Sia, DeSia, SiaCompressed, DeSiaCompressed } from '@valentech/sializer';
import PQueue from 'p-queue';
import memoize from 'fast-memoize';
function limitConcurrency_(asyncFunc, concurrency = 1) {
    const queue = new PQueue({ concurrency });
    return function (...args) {
        return queue.add(() => asyncFunc(...args));
    };
}
const limitConcurrency = memoize(limitConcurrency_);
import LRUCache from 'lru-cache';
const textDecoder = new TextDecoder();
// import { Buffer as BufferShim } from 'buffer/';
const BufferClass = Buffer //;typeof Buffer === "undefined" ? BufferShim : Buffer;
// defining additional types to be serializable:
//   {
//     constructor: RegExp, // The custom class you want to support
//     code: 7, // A unique positive code point for this class, the smaller the better
//     args: (item) => [item.source, item.flags], // A function to serialize the instances of the class
//     build(source, flags) { // A function for restoring instances of the class
//       return new RegExp(source, flags);
//     },
//   },
function coerceKey(key) {
    if (typeof key === 'string') {
        return key;
    } else if (typeof key === 'number') {
        return String(key);
    } else {
        throw new TypeError(`Invalid type of key: ${key}`);
    }
}
class RocksDbCache {
    #cache = undefined;
    #cacheHandle = undefined;
    #sia = undefined;
    #desia = undefined;
    #reverse = false;
    #reverseClone = undefined;
    #lruCache = undefined; // experimental
    #path = undefined;
    #subKey = undefined;
    #subKeys = undefined;
    #keyBuffer = undefined;
    #rocksDb = undefined;
    #bKey = undefined;
    // #average_data = undefined;
    // #average = 0;
    // #maxPoints = 10;
    // #get2Lock = undefined;
    // #get2Queue = undefined;
    constructor(path,
        iterable,
        options = {},
        cloneConstruction, // payload
        instanceToBeCloned) {
        options = Object.assign({
            levelDbOptions: {},
            customConstructors: [],
            lruCache: true,
            lruCacheSize: 1024,
            compression: true
        }, options);
        if (!cloneConstruction) {
            const { levelDbOptions, customConstructors, compression } = options;
            const rocksDb = new RocksDB(path)
            this.#rocksDb = rocksDb;
            this.#cache = levelup(rocksDb);
            this.#cacheHandle = this.#openDb(levelDbOptions);
            const size = 33554432;
            this.#keyBuffer = BufferClass.alloc(size);
            const constructors = [
                // ...builtins,
                ...customConstructors
            ]
            this.compressed = compression; // to be able to read compression mode
            this.#sia = compression ? new SiaCompressed({ constructors }) : new Sia({ constructors });
            this.#desia = compression ? new DeSiaCompressed({ constructors }) : new DeSia({ constructors });
            this.#subKeys = new Map();
            this.#subKey = undefined;
            this.#path = path;
            if (options.lruCache) this.#lruCache = new LRUCache({ max: options.lruCacheSize });
        } else {
            const { reverse, subKey } = cloneConstruction;
            this.#cache = instanceToBeCloned._cache;
            this.#cacheHandle = instanceToBeCloned._cacheHandle;
            this.#sia = instanceToBeCloned._sia;
            this.#desia = instanceToBeCloned._desia;
            this.#reverse = reverse ?? false;
            this.#subKey = subKey ?? undefined;
            this.#subKeys = instanceToBeCloned._subKeys;
            this.#reverseClone = instanceToBeCloned;
            this.#path = instanceToBeCloned._path;
        }
        if (iterable && this.#cacheHandle) {
            this.#cacheHandle = this.#cacheHandle.then(() => this.setMany(iterable));
        }
        // this.#average_data = [];
        // this.#average = 0;
        // this.#maxPoints = 10;
        // this.#get2Lock = false;
        // this.#get2Queue = [];
    }
    get _cache() {
        return this.#cache;
    }
    get _cacheHandle() {
        return this.#cacheHandle;
    }
    get _sia() {
        return this.#sia;
    }
    get _desia() {
        return this.#desia;
    }
    get _reverse() {
        return this.#reverse;
    }
    get _reverseClone() {
        return this.#reverseClone;
    }
    get _path() {
        return this.#path;
    }
    get _subKeys() {
        return this.#subKeys;
    }

    #openDb(levelDbOptions) {
        const self = this;
        return new Promise(function (resolve, reject) {
            // disable rockdb's snappy compression, due to the use of lz4
            // you can see a comparsion of the algorithms here: http://pages.di.unipi.it/farruggia/dcb/
            self.#cache.open({ compression: false, ...levelDbOptions }, (openError) => {
                if (openError) {
                    return reject('Error opening the database:', openError);
                }
                resolve();
            });
        });
    }

    subKey(key) { // key must be string
        const composedKey = !this.#subKey ? key : this.#subKey + key;
        if (this.#subKeys.has(composedKey)) {
            return this.#subKeys.get(composedKey);
        }
        // ...
        let cloneInstance;
        const bKey = this.#encodeJSON(key);
        if (this.#subKey) {
            this.#subKey.copy(this.#keyBuffer, 0, 0, this.#subKey.length);
            bKey.copy(this.#bKey, this.#subKey.length, 0, bKey.length);
        } else {
            bKey.copy(this.#bKey, 0, 0, bKey.length);
        }
        // if (this.#reverseClone) {
        //     cloneInstance = this.#reverseClone;
        // } else {
        //     cloneInstance = new RocksDbCache(undefined, undefined, undefined, true, this);
        //     this.#reverseClone = cloneInstance;
        // }
        return cloneInstance;
    }
    reverse() {
        let cloneInstance;
        if (this.#reverseClone) {
            cloneInstance = this.#reverseClone;
        } else {
            cloneInstance = new RocksDbCache(undefined, undefined, undefined, { reverse: true }, this);
            this.#reverseClone = cloneInstance;
        }
        return cloneInstance;
    }
    // getProperty() {

    // }
    #encodeJSON(data) {
        return this.#sia.serialize(data); //lz4compress(this.#sia.serialize(data));
    }

    #decodeJSON(buffer) {
        return buffer ? this.#desia.deserialize(buffer) : buffer//this.#desia.deserialize(await lz4uncompress(buffer)) : buffer;
    }

    // async #destroyCache(resolve, reject) {
    //     this.#cache.destroy(this.#path, (destroyError) => {
    //         if (destroyError) {
    //             return reject(destroyError);
    //         }
    //         resolve(true);
    //     });
    // }
    // async destroy() {
    //     try {
    //         await this.#cacheHandle;
    //         return new Promise(this.#destroyCache.bind(this));
    //     } catch (err) {
    //         console.error(err);
    //     }
    // }
    async #closeCache(resolve, reject) {
        this.#cache.close((closeError) => {
            if (closeError) {
                return reject(closeError);
            }
            resolve(true);
        });
    }

    async close() {
        await this.#cacheHandle;
        return new Promise(this.#closeCache.bind(this));
    }
    async #getFromCache(key, resolve, reject) {
        this.#cache.get(key, (getError, value) => {
            if (getError) {
                //if (getError.message === 'NotFound: ') {
                if (getError.notFound) {
                    return resolve();
                }
                return reject(getError);
            }
            resolve(this.#decodeJSON(value));
        });
    }
    async #getManyFromCache(keys, options, resolve, reject) {
        const self = this;
        if (this.#lruCache) {

            let uncachedIndices = [];
            let uncachedKeys = [];
            let resultingValues
            if (Array.isArray) { // TODO: both are not optimized
                resultingValues = new Array(keys.length).fill(undefined);
                let i = 0;
                for (let key of keys) {
                    // key = coerceKey(key);
                    // key = this.#encodeJSON(key);
                    if (this.#lruCache.has(key)) {
                        resultingValues[i] = this.#lruCache.get(key);
                    } else {
                        uncachedIndices.push(i);
                        uncachedKeys.push(key);
                    }
                    i++;
                }
            } else {
                resultingValues = new Array(keys.length).fill(undefined);
                let i = 0;
                for (let key of keys) {
                    // key = this.#encodeJSON(key);
                    // key = coerceKey(key);
                    if (this.#lruCache.has(key)) {
                        resultingValues[i] = this.#lruCache.get(key);
                    } else {
                        uncachedIndices.push(i);
                        uncachedKeys.push(key);
                    }
                    i++;
                }
            }

            // for (let i = 0; i < keys.length; i++) {
            //     const key = coerceKey(keys[i]);
            //     if (this.#lruCache.has(key)) {
            //         resultingValues[i] = this.#lruCache.get(key);
            //     } else {
            //         uncachedIndices.push(i);
            //         uncachedKeys.push(key);
            //     }
            // }
            if (uncachedKeys.length > 0) {
                const self = this;
                const uncachedBKeys = uncachedKeys.map(key => self.#encodeJSON(key));
                this.#cache.getMany(uncachedBKeys, options, async (getError, values) => {
                    if (getError) {
                        return reject(getError);
                    }
                    let decodedValues = values.map(value => self.#decodeJSON(value));
                    decodedValues = await Promise.all(decodedValues);
                    if (keys.length === decodedValues.length) return resolve(decodedValues);
                    for (let i = 0; i < decodedValues.length; i++) {
                        resultingValues[uncachedIndices[i]] = decodedValues[i];
                    }
                    return resolve(resultingValues);
                });
            } else {
                return resolve(resultingValues);
            }
        } else {
            const self = this;
            keys = (Array.isArray(keys) ? keys : Array.from(keys)).map(key => self.#encodeJSON(key));
            // console.log({ keys })
            this.#cache.getMany(keys, options, async (getError, values) => {
                if (getError) {
                    return reject(getError);
                }
                let decodedValues = values.map(value => this.#decodeJSON(value));
                decodedValues = await Promise.all(decodedValues)
                return resolve(decodedValues);
            });
        }
    }
    async get(key, options = {}) {
        await this.#cacheHandle;
        const bKey = this.#encodeJSON(key);
        if (this.#lruCache && this.#lruCache.has(key)) return this.#lruCache.get(key);
        return new Promise(this.#getFromCache.bind(this, bKey));
    }
    async getMany(keys, options = {}) {
        return new Promise(this.#getManyFromCache.bind(this, keys, options));
    }
    async #hasInCache(key, resolve, reject) {
        const bKey = this.#encodeJSON(key);
        this.#cache.get(bKey, (getError, _) => {
            if (getError) {
                //if (/NotFound(?:Error)?: /.test(getError.message)) {
                if (getError.notFound) {
                    return resolve(false);
                }
                return reject(getError);
            }
            resolve(true);
        });
    }
    // async has(key) {
    //     await this.#cacheHandle;
    //     return new Promise(this.#hasInCache.bind(this, key));
    // }
    async #hasManyInCache(keys, resolve, reject) {
        const results = [];
        const checkNextKey = async (index) => {
            if (index >= keys.length) {
                return resolve(results);
            }
            // const key = coerceKey(keys[index]);
            const bKey = this.#encodeJSON(keys[index]);
            if (this.#lruCache && this.#lruCache.has(bKey)) {
                results.push(true);
                return checkNextKey(index + 1);
            }
            this.#cache.get(bKey, (getError, _) => {
                if (getError) {
                    if (getError.notFound) {
                        results.push(false);
                    } else {
                        return reject(getError);
                    }
                } else {
                    results.push(true);
                }
                checkNextKey(index + 1);
            });
        };
        checkNextKey(0);
    }

    async has(key) {
        await this.#cacheHandle;
        if (this.#lruCache && this.#lruCache.has(key)) return true;
        return new Promise(this.#hasInCache.bind(this, key));
        // if (!(key instanceof Array)) {
        //     key = coerceKey(key);
        //     if (this.#lruCache && this.#lruCache.has(key)) return true;
        //     return new Promise(this.#hasInCache.bind(this, key));
        // } else {
        //     return (await Promise.all(await new Promise(this.#hasManyInCache.bind(this, key))));
        // }
    }
    async hasMany(keys) {
        return (await Promise.all(await new Promise(this.#hasManyInCache.bind(this, keys))));
    }
    // #isEntry(entry) {
    //     // Map does not check if entry[0] is a string, since it accepts non string arguments as keys
    //     // Therefore a valid entry for RocksDbCache is not the same as a valid entry for Map
    //     return entry instanceof Object && typeof entry[0] === 'string';
    // }
    // async #setIterableInCache(iterable, resolve, reject) {
    //     let promises = [];
    //     for await (let entry of iterable) {
    //         entry = await entry;
    //         if (!this.#isEntry(entry)) return reject(`Iterator value ${entry} is not an entry object`);
    //         promises.push(new Promise(this.#setInCache.bind(this, entry[0], entry[1])));
    //         if (this.#lruCache) this.#lruCache.set(entry[0], entry[1]);
    //     }
    //     resolve(await Promise.all(promises).catch(reject));
    // }
    async #setInCache(key, value, resolve, reject) {
        const encodedValue = await this.#encodeJSON(await value);
        const bKey = this.#encodeJSON(key);
        this.#cache.put(bKey, encodedValue, (putError) => {
            if (putError) {
                return reject(putError);
            }
            resolve(value);
        });
    }
    async #setInCacheMany(iterable, resolve, reject) {
        const self = this;
        let entries;
        if (Array.isArray(iterable)) {
            entries = new Array(iterable.length);
            for (let i = 0; i < iterable.length; i++) {
                const entry = iterable[i];
                entries[i] =
                {
                    type: 'put', key: self.#encodeJSON(entry[0]), value: await self.#encodeJSON(await entry[1])
                }
                // (async (self, entry) => {
                //     return {
                //         type: 'put', key: coerceKey(entry[0]), value: await self.#encodeJSON(await entry[1])
                //     }
                // }).call(this, this, entry);
            }
            // iterable.map(async function (entry) { return { type: 'put', key: coerceKey(entry[0]), value: await self.#encodeJSON(await entry[1]) } }.bind(this));
        } else {
            entries = [];
            // for (let entry of iterable) {
            //     entries.push(async function (entry) { return { type: 'put', key: coerceKey(entry[0]), value: await this.#encodeJSON(await entry[1]) } }.call(this, entry));
            // }
            for (let entry of iterable) {
                entries.push({
                    type: 'put', key: self.#encodeJSON(entry[0]), value: await self.#encodeJSON(await entry[1])
                });
                // entries.push((async (self, entry) => {
                //     return {
                //         type: 'put', key: coerceKey(entry[0]), value: await self.#encodeJSON(await entry[1])
                //     }
                // }).call(this, this, entry));
            }
        }
        entries = await Promise.all(entries)
        const chainedBatch = this.#cache.batch(entries, {}, (batchError) => {
            if (batchError) {
                return reject(batchError);
            }
            resolve(entries);
        });
    }

    async #setObjectInCache(object, resolve, reject) {
        resolve(await new Promise(this.#setInCacheMany.bind(this, Object.entries(object))).catch(reject));
        // resolve(await new Promise(this.#setIterableInCache.bind(this, Object.entries(object))).catch(reject));
    }

    async set(key, value) {
        await this.#cacheHandle;
        // key = coerceKey(key);
        if (this.#lruCache) this.#lruCache.set(key, value);
        return new Promise(this.#setInCache.bind(this, key, value));
    }
    async setMany(entries) {
        await this.#cacheHandle;
        if (entries?.[Symbol.iterator] instanceof Function) {
            return new Promise(this.#setInCacheMany.bind(this, entries));
        } else if (entries instanceof Object) {
            return new Promise(this.#setObjectInCache.bind(this, entries));
        } else {
            throw `Invalid arguments provided: entries: ${entries}`;
        }
    }

    async #deleteFromCache(key, resolve, reject) {
        const bKey = this.#encodeJSON(key)
        this.#cache.del(bKey, (deleteError) => {
            if (deleteError) {
                return reject(deleteError);
            }
            resolve(true);
        });
    }
    async #deleteManyFromCache(iterable, resolve, reject) {
        const self = this;
        let keys;
        if (Array.isArray(iterable)) {
            keys = iterable.map(function (key) { return { type: 'del', key: self.#encodeJSON(key) } });
        } else {
            keys = [];
            for (let key of iterable) {
                keys.push(function (key) { return { type: 'del', key: self.#encodeJSON(key) } }.call(this, key));
            }
        }
        const chainedBatch = this.#cache.batch(await Promise.all(keys), {}, (batchError) => {
            if (batchError) {
                return reject(batchError);
            }
            resolve(true);
        });
    }
    async delete(key) {
        await this.#cacheHandle;
        if (!Array.isArray(key)) {
            if (this.#lruCache) this.#lruCache.delete(key);
            return new Promise(this.#deleteFromCache.bind(this, key));
        } else {
            return new Promise(this.#deleteManyFromCache.bind(this, key));
        }
    }

    async #clearCache(resolve, reject) {
        this.#cache.clear((err) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    }

    async clear() {
        await this.#cacheHandle;
        return new Promise(this.#clearCache.bind(this));
    }

    async forEach(f, concurrency = 1) {
        await this.#cacheHandle;
        if (concurrency > 1) f = limitConcurrency(f, concurrency);
        for await (const [key, value] of this) {
            await f(value, key, this);
        }
    }
    async reduce(f, initialValue, concurrency = 1) {
        await this.#cacheHandle;
        if (concurrency > 1) f = limitConcurrency(f, concurrency);
        let i = 0;
        let accumulator = initialValue;
        for await (const [key, value] of this) {
            if (i === 0 && initialValue === undefined) {
                accumulator = value;
                i++;
                continue;
            }
            accumulator = await f(accumulator, value, key, this);
            i++;
        }
        return accumulator;
    }
    async map(f, concurrency = 1) {
        await this.#cacheHandle;
        if (concurrency > 1) f = limitConcurrency(f, concurrency);
        const values = [];
        for await (const [key, value] of this) {
            values.push([key, await f(value, key, this)]);
        }
        return values;
    }
    async filter(f, concurrency = 1) {
        await this.#cacheHandle;
        if (concurrency > 1) f = limitConcurrency(f, concurrency);
        const values = [];
        for await (const entry of this) {
            const [key, value] = entry;
            if (await f(value, key, this)) {
                values.push(entry);
            }
        }
        return values;
    }

    async entries() {
        await this.#cacheHandle;
        let entries = [];
        for await (const entry of this) {
            entries.push(entry);
        }
        return entries;
    }
    async values() {
        await this.#cacheHandle;
        let values = [];
        const iteratorOptions = {
            reverse: this.#reverse,
            keys: false,
            values: true
        }
        for await (const [_, value] of this.#cache.iterator(iteratorOptions)) {
            values.push(this.#decodeJSON(value));
        }
        return Promise.all(values);
    }
    async keys() {
        await this.#cacheHandle;
        let keys = [];
        const iteratorOptions = {
            reverse: this.#reverse,
            keys: true,
            values: false
        }
        for await (const [key, _] of this.#cache.iterator(iteratorOptions)) {
            keys.push(this.#decodeJSON(key));
        }
        return keys;
    }
    async *[Symbol.asyncIterator]() {
        await this.#cacheHandle;
        const iteratorOptions = {
            reverse: this.#reverse,
            keys: true,
            values: true
        }
        for await (const [key, value] of this.#cache.iterator(iteratorOptions)) {
            yield [this.#decodeJSON(key), await this.#decodeJSON(value)];
        }
    }
}

export default RocksDbCache;
// async function main() {
//     const path = './cache';
//     const cache = new RocksDbCache(path, undefined, { lruCache: true });
//     await cache.clear();
//     let key = 'unknownKey';
//     let keys = new Array(10).fill(0).map((_, i) => `${key}${i}`);
//     let valueGet = await cache.get(key);
//     console.log({ valueGet });
//     let valuesGet = await cache.getMany(keys);
//     console.log({ valuesGet, should: new Array(keys.length).fill(undefined) });

//     let valueHas = await cache.has(key);
//     let valuesHas = await cache.hasMany(keys);
//     console.log({ valueHas, valuesHas, should: new Array(keys.length).fill(false) })
//     console.log(1)
// }
// // main();