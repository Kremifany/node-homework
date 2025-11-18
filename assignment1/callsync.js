function syncfunc() {
    console.log("In syncfunc.  No async operations here.")
    return "Returned from syncfunc."
}

async function asyncCaller() {
    console.log("About to wait.")
    const res = syncfunc()
    console.log(`***************In asyncCaller the syncFunc of type ${typeof res}`)
    if (typeof res == "string") {
    console.log(`**************That object is of class ${res.constructor.name}`)
}
    console.log(res)
    return "asyncCaller complete."
}

console.log("Calling asyncCaller")
const r = asyncCaller()
console.log(`Got back a value from asyncCaller of type ${typeof r}`)
if (typeof r == "object") {
    console.log(`That object is of class ${r.constructor.name}`)
}
r.then(resolvesTo => {
    console.log("The promise resolves to: ", resolvesTo)
})
console.log("Finished.")
