[![gitter chat](https://img.shields.io/gitter/room/valentech/rocksdb-cache.svg?style=flat-square)](https://matrix.to/#/!VDMFZOKVhSMnIuXdso:gitter.im?via=gitter.im)
[![npm downloads](https://img.shields.io/npm/dm/@valentech/rocksdb-cache.svg?style=flat-square)](https://npm-stat.com/charts.html?package=@valentech/rocksdb-cache)

# `RocksDbCache`

Note: Unstable API, stay tuned for version 1.1.

This Node.js package provides a simple cache implementation that uses RocksDB as its underlying storage engine. Its API is similar to that of JavaScript's [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map), with all methods being asynchronous. However, there are a few minor differences which are highlighted below.

The keys used in this cache must be of type string, while the value can be of any data type. Values are serialized using a custom fork of [Sializer](https://www.npmjs.com/package/@valentech/sializer) with some bug fixes, and then compressed using LZ4. The default Snappy compression of RocksDB is disabled.

This package also includes a Least Recently Used (LRU) read cache that works for both single and bulk operations.

## Installation


`npm install @valentech/rocksdb-cache` 

## Usage
    
    `import RocksDbCache from '@valentech/rocksdb-cache';
    
    const path = './cache';
    const cache = new RocksDbCache(path);
    
    // Value can be anything serializable by Sializer
    await cache.set(key, value);
    console.log(await cache.get(key));` 

## API

### `constructor(path)`

Example: `new RocksDbCache('./cache')`

### `cache.set(key, value) or cache.set(entries[]<[key,value]>)`

Sets the value for the key in the cache. If the value is a promise it will be resolved before it is set.

`cache.set(entries)`:  Sets the entries in the cache. `entries` can be any iterable (such as Array, Map, RocksDbCache) which yields a valid entry: `[key, value]`. 

### `cache.get(key) or cache.get(keys[]<key>)`

Returns the value associated to the key, or `undefined` if there is none.

`cache.get(keys)`:  Gets the values associated with keys or undefined if key is not defined. `keys` can be any iterable (such as Array, Set) which yields a valid key: `key`. 

### `cache.has(key) or cache.has(keys[]<key>)`

Returns a boolean indicating whether an element with the specified key exists or not.

`cache.has(keys)`:  Returns booleans indicating whether the elements with the specified keys exist or not. `keys` can be any iterable (such as Array, Set) which yields a valid key: `key`. 

### `cache.delete(key) or cache.delete(keys[]<key>)`

Removes any value associated with the key.  <u>Always returns `true`</u>, unlike Map.prototype.delete which returns `false` if there was no value associated with the key.

`cache.delete(keys)`:  Removes any values associated with the keys.  <u>Always returns `true`</u>. `keys` can be any iterable (such as Array, Set) which yields a valid key: `key`. 

### `cache.clear()`

Removes all key-value pairs from the cache.

### ~~`cache.size`~~

~~Returns the number of key-value pairs in the cache.~~ Cannot be implemented any faster than iterating through all elements, due to the nature of leveldb.

### <u>Async iterator</u>

As all methods are async, <u>there is no `Symbol.iterator` method</u>. However, you can use an async iterator like this:


`for await (let [key, value] of cache) {
  // Do something
}` 

## Example


    import RocksDbCache from '@valentech/rocksdb-cache';
    
    async function example() {
      const path = './cache';
      const cache = new RocksDbCache(path);
    
      const key = 'example';
      const value = { foo: 'bar' };
    
      await cache.set(key, value);
      console.log(await cache.get(key));
    
      console.log(await cache.has(key));
      await cache.delete(key);
      console.log(await cache.has(key));
    
      await cache.clear();
    }
    
    example();
