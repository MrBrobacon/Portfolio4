import ANSI from "./utils/ANSI.mjs";
import KeyBoardManager from "./utils/KeyBoardManager.mjs";
import { readMapFile, readRecordFile } from "./utils/fileHelpers.mjs";
import * as CONST from "./constants.mjs";

const startingLevel = CONST.START_LEVEL_ID;
const levels = loadLevelListings();
let currentLevelId = startingLevel;
let npcs = [];

function loadLevelListings(source = CONST.LEVEL_LISTING_FILE) {
    let data = readRecordFile(source);
    let levels = {};
    for (const item of data) {
        let keyValue = item.split(":");
        if (keyValue.length >= 2) {
            let key = keyValue[0];
            let value = keyValue[1];
            levels[key] = value;
        }
    }
    return levels;
}

let levelData = readMapFile(levels[startingLevel]);
let level = levelData;
initNPCs();


let pallet = {
    "█": ANSI.COLOR.LIGHT_GRAY,
    "H": ANSI.COLOR.RED,
    "$": ANSI.COLOR.YELLOW,
    "B": ANSI.COLOR.GREEN,
    "D": ANSI.COLOR.BLUE,
    "♨": ANSI.COLOR.WHITE,
    "X": ANSI.COLOR.BLACK,
};

let isDirty = true;

let playerPos = {
    row: null,
    col: null,
};

const EMPTY = " ";
const HERO = "H";
const LOOT = "$";
const TELEPORT = '♨';
let direction = -1;

let items = [];

const THINGS = [LOOT, EMPTY, 'D', TELEPORT];

let eventText = "";

const HP_MAX = 10;

const playerStats = {
    hp: 8,
    chash: 0,
};

class Labyrinth {

    update() {

        if (playerPos.row == null) {
            for (let row = 0; row < level.length; row++) {
                for (let col = 0; col < level[row].length; col++) {
                    if (level[row][col] == "H") {
                        playerPos.row = row;
                        playerPos.col = col;
                        break;
                    }
                }
                if (playerPos.row != undefined) {
                    break;
                }
            }
        }

        let drow = 0;
        let dcol = 0;

        if (KeyBoardManager.isUpPressed()) {
            drow = -1;
        } else if (KeyBoardManager.isDownPressed()) {
            drow = 1;
        }

        if (KeyBoardManager.isLeftPressed()) {
            dcol = -1;
        } else if (KeyBoardManager.isRightPressed()) {
            dcol = 1;
        }

        let tRow = playerPos.row + drow;
        let tcol = playerPos.col + dcol;

        if (THINGS.includes(level[tRow][tcol])) {

            let currentItem = level[tRow][tcol];

            if (currentItem == LOOT) {

                let loot = Math.round(Math.random() * 7) + 3;
                playerStats.chash += loot;
                eventText = `Player gained ${loot}$`;

            } else if (currentItem == 'D') {
                

                
                let nextLevelId;
                if (currentLevelId == 'aSharpPlace') {
                    nextLevelId = 'moneyLevel';
                } else {
                    nextLevelId = 'aSharpPlace';
                }

                levelData = readMapFile(levels[nextLevelId]);
                level = levelData;
                currentLevelId = nextLevelId;
                playerPos.row = null;
                playerPos.col = null;
                initNPCs();
                isDirty = true;
                return;
            } else if (currentItem == TELEPORT) {

                
                let otherTeleport = findOtherTeleport(tRow, tcol);
                if (otherTeleport) {
                    level[playerPos.row][playerPos.col] = EMPTY;
                    playerPos.row = otherTeleport.row;
                    playerPos.col = otherTeleport.col;
                    level[playerPos.row][playerPos.col] = HERO;
                    isDirty = true;
                }
                return;  

            }

            
            level[playerPos.row][playerPos.col] = EMPTY;
            level[tRow][tcol] = HERO;

            
            playerPos.row = tRow;
            playerPos.col = tcol;

            
            isDirty = true;

        } else {
            direction *= -1;
            updateNPCs();
        }
    }

    draw() {

        if (isDirty == false) {
            return;
        }
        isDirty = false;

        console.log(ANSI.CLEAR_SCREEN, ANSI.CURSOR_HOME);

        let rendring = "";

        rendring += renderHud();

        for (let row = 0; row < level.length; row++) {
            let rowRendering = "";
            for (let col = 0; col < level[row].length; col++) {
                let symbol = level[row][col];
                if (pallet[symbol] != undefined) {
                    rowRendering += pallet[symbol] + symbol + ANSI.COLOR_RESET;
                } else {
                    rowRendering += symbol;
                }
            }
            rowRendering += "\n";
            rendring += rowRendering;
        }

        console.log(rendring);
        if (eventText != "") {
            console.log(eventText);
            eventText = "";
        }
    }
}
function initNPCs() {
    npcs = [];
    for (let row = 0; row < level.length; row++) {
        for (let col = 0; col < level[row].length; col++) {
            if (level[row][col] === 'X') {
                npcs.push({
                    row: row,
                    col: col,
                    direction: 1,       // 1 for right, -1 for left
                    patrolRange: 2,     // Move +/-2 columns from start
                    startCol: col
                });
            }
        }
    }
}
function updateNPCs() {
    for (let npc of npcs) {
        let nextCol = npc.col + npc.direction;
        let distance = nextCol - npc.startCol;
        if (Math.abs(distance) > npc.patrolRange) {
            npc.direction *= -1;  
            nextCol = npc.col + npc.direction;
        }
        if (level[npc.row][nextCol] === EMPTY) {
            level[npc.row][npc.col] = EMPTY;
            npc.col = nextCol;
            level[npc.row][npc.col] = 'X';
            isDirty = true;
        } else {
            npc.direction *= -1;  
        }
    }
}
function findOtherTeleport(currentRow, currentCol) {
    for (let row = 0; row < level.length; row++) {
        for (let col = 0; col < level[row].length; col++) {
            if (level[row][col] === TELEPORT && (row !== currentRow || col !== currentCol)) {
                return { row, col };
            }
        }
    }
    return null;
}
function renderHud() {
    let hpBar = `Life:[${ANSI.COLOR.RED + pad(playerStats.hp, "♥︎") + ANSI.COLOR_RESET}${ANSI.COLOR.LIGHT_GRAY + pad(HP_MAX - playerStats.hp, "♥︎") + ANSI.COLOR_RESET}]`;
    let cash = `$:${playerStats.chash}`;
    return `${hpBar} ${cash}\n`;
}

function pad(len, text) {
    let output = "";
    for (let i = 0; i < len; i++) {
        output += text;
    }
    return output;
}

export default Labyrinth;