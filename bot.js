const mineflayer = require('mineflayer');
const http = require('http'); 
const config = require('./config.json');

// --- RENDER KEEP-ALIVE SERVER ---
// This prevents Render from putting the bot to sleep.
http.createServer((req, res) => {
  res.write('HonorBot System is Active!');
  res.end();
}).listen(process.env.PORT || 10000);

const bot = mineflayer.createBot({
  host: config.serverHost,
  port: config.serverPort,
  username: config.botUsername,
  auth: 'offline',
  version: config.botVersion,
  viewDistance: config.botChunk
});

let movementPhase = 0;
let hasLoggedIn = false;
const STEP_INTERVAL = 1500;
const JUMP_DURATION = 500;

// --- AUTHME AUTOMATIC HANDLER ---
bot.on('message', (jsonMsg) => {
  const message = jsonMsg.toString();
  console.log(`[CHAT] ${message}`);

  // If the server asks to register, we do it instantly
  if (message.includes('/register')) {
    bot.chat(`/register ${config.authmePassword} ${config.authmePassword}`);
  } 
  // If the server asks to login, we do it
  else if (message.includes('/login')) {
    bot.chat(`/login ${config.authmePassword}`);
  }
});

bot.on('spawn', () => {
  console.log(`✅ ${config.botUsername} has joined. Waiting 10s for world load...`);
  
  if (hasLoggedIn) return;

  // 10 Second Safety Delay to prevent "Moved too quickly" kicks
  setTimeout(() => {
    // Safety login attempt
    bot.chat(`/login ${config.authmePassword}`);
    
    bot.setControlState('sneak', true);
    console.log("🛡️ Bot is now sneaking and starting movement...");
    
    movementCycle();
    hasLoggedIn = true;
  }, 10000); 
});

// --- ANTI-AFK MOVEMENT LOGIC ---
function movementCycle() {
  if (!bot.entity) return;

  switch (movementPhase) {
    case 0:
      bot.setControlState('forward', true);
      bot.setControlState('back', false);
      break;
    case 1:
      bot.setControlState('forward', false);
      bot.setControlState('back', true);
      break;
    case 2:
      bot.setControlState('jump', true);
      setTimeout(() => bot.setControlState('jump', false), JUMP_DURATION);
      break;
    case 3:
      // Randomly look around to look like a real player
      const yaw = Math.random() * Math.PI * 2;
      bot.look(yaw, 0);
      break;
  }

  movementPhase = (movementPhase + 1) % 4;
  setTimeout(movementCycle, STEP_INTERVAL);
}

// --- ERROR & RECONNECT LOGIC ---
bot.on('error', (err) => console.error('⚠️ Error:', err));

bot.on('kicked', (reason) => {
  console.log('⚠️ Bot was kicked for:', reason);
});

bot.on('end', () => {
  console.log('⛔️ Bot Disconnected! Render will restart it shortly.');
  process.exit(1); // Tells Render to restart the script
});
