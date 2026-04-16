import Planet from './planet.js';
import Ship from './ship.js';


const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const bgCanvas = document.getElementById('background');
const bgCtx = bgCanvas.getContext('2d');

let seed = hashCode(new Date().toDateString());
function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}
function rand() {
    seed ^= seed << 13;
    seed ^= seed >> 17;
    seed ^= seed << 5;
    return (seed >>> 0) / 0xffffffff;
}

export { rand };
export let W, H;
function resize() {
    W = window.innerWidth;
    canvas.width = W * devicePixelRatio;
    H = window.innerHeight;
    canvas.height = H * devicePixelRatio;
    bgCanvas.width = W * devicePixelRatio;
    bgCanvas.height = H * devicePixelRatio;
    drawBackground();
}
resize();
window.addEventListener('resize', resize);

export const G = 800;

const AUTO_CIRCULARIZE = false;


/** @type {Planet[]} */
let planets = [];
function drawBackground() {
    const stars = [];
    for (let i = 0; i < 200; i++) {
        stars.push({
            x: rand() * W,
            y: rand() * H,
            size: rand() * 1.5 + 0.5,
            alpha: rand() * 0.5 + 0.3
        });
    }
    bgCtx.scale(devicePixelRatio, devicePixelRatio);
    bgCtx.fillStyle = '#0a0a12';
    bgCtx.fillRect(0, 0, W, H);
    stars.forEach(s => {
        bgCtx.globalAlpha = s.alpha;
        bgCtx.fillStyle = '#ffffff';
        bgCtx.beginPath();
        bgCtx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        bgCtx.fill();
    });
    bgCtx.globalAlpha = 1;
    bgCtx.resetTransform();
}

function initPlanets() {
    planets = [];
    
    const startX = W > H ? W * 0.25 : W * 0.5;
    const startY = W > H ? H * 0.5 : H * 0.75;
    planets.push(new Planet(startX, startY, 5000, '#00e5ff'));
    
    const targetX = W > H ? W * 0.75 : W * 0.5;
    const targetY = W > H ? H * 0.5 : H * 0.25;
    planets.push(new Planet(targetX, targetY, 4500, '#ff6b35'));
}
initPlanets();

let ship = new Ship(planets.at(-2), planets.at(-1));

function initShip(orbiting, target) {
    ship = new Ship(orbiting, target);
}

let level = 1;
let time = 0;
let gameOver = false;
let zoomOutFactor = 1;
let zoomOutTarget = 1;
let zoomOutStart = 1;
let levelDeltaVs = {};
let highScores = [];
let offsetX = 0;

function loadHighScores() {
    const stored = localStorage.getItem('orbitHighScores');
    if (stored) {
        highScores = JSON.parse(stored);
    }
}

function saveHighScore(lvl, dv) {
    if (!highScores[lvl] || dv < highScores[lvl]) {
        highScores[lvl] = dv;
        localStorage.setItem('orbitHighScores', JSON.stringify(highScores));
    }
}

loadHighScores();
let offsetY = 0;
let sliding = false;
let slideProgress = 0;
let slideStartX = 0;
let slideStartY = 0;
let slideTargetX = 0;
let slideTargetY = 0;
let perigeePos = null;
let explosions = [];

function createExplosion(x, y, color, radius) {
    const particles = [];
    for (let i = 0; i < 50; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 100 + Math.random() * 200;
        particles.push({
            x: x + Math.cos(angle) * radius,
            y: y + Math.sin(angle) * radius,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            alpha: 1,
            size: 3 + Math.random() * 6,
            color: color
        });
    }
    explosions.push({ particles, time: 0 });
}

function updateExplosions(dt) {
    for (let i = explosions.length - 1; i >= 0; i--) {
        const exp = explosions[i];
        exp.time += dt;
        
        for (const p of exp.particles) {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= 0.98;
            p.vy *= 0.98;
            p.alpha -= dt * 0.8;
            p.size *= 0.99;
        }
        
        if (exp.time > 1) {
            explosions.splice(i, 1);
        }
    }
}

function drawExplosions() {
    for (const exp of explosions) {
        for (const p of exp.particles) {
            if (p.alpha <= 0) continue;
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.globalAlpha = 1;
}

function generateRandomPlanet(refX, refY) {
    const t = Math.min(1, Math.max(0, (level - 1) / 9));
    const inline = (0.5 + (rand() - 0.5) * t);
    const block = (0.5 + (rand() - 0.5) * t);
    let x, y;
    if (W > H) {
        x = refX + W * block;
        y = H * inline;
    } else {
        x = W * inline;
        y = refY - H * block;
    }
    
    return new Planet(x, y);
}

function transitionToNextLevel() {
    const oldOrbit = ship.orbiting;
    const newOrbit = ship.target;
    
    const slideOffsetX = oldOrbit.x - newOrbit.x;
    const slideOffsetY = oldOrbit.y - newOrbit.y;
    
    slideStartX = offsetX;
    slideStartY = offsetY;
    slideTargetX = offsetX + slideOffsetX;
    slideTargetY = offsetY + slideOffsetY;
    slideProgress = 0;
    sliding = true;
    
    createExplosion(oldOrbit.x, oldOrbit.y, oldOrbit.color, oldOrbit.radius);
    
    const newPlanet = generateRandomPlanet(newOrbit.x, newOrbit.y);
    planets.push(newPlanet);
    ship.target = newPlanet;
    ship.orbiting = newOrbit;
    sliding = true;
    
    levelDeltaVs[level] = ship.consumedDeltaV;
    saveHighScore(level, ship.consumedDeltaV);
    level++;

    perigeePos = AUTO_CIRCULARIZE ? {
        x: ship.orbiting.x,
        y: ship.orbiting.y,
    } : null;
}

export function transformScreen(cb){
    ctx.save();
    ctx.translate(W/2, H/2);
    ctx.scale(zoomOutFactor, zoomOutFactor);
    ctx.translate(offsetX - W / 2, offsetY - H / 2);
    cb();
    ctx.restore();
}

export function worldToScreen(x, y) {
    const cx = W / 2;
    const cy = H / 2;
    return { 
        x: cx + (x + offsetX - cx) * zoomOutFactor, 
        y: cy + (y + offsetY - cy) * zoomOutFactor 
    };
}

function endGame(){
    gameOver = true;

    const orbitedPlanets = planets.slice(0, -1);
    
    const minX = Math.min(...orbitedPlanets.map(p => p.x));
    const maxX = Math.max(...orbitedPlanets.map(p => p.x));
    const minY = Math.min(...orbitedPlanets.map(p => p.y));
    const maxY = Math.max(...orbitedPlanets.map(p => p.y));
    
    const trailX = ship.trail.map(t => t.x);
    const trailY = ship.trail.map(t => t.y);
    const trailMinX = trailX.length ? Math.min(...trailX) : 0;
    const trailMaxX = trailX.length ? Math.max(...trailX) : 0;
    const trailMinY = trailY.length ? Math.min(...trailY) : 0;
    const trailMaxY = trailY.length ? Math.max(...trailY) : 0;
    
    const contentMinX = Math.min(minX, trailMinX) - 100;
    const contentMaxX = Math.max(maxX, trailMaxX) + 100;
    const contentMinY = Math.min(minY, trailMinY) - 100;
    const contentMaxY = Math.max(maxY, trailMaxY) + 100;
    
    const contentW = contentMaxX - contentMinX;
    const contentH = contentMaxY - contentMinY;
    
    const scaleX = W / contentW;
    const scaleY = H / contentH;
    const targetZoom = Math.min(scaleX, scaleY, 1);
    
    zoomOutTarget = Math.max(0.1, targetZoom);
    
    const contentCenterX = (contentMinX + contentMaxX) / 2;
    const contentCenterY = (contentMinY + contentMaxY) / 2;
    slideStartX = offsetX;
    slideStartY = offsetY;
    slideTargetX = W/2 - contentCenterX;
    slideTargetY = H/2 - contentCenterY;
    slideProgress = 0;
    sliding = true;
}

function update(dt) {
    updateExplosions(dt);
    
    if (sliding) {
        slideProgress += dt;
        if (slideProgress >= 1) {
            slideProgress = 1;
            sliding = false;
        }
        const t = slideProgress;
        const ease = t * (2 - t);
        offsetX = slideStartX + (slideTargetX - slideStartX) * ease;
        offsetY = slideStartY + (slideTargetY - slideStartY) * ease;
        zoomOutFactor = zoomOutStart + (zoomOutTarget - zoomOutStart) * ease;
    }
    
    if (gameOver) {
        return;
    }
    
    time += dt;
    
    if(ship.thrust(dt)){
        perigeePos = null;
        return;
    }
    
    const body = ship.orbiting;

    if (perigeePos) {
        const distToPerigee = Math.sqrt(
            Math.pow(ship.x - perigeePos.x, 2) + 
            Math.pow(ship.y - perigeePos.y, 2)
        );
        if (distToPerigee < 15) {
            const orbitDist = Math.sqrt(
                Math.pow(ship.x - body.x, 2) + 
                Math.pow(ship.y - body.y, 2)
            );
            const circularSpeed = Math.sqrt(G * body.mass / orbitDist);
            const currentSpeed = Math.sqrt(ship.vx * ship.vx + ship.vy * ship.vy);
            if (currentSpeed > circularSpeed) {
                ship.thrust(dt, 1);
                return;
            } else {
                const scale = circularSpeed / currentSpeed;
                ship.vx *= scale;
                ship.vy *= scale;
                perigeePos = null;
            }
        }
    }
    
    const grav = ship.orbiting.calculateForceOnObject(ship);
    const targetGrav = ship.target.calculateForceOnObject(ship);
    ship.vx += grav.ax * dt;
    ship.vy += grav.ay * dt;
    
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    
    ship.trail.unshift({ x: ship.x, y: ship.y, time });
    
    if(grav.dist < body.radius) {
        endGame();
    } else if (targetGrav.force > grav.force) {
        transitionToNextLevel();
    } 
    
    if (!gameOver && !sliding) {
        const body = ship.orbiting;
        const dx = ship.x - body.x;
        const dy = ship.y - body.y;
        const currentDist = Math.sqrt(dx * dx + dy * dy);
        const speedSq = ship.vx * ship.vx + ship.vy * ship.vy;
        
        const rx = dx / currentDist;
        const ry = dy / currentDist;
        
        const h = dx * ship.vy - dy * ship.vx;
        const eVecX = (ship.vy * h) / (G * body.mass) - rx;
        const eVecY = (-ship.vx * h) / (G * body.mass) - ry;
        const e = Math.sqrt(eVecX * eVecX + eVecY * eVecY);
        
        if (e >= 1) {
            const screenPos = worldToScreen(ship.x, ship.y);
            if (screenPos.x < -100 || screenPos.x > W + 100 || screenPos.y < -100 || screenPos.y > H + 100) {
                endGame();
            }
        }
    }
}

function drawPerigee() {
    if (!perigeePos) return;
    
    const pulse = Math.sin(time * 5) * 0.3 + 0.7;
    
    ctx.fillStyle = '#ffff00';
    ctx.globalAlpha = pulse;
    ctx.beginPath();
    ctx.arc(perigeePos.x, perigeePos.y, 6, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = '#ffff00';
    ctx.lineWidth = 2;
    ctx.globalAlpha = pulse * 0.5;
    ctx.beginPath();
    ctx.arc(perigeePos.x, perigeePos.y, 12, 0, Math.PI * 2);
    ctx.stroke();
    
    ctx.globalAlpha = 1;
}

function drawUI(avgFps) {    
    ctx.font = '14px "Courier New", monospace';
    ctx.fillStyle = '#00e5ff';
    ctx.textAlign = 'left';
    ctx.fillText(`FPS: ${Math.round(avgFps)}`, 20, 30);
    
    const graphX = 20;
    const graphY = 40;
    const graphW = 100;
    const graphH = 20;
    const maxFps = 120;
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(graphX, graphY + graphH);
    fpsHistory.forEach((fps, i) => {
        const x = graphX + (i / FPS_HISTORY_SIZE) * graphW;
        const y = graphY + graphH - (fps / maxFps) * graphH;
        ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.textAlign = 'right';
    ctx.fillText(`DV: ${Math.round(ship.consumedDeltaV)}`, W - 20, 30);
    ctx.fillText(`LEVEL ${level}`, W - 20, 50);
    ctx.textAlign = 'left';
    
    if (!gameOver) {
        ctx.font = '12px "Courier New", monospace';
        ctx.fillStyle = '#ff6600';
        ctx.globalAlpha = 0.5;
        ctx.textAlign = 'left';
        ctx.fillText('◄ RETRO', 20, H - 40);
        
        ctx.fillStyle = '#00ff88';
        ctx.textAlign = 'right';
        ctx.fillText('PROGRADE ►', W - 20, H - 40);
        ctx.globalAlpha = 1;
    }
    
    if (level === 1 && !gameOver) {
        ctx.font = '12px "Courier New", monospace';
        ctx.fillStyle = '#aaaaaa';
        ctx.globalAlpha = 0.7;
        ctx.textAlign = 'center';
        ctx.fillText('TAP LEFT TO BURN RETROGRADE', W / 2, H - 85);
        ctx.fillText('TAP RIGHT TO BURN PROGRADE', W / 2, H - 70);
        ctx.globalAlpha = 1;
    }
}

function drawWinMessage() {
    ctx.fillStyle = '#ff6b35';
    ctx.font = 'bold 36px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff6b35';
    ctx.shadowBlur = 20;
    ctx.fillText('ORBIT ESTABLISHED!', W / 2, H / 2 - 20);
    ctx.shadowBlur = 0;
    
    ctx.font = '18px "Courier New", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Level ${level}`, W / 2, H / 2 + 25);
}

function drawGameOver() {
    ctx.fillStyle = '#ff3535';
    ctx.font = 'bold 36px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ff3535';
    ctx.shadowBlur = 20;
    ctx.fillText('GAME OVER', W / 2, 50);
    ctx.shadowBlur = 0;
    
    ctx.font = '16px "Courier New", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Highest Level: ${level}`, W / 2, 90);
    
    const tableStartY = 130;
    const col1X = W / 2 - 80;
    const col2X = W / 2 + 40;
    const col3X = W / 2 + 100;
    
    ctx.font = 'bold 14px "Courier New", monospace';
    ctx.fillStyle = '#00e5ff';
    ctx.fillText('LEVEL', col1X, tableStartY);
    ctx.fillText('BEST', col2X, tableStartY);
    ctx.fillText('RUN', col3X, tableStartY);
    
    ctx.strokeStyle = '#00e5ff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 120, tableStartY + 10);
    ctx.lineTo(W / 2 + 120, tableStartY + 10);
    ctx.stroke();
    
    ctx.font = '14px "Courier New", monospace';
    const maxLevels = Math.max(level, highScores.length);
    let y = tableStartY + 25;
    for (let i = maxLevels; i > 1; i--) {
        const best = highScores[i] || 0;
        const run = levelDeltaVs[i] || 0;
        const isCurrent = i === level;
        ctx.fillStyle = isCurrent ? '#ff6b35' : '#aaaaaa';
        ctx.fillText(i.toString(), col1X, y);
        ctx.fillStyle = isCurrent ? '#00ff88' : '#666666';
        ctx.fillText(Math.round(best).toString(), col2X, y);
        ctx.fillStyle = isCurrent ? '#ff6b35' : '#aaaaaa';
        ctx.fillText(run > 0 ? Math.round(run).toString() : '-', col3X, y);
        y += 20;
    }
    
    ctx.font = '14px "Courier New", monospace';
    ctx.fillStyle = '#666666';
    ctx.fillText('Click to restart', W / 2, H - 30);
}

function resetGame() {
    seed = hashCode(new Date().toDateString());
    initPlanets();
    initShip(planets.at(-2), planets.at(-1));
    level = 1;
    gameOver = false;
    zoomOutFactor = 1;
    zoomOutStart = 1;
    zoomOutTarget = 1;
    levelDeltaVs = {};
    offsetX = 0;
    offsetY = 0;
    sliding = false;
    slideProgress = 0;
    perigeePos = null;
}

let lastTime = 0;
let dt = 0.016;
const fpsHistory = [];
const FPS_HISTORY_SIZE = 60;
function gameLoop(timestamp) {
    dt = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;
    fpsHistory.push(1 / dt);
    if (fpsHistory.length > FPS_HISTORY_SIZE) {
        fpsHistory.shift();
    }
    const avgFps = fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length;
    
    ctx.reset();
    ctx.scale(devicePixelRatio, devicePixelRatio);
    
    if(gameOver){
        transformScreen(() => {
            planets.forEach(p => p.draw(ctx, time));
            ship.draw(ctx);
            ship.drawTrail(ctx, Infinity);
        });
    }else{
        transformScreen(() => {
            ship.drawOrbitPath(ctx);
            if(level < 4){
                ship.drawSOIs(ctx);
            }
            planets.slice(-3).forEach(p => p.draw(ctx, time));
            ship.drawTrail(ctx);
            ship.draw(ctx);
            drawExplosions();
            drawPerigee();
        });
        ship.drawPointer(ctx);
    }
    drawUI(avgFps);
    
    if (gameOver) {
        drawGameOver();
    }
    
    ctx.resetTransform();
    update(dt);
    requestAnimationFrame(gameLoop);
}

function handleStart(e) {
    e.preventDefault();
    if (gameOver) {
        if(!sliding){
            resetGame();
        }
        return;
    }
    
    ship.setThrust(e.clientX < W / 2 ? -1 : 1);
}

function handleEnd(e) {
    e.preventDefault();
    ship.setThrust(0);
}

canvas.addEventListener('pointerdown', handleStart);
canvas.addEventListener('pointerup', handleEnd);
canvas.addEventListener('pointerleave', handleEnd);

function handleKeyDown(e) {
    if (gameOver) {
        if(!sliding){
            resetGame();
        }
        return;
    }
    
    if (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.code === 'KeyQ') {
        ship.setThrust(-1);
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD' || e.code === 'KeyW') {
        ship.setThrust(1);
    }
}

function handleKeyUp(e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.code === 'KeyQ' || 
        e.code === 'ArrowRight' || e.code === 'KeyD' || e.code === 'KeyW') {
        ship.setThrust(0);
    }
}

window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);

requestAnimationFrame(gameLoop);