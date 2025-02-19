[X] Potentially add third metric for restricting firing projectiles (instead of stamina)
[ ] Add layers to map (wall collision, spawn points, etc)
[ ] Tilesheets for said layers
[ ] Add sprite sheets for player and enemy (idle, attack, walking in all directions)
[ ] Look into avoiding floating points to reduce compute load for position, speed, acceleration, etc.
[X] Enemies drop reward or exp
[X] HUD
[X] Death screen
[X] Main screen
[X] Options
[ ] Sound effects (still need weapon sounds effects)
[X] Music
[ ] multiplayer connection?
[ ] lantern to increase visibility range
[X] Pause Button - upgrade weapon shop (use Score or new currency)
[ ] Increase map size and type per level
[X] Highscore file
[X] Keep track of enemy type kill count for achievements
[X] Don't allow clicking of shop button on death
[X] Make Play music button a mute button that turns the volume off instead of toggling play
[ ] Rebalance mechanics for consistent play
[ ] Add ammo (and other things like knockback) to shop?
[ ] Directional lighting (like a flashlight that shows a pie shape out in front of you) and a lightly lit sphere around you
[ ] Relocate alerts to be more visible
[ ] Badges (Connect the corn: run consecutively for 30 seconds, submachine god: Get 500 submachine kills in one match, etc.)
[ ] Color coding ammo for ammo types
[ ] Remove default behaviour of space and enter on focused buttons
[ ] Jump?
[ ] Corn club (starts husked, then semi husked, then unhusked, then shoots corn, then shoots popped corn)
[ ] Cornado protective spinning cobs of corn
[ ] Only check enemies in the direction
[ ] Show what the upgrade count is for each upgrade
[ ] Show the names of the guns
[ ] Show achievements you have unlocked
[X] Add round to highscore
[X] Include www in my cors policy
[ ] Add controller support
[ ] On small screens (800px tall) fix black border in viewport (showing enemies, hiding flashlight)
[ ] Explode enemies on their death releasing partical effects
[ ] System for randomly selecting audio files / foley variation on sound trigger
[ ] Implement js obfuscator
[ ] Implement parcel\*

// Implementing parcel with an obfuscator

\*npm install --save-dev parcel
npm install --save-dev javascript-obfuscator
Create a script in your package.json:
{
"scripts": {
"build": "parcel build src/index.html --out-dir dist && javascript-obfuscator dist --output dist --options '{\"compact\":true,\"controlFlowFlattening\":true}'"
}
}
npm run build
