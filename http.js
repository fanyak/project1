const headers = {  
};


export function setAuth(token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log(headers)
}


export function get(url) {
    return fetch(url, {
        method: 'GET',
        headers,
    }).then((response) => {

        if(!response.ok) {
                throw Error(response.statusText);
        }
            
        return response.json();

        }
    )
}
