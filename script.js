/*
 * TTS MATEMATIKA - Logika Utama
 * Langkah 4: Implementasi JavaScript Lengkap
 */

// =============================================
// 1. KONFIGURASI AWAL & VARIABEL GLOBAL
// =============================================

// Konfigurasi grid
const GRID_SIZE = 10; // Grid 10x10 sel
let grid = []; // Array 2D untuk menyimpan state setiap sel
let clues = { across: [], down: [] }; // Petunjuk mendatar dan menurun
let currentLevel = 1;
let seed = Date.now(); // Seed awal untuk random generator

// Operator untuk setiap level
const LEVEL_OPS = {
    1: ['+'],
    2: ['+', '-'],
    3: ['+', '-', '*'],
    4: ['+', '-', '*', '/']
};

// Rentang angka untuk setiap level (menyesuaikan kesulitan)
const LEVEL_RANGES = {
    1: { min: 1, max: 20 },    // Hasil penjumlahan 1-20
    2: { min: 0, max: 30 },    // Hasil +/- 0-30
    3: { min: 0, max: 50 },    // Hasil +/-/* 0-50
    4: { min: 0, max: 100 }    // Hasil semua operasi 0-100
};

// Elemen DOM
const gridContainer = document.getElementById('crossword-grid');
const acrossList = document.getElementById('across-list');
const downList = document.getElementById('down-list');
const levelSelect = document.getElementById('level');
const btnGenerate = document.getElementById('btn-generate');
const btnCheck = document.getElementById('btn-check');
const btnReset = document.getElementById('btn-reset');

// =============================================
// 2. FUNGSI RANDOM GENERATOR DENGAN SEED
// =============================================

/**
 * Mendapatkan fungsi random yang di-seed untuk hasil yang dapat direproduksi
 * @returns {function} Fungsi random generator
 */
function getSeededRandom() {
    // Jika library seedrandom.js sudah di-load
    if (typeof Math.seedrandom === 'function') {
        return new Math.seedrandom(seed.toString());
    } else {
        // Fallback ke Math.random() jika library tidak tersedia
        console.warn('seedrandom.js tidak ditemukan, menggunakan Math.random()');
        return () => Math.random();
    }
}

/**
 * Menghasilkan angka integer acak dalam rentang tertentu
 * @param {number} min - Nilai minimum
 * @param {number} max - Nilai maksimum
 * @param {function} rng - Fungsi random generator
 * @returns {number} Angka acak
 */
function randomInt(min, max, rng) {
    return Math.floor(rng() * (max - min + 1)) + min;
}

/**
 * Memilih elemen acak dari array
 * @param {array} arr - Array input
 * @param {function} rng - Fungsi random generator
 * @returns {*} Elemen acak dari array
 */
function randomChoice(arr, rng) {
    return arr[randomInt(0, arr.length - 1, rng)];
}

/**
 * Memperbarui seed berdasarkan jawaban pengguna
 * Menggunakan hash sederhana dari input pengguna
 */
function updateSeedFromAnswers() {
    let answerString = '';
    
    // Kumpulkan semua jawaban pengguna
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cell = grid[r][c];
            if (cell && cell.input && cell.input.value) {
                answerString += cell.input.value;
            }
        }
    }
    
    // Jika tidak ada jawaban, gunakan timestamp
    if (!answerString) {
        seed = Date.now();
        return;
    }
    
    // Hash sederhana: string ke number
    let hash = 0;
    for (let i = 0; i < answerString.length; i++) {
        const char = answerString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert ke 32-bit integer
    }
    
    seed = hash || Date.now();
    console.log('Seed baru:', seed, 'dari jawaban:', answerString);
}

// =============================================
// 3. FUNGSI GENERATOR SOAL MATEMATIKA
// =============================================

/**
 * Membuat grid kosong 10x10
 */
function createEmptyGrid() {
    grid = [];
    for (let r = 0; r < GRID_SIZE; r++) {
        grid[r] = [];
        for (let c = 0; c < GRID_SIZE; c++) {
            grid[r][c] = {
                isBlack: true,           // Sel hitam/tidak dapat diisi
                number: null,            // Nomor petunjuk
                input: null,             // Input pengguna
                text: null,              // Karakter jawaban
                answer: null,            // Nilai jawaban yang benar
                acrossClue: null,        // Petunjuk mendatar
                downClue: null,          // Petunjuk menurun
                isAcrossStart: false,    // Mulai kata mendatar
                isDownStart: false       // Mulai kata menurun
            };
        }
    }
}

/**
 * Menghasilkan soal matematika acak sesuai level
 * @param {number} length - Panjang soal (jumlah angka)
 * @param {number} level - Level kesulitan (1-4)
 * @returns {object} Objek berisi expression dan answer
 */
function generateMathProblem(length, level) {
    const ops = LEVEL_OPS[level];
    const range = LEVEL_RANGES[level];
    const rng = getSeededRandom();
    
    let expression, result;
    let attempts = 0;
    const maxAttempts = 50; // Mencegah infinite loop
    
    do {
        // Mulai dengan angka pertama
        result = randomInt(1, 9, rng);
        let currentNumbers = [result];
        let currentOps = [];
        
        // Bangun ekspresi bertahap
        for (let i = 1; i < length; i++) {
            let op, num;
            let valid = false;
            let opAttempts = 0;
            
            // Cari operasi dan angka yang valid
            do {
                op = randomChoice(ops, rng);
                num = randomInt(1, 9, rng);
                
                // Validasi khusus untuk operasi tertentu
                if (op === '/') {
                    // Pastikan pembagian menghasilkan integer
                    if (num === 0) continue;
                    if (result % num !== 0) continue;
                }
                
                if (op === '-') {
                    // Pastikan tidak menghasilkan negatif
                    const tempResult = result - num;
                    if (tempResult < 0) continue;
                }
                
                // Hitung hasil sementara
                let tempResult;
                switch (op) {
                    case '+': tempResult = result + num; break;
                    case '-': tempResult = result - num; break;
                    case '*': tempResult = result * num; break;
                    case '/': tempResult = result / num; break;
                }
                
                // Validasi rentang dan integer
                if (tempResult >= range.min && 
                    tempResult <= range.max && 
                    Number.isInteger(tempResult)) {
                    result = tempResult;
                    currentNumbers.push(num);
                    currentOps.push(op);
                    valid = true;
                }
                
                opAttempts++;
                if (opAttempts > 20) {
                    // Reset dan coba lagi dari awal
                    valid = false;
                    break;
                }
            } while (!valid);
            
            if (!valid) break; // Keluar dari loop jika tidak valid
        }
        
        // Bangun string ekspresi
        expression = currentNumbers[0].toString();
        for (let i = 0; i < currentOps.length; i++) {
            expression += ` ${currentOps[i]} ${currentNumbers[i + 1]}`;
        }
        
        attempts++;
        if (attempts > maxAttempts) {
            // Fallback ke ekspresi sederhana
            expression = "1 + 2";
            result = 3;
            break;
        }
        
    } while (result < range.min || result > range.max || !Number.isInteger(result));
    
    return {
        expression: expression,
        answer: result,
        length: length
    };
}

// =============================================
// 4. ALGORITMA PENEMPATAN SOAL DI GRID
// =============================================

/**
 * Menghasilkan daftar soal untuk TTS
 * @returns {array} Array of word objects
 */
function generateWordList() {
    const rng = getSeededRandom();
    const wordList = [];
    const wordCount = randomInt(6, 10, rng); // 6-10 soal
    
    for (let i = 0; i < wordCount; i++) {
        const length = randomInt(3, 7, rng); // Panjang 3-7 karakter
        const problem = generateMathProblem(length, currentLevel);
        
        wordList.push({
            id: i,
            text: problem.answer.toString(),
            length: problem.answer.toString().length,
            clue: problem.expression,
            answer: problem.answer,
            direction: null, // Akan ditentukan saat penempatan
            placed: false
        });
    }
    
    // Urutkan berdasarkan panjang (dari terpanjang ke terpendek)
    wordList.sort((a, b) => b.length - a.length);
    
    return wordList;
}

/**
 * Mengecek apakah kata bisa ditempatkan di posisi tertentu
 * @param {object} word - Word object
 * @param {number} row - Baris awal
 * @param {number} col - Kolom awal
 * @param {string} direction - 'across' atau 'down'
 * @returns {boolean} True jika bisa ditempatkan
 */
function canPlaceWord(word, row, col, direction) {
    // Cek batas grid
    if (direction === 'across') {
        if (col + word.length > GRID_SIZE) return false;
    } else {
        if (row + word.length > GRID_SIZE) return false;
    }
    
    let hasIntersection = false;
    
    // Cek setiap posisi yang akan ditempati
    for (let i = 0; i < word.length; i++) {
        const r = direction === 'across' ? row : row + i;
        const c = direction === 'across' ? col + i : col;
        
        const cell = grid[r][c];
        
        // Jika sel sudah hitam, tidak bisa ditempatkan
        if (cell.isBlack) return false;
        
        // Jika sel sudah berisi karakter
        if (cell.text !== null) {
            // Karakter harus sama
            if (cell.text !== word.text[i]) return false;
            // Tandai bahwa ada persilangan
            hasIntersection = true;
        }
        
        // Cek sel sebelum kata (harus kosong atau hitam)
        if (direction === 'across') {
            if (col > 0 && i === 0) {
                const leftCell = grid[r][c-1];
                if (!leftCell.isBlack) return false;
            }
            // Cek sel setelah kata
            if (col + word.length < GRID_SIZE && i === word.length - 1) {
                const rightCell = grid[r][c+1];
                if (!rightCell.isBlack) return false;
            }
        } else {
            if (row > 0 && i === 0) {
                const topCell = grid[r-1][c];
                if (!topCell.isBlack) return false;
            }
            // Cek sel setelah kata
            if (row + word.length < GRID_SIZE && i === word.length - 1) {
                const bottomCell = grid[r+1][c];
                if (!bottomCell.isBlack) return false;
            }
        }
    }
    
    // Untuk kata kedua dan seterusnya, harus ada persilangan
    if (word.id > 0 && !hasIntersection) return false;
    
    return true;
}

/**
 * Menempatkan kata di grid
 * @param {object} word - Word object
 * @param {number} row - Baris awal
 * @param {number} col - Kolom awal
 * @param {string} direction - 'across' atau 'down'
 * @param {number} clueNumber - Nomor petunjuk
 */
function placeWord(word, row, col, direction, clueNumber) {
    // Tentukan apakah perlu nomor petunjuk baru
    let needsNumber = !grid[row][col].number;
    
    // Jika sel ini belum memiliki nomor dan merupakan awal kata, beri nomor
    if (needsNumber) {
        grid[row][col].number = clueNumber;
        
        if (direction === 'across') {
            grid[row][col].isAcrossStart = true;
        } else {
            grid[row][col].isDownStart = true;
        }
    }
    
    // Buat petunjuk
    const clue = {
        number: clueNumber,
        text: word.clue,
        answer: word.answer,
        direction: direction,
        row: row,
        col: col,
        length: word.length,
        cells: []
    };
    
    // Tempatkan setiap karakter
    for (let i = 0; i < word.length; i++) {
        const r = direction === 'across' ? row : row + i;
        const c = direction === 'across' ? col + i : col;
        
        // Update sel
        grid[r][c].isBlack = false;
        grid[r][c].text = word.text[i];
        grid[r][c].answer = word.answer;
        
        if (direction === 'across') {
            grid[r][c].acrossClue = clue;
        } else {
            grid[r][c].downClue = clue;
        }
        
        // Tambahkan ke daftar sel petunjuk
        clue.cells.push({ row: r, col: c });
    }
    
    // Tambahkan ke daftar petunjuk
    if (direction === 'across') {
        clues.across.push(clue);
    } else {
        clues.down.push(clue);
    }
    
    // Update status kata
    word.placed = true;
    word.direction = direction;
    word.startRow = row;
    word.startCol = col;
}

/**
 * Algoritma utama untuk menempatkan kata-kata di grid
 */
function placeWordsInGrid() {
    const wordList = generateWordList();
    let clueNumber = 1;
    const rng = getSeededRandom();
    
    // Kosongkan grid terlebih dahulu
    createEmptyGrid();
    
    // Tempatkan kata pertama di tengah grid
    const firstWord = wordList[0];
    const centerRow = Math.floor(GRID_SIZE / 2);
    const centerCol = Math.floor((GRID_SIZE - firstWord.length) / 2);
    
    // Jadwalkan grid untuk kata pertama
    for (let i = 0; i < firstWord.length; i++) {
        grid[centerRow][centerCol + i].isBlack = false;
    }
    
    placeWord(firstWord, centerRow, centerCol, 'across', clueNumber++);
    
    // Coba tempatkan kata-kata lainnya
    for (let wordIndex = 1; wordIndex < wordList.length; wordIndex++) {
        const word = wordList[wordIndex];
        let placed = false;
        
        // Coba semua sel yang sudah berisi karakter
        for (let r = 0; r < GRID_SIZE && !placed; r++) {
            for (let c = 0; c < GRID_SIZE && !placed; c++) {
                if (grid[r][c].text !== null) {
                    const existingChar = grid[r][c].text;
                    
                    // Cek setiap posisi dalam kata yang bisa bersilangan
                    for (let i = 0; i < word.length; i++) {
                        if (word.text[i] === existingChar) {
                            // Coba tempatkan secara horizontal
                            const acrossRow = r;
                            const acrossCol = c - i;
                            if (canPlaceWord(word, acrossRow, acrossCol, 'across')) {
                                placeWord(word, acrossRow, acrossCol, 'across', clueNumber++);
                                placed = true;
                                break;
                            }
                            
                            // Coba tempatkan secara vertikal
                            const downRow = r - i;
                            const downCol = c;
                            if (canPlaceWord(word, downRow, downCol, 'down')) {
                                placeWord(word, downRow, downCol, 'down', clueNumber++);
                                placed = true;
                                break;
                            }
                        }
                    }
                }
            }
        }
        
        // Jika tidak bisa ditempatkan dengan persilangan, coba tempatkan di lokasi baru
        if (!placed) {
            let attempts = 0;
            while (!placed && attempts < 100) {
                const direction = randomChoice(['across', 'down'], rng);
                let startRow, startCol;
                
                if (direction === 'across') {
                    startRow = randomInt(0, GRID_SIZE - 1, rng);
                    startCol = randomInt(0, GRID_SIZE - word.length, rng);
                } else {
                    startRow = randomInt(0, GRID_SIZE - word.length, rng);
                    startCol = randomInt(0, GRID_SIZE - 1, rng);
                }
                
                // Cek area sekitar untuk memastikan tidak bertabrakan
                let canPlace = true;
                for (let dr = -1; dr <= word.length; dr++) {
                    for (let dc = -1; dc <= (direction === 'across' ? word.length : 1); dc++) {
                        const checkR = startRow + (direction === 'across' ? 0 : dr);
                        const checkC = startCol + (direction === 'across' ? dc : 0);
                        
                        if (checkR >= 0 && checkR < GRID_SIZE && checkC >= 0 && checkC < GRID_SIZE) {
                            if (!grid[checkR][checkC].isBlack) {
                                canPlace = false;
                                break;
                            }
                        }
                    }
                    if (!canPlace) break;
                }
                
                if (canPlace) {
                    // Jadwalkan grid untuk kata ini
                    for (let i = 0; i < word.length; i++) {
                        const r = direction === 'across' ? startRow : startRow + i;
                        const c = direction === 'across' ? startCol + i : startCol;
                        if (r >= 0 && r < GRID_SIZE && c >= 0 && c < GRID_SIZE) {
                            grid[r][c].isBlack = false;
                        }
                    }
                    
                    placeWord(word, startRow, startCol, direction, clueNumber++);
                    placed = true;
                }
                
                attempts++;
            }
        }
    }
    
    // Set semua sel yang tidak digunakan menjadi hitam
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            if (grid[r][c].text === null) {
                grid[r][c].isBlack = true;
                grid[r][c].number = null;
            }
        }
    }
    
    // Hapus petunjuk yang tidak memiliki kata
    clues.across = clues.across.filter(clue => clue.cells.length > 0);
    clues.down = clues.down.filter(clue => clue.cells.length > 0);
    
    // Urutkan petunjuk berdasarkan nomor
    clues.across.sort((a, b) => a.number - b.number);
    clues.down.sort((a, b) => a.number - b.number);
}

// =============================================
// 5. RENDERING GRID & TAMPILAN
// =============================================

/**
 * Merender grid TTS ke DOM
 */
function renderGrid() {
    // Reset grid container
    gridContainer.innerHTML = '';
    gridContainer.style.gridTemplateColumns = `repeat(${GRID_SIZE}, 1fr)`;
    
    // Buat elemen untuk setiap sel
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cell = grid[r][c];
            const cellElement = document.createElement('div');
            cellElement.className = 'cell';
            
            // Tambahkan class 'black' untuk sel hitam
            if (cell.isBlack) {
                cellElement.classList.add('black');
                gridContainer.appendChild(cellElement);
                continue;
            }
            
            // Tambahkan nomor petunjuk di sudut kiri atas
            if (cell.number !== null) {
                const numberSpan = document.createElement('span');
                numberSpan.className = 'cell-number';
                numberSpan.textContent = cell.number;
                cellElement.appendChild(numberSpan);
            }
            
            // Buat input untuk jawaban
            const input = document.createElement('input');
            input.type = 'text';
            input.maxLength = 2; // Maksimal 2 digit
            input.dataset.row = r;
            input.dataset.col = c;
            input.dataset.answer = cell.answer || '';
            
            // Set nilai input jika ada
            if (cell.input && cell.input.value) {
                input.value = cell.input.value;
            }
            
            // Event listener untuk input
            input.addEventListener('input', handleInput);
            input.addEventListener('keydown', handleKeyDown);
            input.addEventListener('focus', handleFocus);
            
            cellElement.appendChild(input);
            gridContainer.appendChild(cellElement);
            
            // Simpan referensi input di grid state
            cell.input = input;
        }
    }
}

/**
 * Merender daftar petunjuk ke DOM
 */
function renderClues() {
    // Kosongkan daftar petunjuk sebelumnya
    acrossList.innerHTML = '';
    downList.innerHTML = '';
    
    // Render petunjuk mendatar
    clues.across.forEach(clue => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${clue.number}. Mendatar:</strong> ${clue.text}`;
        li.dataset.clueNumber = clue.number;
        li.dataset.direction = 'across';
        li.addEventListener('click', () => highlightClue(clue));
        acrossList.appendChild(li);
    });
    
    // Render petunjuk menurun
    clues.down.forEach(clue => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${clue.number}. Menurun:</strong> ${clue.text}`;
        li.dataset.clueNumber = clue.number;
        li.dataset.direction = 'down';
        li.addEventListener('click', () => highlightClue(clue));
        downList.appendChild(li);
    });
}

/**
 * Menandai sel-sel dari suatu petunjuk
 * @param {object} clue - Petunjuk yang akan ditandai
 */
function highlightClue(clue) {
    // Reset highlight semua sel
    const allInputs = document.querySelectorAll('#crossword-grid input');
    allInputs.forEach(input => {
        input.style.backgroundColor = '';
        input.style.borderColor = '';
    });
    
    // Highlight sel-sel dari petunjuk ini
    clue.cells.forEach(cellPos => {
        const input = document.querySelector(
            `input[data-row="${cellPos.row}"][data-col="${cellPos.col}"]`
        );
        if (input) {
            input.style.backgroundColor = '#e8f4fc';
            input.style.borderColor = '#3498db';
        }
    });
    
    // Fokus ke sel pertama
    const firstCell = clue.cells[0];
    const firstInput = document.querySelector(
        `input[data-row="${firstCell.row}"][data-col="${firstCell.col}"]`
    );
    if (firstInput) {
        firstInput.focus();
    }
}

// =============================================
// 6. HANDLER INPUT & NAVIGASI
// =============================================

/**
 * Handler untuk event input
 * @param {Event} e - Event object
 */
function handleInput(e) {
    const input = e.target;
    const row = parseInt(input.dataset.row);
    const col = parseInt(input.dataset.col);
    const answer = input.dataset.answer;
    
    // Hanya izinkan angka
    input.value = input.value.replace(/[^0-9]/g, '');
    
    // Simpan nilai ke grid state
    if (grid[row] && grid[row][col]) {
        grid[row][col].input = { value: input.value };
    }
    
    // Auto-navigate ke sel berikutnya jika sudah terisi 2 digit
    if (input.value.length === 2) {
        moveToNextCell(row, col, 'forward');
    }
    
    // Reset warna
    input.style.backgroundColor = '';
}

/**
 * Handler untuk event keydown
 * @param {Event} e - Event object
 */
function handleKeyDown(e) {
    const input = e.target;
    const row = parseInt(input.dataset.row);
    const col = parseInt(input.dataset.col);
    
    // Navigasi dengan arrow keys
    switch (e.key) {
        case 'ArrowUp':
            e.preventDefault();
            moveToCell(row - 1, col);
            break;
        case 'ArrowDown':
            e.preventDefault();
            moveToCell(row + 1, col);
            break;
        case 'ArrowLeft':
            e.preventDefault();
            moveToCell(row, col - 1);
            break;
        case 'ArrowRight':
            e.preventDefault();
            moveToCell(row, col + 1);
            break;
        case 'Tab':
            e.preventDefault();
            if (e.shiftKey) {
                moveToPrevCell(row, col);
            } else {
                moveToNextCell(row, col, 'forward');
            }
            break;
        case 'Enter':
            e.preventDefault();
            // Toggle antara mendatar dan menurun
            toggleDirection(row, col);
            break;
        case 'Backspace':
            // Jika input kosong, hapus karakter dan pindah ke sel sebelumnya
            if (input.value === '') {
                moveToPrevCell(row, col);
            }
            break;
    }
}

/**
 * Handler untuk event focus
 * @param {Event} e - Event object
 */
function handleFocus(e) {
    const input = e.target;
    const row = parseInt(input.dataset.row);
    const col = parseInt(input.dataset.col);
    
    // Highlight petunjuk yang terkait
    const cell = grid[row][col];
    if (cell) {
        // Cari petunjuk yang aktif
        let activeClue = null;
        if (document.activeElement === input) {
            // Biasanya highlight petunjuk mendatar terlebih dahulu
            if (cell.acrossClue) {
                activeClue = cell.acrossClue;
            } else if (cell.downClue) {
                activeClue = cell.downClue;
            }
        }
        
        if (activeClue) {
            highlightClue(activeClue);
        }
    }
}

/**
 * Pindah ke sel tertentu
 * @param {number} row - Baris tujuan
 * @param {number} col - Kolom tujuan
 */
function moveToCell(row, col) {
    // Validasi batas grid
    if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) {
        return;
    }
    
    // Cari sel yang bisa difokuskan (tidak hitam)
    for (let r = row; r < GRID_SIZE; r++) {
        for (let c = (r === row ? col : 0); c < GRID_SIZE; c++) {
            if (!grid[r][c].isBlack) {
                const input = document.querySelector(
                    `input[data-row="${r}"][data-col="${c}"]`
                );
                if (input) {
                    input.focus();
                    return;
                }
            }
        }
    }
}

/**
 * Pindah ke sel berikutnya
 * @param {number} currentRow - Baris saat ini
 * @param {number} currentCol - Kolom saat ini
 * @param {string} direction - Arah navigasi
 */
function moveToNextCell(currentRow, currentCol, direction = 'forward') {
    let nextRow = currentRow;
    let nextCol = currentCol;
    
    if (direction === 'forward') {
        // Cari sel berikutnya ke kanan, lalu ke bawah
        if (currentCol < GRID_SIZE - 1) {
            nextCol = currentCol + 1;
        } else if (currentRow < GRID_SIZE - 1) {
            nextRow = currentRow + 1;
            nextCol = 0;
        } else {
            // Kembali ke awal
            nextRow = 0;
            nextCol = 0;
        }
    } else {
        // Cari sel sebelumnya ke kiri, lalu ke atas
        if (currentCol > 0) {
            nextCol = currentCol - 1;
        } else if (currentRow > 0) {
            nextRow = currentRow - 1;
            nextCol = GRID_SIZE - 1;
        } else {
            // Kembali ke akhir
            nextRow = GRID_SIZE - 1;
            nextCol = GRID_SIZE - 1;
        }
    }
    
    // Cari sel yang tidak hitam
    while ((nextRow !== currentRow || nextCol !== currentCol) && 
           (nextRow >= 0 && nextRow < GRID_SIZE && nextCol >= 0 && nextCol < GRID_SIZE)) {
        
        if (!grid[nextRow][nextCol].isBlack) {
            const input = document.querySelector(
                `input[data-row="${nextRow}"][data-col="${nextCol}"]`
            );
            if (input) {
                input.focus();
                // Select teks yang ada
                input.select();
                return;
            }
        }
        
        if (direction === 'forward') {
            if (nextCol < GRID_SIZE - 1) {
                nextCol++;
            } else if (nextRow < GRID_SIZE - 1) {
                nextRow++;
                nextCol = 0;
            } else {
                nextRow = 0;
                nextCol = 0;
            }
        } else {
            if (nextCol > 0) {
                nextCol--;
            } else if (nextRow > 0) {
                nextRow--;
                nextCol = GRID_SIZE - 1;
            } else {
                nextRow = GRID_SIZE - 1;
                nextCol = GRID_SIZE - 1;
            }
        }
    }
}

/**
 * Pindah ke sel sebelumnya
 * @param {number} currentRow - Baris saat ini
 * @param {number} currentCol - Kolom saat ini
 */
function moveToPrevCell(currentRow, currentCol) {
    moveToNextCell(currentRow, currentCol, 'backward');
}

/**
 * Toggle arah navigasi (mendatar/menurun)
 * @param {number} row - Baris saat ini
 * @param {number} col - Kolom saat ini
 */
function toggleDirection(row, col) {
    const cell = grid[row][col];
    
    // Jika sel memiliki kedua petunjuk, toggle di antara mereka
    if (cell.acrossClue && cell.downClue) {
        // Cari petunjuk yang sedang aktif
        const activeInput = document.activeElement;
        if (activeInput && activeInput.dataset.row && activeInput.dataset.col) {
            const activeRow = parseInt(activeInput.dataset.row);
            const activeCol = parseInt(activeInput.dataset.col);
            
            // Tentukan arah berdasarkan petunjuk yang sedang di-highlight
            // (Implementasi sederhana: alternate antara across dan down)
            static lastDirection = 'across';
            lastDirection = lastDirection === 'across' ? 'down' : 'across';
            
            const clue = lastDirection === 'across' ? cell.acrossClue : cell.downClue;
            if (clue) {
                highlightClue(clue);
            }
        }
    }
}

// =============================================
// 7. VALIDASI & CHECK JAWABAN
// =============================================

/**
 * Memeriksa jawaban pengguna
 */
function checkAnswers() {
    let correctCells = 0;
    let totalCells = 0;
    
    // Reset semua highlight
    const allInputs = document.querySelectorAll('#crossword-grid input');
    allInputs.forEach(input => {
        input.style.backgroundColor = '';
        input.style.borderColor = '';
    });
    
    // Periksa setiap sel
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cell = grid[r][c];
            if (!cell.isBlack && cell.answer !== null) {
                totalCells++;
                const input = cell.input;
                
                if (input && input.value) {
                    const userAnswer = parseInt(input.value);
                    const correctAnswer = cell.answer;
                    
                    if (userAnswer === correctAnswer) {
                        // Jawaban benar - hijau
                        input.style.backgroundColor = '#d4edda';
                        input.style.borderColor = '#c3e6cb';
                        correctCells++;
                    } else {
                        // Jawaban salah - merah
                        input.style.backgroundColor = '#f8d7da';
                        input.style.borderColor = '#f5c6cb';
                    }
                } else {
                    // Belum diisi - kuning
                    input.style.backgroundColor = '#fff3cd';
                    input.style.borderColor = '#ffeaa7';
                }
            }
        }
    }
    
    // Tampilkan hasil
    const score = totalCells > 0 ? Math.round((correctCells / totalCells) * 100) : 0;
    let message;
    
    if (score === 100) {
        message = `🎉 SEMPURNA! Semua ${totalCells} jawaban benar!`;
    } else if (score >= 80) {
        message = `👍 Bagus! ${correctCells} dari ${totalCells} benar (${score}%)`;
    } else if (score >= 60) {
        message = `👏 Cukup baik! ${correctCells} dari ${totalCells} benar (${score}%)`;
    } else {
        message = `💪 Tetap semangat! ${correctCells} dari ${totalCells} benar (${score}%). Coba lagi!`;
    }
    
    alert(message);
    
    // Update seed berdasarkan jawaban
    updateSeedFromAnswers();
}

/**
 * Reset semua jawaban
 */
function resetAnswers() {
    if (confirm('Apakah Anda yakin ingin menghapus semua jawaban?')) {
        const allInputs = document.querySelectorAll('#crossword-grid input');
        allInputs.forEach(input => {
            input.value = '';
            input.style.backgroundColor = '';
            input.style.borderColor = '';
            
            // Update grid state
            const row = parseInt(input.dataset.row);
            const col = parseInt(input.dataset.col);
            if (grid[row] && grid[row][col]) {
                grid[row][col].input = { value: '' };
            }
        });
        
        // Fokus ke sel pertama yang bisa diisi
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (!grid[r][c].isBlack) {
                    const input = document.querySelector(
                        `input[data-row="${r}"][data-col="${c}"]`
                    );
                    if (input) {
                        input.focus();
                        return;
                    }
                }
            }
        }
    }
}

// =============================================
// 8. GENERATE PUZZLE UTAMA
// =============================================

/**
 * Fungsi utama untuk menghasilkan puzzle baru
 */
function generatePuzzle() {
    // Reset state
    clues = { across: [], down: [] };
    
    // Tempatkan kata-kata di grid
    placeWordsInGrid();
    
    // Render ke DOM
    renderGrid();
    renderClues();
    
    // Tampilkan info
    console.log(`Puzzle Level ${currentLevel} dihasilkan dengan seed: ${seed}`);
    console.log(`Petunjuk mendatar: ${clues.across.length}`);
    console.log(`Petunjuk menurun: ${clues.down.length}`);
    
    // Fokus ke sel pertama yang bisa diisi
    setTimeout(() => {
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (!grid[r][c].isBlack && grid[r][c].number) {
                    const input = document.querySelector(
                        `input[data-row="${r}"][data-col="${c}"]`
                    );
                    if (input) {
                        input.focus();
                        break;
                    }
                }
            }
        }
    }, 100);
}

// =============================================
// 9. EVENT LISTENERS & INITIALIZATION
// =============================================

/**
 * Inisialisasi event listeners
 */
function initializeEventListeners() {
    // Pilih level
    levelSelect.addEventListener('change', (e) => {
        currentLevel = parseInt(e.target.value);
        generatePuzzle();
    });
    
    // Generate puzzle baru
    btnGenerate.addEventListener('click', () => {
        updateSeedFromAnswers();
        generatePuzzle();
    });
    
    // Periksa jawaban
    btnCheck.addEventListener('click', checkAnswers);
    
    // Reset jawaban
    btnReset.addEventListener('click', resetAnswers);
    
    // Shortcut keyboard
    document.addEventListener('keydown', (e) => {
        // Ctrl+N untuk puzzle baru
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            updateSeedFromAnswers();
            generatePuzzle();
        }
        // Ctrl+C untuk cek jawaban
        if (e.ctrlKey && e.key === 'c') {
            e.preventDefault();
            checkAnswers();
        }
        // Ctrl+R untuk reset
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            resetAnswers();
        }
    });
}

/**
 * Fungsi inisialisasi utama
 */
function initializeGame() {
    console.log('TTS Matematika - Inisialisasi...');
    
    // Set level awal
    currentLevel = parseInt(levelSelect.value);
    
    // Inisialisasi event listeners
    initializeEventListeners();
    
    // Generate puzzle pertama
    generatePuzzle();
    
    console.log('Game siap!');
}

// =============================================
// 10. START THE GAME
// =============================================

// Tunggu hingga DOM selesai dimuat
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGame);
} else {
    initializeGame();
}

// Ekspor fungsi untuk testing (opsional)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateMathProblem,
        canPlaceWord,
        checkAnswers
    };
}
