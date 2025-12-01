# Node.js Fundamentals
 
## What is Node.js?
Node.js its an open source and cross-platform runtime environment for executing  java script outside the browser. Often used to build backend services also called API's.

## How does Node.js differ from running JavaScript in the browser?
1. Execution host is Operating system and not browser
2. Access to file via fs module, it can easily store secrets, js in browser does not have acces to files (sandboxed)

## What is the V8 engine, and how does Node use it?
The V8 engine is Google's open-source, high-performance JavaScript and WebAssembly engine written in C++. It's the core program that takes the JavaScript code you write and translates it into machine code that a computer's processor can execute directly.
V8 is the runtime environment for JavaScript code within Node.js. 
V8 is responsible for all the compilation and execution of the code, when we are running Node.js script.

## What are some key use cases for Node.js?
RESTful APIs and Web Servers, Real-Time Applications, Command Line Interface (CLI) Tools
Data-Intensive Applications
##  
CommonJS is synchronous and was originally designed for Node.js, while ES Modules are asynchronous and are the standardized system for both Node.js and modern web browsers. 
Syntax: CJS uses require and module.exports and exports, while EJS uses import and export
Loading: CJS Synchronous, EJS Asynchronous
Binding: CJs Exports a copy of the variable at the time of export. Changes to the variable in the original module are not reflected in the importing module. EJS Exports a live reference (binding) to the original variable. Changes in the original module are reflected.
CJS exports a *copy* (snapshot) of the value, not a live binding like ESM. 
**CommonJS (default in Node.js):**
```js
JavaScript

//counter.cjs
let count = 0;

function increment() {
    count++;
    console.log(`counter.js count inside increment(): ${count}`);
}

module.exports = {
    count: count, //0
    increment: increment //ref to a func
};

// consumer.js

const counter = require('./counter.cjs');

console.log(`Initial state:`);
console.log(`\nConsumer count: ${counter.count}`); // Output: 0


counter.increment(); 


console.log(`\nAfter calling increment():`);
console.log(`\nConsumer count: ${counter.count}`); 
// Output: 0 
```
**ES Modules (supported in modern Node.js):**       
```js
// counter.mjs - file that exports variable and function
export let count = 0;

export function increment() {
    count++;
}
// another file imports the variable and change it
import { count, increment } from './counter.mjs';

console.log(count); // Output: 0
increment();        // Changes count to 1 inside counter.mjs
console.log(count); // Output: 1
``` 