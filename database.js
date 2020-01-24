const fs = require('fs');
const dbpath = 'db.json';

function readDB(){
    return new Promise( function(resolve, reject) {

        const read = fs.createReadStream(dbpath);
        let body = '';

        read.on('data', (chunk) => {
            //console.log(chunk.toString())
            body += chunk.toString();
        });

        read.on('end', (_) => {
            // console.log(body);
            resolve(JSON.parse(body));
        });
        
        read.on('error', (err) => {
            // console.log(err);
            reject(err);
        });

    });
    
}

function writeDB(users) {
    return new Promise(function(resolve, reject) {
        const writeS = fs.createWriteStream(dbpath);
        writeS.write(JSON.stringify({data: {users}}), (error) => { 
            if(error){
                reject(error)
            } resolve();
        });
    });   
}

function getUser(username) {

}

const privateKey = 'sheeesd';

Object.assign(exports, {readDB, writeDB, privateKey});

/* exports.readDB = readDB;
exports.writeDB = writeDB;
exports.privateKey = privateKey; */
