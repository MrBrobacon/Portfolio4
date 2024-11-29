import ANSI from "./utils/ANSI.mjs";
import SplashScreen from "./splashScreen.mjs";
import Labyrinth from "./labyrint.mjs"

const REFRESH_RATE = 250;
let intervalID = null;
let isBlocked = false;
let state = null;

console.log(ANSI.RESET, ANSI.CLEAR_SCREEN, ANSI.HIDE_CURSOR);

let splash = new SplashScreen();

let splashInterval = setInterval(() => {
    splash.update();
    splash.draw();
    if (splash.isFinished()) {
        clearInterval(splashInterval);
        init();
    }
}, 100); 

function init() {
     
    state = new Labyrinth();
    intervalID = setInterval(update, REFRESH_RATE);
}

function update() {

    if (isBlocked) { return; }
    isBlocked = true;
    
    state.update();
    state.draw();
    
    isBlocked = false;
}

