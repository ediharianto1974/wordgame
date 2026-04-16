// ==========================================
// GAME LOGIC & LEVEL ACCESS (STRICT MODE)
// ==========================================
const levels = {
    easy: ['missing', 'spelling', 'plural', 'genderNouns', 'occupations'],
    medium: ['puzzle', 'guessing', 'pastTense', 'superlatives', 'synonym', 'antonym'],
    hard: ['grammar', 'architect', 'idioms', 'listening', 'speaking']
};

function checkLevelAccess() {
    // Ambil data markah
    const userScores = localPlayerData.games || localPlayerData.scores || {};

    // 1. Fungsi Bantuan: Korek markah sebenar
    function getRealScore(cat) {
        let rawScore = userScores[cat];
        if (typeof rawScore === 'object' && rawScore !== null) {
            return parseInt(rawScore.score || rawScore.best || rawScore.mark || 0);
        }
        return parseInt(rawScore) || 0;
    }

    // 2. Kira berapa kategori Easy & Medium yang dah MASTERED
    let easyMastered = 0;
    levels.easy.forEach(cat => {
        const totalQ = typeof gameData !== 'undefined' && gameData[cat] ? gameData[cat].length : 50; 
        if (getRealScore(cat) > 0 && getRealScore(cat) >= totalQ) {
            easyMastered++;
        }
    });

    let mediumMastered = 0;
    levels.medium.forEach(cat => {
        const totalQ = typeof gameData !== 'undefined' && gameData[cat] ? gameData[cat].length : 50;
        if (getRealScore(cat) > 0 && getRealScore(cat) >= totalQ) {
            mediumMastered++;
        }
    });

    // 3. Logik Buka Kunci (Unlock)
    const mediumUnlocked = easyMastered >= 3; // Perlukan 3 Easy Mastered
    const hardUnlocked = mediumMastered >= 3; // Perlukan 3 Medium Mastered

    // 4. Terapkan visual mangga/kunci pada kad Medium
    levels.medium.forEach(cat => {
        const card = document.querySelector(`[data-category="${cat}"]`) || document.querySelector(`[onclick="initGame('${cat}')"]`);
        if (card) {
            if (mediumUnlocked) {
                card.classList.remove('opacity-50', 'pointer-events-none');
                const lock = card.querySelector('.fa-lock');
                if (lock) lock.parentElement.remove(); 
            } else {
                card.classList.add('opacity-50', 'pointer-events-none');
                if (!card.querySelector('.fa-lock')) {
                    card.innerHTML += `<div class="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center rounded-3xl"><i class="fas fa-lock text-4xl text-gray-600"></i></div>`;
                }
            }
        }
    });

    // 5. Terapkan visual mangga/kunci pada kad Hard
    levels.hard.forEach(cat => {
        const card = document.querySelector(`[data-category="${cat}"]`) || document.querySelector(`[onclick="initGame('${cat}')"]`);
        if (card) {
            if (hardUnlocked) {
                card.classList.remove('opacity-50', 'pointer-events-none');
                const lock = card.querySelector('.fa-lock');
                if (lock) lock.parentElement.remove(); 
            } else {
                card.classList.add('opacity-50', 'pointer-events-none');
                if (!card.querySelector('.fa-lock')) {
                    card.innerHTML += `<div class="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center rounded-3xl"><i class="fas fa-lock text-4xl text-gray-600"></i></div>`;
                }
            }
        }
    });
}

// ==========================================
// 1. SISTEM KUIZ & MEMORI PERMAINAN
// ==========================================
function initGame(type) {
    if (!type) return; 
    const safeType = type.toUpperCase(); 

    const playerName = localPlayerData.passcode || localPlayerData.name || "guest";
    const userKey = "memoriPemain_" + playerName;

    // Pemulihan Memori
    let currentMem = localPlayerData.lastPlayed || [];
    if (typeof currentMem === 'string') currentMem = currentMem.replace(/[\[\]"'\\]/g, '').split(',').map(s => s.trim()).filter(s => s !== "");
    
    let localMem = [];
    try {
        const savedMem = localStorage.getItem(userKey);
        if (savedMem) localMem = savedMem.replace(/[\[\]"'\\]/g, '').split(',').map(s => s.trim()).filter(s => s !== "");
    } catch (e) {}

    let combinedMem = localMem.length > currentMem.length ? localMem : currentMem;
    const HAD_MEMORI = 2;
    if (combinedMem.length > HAD_MEMORI) combinedMem = combinedMem.slice(-HAD_MEMORI);
    
    localPlayerData.lastPlayed = combinedMem.map(s => s.toUpperCase());

    // Sistem Anti-Grinding
    if (localPlayerData.lastPlayed.includes(safeType) && !window.currentActiveChallenge) {
        alert(`⛔ THIS CATEGORY IS RESTING! ⛔\n\nYou have played category "${safeType}" recently.\nPlease choose another category to play.\n\nRecent Memory:\n[ ${localPlayerData.lastPlayed.join(' ➔ ')} ]`);
        return; 
    }

    localPlayerData.lastPlayed.push(safeType);
    if (localPlayerData.lastPlayed.length > HAD_MEMORI) localPlayerData.lastPlayed = localPlayerData.lastPlayed.slice(-HAD_MEMORI);
    localStorage.setItem(userKey, localPlayerData.lastPlayed.join(','));

    if (typeof saveCloudPlayerData === 'function') saveCloudPlayerData(); 

    // Mula UI Permainan
    currentGameType = type;
    document.getElementById('menu-screen')?.classList.add('hidden');
    document.getElementById('game-arena')?.classList.remove('hidden');
    document.getElementById('check-btn')?.classList.remove('hidden'); 
    document.getElementById('final-score')?.classList.add('hidden');

    const checkBtn = document.getElementById('check-btn');
    if (checkBtn) {
        checkBtn.disabled = false;
        checkBtn.innerHTML = 'CHECK ANSWERS & SEE SCORE'; 
        checkBtn.classList.remove('bg-gray-400', 'cursor-not-allowed'); 
        checkBtn.classList.add('bg-green-500', 'hover:bg-green-600'); 
    }
    
    const container = document.getElementById('question-container');
    container.innerHTML = "";
    
    let title = type.toUpperCase();
    if(type === 'guessing') title = "Guess the Word";
    if(type === 'puzzle') title = "Word Scramble";
    if(type === 'synonym') title = "Synonyms";
    if(type === 'antonym') title = "Antonyms";
    if(type === 'missing') title = "Missing Letters";
    if(type === 'pastTense') title = "Past Tense Challenge";
    if(type === 'plural') title = "Singular to Plural";
    if(type === 'spelling') title = "Correct the Spelling";
    document.getElementById('game-title').innerText = title;

    let allQuestions = [...(typeof gameData !== 'undefined' && gameData[type] ? gameData[type] : [])];
    if(allQuestions.length === 0) {
        container.innerHTML = "<p class='text-center text-red-500 font-bold'>Question data empty!</p>";
        return; 
    }
    allQuestions.sort(() => Math.random() - 0.5);

    allQuestions.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = "bg-white p-5 rounded-2xl border-l-4 border-indigo-400 shadow-sm";
        
        // JIKA PERMAINAN ADALAH SPEAKING / PRONUNCIATION
        if (type === 'speaking' || type === 'pronunciation') {
            div.classList.add('text-center'); // Ketengahkan tulisan untuk game ini
            div.innerHTML = `
                <p class="font-bold text-gray-500 mb-2">Sebut ayat di bawah:</p>
                <h1 class="text-2xl font-extrabold text-indigo-700 mb-4 target-word">${item.q}</h1>
                
                <button type="button" onclick="startMic(this)" class="bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-full font-bold shadow-md">
                    🎤 Tekan & Cakap
                </button>
                
                <p class="status-text text-sm text-gray-500 mt-3 italic"></p>
                
                <input type="hidden" class="game-input" data-answer="${item.a}" value="">
            `;
        } 
        // JIKA PERMAINAN LAIN (Menaip macam biasa)
        else {
            div.innerHTML = `
                <p class="font-bold text-gray-700 mb-3">${index + 1}. ${item.q}</p>
                <input type="text" class="game-input w-full p-3 rounded-lg bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-indigo-400" placeholder="Type your answer here..." data-answer="${item.a}">
            `;
        }
        
        container.appendChild(div);
    });

    startTimer(240); 
}

// ==========================================
// 2. KAWALAN MASA & MARKAH
// ==========================================
function startTimer(seconds) {
    timeLeft = seconds;
    if(typeof currentTimer !== 'undefined') clearInterval(currentTimer);
    
    currentTimer = setInterval(() => {
        const mins = Math.floor(timeLeft / 60);
        const secs = timeLeft % 60;
        const timerBox = document.getElementById('timer-box');
        if (timerBox) {
            timerBox.innerText = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            if (timeLeft <= 10) timerBox.classList.add('animate-pulse', 'bg-red-600');
            else timerBox.classList.remove('animate-pulse', 'bg-red-600');
        }

        if (timeLeft <= 0) {
            clearInterval(currentTimer);
            timeUp();
        }
        timeLeft--;
    }, 1000);
}

function timeUp() {
    const timerBox = document.getElementById('timer-box');
    if (timerBox) timerBox.innerText = "TIME UP!";
    document.querySelectorAll('.game-input').forEach(input => input.disabled = true);
    document.getElementById('check-btn')?.classList.remove('hidden');
    alert("TIME'S UP! Check your answers below.");
}

async function finishGame() {
    // ==========================================
    // 1. TANGKAP NAMA AWAL-AWAL SEBELUM MEMORI HILANG
    // ==========================================
    let currentPlayerName = localPlayerData.name || localStorage.getItem("playerName") || "Guest";
    let currentPlayerClass = localPlayerData.class || localStorage.getItem("playerClass") || "-";

    const checkBtn = document.getElementById('check-btn');
    if (checkBtn && checkBtn.disabled) return; 
    
    if (checkBtn) {
        checkBtn.disabled = true;
        checkBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking...';
        checkBtn.classList.remove('bg-green-500', 'hover:bg-green-600');
        checkBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
    }
    
    const inputs = document.querySelectorAll('.game-input');
    let score = 0; let total = inputs.length;

    inputs.forEach(input => {
        const userAns = input.value.trim().toLowerCase();
        const correctAns = input.dataset.answer.toLowerCase();
        input.classList.remove('border-gray-200', 'focus:ring-indigo-400', 'bg-gray-50');

        let isCorrect = correctAns.includes('|') ? correctAns.split('|').includes(userAns) : userAns === correctAns;

        if (isCorrect) {
            score++;
            input.classList.add('bg-green-100', 'border-green-500', 'text-green-800', 'font-bold');
        } else {
            input.classList.add('bg-red-100', 'border-red-500', 'text-red-800');
        }
        input.readOnly = true;
    });

// MASALAH BERLAKU DI SINI: loadCloudPlayerData mungkin memadam localPlayerData.name
    if (typeof loadCloudPlayerData === "function") await loadCloudPlayerData();

    // ==========================================
    // 2. SUNTIK SEMULA INGATAN (Penyelesaian Amnesia)
    // ==========================================
    localPlayerData.name = currentPlayerName;
    localPlayerData.class = currentPlayerClass;
    localStorage.setItem("playerName", currentPlayerName);
    localStorage.setItem("playerClass", currentPlayerClass);
    // ==========================================

    if (!localPlayerData.games) localPlayerData.games = {};
    let currentBest = localPlayerData.games[currentGameType] ? localPlayerData.games[currentGameType].score : -1;
    if (score > currentBest) localPlayerData.games[currentGameType] = { score: score, total: total };

    document.getElementById('score-val').innerText = `${score}/${total}`;
    document.getElementById('final-score').classList.remove('hidden');
    if (checkBtn) checkBtn.classList.add('hidden');

    // Pengiraan XP
    let currentXP = parseInt(localPlayerData.totalScore) || 0;
    let xpToAdd = score;
    let liveLevel = Math.floor(currentXP / 100) + 1;

    if (xpToAdd > 0) {
        if (liveLevel >= 100) xpToAdd = 0;
        else if (liveLevel >= 90) xpToAdd = Math.max(1, Math.round(xpToAdd / 6));
        else if (liveLevel >= 50) xpToAdd = Math.max(1, Math.round(xpToAdd / 2));
    }

    localPlayerData.totalScore = currentXP + xpToAdd;
    localPlayerData.Total = localPlayerData.totalScore;

    // Hardcore Penalty
    let wrongAnswers = total - score; 
    if (liveLevel >= 50 && wrongAnswers > 0) {
        let totalPenalty = wrongAnswers * ((Math.floor(liveLevel / 10) - 4) * 100);
        localPlayerData.coins = Math.max(0, localPlayerData.coins - totalPenalty);
        alert(`🔥 HARDCORE PENALTY!\nLevel: ${liveLevel}\nWrong question: ${wrongAnswers}\nTolak ${totalPenalty} Coins!`);
    }

    // Ganjaran Coins & Cabaran Biasa
    let coinsEarned = score * 2 * (typeof getCurrentEvent === "function" && getCurrentEvent() ? getCurrentEvent().multiplier : 1); 
    if (typeof checkChallengeReward === "function") coinsEarned += checkChallengeReward(score); 
    if (coinsEarned > 0) localPlayerData.coins = (parseInt(localPlayerData.coins) || 0) + coinsEarned;

    // ==========================================
    // 2. POSMEN MENGHANTAR MARKAH (GUNA NAMA YANG DITANGKAP)
    // ==========================================
    try {
        const scorePayload = {
            action: "submitScore",
            name: currentPlayerName, // <--- Kita guna nama yang dah ditangkap awal-awal
            cls: currentPlayerClass, // <--- Guna kelas yang dah ditangkap awal-awal
            type: currentGameType,             
            score: score,
            total: total
        };

        const targetURL = (typeof SCRIPT_URL !== "undefined") ? SCRIPT_URL : "https://script.google.com/macros/s/AKfycbwG1uiPv8Z0LCpHxmmcs5H3ZT_aPh0uOTfTCqmb5lyGF4C224BXObkeGJgq8pnj8W6C/exec";

        fetch(targetURL, {
            method: "POST",
            body: JSON.stringify(scorePayload)
        })
        .then(res => res.json())
        .then(data => console.log("✅ Markah berjaya dihantar ke Scores:", data))
        .catch(err => console.error("❌ Ralat hantar markah:", err));
    } catch (error) {
        console.error("Gagal menjana payload markah:", error);
    }
    // ==========================================

    // Kemaskini UI (Wajib ada)
    if (typeof updatePlayerLevelUI === "function") updatePlayerLevelUI();
    if (typeof saveCloudPlayerData === "function") saveCloudPlayerData();

    const praiseEl = document.getElementById('praise-text');
    if (praiseEl) praiseEl.innerText = score === total ? "Excellent! 🌟" : "Good Job! 💪";
    
    // ==========================================
    // PENAMBAHAN BARU: SEMAK RESULT CABARAN RAKAN
    // ==========================================
    if (typeof checkAndCompleteChallenge === "function") {
        checkAndCompleteChallenge(score); // Hantar markah akhir pemain ke sistem cabaran
    }
    // ==========================================

    // Kemaskini UI
    if (typeof updatePlayerLevelUI === "function") updatePlayerLevelUI();
    if (typeof saveCloudPlayerData === "function") saveCloudPlayerData();

    document.getElementById('praise-text').innerText = score === total ? "Excellent! 🌟" : "Good Job! 💪";
    
    // Update Mastered Card Locks
    if (typeof checkLevelAccess === 'function') checkLevelAccess();
    if (typeof updateCategoryProgress === 'function') updateCategoryProgress();
}

function updateCategoryProgress() {
    const userScores = localPlayerData.games || {};
    let totalMastered = Object.keys(userScores).filter(cat => {
        let sc = typeof userScores[cat] === 'object' ? userScores[cat].score : parseInt(userScores[cat]) || 0;
        let tq = typeof gameData !== 'undefined' && gameData[cat] ? gameData[cat].length : -1;
        return sc > 0 && sc === tq;
    }).length;
    
    const masteryElement = document.getElementById('mastery-count');
    if (masteryElement) masteryElement.innerText = totalMastered;
}

// ==========================================
// 3. LEADERBOARD
// ==========================================
async function showLeaderboard() {
    document.getElementById('menu-screen').classList.add('hidden');
    document.getElementById('game-arena').classList.add('hidden');
    document.getElementById('leaderboard-screen').classList.remove('hidden');
    
    const body = document.getElementById('leaderboard-body');
    body.innerHTML = "<tr><td colspan='6' class='p-8 text-center text-indigo-500 font-bold animate-pulse'><i class='fas fa-spinner fa-spin mr-2'></i> Fetching live scores...</td></tr>";

    try {
        const response = await fetch(SCRIPT_URL);
        const scores = await response.json();
        
        if(scores.length === 0) {
            body.innerHTML = "<tr><td colspan='6' class='p-8 text-center text-gray-400'>No records yet. Be the first to play!</td></tr>";
            return;
        }

        const studentData = {};
        
        scores.forEach(s => {
            if (!s || !s.name) return; 

            const safeName = String(s.name).toUpperCase();
            const safeCls = s.cls ? String(s.cls).toUpperCase() : "TIADA KELAS";
            const key = safeName + "_" + safeCls;
            
            if (!studentData[key]) {
                studentData[key] = {
                    name: safeName,
                    cls: s.cls || "-",
                    activeAvatar: s.activeAvatar, 
                    claimedLevel: s.claimedLevel, // <--- DIKEMASKINI: Simpan data lajur K
                    activeTitle: s.activeTitle || "Novice", 
                    games: {}
                };
            }
            
            if (s.type && s.score !== undefined) {
                let numericScore = Number(s.score) || 0;
                let numericTotal = Number(s.total) || 0;
                let currentBestScore = studentData[key].games[s.type] ? studentData[key].games[s.type].score : -1;
                if (numericScore > currentBestScore) {
                    studentData[key].games[s.type] = { score: numericScore, total: numericTotal };
                }
            } else {
                studentData[key].directTotal = Number(s.total) || 0;
            }
        });

        const leaderboard = Object.values(studentData).map(student => {
            let grandScore = 0;
            let grandMax = 0;
            const gameList = [];
            for (const [gameName, gameData] of Object.entries(student.games)) {
                grandScore += Number(gameData.score);
                grandMax += Number(gameData.total);
                gameList.push({ name: gameName, score: Number(gameData.score), total: Number(gameData.total) });
            }
            if (student.directTotal !== undefined && student.directTotal > 0) {
                grandScore = Number(student.directTotal);
                grandMax = Number(student.directTotal);
            }
            return { ...student, gameList, grandScore, grandMax };
        });

        leaderboard.sort((a, b) => b.grandScore - a.grandScore);

        body.innerHTML = "";
        let allRowsHTML = "";
        const currentPlayerName = (typeof localPlayerData !== 'undefined' && localPlayerData && localPlayerData.name) 
                                  ? String(localPlayerData.name).toUpperCase() 
                                  : "";

        leaderboard.slice(0, 50).forEach((student, index) => {
            let currentRank = index + 1;
            let rankIcon = `#${index+1}`;
            if(index === 0) rankIcon = `🥇`;
            if(index === 1) rankIcon = `🥈`;
            if(index === 2) rankIcon = `🥉`;
            
            if (currentPlayerName !== "" && student.name === currentPlayerName) {
                if (typeof checkLeaderboardAchievements === 'function') {
                    checkLeaderboardAchievements(currentRank);
                }
            }

            // 1. LUKIS AVATAR (DIKEMASKINI DENGAN JSON.PARSE)
            let avatarHtml = '';
            if (student.activeAvatar) {
                // <--- DIKEMASKINI: Tukar teks JSON kepada Object
                let active = typeof student.activeAvatar === 'string' ? JSON.parse(student.activeAvatar) : student.activeAvatar;
                
                let avatarKey = active.key || active.id || active.avatarKey;
                let visualContent = '';
                let isLegendaryImage = false;
                const rawData = (typeof avatars !== 'undefined') ? avatars : (typeof avatarsData !== 'undefined' ? avatarsData : null);

                if (rawData && rawData[avatarKey] && rawData[avatarKey].levels) {
                    let safeLevel = active.level || 1; 
                    const levelInfo = rawData[avatarKey].levels.slice().reverse().find(l => safeLevel >= l.level);

                    if (levelInfo && levelInfo.img) {
                        visualContent = `<img src="${levelInfo.img}" class="w-14 h-14 md:w-16 md:h-16 object-contain drop-shadow-[0_0_8px_rgba(255,140,0,0.8)] legendary-avatar mx-auto">`;
                        isLegendaryImage = true;
                    } else {
                        let iconToUse = (levelInfo && levelInfo.icon) ? levelInfo.icon : active.icon;
                        visualContent = `<i class="${iconToUse} text-xl md:text-2xl text-yellow-600"></i>`;
                    }
                } else {
                    visualContent = active.img 
                        ? `<img src="${active.img}" class="w-14 h-14 md:w-16 md:h-16 object-contain drop-shadow-md legendary-avatar mx-auto">` 
                        : `<i class="${active.icon} text-xl md:text-2xl text-yellow-600"></i>`;
                    if (active.img) isLegendaryImage = true;
                }
                
                let containerClass = isLegendaryImage 
                    ? "w-12 h-12 md:w-14 md:h-14 flex items-center justify-center mb-1 relative" 
                    : "avatar-3d-glow bg-indigo-50 border-2 border-indigo-200 rounded-full w-12 h-12 md:w-14 md:h-14 flex items-center justify-center mb-1 relative"; 

                avatarHtml = `
                    <div class="flex flex-col items-center justify-center p-2">
                        <div class="${containerClass}">
                            ${visualContent}
                            <div class="absolute -bottom-1 -right-1 z-10 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-white shadow-sm">Lvl ${active.level || 1}</div>
                        </div>
                        <div class="text-[9px] font-bold text-yellow-700 text-center uppercase bg-yellow-100 px-2 py-0.5 rounded-full shadow-sm whitespace-nowrap w-max mx-auto mt-1">${active.name}</div>
                    </div>`;
            } else {
                avatarHtml = `<div class="text-[10px] text-gray-400 italic text-center py-4">No Guardian</div>`;
            }

            // 2. GELARAN KARAKTER
            const titleName = String(student.activeTitle || "Novice");
            const rawAchievements = (typeof achievementsData !== 'undefined') ? achievementsData : [];
            const titleData = rawAchievements.find(ach => ach.name === titleName);
            const tier = titleData ? titleData.tier : 'common';
            const achId = titleData ? titleData.id : ''; 
            
            let titleHTML = "";
            const upperTitle = titleName.toUpperCase();

            if (achId === 'ach_16') titleHTML = `<div class="title-king inline-block mt-1">👑 ${upperTitle}</div>`;
            else if (achId === 'ach_15') titleHTML = `<div class="title-legendary-beast inline-block mt-1">👾 ${upperTitle}</div>`;
            else if (achId === 'ach_08') titleHTML = `<div class="title-master inline-block mt-1">🔥 ${upperTitle}</div>`;
            else if (tier === 'legendary') titleHTML = `<div class="title-legendary inline-block mt-1">🏆 ${upperTitle}</div>`;
            else if (tier === 'epic') titleHTML = `<div class="title-epic text-[10px] md:text-xs inline-block mt-1">✨ ${upperTitle}</div>`;
            else if (tier === 'rare') titleHTML = `<div class="title-rare text-[10px] md:text-xs inline-block mt-1">⭐ ${upperTitle}</div>`;
            else titleHTML = `<div class="title-common text-[10px] md:text-xs inline-block mt-1">${upperTitle}</div>`;

            // 3. PENGIRAAN LEVEL (DIKEMASKINI: Baca Lajur K jika ada)
            let studentLevel = Math.floor(student.grandScore / 100) + 1;
            
            // <--- DIKEMASKINI: Jika lajur K ada data, ambil nilai maks
            if (student.claimedLevel) {
                try {
                    let lvlData = typeof student.claimedLevel === 'string' ? JSON.parse(student.claimedLevel) : student.claimedLevel;
                    if (Array.isArray(lvlData) && lvlData.length > 0) {
                        studentLevel = Math.max(...lvlData);
                    }
                } catch(e) {}
            }

            let studentLevelTitle = "Novice";
            if (studentLevel >= 151) studentLevelTitle = "Transcendent";
            else if (studentLevel >= 101) studentLevelTitle = "Omniscient";
            else if (studentLevel >= 51) studentLevelTitle = "Adept";

            let newLevelBadgeHTML = `<div class="mt-1 flex items-center gap-1 text-[11px] md:text-sm font-semibold text-pink-600"><i class="fas fa-certificate"></i> Lv.${studentLevel} ${studentLevelTitle}</div>`;

            // 4. LENCANA PERMAINAN
            let gamesBadgesHtml = student.gameList.map(game => {
                return `<span class="inline-block bg-indigo-50 border border-indigo-200 text-indigo-700 text-[9px] md:text-xs px-2 py-1 rounded-md m-0.5 font-semibold">${game.name}: <span class="text-green-600">${game.score}/${game.total}</span></span>`;
            }).join('');

            // 5. MARKAH KESELURUHAN
            const totalHtmlRes = `<span class="bg-indigo-600 text-white px-2 py-1 md:px-3 md:py-1 rounded-full font-bold shadow-md text-xs md:text-base whitespace-nowrap">${student.grandScore} XP</span>`;

            // 6. BINA BARIS JADUAL
            const row = `
                <tr class="border-b-2 border-indigo-100 hover:bg-gray-50 transition">
                    <td class="p-2 md:p-4 font-bold text-indigo-600 text-sm md:text-xl text-center align-middle">${rankIcon}</td>
                    <td class="p-1 md:p-2 w-12 md:w-24 align-middle">${avatarHtml}</td>
                    <td class="p-2 md:p-4 align-middle">
                        <div class="font-black uppercase text-gray-800 text-xs md:text-lg">${student.name}</div>
                        ${titleHTML}
                        <br> ${newLevelBadgeHTML}
                    </td>
                    <td class="p-2 md:p-4 text-[10px] md:text-sm text-gray-500 text-center align-middle">${student.cls || "-"}</td>
                    <td class="p-2 md:p-4 align-middle">
                        <div class="flex flex-wrap gap-1 justify-start">
                            ${gamesBadgesHtml}
                        </div>
                    </td>
                    <td class="p-2 md:p-4 text-center align-middle">${totalHtmlRes}</td>
                </tr>
            `;
            allRowsHTML += row; 
        });

        body.innerHTML = allRowsHTML;

    } catch (error) {
        console.error("Leaderboard Error:", error);
        body.innerHTML = `<tr><td colspan='6' class='p-8 text-center text-red-500 font-bold'><i class='fas fa-exclamation-triangle'></i> Ralat: ${error.message} <br> <span class='text-xs'>Sila refresh halaman.</span></td></tr>`;
    }
}

// ==========================================
// 4. SISTEM CABARAN (MULTIPLAYER)
// ==========================================
function generateChallengeCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return '#C-' + result;
}

async function generateChallenge() {
    const code = generateChallengeCode();
    const scoreText = document.getElementById('score-val')?.innerText || "0/0";
    
    const payload = {
        action: "createChallenge", challengeCode: code, challengerName: localPlayerData.name,
        challengerClass: localPlayerData.class || "-", gameType: currentGameType, challengerScore: parseInt(scoreText.split('/')[0]) || 0
    };
    try {
        await fetch(SCRIPT_URL, { method: "POST", body: JSON.stringify(payload) });
        alert("Challenge Code generated: " + code + "\nShare this code to your friend!");
    } catch (e) {}
}

async function joinChallenge() {
    const codeInput = document.getElementById('challenge-input-code')?.value.trim().toUpperCase();
    if (!codeInput) return;
    
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getChallenge&code=${encodeURIComponent(codeInput)}`);
        const data = await response.json();
        if (data.error) { alert("Invalid code!"); return; }
        
        isChallengeMode = true; activeChallengeCode = codeInput;
        targetScoreToBeat = data.challengerScore; activeChallengerName = data.challengerName;
        
        alert(`⚔️ CHALLENGE FOUND!\nOpponent: ${activeChallengerName}\nCategory: ${data.gameType.toUpperCase()}`);
        initGame(data.gameType); 
    } catch (e) {}
}

function checkChallengeReward(myScore) {
    if (!isChallengeMode) return 0; 
    let reward = 0;
    if (myScore > targetScoreToBeat) { reward = 50; alert(`🏆 YOU'VE WON! Opponent: ${activeChallengerName}`); } 
    else if (myScore === targetScoreToBeat) { reward = 20; alert(`🤝 SERI!`); } 
    else alert(`💔 YOU'VE LOST!`);
    
    fetch(SCRIPT_URL, { method: "POST", body: JSON.stringify({ action: "completeChallenge", challengeCode: activeChallengeCode }) });
    isChallengeMode = false; activeChallengeCode = null;
    return reward;
}

// ==========================================
// FUNGSI SERTAI CABARAN RAKAN
// ==========================================
async function promptJoinChallenge() {
    const code = prompt("Please enter the Challenge Code:\n(Example: CHL-1234)");
    
    if (!code || code.trim() === "") return; 

    const cleanCode = code.trim().toUpperCase();
    console.log("Menyemak kod cabaran: " + cleanCode);

    try {
        // Hantar maklumat ke Google Sheets secara POST
        const payload = {
            action: "getChallenge",
            challengeCode: cleanCode
        };

        // Pastikan SCRIPT_URL anda telah didefinasikan di bahagian atas fail JS
        const response = await fetch(SCRIPT_URL, {
            method: "POST",
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        // Semak respon
        if (data.error) {
            alert("❌ GAGAL: " + data.error);
        } else {
            alert(`🔥 CHALLENGE FOUND!\n\nOpponet: ${data.challengerName} (${data.challengerClass})\nCategory: ${data.gameType}\nScore to beat: ${data.challengerScore}\n\nGood Luck!`);

            // Simpan data cabaran dalam memori untuk dibandingkan lepas habis game
            window.currentActiveChallenge = {
                code: cleanCode,
                challengerName: data.challengerName,
                gameType: data.gameType,
                targetScore: data.challengerScore
            };

            // MULA PERMAINAN MENGGUNAKAN initGame
            if (typeof initGame === 'function') {
                // Sembunyikan menu utama (jika perlu) sebelum mula game
                const menuScreen = document.getElementById('menu-screen');
                if (menuScreen) menuScreen.classList.add('hidden');
                
                // Mula game mengikut kategori cabaran
                initGame(data.gameType);
            } else {
                alert("Ralat: Fungsi initGame tidak dijumpai dalam sistem.");
            }
        }

    } catch (error) {
        console.error("Ralat Rangkaian:", error);
        alert("Connection error. Please make sure your internet is stable and try again.");
    }
}

// ==========================================
// FUNGSI SEMAK RESULT CABARAN (GAME OVER)
// ==========================================
function checkAndCompleteChallenge(playerFinalScore) {
    // 1. Semak adakah pemain sedang bermain dalam mod cabaran
    if (!window.currentActiveChallenge) return;

    const challenge = window.currentActiveChallenge;
    const target = parseInt(challenge.targetScore);
    const score = parseInt(playerFinalScore);

    console.log(`Checking challenge: Your score ${score} vs Target score ${target}`);

    if (score > target) {
        // --- MENANG CABARAN ---
        const rewardCoins = 50; // Jumlah syiling menang cabaran
        
        // Kemaskini data profil
        localPlayerData.coins = (Number(localPlayerData.coins) || 0) + rewardCoins;
        localPlayerData.challengesWon = (Number(localPlayerData.challengesWon) || 0) + 1;
        
        // Papar Notifikasi Menang
        alert(`🎉 CONGRATULATION CHALLENGE COMPLETED!\n\nYou have beaten ${challenge.challengerName}!\nYour Score: ${score}\nTarget Score: ${target}\n\nReward: +${rewardCoins} Coins!`);

        // Arahkan Google Sheets untuk "Tutup" (Completed) cabaran ini
        try {
            const payload = {
                action: "completeChallenge",
                challengeCode: challenge.code
            };
            fetch(SCRIPT_URL, {
                method: "POST",
                body: JSON.stringify(payload)
            });
        } catch (e) {
            console.error("Gagal menutup cabaran di database", e);
        }

    } else if (score === target) {
        // --- SERI ---
        localPlayerData.challengesTied = (Number(localPlayerData.challengesTied) || 0) + 1;
        alert(`🤝 CHALLENGE TIED!\n\nYour score is the same with ${challenge.challengerName} (${score}).\nPlease try again to beat the record!`);
        
    } else {
        // --- KALAH ---
        localPlayerData.challengesLost = (Number(localPlayerData.challengesLost) || 0) + 1;
        alert(`💔 CHALLENGE FAILED!\n\nYou have not beaten ${challenge.challengerName}.\nYour Score: ${score}\nTarget Score: ${target}\n\nDon't give up, try again!`);
    }

    // 2. Padam memori cabaran supaya ia tak berulang kali dipanggil
    window.currentActiveChallenge = null;
    
    // 3. Simpan perubahan (Coins & Stats) ke Cloud Database
    if (typeof saveCloudPlayerData === 'function') {
        saveCloudPlayerData();
    }
}

/* ==========================================
   FUNGSI AUDIO UNTUK LISTENING GAME (WEB SPEECH API)
   ========================================== */
window.playAudio = function(wordToSay) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); 
        var msg = new SpeechSynthesisUtterance();
        msg.text = wordToSay;
        msg.lang = 'en-US'; 
        msg.rate = 0.85; // Diperlahankan sedikit supaya murid dengar dengan jelas
        window.speechSynthesis.speak(msg);
    } else {
        alert("Maaf, pelayar (browser) peranti ini tidak menyokong fungsi audio.");
    }
};

/* ==========================================
   FUNGSI AI SUARA (SPEECH RECOGNITION) - VERSI KEBAL
   ========================================== */
window.startMic = function(btnElement) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Sila gunakan Google Chrome untuk ciri Mikrofon.");
        return;
    }

    // CARA BAHARU: Suruh sistem cari kotak utama (kad putih) berbanding kotak sebelah
    const parentDiv = btnElement.closest('.bg-white') || btnElement.parentElement;
    
    // Cari elemen perkataan (AI akan cari class .target-word ATAU tag <h1> sebagai sandaran)
    const wordElement = parentDiv.querySelector('.target-word') || parentDiv.querySelector('h1');
    
    if (!wordElement) {
        alert("Ralat Sistem: Tidak dapat mengesan teks soalan di skrin.");
        return;
    }

    const targetWord = wordElement.innerText.toLowerCase();
    const statusText = parentDiv.querySelector('.status-text');
    const hiddenInput = parentDiv.querySelector('.game-input');

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = function() {
        btnElement.innerHTML = "🎙️ Mendengar...";
        btnElement.classList.replace('bg-red-500', 'bg-red-800');
        if(statusText) statusText.innerText = "Sila sebut sekarang...";
    };

    recognition.onresult = function(event) {
        // Ambil suara murid
        let transcript = event.results[0][0].transcript.toLowerCase().trim();
        
        // Buang tanda baca supaya AI tak keliru
        let cleanTranscript = transcript.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
        let cleanTarget = targetWord.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");

        if (cleanTranscript === cleanTarget) {
            if(statusText) {
                statusText.innerText = "✅ TEPAT! (" + transcript + ")";
                statusText.classList.replace('text-gray-500', 'text-green-600');
            }
            // Masukkan jawapan betul ke dalam input ghaib
            if(hiddenInput) hiddenInput.value = targetWord; 
            
            btnElement.innerHTML = "✅ Selesai";
            btnElement.disabled = true;
            btnElement.classList.replace('bg-red-800', 'bg-green-500');
        } else {
            if(statusText) {
                statusText.innerText = "❌ Anda sebut: '" + transcript + "'. Cuba lagi!";
                statusText.classList.replace('text-gray-500', 'text-red-500');
            }
            btnElement.innerHTML = "🎤 Cuba Lagi";
            btnElement.classList.replace('bg-red-800', 'bg-red-500');
        }
    };

    recognition.onerror = function(event) {
        if(statusText) statusText.innerText = "Gagal mengecam suara. Sila tekan sekali lagi.";
        btnElement.innerHTML = "🎤 Tekan & Cakap";
        btnElement.classList.replace('bg-red-800', 'bg-red-500');
    };

    recognition.onend = function() {
        if(btnElement.innerHTML !== "✅ Selesai") {
            btnElement.innerHTML = "🎤 Tekan & Cakap";
            btnElement.classList.replace('bg-red-800', 'bg-red-500');
        }
    };

    recognition.start();
};
