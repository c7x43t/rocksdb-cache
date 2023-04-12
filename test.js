import { describe, it, before } from 'mocha';
import RocksDbCache from './index.js';
import { expect } from 'chai';

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
        value: 42n,
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
    {
        description: 'function',
        value: function () {
            return 'Hello, world!';
        },
    },
    {
        description: 'arrow function',
        value: () => 'Hello, world!',
    },
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
        value: new Float32Array([1.1, 2.2, 3.3]),
    },
    {
        description: 'Float64Array',
        value: new Float64Array([1.1, 2.2, 3.3]),
    },
    {
        description: 'BigInt64Array',
        value: new BigInt64Array([1n, 2n, 3n]),
    },
    {
        description: 'BigUint64Array',
        value: new BigUint64Array([1n, 2n, 3n]),
    },
    {
        description: 'BigInt',
        value: 42n,
    },
    {
        description: 'Symbol',
        value: Symbol('test'),
    },
    // {
    //     description: 'error',
    //     value: new Error('Test error'),
    // },
];
const baseTypes = {
    string: 'string',
    number: 42,
    BigInt: BigInt(42),
    boolean: true,
    null: null,
    undefined: undefined,
    array: [1, 2, 3],
    object: { key: 'value' },
    function: function () { },
    arrowFunction: () => { },
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
    Float32Array: new Float32Array([1, 2, 3]),
    Float64Array: new Float64Array([1, 2, 3]),
    BigInt64Array: new BigInt64Array([BigInt(1), BigInt(2), BigInt(3)]),
    BigUint64Array: new BigUint64Array([BigInt(1), BigInt(2), BigInt(3)]),
    Symbol: Symbol('test'),
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
describe('RocksDbCache basic get and set operations', () => {
    const path = './cache';
    let cache;
    // before(async () => {
    //     await cache.clear();
    // });
    before(async () => {
        cache = new RocksDbCache(path);
        await cache.clear();
    });

    after(async () => {
        await cache.close();
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
        const description = `mixedTypes`;
        const value = createMixedTypesObject();
        it(`should set and get Map, Set, Object, Array, containing all types`, async () => {
            await cache.set(description, value);
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

describe('RocksDbCache other operations', () => {
    const path = './cache';
    let cache;
    // before(async () => {
    //     await cache.clear();
    // });
    beforeEach(async () => {
        cache = new RocksDbCache(path, { lruCache: false });
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
    });
    it('should set and get many values', async () => {
        let testData = {};
        for (let i = 0; i < 1e2; i++) testData[`key${i}`] = i;
        await cache.set(Object.entries(testData));
        let values = await cache.get(Object.keys(testData));
        expect(values).to.deep.equal(Object.values(testData));
        await cache.clear();
        await cache.set(testData);
        values = await cache.get(new Set(Object.keys(testData)));
        expect(values).to.deep.equal(Object.values(testData));
        await cache.clear();
        await cache.set(new Map(Object.entries(testData)));
        values = await cache.get(Object.keys(testData));
        expect(values).to.deep.equal(Object.values(testData));
    });
});