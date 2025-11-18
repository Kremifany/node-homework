const os = require('os');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs/promises')

const sampleFilesDir = path.join(__dirname, 'sample-files');
if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}

// OS module
console.log(`Platform: ,${os.platform()}`);
console.log(`CPU: ,${os.cpus()[0].model}`)
console.log(`Total Memory: ${os.totalmem}`)


// Path module
const filePath = path.join(__dirname,"./sample-files/demo.txt");
console.log(`Joined path: ${filePath}`)

// fs.promises API


const writeReadFile = async () =>{
 try {
      await fsPromises.writeFile(filePath, "Hello from fs.promises!", 'utf8');
      const fileReadHandle = await fsPromises.readFile(filePath,'utf-8');
      console.log("fs.promises read: ", fileReadHandle) 
    } catch (err) {
       console.log("An error occurred in reading data.", err);
       return
    }
  }

  writeReadFile()
// Streams for large files- log first 40 chars of each chunk

const filePath2 = path.join(__dirname,"./sample-files/largefile.txt");
const writeReadLargeFile = async () =>{
  try {
      await fsPromises.writeFile(filePath2, " ", 'utf8');
      for(let i=0; i<100; i++){
        await fsPromises.appendFile(filePath2,"This is a line in a large file...\n");
      }
      const reader =fs.createReadStream(filePath2,{ encoding: 'utf8',highWaterMark: 1024 })
      reader.on('data', (chunk) => {
        const preview = chunk.slice(0, 40);
        console.log("Read chunk: ", chunk)
      });
      reader.on('end',() => {
        console.log("Finished reading large file with streams.")
      })

    } catch (err) {
       console.log("An error occurred in reading data.", err);
       return
    }
  }

writeReadLargeFile()