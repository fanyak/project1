const partial = (fn, ...initialArgs) => {
    return function p(...finalArgs) {
        console.log(...initialArgs, ...finalArgs)
        return fn(...initialArgs, ...finalArgs);
    }
}

const curry = (fn) => {
    return function curried(...args) {
        if(args.length < fn.length){
            return curried.bind(null, ...args)
        } else {
            return fn(...args);
        }
    }
}

const compose = (...fns) => {
    return function composed(x) {
        return fns.reduceRight((y, f) => f(y) , x);
    }
}

function arrayMethod(methodName, mappingFn) {
    return function(array) {
        return array[methodName](mappingFn);
    }
}

