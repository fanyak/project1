(
    function carousel() {
        const prefix ='https://images.unsplash.com/';
        const urls = [
            'photo-1544568100-847a948585b9',
            'photo-1517423440428-a5a00ad493e8',
            'photo-1510771463146-e89e6e86560e',
            'photo-1507146426996-ef05306b995a',
            'photo-1530281700549-e82e7bf110d6',
            'photo-1548199973-03cce0bbc87b',
            'photo-1552053831-71594a27632d',
        ];

        const items = document.querySelector('.items');

        const carousel = document.querySelector('.carousel');

        const selector = document.querySelector('.selection button');
        
        urls.forEach((url) => getImage(url));

        function getImage(url, size = 100) {           

            return fetch(`${prefix}${url}?w=${size}`, {
                method: 'GET',
                headers: {
                    // 'cache-control': 'no-cache',
                    'accept': 'image/*',
                    'accept-encoding': 'gzip',
                },
                mode: 'cors',
            })
            .then((response) => {
                if(!response.ok) {
                    throw Error(response.statusText);
                } return response.blob();
            } )
            .catch((error) => new Blob()) // @TODO add a not found image from service worker
            .then((imgBlob) => {
                const image = new Image(size);
                image.style.minWidth = `${size}px`;
                const imageUrl = URL.createObjectURL(imgBlob);
                image.src = imageUrl;
                image.alt= 'dog'

                items.appendChild(image);
                image.onload = function() {
                    URL.revokeObjectURL(this.src)
                }

                // const reader = new FileReader();
                // reader.readAsDataURL(imgBlob);

                // reader.onloadend = function(evt) {
                //     const image = new Image(400);
                //     image.src = reader.result;
                //     document.body.appendChild(image); 
                // }                           
            });
        }

        const hasPointer = window.PointerEvent;

        if(hasPointer) {
            items.addEventListener('pointerdown', touchStart);
            items.addEventListener('pointerup', touchEnd);
            items.addEventListener('pointercancel', touchEnd);
        } else {
            items.addEventListener('mousedown', touchStart, true);

            items.addEventListener('touchstart', touchStart);
            items.addEventListener('touchend', touchEnd);
            items.addEventListener('touchcancel', touchEnd);
        }

        let startPoint = {};
        let diff = 0;

        function touchStart(evt) { 

            evt.preventDefault();

            startPoint['clientX'] = evt.clientX;
            startPoint['clientY'] = evt.clientY;

            
            if(hasPointer) {
                items.setPointerCapture(evt.pointerId);
                items.addEventListener('pointermove', touchMove);
            } else {
                if(event.touches) {

                    items.addEventListener('touchmove', touchMove);
                    const [touchEvent] = [].slice.call(event.targetTouches, 0);
                    // console.log(touchEvent);
                    startPoint['clientX'] = touchEvent.clientX;
                    startPoint['clientY'] = touchEvent.clientY;
                    lastPosition = startPoint['clientX'];
                } else {

                    document.body.addEventListener('mousemove', touchMove);
                    document.body.addEventListener('mouseup', touchEnd);
                }
            }

        }

        function touchMove(evt) {
            let touchEvent;
            console.log(evt)
            if(evt.touches) {
              [touchEvent] = [].slice.call(evt.targetTouches, 0);
            }
            const {clientX, clientY} = touchEvent ||  evt;

            diff += (clientX - startPoint.clientX) / 7;

            if(diff > 200) {
                diff = 200;
            }    
            if (diff < -500) {
                diff = -500;
            }   

            window.requestAnimationFrame(() => {
                items.style.transform = `translateX(${diff}px)`;
            });
        }

        function touchEnd(evt) {
            console.log(evt);
           
            if(hasPointer) {
                items.removeEventListener('pointermove', touchMove);
                items.releasePointerCapture(evt.pointerId);
            } else {
                if(event.touches) {
                    // console.log(event.touches);
                    items.removeEventListener('touchmove', touchMove);
                } else {
                    document.body.removeEventListener('mousemove', touchMove);
                    document.body.removeEventListener('mouseup', touchEnd);
                }
            }
            
        }

        /* ********************************* */

        selector.addEventListener('click', (event) => {
            console.log(event.srcElement, event.currentTarget, diff);
            const imgIndx = Math.max((urls.length -1) - Math.abs((Math.floor(diff/100))), 0);
            console.log(imgIndx)
            openModal(imgIndx)
        })

        function openModal(srcImg) {
           const clone =  document.getElementById('modal').content.cloneNode(true);
           document.body.appendChild(clone);

            fetch(`${prefix}${urls[srcImg]}?w=400`)
            .then((response) => response.blob())
            .then((imageBlob) => {
                const imgUrl = URL.createObjectURL(imageBlob);

                const modal = document.body.querySelector('.modal');
                const [close, save] = [].slice.call(modal.querySelectorAll('button'), 0);

                const header = modal.querySelector('h2');

                modal.querySelector('img').src = imgUrl;
                header.focus();

                close.addEventListener('click', (e) => {
                   document.body.removeChild(modal);
                });

                save.addEventListener('click', function(event) {

                    if(window.indexedDB){
                        let db;
                        let version; 
                        let added = false;

                        let request = indexedDB.open('dogphotos');

                        request.onupgradeneeded = function(e) {
                            const db = e.target.result;
                            const store = db.createObjectStore('photos', {keyPath: 'url'});
                            store.createIndex('url', 'url', {unique: true});
                            store.transaction.oncomplete = function(e) {
                                    const transaction = db.transaction('photos', 'readwrite');
                                
                                    transaction.oncomplete = function(e) {
                                        close.click();
                                    }
                                    transaction.onerror = function(e) {
                                        console.log(e);
                                    }

                                    const store = transaction.objectStore('photos');
                                    store.add({url: srcImg, blob: imageBlob});
                                    added = true;
                            }

                        }
                        // console.log(request);
                        request.onerror = function(ev) {

                        };
                        request.onsuccess = function(ev) {
                            const db = ev.target.result;
                            
                            if(!added) {
                               const transaction  = db.transaction('photos', 'readwrite');
                               
                               transaction.oncomplete = function(e) {
                                const dragAndDrop = document.body.querySelector('.dragAndDrop');
                                const image = new Image(100);
                                const imageUrl = URL.createObjectURL(imageBlob);
                                image.src = imageUrl;
                                dragAndDrop.appendChild(image);
                                image.onclick = function(e) {
                                    db.transaction('photos', 'readwrite').objectStore('photos').delete(srcImg);
                                    dragAndDrop.removeChild(Array.from(dragAndDrop.children).find((child) => child == image));
                                }
                                close.click();
                               }

                               transaction.onerror = function(e) {
                                   console.log(e.target.error);
                               }

                               const store = transaction.objectStore('photos');
                               store.add({url: srcImg, blob: imageBlob});

                            }
                             console.log(db);

                            db.onerror = function(errorEvent) {
                                console.log(errorEvent.target.error)
                            }                        

                          
                        }

                       

                     }
                    
                });

                save.addEventListener('keydown',(evt) => {
                    if(event.key === 'Tab' && !event.shiftKey) {
                        event.preventDefault();
                        header.focus();
                    }
                });
               
                header.addEventListener('keydown',(evt) => {
                    console.log(event)
                    if(event.key === 'Tab' && event.shiftKey) {
                        event.preventDefault();
                        save.focus();
                    }
                });
            })
        }

        function createStore(v) {
            return new Promise(function(resolve, reject) {
                const request = indexedDB.open('dogphotos', v);

                request.onupgradeneeded = function(e) {
                   const store =  e.target.result.createObjectStore('photos', {keyPath: "url"});
                   store.createIndex('url', 'url', {unique: true});
                } 
               
                // onsuccess runs after onupgradeneeded
                request.onsuccess = function(event) {
                    let db = event.target.result;
                    resolve(db);

                    db.onerror = function(e) {
                        reject(e)
                    }
                }
                request.onerror = function(e) {
                    reject(e)
                } 
               
            });
            

            
        }


    }
    
   
)();
