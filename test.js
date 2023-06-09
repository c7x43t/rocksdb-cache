import { describe, it, before } from 'mocha';
import RocksDbCache from './index.js';
import { expect } from 'chai';
import deepEql from 'deep-eql';
import { DeSia, DeSiaCompressed, Sia, SiaCompressed } from '@valentech/sializer';

const typesTestData = [
    {
        description: 'string',
        value: 'Hello, world!',
    },
    {
        description: 'number',
        value: 42,
    },
    {
        description: 'BigInt',
        value: 12345678901234567821234567890123456782n,
    },
    {
        description: 'boolean',
        value: true,
    },
    {
        description: 'null',
        value: null,
    },
    {
        description: 'undefined',
        value: undefined,
    },
    {
        description: 'array',
        value: [1, 2, 3],
    },
    {
        description: 'object',
        value: { key: 'value' },
    },
    // {
    //     description: 'function',
    //     value: function () {
    //         return 'Hello, world!';
    //     },
    // },
    // {
    //     description: 'arrow function',
    //     value: () => 'Hello, world!',
    // },
    {
        description: 'date',
        value: new Date(),
    },
    {
        description: 'regexp',
        value: /^test$/i,
    },
    {
        description: 'Map',
        value: new Map([
            ['key1', 'value1'],
            ['key2', 'value2'],
        ]),
    },
    {
        description: 'Set',
        value: new Set([1, 2, 3]),
    },
    {
        description: 'Int8Array',
        value: new Int8Array([1, 2, 3]),
    },
    {
        description: 'Uint8Array',
        value: new Uint8Array([1, 2, 3]),
    },
    {
        description: 'Uint8ClampedArray',
        value: new Uint8ClampedArray([1, 2, 3]),
    },
    {
        description: 'Int16Array',
        value: new Int16Array([1, 2, 3]),
    },
    {
        description: 'Uint16Array',
        value: new Uint16Array([1, 2, 3]),
    },
    {
        description: 'Int32Array',
        value: new Int32Array([1, 2, 3]),
    },
    {
        description: 'Uint32Array',
        value: new Uint32Array([1, 2, 3]),
    },
    {
        description: 'Float32Array',
        value: new Float32Array([1.1, 2.2, 3.3, -1.1, -2.2, -3.3, 5234348950.432534, -5234348950.432534]),
    },
    {
        description: 'Float64Array',
        value: new Float64Array([1.1, 2.2, 3.3, -1.1, -2.2, -3.3, 5234348950.432534, -5234348950.432534]),
    },
    {
        description: 'BigInt64Array',
        value: new BigInt64Array([1n, 2n, 3n, -9223372036854775807n, 9223372036854775807n]),
    },
    {
        description: 'BigUint64Array',
        value: new BigUint64Array([1n, 2n, 3n, 18446744073709551615n]),
    },
    {
        description: 'BigInt',
        value: 42n,
    },
    {
        description: 'Object.create(null)',
        value: Object.create(null)
    },
    {
        description: 'boolObj',
        value: new Boolean(true)
    },
    {
        description: 'numObj',
        value: new Number(3),
    },
    {
        description: 'strObj',
        value: new String('hello'),
    },
    // {
    //     description: 'Symbol',
    //     value: Symbol('test'),
    // },
    // {
    //     description: 'error',
    //     value: new Error('Test error'),
    // },
];
const baseTypes = {
    string: 'string',
    number: 42,
    BigInt: 123456789012345678901234567890123456789012345678901234567890n, // 423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450423756230478956790234875028943750234895723489057023489572903486720345896729083456723450n
    boolean: true,
    null: null,
    undefined: undefined,
    array: [1, 2, 3],
    object: { key: 'value' },
    boolObj: new Boolean(true),
    numObj: new Number(3),
    strObj: new String('hello'),
    // function: function () { },
    // arrowFunction: () => { },
    date: new Date(),
    regexp: /regex/,
    Map: new Map([['key', 'value']]),
    Set: new Set([1, 2, 3]),
    Int8Array: new Int8Array([1, 2, 3]),
    Uint8Array: new Uint8Array([1, 2, 3]),
    Uint8ClampedArray: new Uint8ClampedArray([1, 2, 3]),
    Int16Array: new Int16Array([1, 2, 3]),
    Uint16Array: new Uint16Array([1, 2, 3]),
    Int32Array: new Int32Array([1, 2, 3]),
    Uint32Array: new Uint32Array([1, 2, 3]),
    Float32Array: new Float32Array([1.1, 2.2, 3.3, -1.1, -2.2, -3.3, 5234348950.432534, -5234348950.432534]),
    Float64Array: new Float64Array([1.1, 2.2, 3.3, -1.1, -2.2, -3.3, 5234348950.432534, -5234348950.432534]),
    BigInt64Array: new BigInt64Array([BigInt(1), BigInt(2), BigInt(3), -9223372036854775807n, 9223372036854775807n]),
    BigUint64Array: new BigUint64Array([BigInt(1), BigInt(2), BigInt(3), 18446744073709551615n]),
    // Symbol: Symbol('test'),
};
function createMixedTypesObject() {
    const nestedObject = {
        obj: {
            innerObj: baseTypes,
        },
        map: new Map(Object.entries(baseTypes)),
        set: new Set(Object.values(baseTypes)),
        arr: Object.values(baseTypes),
    };
    return nestedObject;
}
function createNestedObject(levels, data) {
    if (levels === 0) {
        return data;
    }
    const nestedObject = {
        obj: createNestedObject(levels - 1, data),
        map: new Map([['key', createNestedObject(levels - 1, data)]]),
        set: new Set([createNestedObject(levels - 1, data)]),
        arr: [createNestedObject(levels - 1, data)],
    };

    return nestedObject;
};
for (let withLruCache of [true, false]) {
    describe(`RocksDbCache basic get and set operations ${withLruCache ? 'with LRU cache' : 'without LRU cache'}`, () => {
        const path = './cache';
        let cache;
        // before(async () => {
        //     await cache.clear();
        // });
        before(async () => {
            cache = new RocksDbCache(path, undefined, { lruCache: withLruCache });
            await cache.clear();
        });

        after(async () => {
            try {
                await cache.close();
            } catch (err) {
                console.error(err);
            }

        });

        it('should be empty initially', async () => {
            expect((await cache.keys()).length).to.equal(0);
        });

        it('should set and get a value of type string', async () => {
            await cache.set('key', 'value');
            return expect(await cache.get('key')).to.equal('value');
        });

        for (const { description, value } of typesTestData) {
            it(`should set and get a value of type ${description}`, async () => {
                try {
                    await cache.set(description, value);
                    expect(await cache.get(description)).to.deep.equal(value);
                } catch (err) {
                    console.error(err)
                    throw err;
                }

            });
        }
        for (let [baseTypeKey, baseTypeValue] of Object.entries(baseTypes)) {
            {
                const description = `Set_${baseTypeKey}`;
                const value = new Set([baseTypeValue]);
                it(`should set and get a Set containing ${baseTypeKey}`, async () => {
                    await cache.set(description, value);
                    expect(await cache.get(description)).to.deep.equal(value);
                });
            }
            {
                const description = `Map_${baseTypeKey}`;
                const value = new Map([[baseTypeKey, baseTypeValue]]);
                it(`should set and get a Map containing ${baseTypeKey}`, async () => {
                    await cache.set(description, value);
                    expect(await cache.get(description)).to.deep.equal(value);
                });
            }
            {
                const description = `Object_${baseTypeKey}`;
                const value = Object.fromEntries([[baseTypeKey, baseTypeValue]]);
                it(`should set and get an Object containing ${baseTypeKey}`, async () => {
                    await cache.set(description, value);
                    expect(await cache.get(description)).to.deep.equal(value);
                });
            }
            {
                const description = `Array_${baseTypeKey}`;
                const value = [baseTypeValue];
                it(`should set and get an Array containing ${baseTypeKey}`, async () => {
                    await cache.set(description, value);
                    expect(await cache.get(description)).to.deep.equal(value);
                });
            }
        }
        for (const level of [1, 2, 3, 4, 5]) {
            const description = `nestedLevel_${level}`;
            const value = createNestedObject(level);
            it(`should set and get nested structures of Map, Set, Object, Array ${description}`, async () => {
                await cache.set(description, value);
                expect(await cache.get(description)).to.deep.equal(value);
            });



        }
        {
            for (let baseType of Object.entries(baseTypes)) {
                const description = `key`;
                let baseTypeO = Object.fromEntries([baseType]);
                var obj = {
                    innerObj: baseTypeO,
                }

                it(`should set and get a ${baseType[0]} from an Object`, async () => {
                    await cache.set(description, obj);
                    expect(await cache.get(description)).to.deep.equal(obj);
                });
                var map = new Map(Object.entries(baseTypeO));
                it(`should set and get a ${baseType[0]} from a Map`, async () => {
                    await cache.set(description, map);
                    expect(await cache.get(description)).to.deep.equal(map);
                });
                var set = new Set(Object.values(baseTypeO));
                it(`should set and get a ${baseType[0]} from a Set`, async () => {
                    await cache.set(description, set);
                    expect(await cache.get(description)).to.deep.equal(set);
                });
                var arr = Object.values([baseType]);
                it(`should set and get a ${baseType[0]} from an Array `, async () => {
                    await cache.set(description, arr);
                    expect(await cache.get(description)).to.deep.equal(arr);
                });

            }
        }
        {
            const description = `mixedTypes`;
            const value = createMixedTypesObject();
            it(`should set and get Map, Set, Object, Array, containing all types`, async () => {
                await cache.set(description, value);
                // console.log(await cache.get(description));
                expect(await cache.get(description)).to.deep.equal(value);
            });
        }
        for (const level of [1, 2, 3, 4]) {
            const description = `nestedLevel_${level}`;
            const value = createNestedObject(level, createMixedTypesObject());
            it(`should set and get nested structures of Map, Set, Object, Array ${description} containing all types in leaves`, async () => {
                await cache.set(description, value);
                expect(await cache.get(description)).to.deep.equal(value);
            });
        }


    });

    describe(`RocksDbCache other operations ${withLruCache ? 'with LRU cache' : 'without LRU cache'}`, () => {
        const path = './cache';
        let cache;
        // before(async () => {
        //     await cache.clear();
        // });
        beforeEach(async () => {
            cache = new RocksDbCache(path, undefined, { lruCache: withLruCache });
            await cache.clear();
        });

        afterEach(async () => {
            await cache.close();
        });
        it('should resolve top level Promises before saving values', async () => {
            let value = 42;
            let promise = Promise.resolve(value)
            await cache.set('key', promise);
            expect(await cache.get('key')).to.equal(value);
        });
        it('delete should always return true', async () => {
            await cache.set('key', 'value');
            expect(await cache.delete('key')).to.equal(true);
            expect(await cache.delete('key2')).to.equal(true);
        });
        it('should delete a value', async () => {
            await cache.set('key', 'value');
            expect(await cache.has('key')).to.equal(true);
            await cache.delete('key');
            expect(await cache.has('key')).to.equal(false);
        });
        it('should check if a key exists or doesn\'t exist', async () => {
            await cache.set('key', 'value');
            expect(await cache.has('key')).to.equal(true);
            expect(await cache.has('key2')).to.equal(false);
        });
        it('should iterate with forEach', async () => {
            const testData = { key1: 'value1', key2: 'value2', key3: 'value3' };
            for (const [key, value] of Object.entries(testData)) {
                await cache.set(key, value);
            }

            const result = {};
            await cache.forEach((value, key) => {
                result[key] = value;
            });

            expect(result).to.deep.equal(testData);
        });
        it('should reduce values', async () => {
            const testData = { key1: 1, key2: 2, key3: 3 };
            for (const [key, value] of Object.entries(testData)) {
                await cache.set(key, value);
            }
            const sum = await cache.reduce((accumulator, value) => accumulator + value, 0);
            expect(sum).to.equal(6);
            const sum2 = await cache.reduce((accumulator, value) => accumulator + value);
            expect(sum2).to.equal(6);
        });
        it('should map values', async () => {
            const testData = { key1: 1, key2: 2, key3: 3 };
            for (const [key, value] of Object.entries(testData)) {
                await cache.set(key, value);
            }
            let values = await cache.map((value, _) => value + 1);
            expect(compareArrays(values, [['key1', 2], ['key2', 3], ['key3', 4]])).to.deep.equal(true);
        });
        it('should filter values', async () => {
            const testData = { key1: 1, key2: 2, key3: 3 };
            for (const [key, value] of Object.entries(testData)) {
                await cache.set(key, value);
            }
            let values = await cache.filter((value, key) => value == 3 || key == 'key1');
            expect(compareArrays(values, [['key1', 1], ['key3', 3]])).to.deep.equal(true);
        });
        it('should set and get many values', async () => {
            let testData = {};
            try {
                for (let i = 0; i < 1e2; i++) testData[`key${i}`] = i;
                await cache.setMany(Object.entries(testData));
                let values = await cache.getMany(Object.keys(testData));
                expect(values).to.deep.equal(Object.values(testData));
                await cache.clear();
                await cache.setMany(testData);
                values = await cache.getMany(new Set(Object.keys(testData)));
                expect(values).to.deep.equal(Object.values(testData));
                await cache.clear();
                await cache.setMany(new Map(Object.entries(testData)));
                values = await cache.getMany(Object.keys(testData));
                expect(values).to.deep.equal(Object.values(testData));
            } catch (err) {
                console.error(err);
            }

        });
        it('should return has = false, get = undefined for undefined keys', async () => {
            let key = 'unknownKey';
            let keys = new Array(10).fill(0).map((_, i) => `${key}${i}`);
            let valueGet = await cache.get(key);
            let valuesGet = await cache.getMany(keys);
            expect(valueGet).to.equal(undefined);
            expect(valuesGet).to.deep.equal(new Array(keys.length).fill(undefined));
            let valueHas = await cache.has(key);
            let valuesHas = await cache.hasMany(keys);
            expect(valueHas).to.equal(false);
            expect(valuesHas).to.deep.equal(new Array(keys.length).fill(false));
        })
        it('should support null Prototype Object', async () => {
            var o_n = Object.create(null);
            o_n.a = 1;
            o_n.b = 2;
            o_n.c = 3;
            await cache.set('test', o_n);
            var value = await cache.get('test');
            expect(value).to.deep.equal(o_n);
            expect(Object.getPrototypeOf(value)).to.equal(Object.getPrototypeOf(o_n));
        });

        it('should support circular datastructures', async () => {
            function deepEqual(a, b, seen = new WeakMap()) { // a
                if (a === b) {
                    return true;
                }

                if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) {
                    return false;
                }

                if (seen.get(a) === b || seen.get(b) === a) {
                    return true;
                }

                if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) {
                    return false;
                }

                let keysA = Reflect.ownKeys(a);
                let keysB = Reflect.ownKeys(b);

                if (keysA.length !== keysB.length) {
                    return false;
                }

                seen.set(a, b);
                seen.set(b, a);

                for (let key of keysA) {
                    if (!keysB.includes(key)) {
                        return false;
                    }

                    if (a instanceof Map || a instanceof Set) {
                        if (a.size !== b.size) {
                            return false;
                        }

                        for (let entry of a.entries()) {
                            if (a instanceof Map) {
                                if (!b.has(entry[0])) {
                                    return false;
                                }

                                if (!deepEqual(entry[1], b.get(entry[0]), seen)) {
                                    return false;
                                }
                            } else {
                                if (!b.has(entry[0])) {
                                    return false;
                                }
                            }
                        }
                    } else if (!deepEqual(a[key], b[key], seen)) {
                        return false;
                    }
                }

                return true;
            }
            var nested = new Map([[1, 2], [3, 4]]);
            var set_1 = new Set([3, 4, 5]);
            nested.set('set', set_1)
            var o = {}
            var o_n = Object.create(null);
            var m = new Map();
            var s = new Set();
            var a = [undefined, o, s, m, nested, set_1, o_n]
            m.set(0, m);
            m.set(1, nested);
            m.set(2, set_1);
            m.set(3, o);
            m.set(4, o_n);
            m.set(5, s);
            m.set(6, a);
            s.add(s);
            s.add(m)
            s.add(o);
            s.add(nested);
            s.add(set_1);
            s.add(o_n);
            s.add(a);
            o.o = o
            o.m = m;
            o.s = s;
            o.a = a;
            o.o_n = o_n;
            o.nested = nested;
            o.set_1 = set_1;
            o_n.o = o
            o_n.m = m;
            o_n.s = s;
            o_n.a = a;
            o_n.o_n = o_n;
            o_n.nested = nested;
            o_n.set_1 = set_1;
            a[0] = a
            await cache.set('test', o);
            var value = await cache.get('test');
            expect(deepEqual(o, value)).to.be.true;
            //expect(value).to.deep.equal(o); // this throws because it cannot compare o and value
        })
        it('should support BigInts', async () => {
            var bigInts = [2n];
            for (var i = 1; i < 128; i++) bigInts.push(bigInts[i - 1] * 2n);
            var bigIntsM1 = bigInts.map(e => e - 1n);
            var bigIntsP1 = bigInts.map(e => e + 1n);
            var bigInts = [...bigInts, ...bigIntsM1, ...bigIntsP1];
            var bigIntsN = bigInts.map(e => -e);
            var bigInts = [...bigInts, ...bigIntsN, -1n, 0n, 1n];
            await cache.set('test', bigInts);
            var value = await cache.get('test');
            expect(value).to.deep.equal(bigInts);
        });
        it('should return the cache entries', async () => {
            for (let key of Object.keys(baseTypes)) {
                await cache.set(key, baseTypes[key]);
            }
            // let entries = Object.entries(baseTypes);
            let entriesCache = await cache.entries();
            expect(baseTypes).to.deep.equal(Object.fromEntries(entriesCache));
        })
        // function compareArrays(a, b) { // compare arrays without order
        //     if (a.length !== b.length) return false;
        //     // track elements seen before for exclusion such that there is a 1 to 1 correspondence
        //     let indices = new Set();
        //     for (let val of a) {
        //         let index = b.findIndex((e, i) => !indices.has(i) && deepEql(val, e))
        //         if (index === -1) return false;
        //         indices.add(index);
        //     }
        //     return true;
        // }
        function compareArrays(a, b) { // compare arrays without order
            if (a.length !== b.length) return false;

            // track elements seen before for exclusion such that there is a 1 to 1 correspondence
            let bIndices = new Set();

            for (let val of a) {
                let index = b.findIndex((e, i) => !bIndices.has(i) && deepEql(val, e));

                if (index === -1) return false;

                bIndices.add(index);
            }

            return true;
        }
        function diffArrays(a, b) { // compare arrays without order and return differences
            let array1Diff = [];
            let array2Diff = [];
            let indices = new Set();

            for (let val of a) {
                let index = b.findIndex((e, i) => !indices.has(i) && deepEql(val, e));
                if (index === -1) {
                    array1Diff.push(val);
                } else {
                    indices.add(index);
                }
            }

            for (let i = 0; i < b.length; i++) {
                if (!indices.has(i)) {
                    array2Diff.push(b[i]);
                }
            }

            return {
                array1: array1Diff,
                array2: array2Diff
            };
        }

        it('should return the cache keys', async () => {
            for (let key of Object.keys(baseTypes)) {
                await cache.set(key, baseTypes[key]);
            }
            let keysCache = await cache.keys();
            expect(compareArrays(Object.keys(baseTypes), keysCache)).to.deep.equal(true);
        });
        it('should return the cache values', async () => {
            for (let key of Object.keys(baseTypes)) {
                await cache.set(key, baseTypes[key]);
            }
            let valuesCache = await cache.values();
            expect(compareArrays(Object.values(baseTypes), valuesCache)).to.deep.equal(true);
        });
        it('should support setMany', async () => {
            await cache.setMany(Object.entries(baseTypes));
            for (let key of Object.keys(baseTypes)) {
                const value = await cache.get(key)
                expect(value).to.deep.equal(baseTypes[key]);
            }
            for (let key of Object.keys(baseTypes)) {
                const value = await cache.has(key)
                expect(value).to.deep.equal(true);
            }
        });
        it('should support getMany', async () => {
            for (let key of Object.keys(baseTypes)) {
                await cache.set(key, baseTypes[key]);

            }
            let get_ = await cache.getMany(Object.keys(baseTypes));
            // console.log(Object.values(baseTypes))
            // console.log(get_)
            const vals = Object.values(baseTypes);
            // for (let i = 0; i < get_.length; i++) {
            //     console.log(get_[i], vals[i], get_[i] === vals[i])
            // }
            // console.log(diffArrays(vals, get_))
            expect(compareArrays(Object.values(baseTypes), get_)).to.deep.equal(true);
        });
        it('should support hasMany', async () => {
            for (let key of Object.keys(baseTypes)) {
                await cache.set(key, baseTypes[key]);

            }
            let has_ = await cache.hasMany(Object.keys(baseTypes));
            expect(has_.reduce((acc, e) => acc && e)).to.deep.equal(true);
        });
        it('should support bulk operations', async () => {
            await cache.setMany(Object.entries(baseTypes));
            let get_ = await cache.getMany(Object.keys(baseTypes));
            let has_ = await cache.hasMany(Object.keys(baseTypes));

            expect(compareArrays(Object.values(baseTypes), get_)).to.deep.equal(true);
            expect(has_.reduce((acc, e) => acc && e)).to.deep.equal(true);
            await cache.delete(Object.keys(baseTypes));
            expect((await cache.keys()).length).to.equal(0);
        });
        it('test the getters', async () => {
            // expect(cache).to.equal(cache._cache);
            expect(cache._sia instanceof Sia || cache._sia instanceof SiaCompressed).to.equal(true);
            expect(cache._desia instanceof DeSia || cache._desia instanceof DeSiaCompressed).to.equal(true);
            expect(cache._path).to.equal(path);
        });
        it('should support reverse iteration', async () => {
            for (let key of Object.keys(baseTypes)) {
                await cache.set(key, baseTypes[key]);
            }
            // let entries = Object.entries(baseTypes);
            let keysCache = await cache.keys();
            let valuesCache = await cache.values();
            let entriesCache = await cache.entries();
            let reversedCache = cache.reverse();
            expect(reversedCache instanceof RocksDbCache).to.equal(true);
            let keysReverse = await reversedCache.keys();
            let valuesReverse = await reversedCache.values();
            let entriesReverse = await reversedCache.entries();
            expect(keysReverse.reverse()).to.deep.equal(keysCache);
            expect(valuesReverse.reverse()).to.deep.equal(valuesCache);
            expect(entriesReverse.reverse()).to.deep.equal(entriesCache);
        });
    });
}
