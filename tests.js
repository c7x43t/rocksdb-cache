import RocksDbCache from './RocksDbCache';
import { resolve } from 'path';
import fs from 'fs';

const TEST_CACHE_PATH = resolve(__dirname, 'test-cache');

describe('RocksDbCache', () => {
    let cache: RocksDbCache;

    beforeAll(async () => {
        cache = new RocksDbCache(TEST_CACHE_PATH);
    });

    afterAll(async () => {
        await cache.close();
        fs.rmSync(TEST_CACHE_PATH, { recursive: true });
    });

    beforeEach(async () => {
        await cache.clear();
    });

    test('set and get', async () => {
        await cache.set('key1', { data: 'test data' });
        const value = await cache.get('key1');
        expect(value).toEqual({ data: 'test data' });
    });

    test('has', async () => {
        await cache.set('key2', { data: 'test data' });
        expect(await cache.has('key2')).toBe(true);
        expect(await cache.has('non-existent-key')).toBe(false);
    });

    test('delete', async () => {
        await cache.set('key3', { data: 'test data' });
        expect(await cache.has('key3')).toBe(true);
        await cache.delete('key3');
        expect(await cache.has('key3')).toBe(false);
    });

    test('clear', async () => {
        await cache.set('key4', { data: 'test data' });
        await cache.set('key5', { data: 'test data' });
        await cache.clear();
        expect(await cache.keys()).toEqual([]);
    });

    test('entries', async () => {
        await cache.set('key6', { data: 'test data' });
        await cache.set('key7', { data: 'more test data' });
        const entries = await cache.entries();
        expect(entries).toEqual([
            ['key6', { data: 'test data' }],
            ['key7', { data: 'more test data' }],
        ]);
    });

    test('forEach', async () => {
        await cache.set('key8', { data: 'test data' });
        await cache.set('key9', { data: 'more test data' });
        const results: any[] = [];
        await cache.forEach((value, key, _) => {
            results.push([key, value]);
        });
        expect(results).toEqual([
            ['key8', { data: 'test data' }],
            ['key9', { data: 'more test data' }],
        ]);
    });

    test('values', async () => {
        await cache.set('key10', { data: 'test data' });
        await cache.set('key11', { data: 'more test data' });
        const values = await cache.values();
        expect(values).toEqual([
            { data: 'test data' },
            { data: 'more test data' },
        ]);
    });

    test('keys', async () => {
        await cache.set('key12', { data: 'test data' });
        await cache.set('key13', { data: 'more test data' });
        const keys = await cache.keys();
        expect(keys).toEqual(['key12', 'key13']);
    });
});
// async function tests() {
//     let cache = new RocksDbCache('./cache');
//     await cache.clear();
//     console.log({ cache: await cache.values() })
//     let data = {
//         promise: Promise.resolve(3),
//         regexp: /abvc/ig,
//         date: new Date()
//     }
//     for (let entry of Object.entries(data)) {
//         await cache.set(entry[0], entry[1]);
//     }
//     for (let entry of Object.entries(data)) {
//         console.log(entry[0], await cache.get(entry[0]))
//     }
//     for (let entry of Object.entries(data)) {
//         console.log(entry[0], await cache.has(entry[0]))
//     }
//     console.log('g', await cache.has('g'))
//     console.log({ keys: await cache.keys() })
//     console.log({ entries: await cache.entries() })
//     console.log({ values: await cache.values() })
//     console.log({ delete_g: await cache.delete('g') })

//     console.log({ delete_promise: await cache.delete('promise') })

//     console.log({ keys: await cache.keys() })
//     console.log({ entries: await cache.entries() })
//     console.log({ values: await cache.values() })
//      await cache.clear();
//     console.log({ close: await cache.close() })
//         // SIA tests:
//         const types =
//     [

//     ]

// const sia = new Sia({ constructors: [...builtins, ...types] })
// const desia = new DeSia({ constructors: [...builtins, ...types] });
// // { date: new Date(), z: 2334, m: new Map([[{ c: 3 }, { d: 4 }]]), c: new Set([1, { c: 4 }], new Map([[{ c: 3 }, { d: 4 }]])) }
// const data_ = { date: new Date(), z: 2334, m: new Map([[{ c: 3 }, { d: 4 }]]), c: new Set([{ date: new Date(), z: 2334, m: new Map([[{ c: 3 }, { d: 4 }]]), c: new Set([1, { c: 4 }, new Map([[{ c: 3 }, { d: 4 }]])]) }, 1, { c: 4 }, new Map([[{ c: 3 }, { d: 4 }]])]) }
// console.log(data_)
// const serialized = sia.serialize(data_)
// console.log(serialized)
// const data = desia.deserialize(serialized);
// console.log(data)
// console.log(desia.deserialize(sia.serialize(new Map([[1, 2], [3, 4]]))))
// console.log(desia.deserialize(sia.serialize(new Set([1, 2, 3, 4]))))
// console.log(1)
//     console.log(1)
// }
// tests()

// export default RocksDbCache;

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
async function main() {
    let cache = new RocksDbCache('./cache');
    await cache.clear();
    console.log({ cache: await cache.values() })
    let data = {
        promise: 3, // not supported. Promise.resolve(3),
        regexp: /abvc/ig,
        date: new Date()
    }
    let t1 = Date.now();

    await cache.setMany(new Array(1e3).fill(0).map((_, i) => [String(i), data]))
    console.log({ entries: await cache.entries() })
    await cache.clear();
    for (let i = 0; i < 1e3; i++) {
        await cache.set(String(i), data);
    }
    let t2 = Date.now();
    let keys = [];
    let values = [];
    for (let i = 0; i < 1e4; i++) {
        let key = String(getRandomInt(0, 1999));
        keys.push(key)
        values.push(cache.get(key));
    }
    console.log({ dd: await Promise.all(values) });
    let t3 = Date.now();
    console.log({ d: await cache.get(keys) });
    let t4 = Date.now();
    // cache.has performance 45
    values = []
    for (let i = 0; i < 1e4; i++) {
        let key = String(getRandomInt(0, 1999));
        // keys.push(key)
        values.push(cache.has(key));
    }
    console.log({ dd: await Promise.all(values) });
    let t5 = Date.now();
    let hasValues = new Array(2000).fill(0).map((_, i) => String(i));
    //console.log({ hasValues })
    let values_ = await cache.has(hasValues);

    //console.log({ values_ });
    let t6 = Date.now();
    console.log({ t12: t2 - t1, t23: t3 - t2, t34: t4 - t3, t45: t5 - t4, t56: t6 - t5 })
    console.log({ keys });
    //
    await cache.clear();
    for (let i = 0; i < 1e3; i++) {
        await cache.set(String(i), i);
    }
    console.log(await cache.values());
    await cache.delete(['44', '33']);
    await cache.delete('22');
    console.log(await cache.reverse().values());
    await cache.clear();
    //
    await cache.set('key1', data);
    await cache.set('key2', data);
    const [key1, key2] = await cache.get(['key1', 'key2']);
    console.log({ key1, key2 });
    await cache.clear();
    await cache.set([['1', 2], ['2', 4]])
    console.log(await cache.entries());
    await cache.clear();
    await cache.set({ hello: 'world', 'test': 123 });
    console.log(await cache.entries());
    await cache.clear();
    await cache.set(new Map([['1', 2], ['2', 4]]));
    console.log(await cache.entries());
    await cache.clear();
    for (let i = 0; i < 1e3; i++) {
        await cache.set(String(i), i);
    }
    console.log(await cache.map(e => e + 1, 1));
    console.log(await cache.filter(e => e < 300, 1));
    console.log(await cache.reduce((acc, e) => acc + e, 10));
    console.log(1)
}
main();