const EventEmitter = require("events");
const emitter = new EventEmitter();
emitter.on('time',(msg) => {
    console.log("Time was received: ",msg)
}) 
setInterval(() => {
    const t = new Date().toString()
    emitter.emit('time',t)
}, 5000)

module.exports = emitter;