const fs = require('fs');
const path = require('path');

const vapiPath = path.join(__dirname, '../node_modules/@vapi-ai/react-native/dist/vapi.js');

if (!fs.existsSync(vapiPath)) {
  console.log('[patch-vapi] vapi.js not found, skipping patch');
  process.exit(0);
}

let content = fs.readFileSync(vapiPath, 'utf8');
let changed = false;

// Patch 1: subscribeToTracksAutomatically: false -> true
if (content.includes('subscribeToTracksAutomatically: false,')) {
  content = content.replace('subscribeToTracksAutomatically: false,', 'subscribeToTracksAutomatically: true,');
  changed = true;
  console.log('[patch-vapi] Patched subscribeToTracksAutomatically: false -> true');
}

// Patch 2: Race join() with 8s timeout so vapi.start() doesn't hang forever
// when joined-meeting never fires at the JS level (Daily.co iOS bug)
const oldJoin = `await this.call.join({
                    url: roomUrl,
                    subscribeToTracksAutomatically: true,
                });`;
const newJoin = `let joinedNaturally = false;
                const joinPromise = this.call.join({
                    url: roomUrl,
                    subscribeToTracksAutomatically: true,
                }).then(() => { joinedNaturally = true; });
                await Promise.race([
                    joinPromise,
                    new Promise(resolve => setTimeout(resolve, 8000)),
                ]);
                if (!joinedNaturally) {
                    this.onJoinedMeeting();
                }`;

if (content.includes(oldJoin)) {
  content = content.replace(oldJoin, newJoin);
  changed = true;
  console.log('[patch-vapi] Patched call.join() with 8s timeout fallback');
}

if (changed) {
  fs.writeFileSync(vapiPath, content, 'utf8');
} else {
  console.log('[patch-vapi] Already patched or patterns not found');
}

// Patch 3: Remove sendAppMessage "only supported after join" guard in daily.js
// In joining-meeting state, the native SCTP channel may already be up.
// The guard in daily-js prevents sending app messages until meetingState===joined,
// but joined-meeting never fires on this iOS configuration.
const dailyPath = path.join(__dirname, '../node_modules/@daily-co/daily-js/dist/daily.js');
if (fs.existsSync(dailyPath)) {
  let dailyContent = fs.readFileSync(dailyPath, 'utf8');
  const guardStr = 'if(hs(this._callState,"sendAppMessage()"),JSON.stringify(e).l';
  const fixedStr = 'if(JSON.stringify(e).l';
  if (dailyContent.includes(guardStr)) {
    dailyContent = dailyContent.replace(guardStr, fixedStr);
    fs.writeFileSync(dailyPath, dailyContent, 'utf8');
    console.log('[patch-vapi] Patched daily.js: removed sendAppMessage joined-state guard');
  } else {
    console.log('[patch-vapi] daily.js guard already patched or pattern not found');
  }
}
