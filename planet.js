// @ts-check

export default class Planet {
    static DENSITY = 80;
    static COLORS = ['#ff6b35', '#7b2cbf', '#2ec4b6', '#e71d36', '#ff9f1c', '#7209b7', '#06d6a0', '#ffd166'];

    /**
     * @param {number} x
     * @param {number} y
     * @param {number} mass
     * @param {string} color
     */

    /*
    

    const radius = 35 + Math.random() * 30;
    const mass = radius * 80;
    */
    constructor(x, y, mass = Planet.randomMass(), color = Planet.randomColor()){
        this.x = x;
        this.y = y;
        this.mass = mass;
        this.radius = mass/Planet.DENSITY;
        this.color = color;
    }

    static randomColor(){
        return Planet.COLORS[Math.floor(Math.random() * Planet.COLORS.length)];
    }

    static randomMass(){
        return (35 + Math.random()*30)*Planet.DENSITY;
    }
}