// Konfigurasi
const GRID_SIZE = 10; // Grid 10x10
let grid = []; // Array 2D untuk state grid
let clues = { across: [], down: [] }; // Daftar petunjuk
let currentLevel = 1;
let seed = Date.now(); // Seed awal

// Operator per level
const LEVEL_OPS = {
    1: ['+'],
    2: ['+', '-'],
    3: ['+', '-', '*'],
    4: ['+', '-', '*', '/']
};

// Elemen DOM
const gridContainer = document.getElementById('crossword-grid');
const acrossList = document.getElementById('across-list');
const downList = document.getElementById('down-list');
const levelSelect = document.getElementById('level');
const btnGenerate = document.getElementById('btn-generate');
const btnCheck = document.getElementById('btn-check');
const btnReset = document.getElementById('btn-reset');
