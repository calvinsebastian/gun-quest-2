import { backgroundMusic, musicToggle } from "../GunQuest.js";

const mainContainer = document.getElementById("container");
const mobileMessage = document.getElementById("mobile-message");
const fullScreenButton = document.getElementById("fullScreen");
const muteButton = document.getElementById("mute");

export let mute = false;

export const handleFullscreen = () => {
  // Check if the document is in fullscreen mode
  if (
    document.fullscreenElement === mainContainer ||
    document.mozFullScreenElement === mainContainer || // Firefox
    document.webkitFullscreenElement === mainContainer || // Chrome, Safari, and Opera
    document.msFullscreenElement === mainContainer
  ) {
    fullScreenButton.classList.remove("muted");
    // IE/Edge
    // If already in fullscreen, exit fullscreen
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      // Firefox
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      // Chrome, Safari, and Opera
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      // IE/Edge
      document.msExitFullscreen();
    }
  } else {
    fullScreenButton.classList.add("muted");
    // If not in fullscreen, enter fullscreen
    if (mainContainer.requestFullscreen) {
      mainContainer.requestFullscreen();
    } else if (mainContainer.mozRequestFullScreen) {
      // Firefox
      mainContainer.mozRequestFullScreen();
    } else if (mainContainer.webkitRequestFullscreen) {
      // Chrome, Safari, and Opera
      mainContainer.webkitRequestFullscreen();
    } else if (mainContainer.msRequestFullscreen) {
      // IE/Edge
      mainContainer.msRequestFullscreen();
    }
  }
};

export const handleMute = () => {
  if (mute) {
    if (musicToggle.checked) {
      backgroundMusic.play().catch((error) => {
        console.error("Audio playback failed:", error);
      });
    }
    muteButton.classList.remove("muted");
    mute = false;
  } else {
    muteButton.classList.add("muted");
    if (musicToggle.checked) {
      backgroundMusic.pause();
    }
    mute = true;
  }
};

export const checkScreenSize = () => {
  if (window.innerWidth < 1200 || window.innerHeight < 800) {
    console.error(
      "screen too small:",
      `width = ${window.innerWidth}px,`,
      `height = ${window.innerHeight}px`
    );
    mobileMessage.style.display = "flex";
  } else {
    mobileMessage.style.display = "none";
  }
};

const resizeCanvas = () => {
  if (window.innerWidth < 1200) {
    viewport.width = window.innerWidth;
    overlay.width = window.innerWidth;
  } else {
    viewport.width = "1200";
    overlay.width = "1200";
  }
  viewport.height = window.innerHeight - 200;
  overlay.height = window.innerHeight - 200;
};

export const handleResize = () => {
  checkScreenSize();
  resizeCanvas();
};

export async function initiateEventListeners() {
  //
  // Mute music button behaviour

  muteButton.addEventListener("click", handleMute);

  // full screen button behaviour

  fullScreenButton.addEventListener("click", handleFullscreen);

  // Check screen size on window resize

  // Prevent default right click behaviour on window
  window.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });

  // functions run on initiation
  resizeCanvas();
  checkScreenSize();
}
