
import { setAuth, get } from './http.js';

const dragAndDrop = document.body.querySelector('.dragAndDrop');

if(window.location.href.includes('token')) {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('token');
    if(token) {
        setAuth(token);
        const strippedUrl = window.location.href.replace(/\??token=[^&]+/, '');
        window.history.replaceState(null, "", strippedUrl);
        get(`/user/${token}`)
        .then(appendUser)
        .catch((error) => console.error('captured error:' , error));
    }
} else {
    // setUpDrangAndDrop();
}


function appendUser(user) {
    if('content' in document.createElement('template')) {
       const clone = document.getElementById('loggedIn').content.cloneNode(true);
       clone.querySelector("#username").textContent = user.username;

       const child = document.body.querySelector("#unknownUser");
       const header = document.body.querySelector("header"); 
       
       header.removeChild(child);
       header.appendChild(clone);

       setUpDrangAndDrop();
    }
}


function setUpDrangAndDrop() {
    dragAndDrop.removeAttribute('hidden');

    const request = indexedDB.open('dogphotos');
    request.onupgradeneeded = function(e) {
        const db = e.target.result;
        const store = db.createObjectStore('photos', {keyPath: 'url'});
        store.createIndex('url', 'url', {unique: true});

        // prevent changing from a different tab
        useDatabase(db)
    }

    request.onsuccess = function (e) {
        const db = e.target.result;
        const store = db.transaction('photos', 'readonly').objectStore('photos');
        const req = store.getAll();
        req.onsuccess = function (event){
            const res = event.target.result;
            res.forEach(element => {
                const imgurl = URL.createObjectURL(element.blob);
                const image = new Image(100);
                image.src = imgurl;
                
                image.onclick = function(event) {
                    const store = db.transaction('photos','readwrite').objectStore('photos');
                    store.delete(element.url);
                    store.transaction.oncomplete = function(_) {
                        const child = Array.from(dragAndDrop.children).find((child) => child == event.srcElement);
                        dragAndDrop.removeChild(child);
                    }
                }
                dragAndDrop.appendChild(image);
            });
            useDatabase(db)
        }
        
    }

    request.onerror = function(e) {
        alert(e.target.error);
    }
    
    function useDatabase(db) {
        console.log(db)
        db.versionchange = function(event) {
            db.close();
        }
    }
   
}





