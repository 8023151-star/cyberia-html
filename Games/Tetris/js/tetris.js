(() => {
  'use strict';

  const COLS = 10;
  const ROWS = 20;
  const CELL = 30;
  const COLORS = { I: '#69dff2', O: '#f7d66f', T: '#b990f7', S: '#75dbad', Z: '#f27c93', J: '#7b9ff7', L: '#f7ae72' };
  const SHAPES = {
    I: [[1, 1, 1, 1]], O: [[1, 1], [1, 1]],
    T: [[0, 1, 0], [1, 1, 1]], S: [[0, 1, 1], [1, 1, 0]],
    Z: [[1, 1, 0], [0, 1, 1]], J: [[1, 0, 0], [1, 1, 1]],
    L: [[0, 0, 1], [1, 1, 1]]
  };
  const boardCanvas = document.querySelector('#board');
  const boardCtx = boardCanvas.getContext('2d');
  const holdCanvas = document.querySelector('#hold-canvas');
  const nextCanvas = document.querySelector('#next-canvas');
  const overlay = document.querySelector('#overlay');
  const overlayTitle = document.querySelector('#overlay-title');
  const overlayText = document.querySelector('#overlay-text');
  const startButton = document.querySelector('#start-button');
  const pauseButton = document.querySelector('#pause-button');
  const restartButton = document.querySelector('#restart-button');
  const musicButton = document.querySelector('#music-button');
  const themeSelect = document.querySelector('#theme-select');
  const themeAudio = document.querySelector('#theme-audio');
  const volumeSlider = document.querySelector('#volume-slider');
  const volumeValue = document.querySelector('#volume-value');

  let board = emptyBoard();
  let bag = [];
  let queue = [];
  let piece = null;
  let held = null;
  let canHold = true;
  let score = 0;
  let lines = 0;
  let level = 1;
  let best = 0;
  let state = 'ready';
  let fallTime = 0;
  let softTime = 0;
  let lockTime = 0;
  let lastFrame = 0;
  let downHeld = false;
  let musicOn = true;
  let audio = null;
  let volume = .1;
  let musicFade = 1;
  let fadeStart = null;

  try { best = Number(localStorage.getItem('cyberia-tetris-best')) || 0; } catch (_) {}
  volumeSlider.value = String(Math.round(volume * 100));
  volumeValue.textContent = volumeSlider.value + '%';
  applyMusicVolume();

  function emptyBoard() { return Array.from({ length: ROWS }, () => Array(COLS).fill(null)); }
  function shuffledBag() {
    const types = Object.keys(SHAPES);
    for (let i = types.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [types[i], types[j]] = [types[j], types[i]];
    }
    return types;
  }
  function nextType() {
    if (!bag.length) bag = shuffledBag();
    return bag.pop();
  }
  function fillQueue() { while (queue.length < 4) queue.push(nextType()); }
  function makePiece(type) {
    const matrix = SHAPES[type].map(row => [...row]);
    return { type, matrix, x: Math.floor((COLS - matrix[0].length) / 2), y: 0 };
  }
  function spawn(type = null) {
    fillQueue();
    piece = makePiece(type || queue.shift());
    fillQueue();
    if (collides(piece.matrix, piece.x, piece.y)) gameOver();
    drawPreviews();
  }
  function collides(matrix, px, py) {
    return matrix.some((row, y) => row.some((filled, x) => {
      if (!filled) return false;
      const bx = px + x, by = py + y;
      return bx < 0 || bx >= COLS || by >= ROWS || (by >= 0 && board[by][bx]);
    }));
  }
  function move(dx) {
    if (state !== 'playing' || collides(piece.matrix, piece.x + dx, piece.y)) return;
    piece.x += dx;
    lockTime = 0;
    draw();
  }
  function stepDown(soft = false) {
    if (state !== 'playing' || collides(piece.matrix, piece.x, piece.y + 1)) return false;
    piece.y++;
    lockTime = 0;
    if (soft) { score++; updateStats(); }
    draw();
    return true;
  }
  function rotate(clockwise = true) {
    if (state !== 'playing') return;
    const old = piece.matrix;
    const rotated = clockwise
      ? old[0].map((_, x) => old.map(row => row[x]).reverse())
      : old[0].map((_, x) => old.map(row => row[old[0].length - 1 - x]));
    for (const [dx, dy] of [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1], [-1, -1], [1, -1], [0, -2]]) {
      if (!collides(rotated, piece.x + dx, piece.y + dy)) {
        piece.matrix = rotated;
        piece.x += dx;
        piece.y += dy;
        lockTime = 0;
        effect('rotate');
        draw();
        return;
      }
    }
  }
  function hardDrop() {
    if (state !== 'playing') return;
    let cells = 0;
    while (!collides(piece.matrix, piece.x, piece.y + 1)) { piece.y++; cells++; }
    score += cells * 2;
    lockPiece();
    effect('drop');
  }
  function hold() {
    if (state !== 'playing' || !canHold) return;
    const currentType = piece.type;
    if (held) { piece = makePiece(held); held = currentType; }
    else { held = currentType; spawn(); }
    canHold = false;
    fallTime = lockTime = 0;
    if (collides(piece.matrix, piece.x, piece.y)) gameOver();
    drawPreviews();
    draw();
  }
  function lockPiece() {
    piece.matrix.forEach((row, y) => row.forEach((filled, x) => {
      if (filled && piece.y + y >= 0) board[piece.y + y][piece.x + x] = piece.type;
    }));
    let cleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (board[y].every(Boolean)) {
        board.splice(y, 1);
        board.unshift(Array(COLS).fill(null));
        cleared++;
        y++;
      }
    }
    if (cleared) {
      score += [0, 100, 300, 500, 800][cleared] * level;
      lines += cleared;
      level = Math.floor(lines / 10) + 1;
      effect('clear');
    }
    canHold = true;
    fallTime = lockTime = 0;
    updateStats();
    spawn();
    draw();
  }
  function updateStats() {
    if (score > best) {
      best = score;
      try { localStorage.setItem('cyberia-tetris-best', String(best)); } catch (_) {}
    }
    document.querySelector('#score').textContent = score.toLocaleString();
    document.querySelector('#best').textContent = best.toLocaleString();
    document.querySelector('#lines').textContent = lines;
    document.querySelector('#level').textContent = level;
  }
  function showOverlay(title, message, button) {
    overlayTitle.textContent = title;
    overlayText.textContent = message;
    startButton.innerHTML = button + ' <span aria-hidden="true">↗</span>';
    overlay.hidden = false;
  }
  function startGame() {
    board = emptyBoard(); bag = []; queue = []; held = null; canHold = true;
    score = 0; lines = 0; level = 1; fallTime = softTime = lockTime = 0;
    downHeld = false; state = 'playing';
    musicFade = 1; fadeStart = null; applyMusicVolume();
    fillQueue(); spawn(); updateStats(); draw();
    overlay.hidden = true;
    pauseButton.disabled = false;
    pauseButton.innerHTML = 'Pause <kbd>P</kbd>';
    startAudio();
  }
  function gameOver() {
    state = 'over';
    downHeld = false;
    fadeStart = performance.now();
    pauseButton.disabled = true;
    showOverlay('G4me over', 'You scored ' + score.toLocaleString() + ' points. Ready for another round?', 'Play again');
    syncMusic();
  }
  function togglePause() {
    if (state === 'playing') {
      state = 'paused'; downHeld = false;
      showOverlay('Paused', 'Take your time. Your blocks will wait.', 'Resume game');
      pauseButton.innerHTML = 'Resume <kbd>P</kbd>';
    } else if (state === 'paused') {
      state = 'playing'; overlay.hidden = true;
      pauseButton.innerHTML = 'Pause <kbd>P</kbd>';
      lastFrame = performance.now();
    }
    syncMusic();
  }

  function cell(ctx, x, y, size, type, ghost = false) {
    const px = x * size, py = y * size;
    if (ghost) {
      ctx.fillStyle = COLORS[type] + '27';
      ctx.strokeStyle = COLORS[type] + 'bb';
      ctx.lineWidth = 2;
      ctx.fillRect(px + 2, py + 2, size - 4, size - 4);
      ctx.strokeRect(px + 3, py + 3, size - 6, size - 6);
      return;
    }
    ctx.fillStyle = COLORS[type];
    ctx.fillRect(px + 1, py + 1, size - 2, size - 2);
    ctx.fillStyle = '#ffffff36';
    ctx.fillRect(px + 3, py + 3, size - 6, 4);
    ctx.fillRect(px + 3, py + 3, 4, size - 6);
    ctx.fillStyle = '#00000028';
    ctx.fillRect(px + 3, py + size - 7, size - 6, 4);
  }
  function drawMatrix(ctx, matrix, px, py, type, ghost = false) {
    matrix.forEach((row, y) => row.forEach((filled, x) => {
      if (filled && py + y >= 0) cell(ctx, px + x, py + y, CELL, type, ghost);
    }));
  }
  function draw() {
    boardCtx.fillStyle = '#06112f';
    boardCtx.fillRect(0, 0, 300, 600);
    boardCtx.strokeStyle = '#ffffff0c';
    boardCtx.lineWidth = 1;
    for (let x = 1; x < COLS; x++) { boardCtx.beginPath(); boardCtx.moveTo(x * CELL + .5, 0); boardCtx.lineTo(x * CELL + .5, 600); boardCtx.stroke(); }
    for (let y = 1; y < ROWS; y++) { boardCtx.beginPath(); boardCtx.moveTo(0, y * CELL + .5); boardCtx.lineTo(300, y * CELL + .5); boardCtx.stroke(); }
    board.forEach((row, y) => row.forEach((type, x) => { if (type) cell(boardCtx, x, y, CELL, type); }));
    if (piece && state !== 'ready') {
      let ghostY = piece.y;
      while (!collides(piece.matrix, piece.x, ghostY + 1)) ghostY++;
      if (ghostY !== piece.y) drawMatrix(boardCtx, piece.matrix, piece.x, ghostY, piece.type, true);
      drawMatrix(boardCtx, piece.matrix, piece.x, piece.y, piece.type);
    }
  }
  function drawPreview(canvas, type) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!type) return;
    const matrix = SHAPES[type];
    const size = 24;
    const x0 = (canvas.width - matrix[0].length * size) / 2;
    const y0 = (canvas.height - matrix.length * size) / 2;
    matrix.forEach((row, y) => row.forEach((filled, x) => {
      if (filled) {
        ctx.fillStyle = COLORS[type];
        ctx.fillRect(x0 + x * size + 1, y0 + y * size + 1, size - 2, size - 2);
        ctx.fillStyle = '#ffffff33';
        ctx.fillRect(x0 + x * size + 3, y0 + y * size + 3, size - 6, 3);
      }
    }));
  }
  function drawPreviews() { drawPreview(holdCanvas, held); drawPreview(nextCanvas, queue[0]); }

  function startAudio() {
    // Browsers allow audio only after a user gesture such as Start or Enter.
    try {
      if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)();
      audio.resume();
    } catch (_) { audio = null; }
    themeAudio.currentTime = 0;
    syncMusic();
  }
  function applyMusicVolume() { themeAudio.volume = volume * musicFade; }
  function syncMusic() {
    if (musicOn && (state === 'playing' || state === 'over')) {
      const play = themeAudio.play();
      if (play && typeof play.catch === 'function') play.catch(() => {});
    } else {
      themeAudio.pause();
    }
  }
  function updateMusicButton() {
    musicButton.innerHTML = '<span aria-hidden="true">♫</span> Music ' + (musicOn ? 'on' : 'off');
    musicButton.setAttribute('aria-pressed', String(musicOn));
    syncMusic();
  }
  function effect(kind) {
    if (!audio || volume === 0) return;
    const now = audio.currentTime;
    const notes = kind === 'clear' ? [440, 587, 784] : kind === 'drop' ? [180, 110] : [440];
    notes.forEach((frequency, index) => {
      const at = now + index * .055;
      const oscillator = audio.createOscillator();
      const envelope = audio.createGain();
      oscillator.type = kind === 'drop' ? 'sawtooth' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, at);
      envelope.gain.setValueAtTime(.045 * volume, at);
      envelope.gain.exponentialRampToValueAtTime(.001, at + .11);
      oscillator.connect(envelope); envelope.connect(audio.destination);
      oscillator.start(at); oscillator.stop(at + .12);
    });
  }

  function frame(timestamp) {
    const delta = Math.min(timestamp - (lastFrame || timestamp), 50);
    lastFrame = timestamp;
    if (state === 'playing') {
      const interval = Math.max(75, 850 * Math.pow(.82, level - 1));
      fallTime += delta;
      if (fallTime >= interval) { fallTime = 0; stepDown(); }
      if (downHeld) {
        softTime += delta;
        if (softTime >= 45) { softTime = 0; stepDown(true); }
      }
      if (piece && collides(piece.matrix, piece.x, piece.y + 1)) {
        lockTime += delta;
        if (lockTime >= 400) lockPiece();
      }
    }
    if (state === 'over' && fadeStart !== null) {
      const progress = Math.min(1, Math.max(0, (timestamp - fadeStart) / 2000));
      musicFade = 1 - .75 * progress;
      applyMusicVolume();
      if (progress === 1) fadeStart = null;
    }
    requestAnimationFrame(frame);
  }
  function action(name) {
    if (name === 'left') move(-1);
    else if (name === 'right') move(1);
    else if (name === 'down') stepDown(true);
    else if (name === 'rotate') rotate(true);
    else if (name === 'rotate-ccw') rotate(false);
    else if (name === 'drop') hardDrop();
    else if (name === 'hold') hold();
  }
  document.addEventListener('keydown', event => {
    if (event.target && ['INPUT', 'SELECT'].includes(event.target.tagName)) return;
    const keys = { ArrowLeft:'left', ArrowRight:'right', ArrowDown:'down', ArrowUp:'rotate', KeyX:'rotate', KeyZ:'rotate-ccw', Space:'drop', KeyC:'hold', ShiftLeft:'hold', ShiftRight:'hold' };
    if (event.code in keys) {
      event.preventDefault();
      if (event.repeat && ['drop','hold','rotate','rotate-ccw'].includes(keys[event.code])) return;
      action(keys[event.code]);
      if (event.code === 'ArrowDown' && state === 'playing') downHeld = true;
    } else if (event.code === 'KeyP' || event.code === 'Escape') {
      event.preventDefault(); if (!event.repeat) togglePause();
    } else if (event.code === 'KeyM') {
      if (!event.repeat) { musicOn = !musicOn; updateMusicButton(); }
    } else if (event.code === 'Enter' && state !== 'playing') {
      event.preventDefault(); state === 'paused' ? togglePause() : startGame();
    }
  });
  document.addEventListener('keyup', event => { if (event.code === 'ArrowDown') downHeld = false; });
  window.addEventListener('blur', () => { downHeld = false; if (state === 'playing') togglePause(); });
  startButton.addEventListener('click', () => { state === 'paused' ? togglePause() : startGame(); });
  pauseButton.addEventListener('click', togglePause);
  restartButton.addEventListener('click', startGame);
  musicButton.addEventListener('click', () => { musicOn = !musicOn; updateMusicButton(); });
  volumeSlider.addEventListener('input', () => {
    volume = Number(volumeSlider.value) / 100;
    volumeValue.textContent = volumeSlider.value + '%';
    applyMusicVolume();
  });
  themeSelect.addEventListener('change', () => {
    themeAudio.pause();
    themeAudio.src = themeSelect.value;
    themeAudio.load();
    syncMusic();
  });
  document.querySelectorAll('.touch-controls button').forEach(button => {
    let repeat = null;
    button.addEventListener('pointerdown', event => {
      event.preventDefault();
      const name = button.dataset.action;
      action(name);
      if (['left','right','down'].includes(name)) repeat = setInterval(() => action(name), 90);
      button.setPointerCapture(event.pointerId);
    });
    const stop = () => { clearInterval(repeat); repeat = null; };
    button.addEventListener('pointerup', stop);
    button.addEventListener('pointercancel', stop);
    button.addEventListener('lostpointercapture', stop);
  });

  updateStats();
  draw();
  drawPreviews();
  requestAnimationFrame(frame);
})();
