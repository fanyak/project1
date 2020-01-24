const http = require('http');
const path = require('path');
const fs = require('fs');
const etag = require('etag');
// parse forms
const util = require('util');
const formidable = require('formidable');
const { compress } = require('./compress.js');
const jwt = require('jsonwebtoken');

const mime = require('mime-types');

const zlib = require('zlib');
const gzip = zlib.createGzip();



// db
const { readDB, writeDB, privateKey } = require('./database.js');



const port = 8080;

const server = http.createServer((req, res) => {

    const et = etag('hello world');
    if(req.url === '/') {
        req.url = '/index.html';
    }
    const paths = path.join(__dirname, req.url);
    const [p] = paths.split('?');

    const url = new URL(path.join(process.cwd(), req.url));
    const searchParams = url.searchParams;

    // setup cors
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000')

    if(req.url === '/favicon.ico') {
        res.end();
        return;
    }

    // console.log(req.url, p);

    /**************** GET **************/

    if(req.method === 'GET') {

        if(req.headers && 'if-none-match' in req.headers) {
            if(req.headers['if-none-match'] === et){
                res.writeHead(304);
                res.end();
                return;
            }
        }

        if(new RegExp(/\/user\/[a-z0-9]/).test(req.url)) {
            const token = req.headers['authorization'];
            if(token){
                const [bearer, key]= token.split('Bearer');
                const user = jwt.verify(key.trim(), privateKey);
                res.end(JSON.stringify(user));
                return;
            } 
            res.writeHead(401);
            res.end();
            return;            
        }
    
        const readStream = fs.createReadStream(p);
        
    
        if(req.url.includes('/index.html') || req.url === '/') {
    
           res.setHeader('etag', et)
           res.setHeader('Cache-Control', 'no-cache');
           res.setHeader('Content-Type', 'text/html');
    
            readStream.on('open', (n) => {
                readStream.pipe(res);
            })
    
            readStream.on('close', (n)=> {
                res.end();
            })
        } else if(req.url.includes('/authorization.html')) {
            
            const mode = searchParams.get('mode');
    
            if(mode) {
                res.setHeader('Cache-Control', 'max-age=3600');
                res.setHeader('Content-Type', 'text/html');
        
        
                // console.log('mode: ', mode);
        
                readStream.on('open', (n) => {
                    readStream.pipe(res);
                })
        
                readStream.on('close', (n)=> {
                    res.end();
                });
            }
        } else { // if(new RegExp(/.\.(jpg|png)/).test(req.url)){

            res.setHeader('Content-Type', mime.lookup(req.url));
            res.setHeader('Cache-Control', 'no-cache');
            
            readStream.on('open', (fd) => {
                readStream.pipe(res);
            });
            readStream.on('close', (fd) => {
                res.end()
            })
        }
    
    }

    // POST
    /*************** POST  **************/
    if(req.method === 'POST') {

        // Instantiate a new formidable form for processing.

        const form = new formidable.IncomingForm();
        form.encoding = 'utf-8';
        //set the dir where form uploads are saved - change later with fs.rename
        form.uploadDir = "./uploads/";
        
        if(req.url.includes('authorization')) {

        let users;
         readDB().then( (data) => {
            ({users} = data.data);            
             
                /* let body = ''
                req.on('data', (chunk) => {
                        body += chunk.toString();
                    });

                    req.on('end', (ev) => {
                        console.log(body)
                        res.end('ok');
                    }) */

                form.parse(req, function(err, fields, files) {

                    if (err) {          
                        // Check for and handle any errors here.          
                        console.error(err.message);
                        return;
                    }

                    const foundUser = users.find((user) => user.username === fields.username);


                    // res.writeHead(200, {'content-type': 'application/json'});
                    // res.write('received upload:\n\n');

                    if(foundUser) {
                        console.log('foundUser')
                        const token = jwt.sign({ ...foundUser }, privateKey);
                        res.end(JSON.stringify({token}));
                        return;
                    }
            
                    // This last line responds to the form submission with a list of the parsed data and files.
                    if(files) {

                        for(file in files){

                            if(files[file].size) {
                                const writable = path.join('uploads', files[file].name);
                                /* const str = files[file].path;
                                    const chars = [...str].map((char) => {
                                        if (char === '\\') {
                                            return '/'
                                        } return char;
                                    });
                                    compress(chars.join('')).then(console.log).catch((err) => console.log(111, err)) 
                                */
                                fs.rename( files[file].path, writable, (err) => {
                                        if(err){
                                                throw(err)
                                            }  fs.stat(writable, (err, stats)=> {
                                                if(err){
                                                    throw(err);
                                                } //console.log(stats)
                                               }); 

                                            compress(`uploads/${files[file].name}`).then(console.log).catch((err) => console.log(111, err));

                                } );
                            }
                        }
                    }
                    
                    users.push({...fields, files});
                    

                    writeDB(users)
                        .then((_) => {
                            const token = jwt.sign({ ...fields }, privateKey);
                            res.writeHead(301, {'Content-Type': 'text/html', 'Location': `../index.html?token=${token}`});
                            res.end();
                            res.end(JSON.stringify({fields, files, token}));
                        })
                        .catch((err) => console.log(err));
                
                });
                
            } );

        }

    }
       
        
    

});
server.listen(port, ()=> console.log(`server listenig on ${port}`));






