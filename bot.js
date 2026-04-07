const mineflayer = require('mineflayer');
const http = require('http'); // Required for Render to stay online
const config = require('./config.json');

// --- RENDER WEB SERVER ---
// This keeps the bot alive 24/7 by pretending to be a website.
http.createServer((req, res) => {
  res.write('HonorBot is Online!');
  res.end();
}).listen(process.env.PORT || 3000);

const bot = mineflayer.createBot({
  host: config.serverHost,
  port: config.serverPort,
  username: config.botUsername,
  auth: 'offline',
  version: config.botVersion,
  viewDistance: config.botChunk
});

let movementPhase = 0;
const STEP_INTERVAL = 1500;
const JUMP_DURATION = 500;

// --- AUTHME LOGIN HANDLER ---
bot.on('message', (jsonMsg) => {
  const message = jsonMsg.toString();
  console.log(`[CHAT] ${message}`);

  // Automatically detects if the server asks to register or login
  if (message.includes('/register')) {
    bot.chat(`/register ${config.authmePassword} ${config.authmePassword}`);
  } else if (message.includes('/login')) {
    bot.chat(`/login ${config.authmePassword}`);
  }
});

bot.on('spawn', () => {
  console.log(`✅ ${config.botUsername} has joined the server!`);
  
  // Extra safety: Try to login 3 seconds after spawning just in case
  setTimeout(() => {
    bot.chat(`/login ${config.authmePassword}`);
  }, 3000);

  bot.setControlState('sneak', true);
  setTimeout(movementCycle, STEP_INTERVAL);
});

// --- YOUR ORIGINAL MOVEMENT LOGIC ---
function movementCycle() {
  if (!bot.entity) return;

  switch (movementPhase) {
    case 0:
      bot.setControlState('forward', true);
      bot.setControlState('back', false);
      bot.setControlState('jump', false);
      break;
    case 1:
      bot.setControlState('forward', false);
      bot.setControlState('back', true);
      bot.setControlState('jump', false);
      break;
    case 2:
      bot.setControlState('forward', false);
      bot.setControlState('back', false);
      bot.setControlState('jump', true);
      setTimeout(() => {
        bot.setControlState('jump', false);
      }, JUMP_DURATION);
      break;
    case 3:
      bot.setControlState('forward', false);
      bot.setControlState('back', false);
      bot.setControlState('jump', false);
      // Randomly look around to look more "human"
      const yaw = Math.random() * Math.PI * 2;
      bot.look(yaw, 0);
      break;
  }

  movementPhase = (movementPhase + 1) % 4;
  setTimeout(movementCycle, STEP_INTERVAL);
}

bot.on('error', (err) => {
  console.error('⚠️ Error:', err);
});

bot.on('end', () => {
  console.log('⛔️ Bot Disconnected! Restarting...');
  // This helps Render know it needs to restart the process
  process.exit(1);
});
