import config from './config';
import Canvas from './canvas';
import Space from './sprites/space';
import SpaceShip from './sprites/spaceShip';
import eventProvider from './events/eventProvider';
import Alien from './sprites/alien';
import Bullet from './sprites/bullet';

export default function starBattleEngine(htmlCanvas: HTMLCanvasElement) {
  const canvas = new Canvas(htmlCanvas);
  const space = new Space(canvas);
  const spaceShip = new SpaceShip(canvas);

  let aliens: Alien[] = [];
  let score = 0;
  let lives = 3;
  let wave = 0;
  let gameOver = false;
  let invincibleFrames = 0;
  let waveAnnounceFrames = 0;

  const spawnWave = () => {
    wave++;
    waveAnnounceFrames = 120;
    const count = Math.min(2 + wave, 8);
    aliens = Array.from({ length: count }, (_, i) => {
      const x = (canvas.width / (count + 1)) * (i + 1);
      const y = 60 + Math.random() * 50;
      return new Alien(canvas, x, y, () => ({
        x: spaceShip.state.x + 40,
        y: spaceShip.state.y,
      }));
    });
  };

  const resetGame = () => {
    score = 0;
    lives = 3;
    wave = 0;
    gameOver = false;
    invincibleFrames = 0;
    spaceShip.reset();
    spawnWave();
  };

  spawnWave();

  const eventLoader = eventProvider((e: Event) => {
    canvas.eventDistributor(e);
    space.eventDistributor(e);
    spaceShip.eventDistributor(e);
    if (gameOver && e.type === 'keydown') {
      const ke = e as KeyboardEvent;
      if (ke.code === 'Space' || ke.code === 'Enter') resetGame();
    }
  });

  const drawHUD = () => {
    const ctx = canvas.ctx;
    ctx.save();
    ctx.font = 'bold 20px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 4;
    ctx.fillText(`Score: ${score}`, 20, 34);
    ctx.textAlign = 'center';
    ctx.fillText(`Wave ${wave}`, canvas.width / 2, 34);
    ctx.textAlign = 'right';
    for (let i = 0; i < lives; i++) {
      ctx.fillStyle = '#ff4455';
      ctx.fillText('♥', canvas.width - 16 - i * 26, 34);
    }
    ctx.restore();
  };

  const drawWaveAnnounce = () => {
    const ctx = canvas.ctx;
    const alpha = Math.min(1, waveAnnounceFrames / 30);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 48px monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#00ffaa';
    ctx.shadowBlur = 20;
    ctx.fillText(`WAVE ${wave}`, canvas.width / 2, canvas.height / 2);
    ctx.restore();
  };

  const drawGameOver = () => {
    const ctx = canvas.ctx;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 64px monospace';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 30;
    ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 40);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px monospace';
    ctx.shadowBlur = 0;
    ctx.fillText(`Score: ${score}  |  Wave: ${wave}`, canvas.width / 2, canvas.height / 2 + 20);
    ctx.fillStyle = '#aaffaa';
    ctx.font = '20px monospace';
    ctx.fillText('Press SPACE or ENTER to restart', canvas.width / 2, canvas.height / 2 + 70);
    ctx.restore();
  };

  return setInterval(() => {
    canvas.reset();
    space.draw();

    if (gameOver) {
      drawGameOver();
      return;
    }

    // Update aliens
    aliens.forEach((alien) => alien.update());

    // Player bullets vs aliens
    const playerBulletsHit = new Set<Bullet>();
    spaceShip.state.bullets.forEach((bullet) => {
      aliens.forEach((alien) => {
        if (alien.alive && alien.checkHit(bullet)) {
          alien.takeDamage();
          playerBulletsHit.add(bullet);
          if (!alien.alive) score += 100;
        }
      });
    });
    playerBulletsHit.forEach((b) => spaceShip.removeBullet(b));

    // Alien bullets vs player
    if (invincibleFrames <= 0) {
      aliens.forEach((alien) => {
        const alienBulletsHit = new Set<Bullet>();
        alien.bullets.forEach((bullet) => {
          if (spaceShip.checkHit(bullet)) {
            alienBulletsHit.add(bullet);
            lives--;
            invincibleFrames = 90;
            if (lives <= 0) gameOver = true;
          }
        });
        alienBulletsHit.forEach((b) => alien.removeBullet(b));
      });
    }

    if (invincibleFrames > 0) invincibleFrames--;

    // Draw player (blink during invincibility)
    if (invincibleFrames <= 0 || Math.floor(invincibleFrames / 5) % 2 === 0) {
      spaceShip.draw();
    }

    // Draw aliens
    aliens.forEach((alien) => {
      if (alien.alive) alien.draw();
    });

    // Spawn next wave when all enemies are dead
    if (aliens.length > 0 && aliens.every((a) => !a.alive)) {
      spawnWave();
    }

    if (waveAnnounceFrames > 0) {
      drawWaveAnnounce();
      waveAnnounceFrames--;
    }

    drawHUD();
  }, config.speed);
}
