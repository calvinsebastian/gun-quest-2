import { Game } from "./classes/Game.js";
import "../../css/gun-quest-2.css";

import Stats from "stats.js";

const stats1 = new Stats();
stats1.showPanel(0); // FPS
document.body.appendChild(stats1.dom);

const stats2 = new Stats();
stats2.showPanel(1); // MS
stats2.dom.style.cssText = "position:absolute;top:0;left:80px;";
document.body.appendChild(stats2.dom);

const stats3 = new Stats();
stats3.showPanel(2); // Memory
stats3.dom.style.cssText = "position:absolute;top:0;left:160px;";
document.body.appendChild(stats3.dom);

function animate() {
  stats1.begin();
  stats2.begin();
  stats3.begin();

  // Your game update & rendering code here

  stats1.end();
  stats2.end();
  stats3.end();

  requestAnimationFrame(animate);
}

animate();

window.onload = () => {
  new Game();
};
