// @ts-check

let seed = hashCode(new Date().toDateString());

/**
 * @param {string} str
 */
function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

export function reset(str = new Date().toDateString()){
    seed = hashCode(str);
}

export function rand() {
    seed ^= seed << 13;
    seed ^= seed >> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 0xffffffff;
}