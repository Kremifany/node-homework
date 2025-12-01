const fs = require('fs');
const fsPromises = require("fs/promises");
const path = require('path');      

const fileName = path.join(__dirname,"./sample-files/sample.txt");

// Write a sample file for demonstration //
fs.writeFileSync(fileName, "Hello, async world!", 'utf8');



// 1. Callback style
fs.readFile(fileName,'utf-8',(err,data)=>{
  try{
    console.log("Callback read: "+ data)
  }
  catch (err) {
    console.log("An error occurred.", err);
  }
}
)
// Callback hell example (test and leave it in comments):
//---reads the file
// fs.readFile(fileName,'utf8',(err,data) =>{
//   if(err){
//     console.log("something went wrong",err);
//     return
//   }
//   console.log('Data readed successfully from ' + fileName);
//   console.log(data)
//---appends to the file
//   fs.appendFile(fileName, "\n21,AsycFunctions",'utf8',()=>{
//     if (err) {
//       console.error("Append Error:", err);
//       return;
//     }
//     console.log('Data appended successfully to ' + fileName);
//---reads the file again
//     fs.readFile(fileName,'utf8',(err,data) =>{
//     if(err){
//       console.log("something went wrong",err);
//       return
//     }
//     console.log('Data readed successfully from ' + fileName + 'after data was appended');
//     console.log(data)
//   });
// });
// });


// 2. Promise style

const doFileOperations = async () => {
  try {
    const filehandle = await new Promise((resolve, reject) => {
      fs.readFile(fileName, 'utf-8', (err, filehandle) => {
        return err ? reject(err) : resolve(filehandle);
      });
    })
    console.log("Promise read: "+ filehandle)
  } catch (err) {
    console.log("An error occurred in reading data.", err);
    return
  }
};

doFileOperations();



// 3. Async/Await style
const doFileOperationsAwaitAsync = async () => {
  try {
    const filehandle = await fsPromises.readFile(fileName, 'utf-8')
    console.log("Async/Await read: "+ filehandle)
  } catch (err) {
     console.log("An error occurred in reading data.", err);
     return
  }
};

doFileOperationsAwaitAsync();









