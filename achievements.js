// ==========================================
// FUNGSI PAPARAN ACHIEVEMENTS
// ==========================================

function showAchievementsScreen() {
    const screensToHide = ['menu-screen', 'game-screen', 'leaderboard-screen', 'shop-screen'];
    screensToHide.forEach(id => {
        const screen = document.getElementById(id);
        if (screen) screen.classList.add('hidden');
    });

    const achScreen = document.getElementById('achievements-screen');
    if (achScreen) {
        achScreen.classList.remove('hidden');
    } else {
        alert("Ralat: ID 'achievements-screen' tidak dijumpai dalam HTML!");
        return;
    }

    renderAchievements();
}

function closeAchievementsScreen() {
    const achScreen = document.getElementById('achievements-screen');
    if (achScreen) achScreen.classList.add('hidden');
    
    const mainMenu = document.getElementById('menu-screen') || document.getElementById('main-menu');
    if (mainMenu) mainMenu.classList.remove('hidden');
}

function renderAchievements() {
    const listContainer = document.getElementById('achievements-list');
    if (!listContainer) return;
    
    listContainer.innerHTML = ''; 

    let tempAchievements = [];
    if (typeof localPlayerData !== 'undefined' && localPlayerData && localPlayerData.name) {
        if (!localPlayerData.achievements) localPlayerData.achievements = []; 
        tempAchievements = localPlayerData.achievements;
    }

    let unlockedCount = 0;
    const achievementsToLoop = (typeof ACHIEVEMENTS_LIST !== 'undefined') ? ACHIEVEMENTS_LIST : (typeof achievementsData !== 'undefined' ? achievementsData : []);

    if (achievementsToLoop.length === 0) return;

    achievementsToLoop.forEach(ach => {
        const isUnlocked = tempAchievements.includes(ach.id);
        if (isUnlocked) unlockedCount++;

        const bgClass = isUnlocked ? 'bg-white border-l-4 border-green-500' : 'bg-gray-50 border-l-4 border-gray-300 opacity-80 grayscale';
        const iconClass = isUnlocked ? 'fas fa-unlock text-green-500' : 'fas fa-lock text-gray-400';
        const titleClass = isUnlocked ? 'text-gray-800' : 'text-gray-500';
        const rewardText = isUnlocked ? `<span class="text-green-600 font-bold text-xs"><i class="fas fa-check-circle"></i> Claimed</span>` : `<span class="text-yellow-600 font-bold text-xs">+${ach.coinReward} Coins</span>`;
        const titleBadge = ach.titleReward ? `<span class="inline-block bg-indigo-50 text-indigo-700 text-[10px] px-2 py-0.5 rounded-full font-semibold border border-indigo-100">Title: ${ach.titleReward}</span>` : '';

        const card = `
            <div class="${bgClass} rounded-xl shadow-sm p-4 flex items-start transition hover:shadow-md mb-3">
                <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mr-3 shrink-0">
                    <i class="${iconClass} text-lg"></i>
                </div>
                <div class="flex-1">
                    <h3 class="${titleClass} font-bold text-sm md:text-base">${ach.name}</h3>
                    <p class="text-xs text-gray-500 mt-1 mb-2 leading-tight">${ach.description}</p>
                    <div class="flex items-center justify-between mt-auto">
                        ${titleBadge}
                        ${rewardText}
                    </div>
                </div>
            </div>
        `;
        listContainer.innerHTML += card;
    });

    const statsEl = document.getElementById('achievements-stats');
    if (statsEl) {
        statsEl.innerText = `Unlocked: ${unlockedCount} / ${achievementsToLoop.length}`;
    }
}

// --- FUNGSI PENCAPAIAN (ACHIEVEMENTS) LOGIC ---
function checkAchievements() {
    if (!localPlayerData) return;

    if (typeof localPlayerData.achievements === 'string') {
        try { localPlayerData.achievements = JSON.parse(localPlayerData.achievements); } 
        catch(e) { localPlayerData.achievements = []; }
    }
    if (!Array.isArray(localPlayerData.achievements)) localPlayerData.achievements = [];

    let avatarObj = localPlayerData.avatars || {};
    if (typeof avatarObj === 'string') {
        try { avatarObj = JSON.parse(avatarObj); } 
        catch(e) { avatarObj = {}; }
    }
    localPlayerData.avatars = avatarObj;

    const currentScore = Number(localPlayerData.totalScore) || 0;
    const currentCoins = Number(localPlayerData.coins) || 0;

    let avatarCount = Object.keys(avatarObj).length;
    let maxAvatarLevel = 0;
    const levels = Object.values(avatarObj).map(Number);
    if (levels.length > 0) maxAvatarLevel = Math.max(...levels);

    const userScores = localPlayerData.games || localPlayerData.scores || {};
    let totalGamesPlayed = Object.keys(userScores).length;
    let totalPerfects = 0;

    for (let cat in userScores) {
        let rawScore = userScores[cat];
        let scoreVal = typeof rawScore === 'object' && rawScore !== null ? parseInt(rawScore.score || 0) : parseInt(rawScore) || 0;
        let totalQ = (typeof gameData !== 'undefined' && gameData[cat]) ? gameData[cat].length : 50;
        if (scoreVal > 0 && scoreVal >= totalQ) totalPerfects++;
    }

    let hasNewAchievement = false;
    const achievementsToLoop = (typeof ACHIEVEMENTS_LIST !== 'undefined') ? ACHIEVEMENTS_LIST : (typeof achievementsData !== 'undefined' ? achievementsData : []);

    achievementsToLoop.forEach(ach => {
        if (localPlayerData.achievements.includes(ach.id)) return; 
        let conditionMet = false;

        switch (ach.id) {
            case "ach_01": if (currentScore >= 100) conditionMet = true; break;
            case "ach_02": if (currentScore >= 1000) conditionMet = true; break;
            case "ach_03": if (currentScore >= 5000) conditionMet = true; break;
            case "ach_04": if (currentScore >= 10000) conditionMet = true; break;
            case "ach_05": if (totalPerfects >= 5) conditionMet = true; break; 

            case "ach_06": if (localPlayerData.challengesSent >= 1) conditionMet = true; break;
            case "ach_07": if (localPlayerData.challengesWon >= 1) conditionMet = true; break;
            case "ach_08": if (localPlayerData.challengesWon >= 10) conditionMet = true; break;
            case "ach_09": if (localPlayerData.challengesTied >= 1) conditionMet = true; break;

            case "ach_10": if (currentCoins >= 1000) conditionMet = true; break;
            case "ach_11": if (localPlayerData.coinsSpent >= 5000) conditionMet = true; break; 
            case "ach_12": if (localPlayerData.totalCoinsEarned >= 20000) conditionMet = true; break; 

            case "ach_13": if (avatarCount >= 1) conditionMet = true; break;
            case "ach_14": if (avatarCount >= 5) conditionMet = true; break;
            case "ach_15": if (maxAvatarLevel >= 10) conditionMet = true; break;
            case "ach_16": if (avatarCount >= 10) conditionMet = true; break;

            case "ach_21": if (localPlayerData.loginStreak >= 3) conditionMet = true; break;
            case "ach_22": if (localPlayerData.loginStreak >= 7) conditionMet = true; break;
            case "ach_23": if (localPlayerData.gamesPlayedToday >= 5) conditionMet = true; break;

            case "ach_24": if (totalGamesPlayed >= 12) conditionMet = true; break; 
            case "ach_27": if (totalPerfects >= 3) conditionMet = true; break; 
            case "ach_33": if (localPlayerData.shopVisits >= 20) conditionMet = true; break;
        }

        if (conditionMet) {
            unlockAchievement(ach);
            hasNewAchievement = true;
        }
    });

    if (hasNewAchievement && typeof saveCloudPlayerData === "function") saveCloudPlayerData();
}
	
function unlockAchievement(ach) {
    if (!localPlayerData.achievements) localPlayerData.achievements = [];
    localPlayerData.achievements.push(ach.id);
    localPlayerData.coins = (Number(localPlayerData.coins) || 0) + (ach.coinReward || 0);
    
    const coinDisplay = document.getElementById('coin-display') || document.getElementById('player-coins');
    if (coinDisplay) coinDisplay.innerText = localPlayerData.coins;

    alert(`🎉 ACHIEVEMENT UNLOCKED: ${ach.name}!\n\n${ach.description}\nReward: +${ach.coinReward || 0} Coins!`);
}

// ==========================================
// FUNGSI PENJEJAK (TRACKERS) BARU
// Ini fungsi pintar untuk membantu rekod markah & aktiviti
// ==========================================

function trackGamePlayed() {
    if (!localPlayerData) return;
    localPlayerData.gamesPlayedToday = (Number(localPlayerData.gamesPlayedToday) || 0) + 1;
    checkAchievements();
}

function trackCoinsEarned(amount) {
    if (!localPlayerData) return;
    localPlayerData.totalCoinsEarned = (Number(localPlayerData.totalCoinsEarned) || 0) + amount;
    checkAchievements();
}

function trackCoinsSpent(amount) {
    if (!localPlayerData) return;
    localPlayerData.coinsSpent = (Number(localPlayerData.coinsSpent) || 0) + amount;
    checkAchievements();
}

function trackShopVisit() {
    if (!localPlayerData) return;
    localPlayerData.shopVisits = (Number(localPlayerData.shopVisits) || 0) + 1;
    checkAchievements();
}

function trackLoginStreak() {
    if (!localPlayerData) return;
    const today = new Date().toDateString();
    
    if (localPlayerData.lastLoginDate !== today) {
        // Semak adakah login semalam?
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (localPlayerData.lastLoginDate === yesterday.toDateString()) {
            localPlayerData.loginStreak = (Number(localPlayerData.loginStreak) || 0) + 1; // Sambung streak
        } else {
            localPlayerData.loginStreak = 1; // Mula dari 1 semula kalau terlepas hari
        }
        
        localPlayerData.lastLoginDate = today;
        localPlayerData.gamesPlayedToday = 0; // Reset game harian
        checkAchievements();
        if (typeof saveCloudPlayerData === "function") saveCloudPlayerData();
    }
}