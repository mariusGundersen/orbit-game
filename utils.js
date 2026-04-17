// @ts-check

/**
 * @template T
 * @param {number} length
 * @param {(index: number) => T} factory
 * @returns {T[]}
 */
export function generateArray(length, factory){
    const array = new Array(length);
    for(let i=0; i<length; i++){
        array[i] = factory(i);
    }
    return array;
} 