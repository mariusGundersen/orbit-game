import Game from './game.js';


const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const bgCanvas = document.getElementById('background');
const bgCtx = bgCanvas.getContext('2d');


export let W, H;
function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * devicePixelRatio;
    canvas.height = H * devicePixelRatio;
    bgCanvas.width = W * devicePixelRatio;
    bgCanvas.height = H * devicePixelRatio;
    drawBackground();
}
resize();

window.addEventListener('resize', resize);

let game = new Game();

function drawBackground() {
    const stars = [];
    for (let i = 0; i < 200; i++) {
        stars.push({
            x: Math.random() * W,
            y: Math.random() * H,
            size: Math.random() * 1.5 + 0.5,
            alpha: Math.random() * 0.5 + 0.3
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

export function worldToScreen(x, y) {
    const cx = W / 2;
    const cy = H / 2;
    return { 
        x: cx + (x + game.viewport.x - cx) * game.viewport.zoom, 
        y: cy + (y + game.viewport.y - cy) * game.viewport.zoom 
    };
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
    ctx.fillText(`DV: ${Math.round(game.ship.fuel)}`, W - 20, 30);
    ctx.fillText(`LEVEL ${game.level}`, W - 20, 50);
    ctx.textAlign = 'left';
    
    ctx.font = '12px "Courier New", monospace';
    ctx.fillStyle = '#ff6600';
    ctx.globalAlpha = 0.5;
    ctx.textAlign = 'left';
    ctx.fillText('◄ RETRO', 20, H - 40);
    
    ctx.fillStyle = '#00ff88';
    ctx.textAlign = 'right';
    ctx.fillText('PROGRADE ►', W - 20, H - 40);
    ctx.globalAlpha = 1;
    
    
    if (game.level === 1 ) {
        ctx.font = '12px "Courier New", monospace';
        ctx.fillStyle = '#aaaaaa';
        ctx.globalAlpha = 0.7;
        ctx.textAlign = 'center';
        ctx.fillText('TAP LEFT TO BURN RETROGRADE', W / 2, H - 85);
        ctx.fillText('TAP RIGHT TO BURN PROGRADE', W / 2, H - 70);
        ctx.globalAlpha = 1;
    }
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
    ctx.fillText(`Highest Level: ${game.level}`, W / 2, 90);
        
    ctx.font = '14px "Courier New", monospace';
    ctx.fillStyle = '#666666';
    ctx.fillText('Click to restart', W / 2, H - 30);
}

function resetGame() {
    game = new Game(game.viewport);
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
    
    game.update(dt);

    ctx.reset();
    ctx.scale(devicePixelRatio, devicePixelRatio);
    
    game.draw(ctx);
    if(game.gameOver){
        drawGameOver();
    }else{
        drawUI(avgFps);
    }
    
    
    ctx.resetTransform();
    requestAnimationFrame(gameLoop);
}

function handleStart(e) {
    e.preventDefault();
    if (game.gameOver) {
        if(!game.viewport.sliding){
            resetGame();
        }
        return;
    }
    
    game.ship.setThrust(e.clientX < W / 2 ? -1 : 1);
}

function handleEnd(e) {
    e.preventDefault();
    game.ship.setThrust(0);
}

canvas.addEventListener('pointerdown', handleStart);
canvas.addEventListener('pointerup', handleEnd);
canvas.addEventListener('pointerleave', handleEnd);

function handleKeyDown(e) {
    if (game.gameOver) {
        if(!game.viewport.sliding){
            resetGame();
        }
        return;
    }
    
    if (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.code === 'KeyQ') {
        game.ship.setThrust(-1);
    } else if (e.code === 'ArrowRight' || e.code === 'KeyD' || e.code === 'KeyW') {
        game.ship.setThrust(1);
    }
}

function handleKeyUp(e) {
    if (e.code === 'ArrowLeft' || e.code === 'KeyA' || e.code === 'KeyQ' || 
        e.code === 'ArrowRight' || e.code === 'KeyD' || e.code === 'KeyW') {
        game.ship.setThrust(0);
    }
}

window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);

requestAnimationFrame(gameLoop);