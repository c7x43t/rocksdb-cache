
// function getRandomInt(min, max) {
//     min = Math.ceil(min);
//     max = Math.floor(max);
//     return Math.floor(Math.random() * (max - min + 1)) + min;
// }
// async function main() {
//     let cache = new RocksDbCache('./cache');
//     await cache.clear();
//     console.log({ cache: await cache.values() })
//     let data = {
//         promise: 3, // not supported. Promise.resolve(3),
//         regexp: /abvc/ig,
//         date: new Date()
//     }
//     let t1 = Date.now();

//     // await cache.set(new Array(1e3).fill(0).map((_, i) => [String(i), data]))
//     // console.log({ entries: await cache.entries() })
//     // await cache.clear();
//     for (let i = 0; i < 1e3; i++) {
//         await cache.set(String(i), data);
//     }
//     let t2 = Date.now();
//     let keys = [];
//     let values = [];
//     for (let i = 0; i < 1e4; i++) {
//         let key = String(getRandomInt(0, 1999));
//         keys.push(key)
//         values.push(cache.get(key));
//     }
//     console.log({ dd: await Promise.all(values) });
//     let t3 = Date.now();
//     console.log({ d: await cache.get(keys) });
//     let t4 = Date.now();
//     // cache.has performance 45
//     values = []
//     for (let i = 0; i < 1e4; i++) {
//         let key = String(getRandomInt(0, 1999));
//         // keys.push(key)
//         values.push(cache.has(key));
//     }
//     console.log({ dd: await Promise.all(values) });
//     let t5 = Date.now();
//     let hasValues = new Array(2000).fill(0).map((_, i) => String(i));
//     //console.log({ hasValues })
//     let values_ = await cache.has(hasValues);

//     //console.log({ values_ });
//     let t6 = Date.now();
//     console.log({ t12: t2 - t1, t23: t3 - t2, t34: t4 - t3, t45: t5 - t4, t56: t6 - t5 })
//     console.log({ keys });
//     //
//     await cache.clear();
//     for (let i = 0; i < 1e3; i++) {
//         await cache.set(String(i), i);
//     }
//     console.log(await cache.values());
//     await cache.delete(['44', '33']);
//     await cache.delete('22');
//     console.log(await cache.reverse().values());
//     await cache.clear();
//     //
//     await cache.set('key1', data);
//     await cache.set('key2', data);
//     const [key1, key2] = await cache.get(['key1', 'key2']);
//     console.log({ key1, key2 });
//     await cache.clear();
//     await cache.set([['1', 2], ['2', 4]])
//     console.log(await cache.entries());
//     await cache.clear();
//     await cache.set({ hello: 'world', 'test': 123 });
//     console.log(await cache.entries());
//     await cache.clear();
//     await cache.set(new Map([['1', 2], ['2', 4]]));
//     console.log(await cache.entries());
//     await cache.clear();
//     for (let i = 0; i < 1e3; i++) {
//         await cache.set(String(i), i);
//     }
//     console.log(await cache.map(e => e + 1, 1));
//     console.log(await cache.filter(e => e < 300, 1));
//     console.log(await cache.reduce((acc, e) => acc + e, 10));
//     console.log(1)
// }
// main();
if (false) {
    var rdb = new RocksDbCache('./cache');
    var int8 = new Int8Array(2);
    int8[0] = 42;
    var buf = Buffer.from(Buffer.from([1, 2, 3, 4])); //new ArrayBuffer(8); //
    var data = rdb._sia.serialize(buf)
    var ddata = rdb._desia.deserialize(data);
    console.log(buf, data, ddata)
    console.log(1)
}

async function debug() {
    let cache = new RocksDbCache('./cache');
    await cache.clear();
    const testData = { key1: 1, key2: 2, key3: 3 };
    // await cache.set(testData);
    // for (const [key, value] of Object.entries(testData)) {
    //     await cache.set(key, value);
    // }
    try {
        await cache.set(Object.entries(testData));
        for (let key of Object.keys(testData)) console.log({ key, value: await cache.get(key) })
        const values = await cache.get(Object.keys(testData));
        console.log({ values })
        //expect(values).to.deep.equal(Object.values(testData));
        console.log(1)
    } catch (err) {
        console.error(err)
    }
}
//debug();