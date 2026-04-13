// ==========================================
// SISTEM AUTENTIKASI (LOGIN & LOGOUT)
// ==========================================

window.onload = async () => {
    // 1. KAWALAN SKRIN
    let isUserLoggedIn = localStorage.getItem('localPlayerData') || localStorage.getItem('playerName'); 

    if (!isUserLoggedIn) {
        document.getElementById('auth-screen')?.classList.remove('hidden');
        document.getElementById('login-screen')?.classList.remove('hidden');
        document.getElementById('menu-screen')?.classList.add('hidden');
        document.getElementById('game-arena')?.classList.add('hidden');
        document.getElementById('leaderboard-screen')?.classList.add('hidden');
        document.getElementById('shop-screen')?.classList.add('hidden');
        document.getElementById('achievements-screen')?.classList.add('hidden');
} else {
        document.getElementById('auth-screen')?.classList.add('hidden');
        document.getElementById('login-screen')?.classList.add('hidden');
        document.getElementById('menu-screen')?.classList.remove('hidden');
        
        // --- TAMBAH INI ---
        // Ambil data dari storage untuk semak jika dia Game Master
        const savedData = JSON.parse(localStorage.getItem('localPlayerData') || '{}');
        if (savedData.name && savedData.name.toUpperCase() === "GAME MASTER") {
            document.getElementById('admin-control-btn')?.classList.remove('hidden');
        }
        if (typeof checkGameMaster === 'function') checkGameMaster();
        // ------------------

        if (typeof checkLevelAccess === 'function') checkLevelAccess();
    }

    // 2. MENARIK DATA NAMA
    const datalist = document.getElementById('name-suggestions');
    const loadingText = document.getElementById('loading-status');
    const startBtn = document.getElementById('start-btn');
    
    if(startBtn) {
        startBtn.disabled = true; 
        startBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }

    try {
        const response = await fetch(SCRIPT_URL);
        const data = await response.json();
        
        const uniqueStudents = [];
        const checkDuplicate = new Map();
        
        for (const item of data) {
            if(!checkDuplicate.has(item.name.toLowerCase())){
                checkDuplicate.set(item.name.toLowerCase(), true);
                uniqueStudents.push({ name: item.name.toUpperCase(), class: item.cls });
            }
        }
        studentDatabase = uniqueStudents;
        
        studentDatabase.forEach(profile => {
            const option = document.createElement('option');
            option.value = profile.name;
            datalist?.appendChild(option);
        });

        if (loadingText) {
            loadingText.innerText = "Profiles loaded successfully!";
            loadingText.classList.replace('text-indigo-500', 'text-green-500');
            loadingText.classList.remove('animate-pulse');
        }
    } catch (error) {
        console.error("Error fetching data:", error);
        if (loadingText) {
            loadingText.innerText = "Warning: Could not load profiles. Proceed manually.";
            loadingText.classList.replace('text-indigo-500', 'text-red-500');
            loadingText.classList.remove('animate-pulse');
        }
    } finally {
        if(startBtn) {
            startBtn.disabled = false;
            startBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }
};

function autoFillClass() {
    const inputName = document.getElementById('student-name')?.value.trim().toLowerCase();
    const foundProfile = studentDatabase.find(p => p.name.toLowerCase() === inputName);
    if (foundProfile) {
        document.getElementById('student-class').value = foundProfile.class;
    }
}

if (localPlayerData && localPlayerData.name && localPlayerData.name.toUpperCase() === "GAME MASTER") {
        document.getElementById('admin-control-btn')?.classList.remove('hidden');
    } else {
        document.getElementById('admin-control-btn')?.classList.add('hidden');
    }
    
async function startGameHub() {
    const nameInput = document.getElementById('student-name').value.trim();
    const classInput = document.getElementById('student-class').value.trim();
    const pinInput = document.getElementById('student-pin').value.trim(); 

    if (!nameInput || !classInput) {
        alert("Please enter your name and class first!");
        return;
    }

    const startBtn = document.getElementById('start-btn');
    startBtn.innerText = "Loading data...";
    startBtn.disabled = true;

    try {
        const response = await fetch(`${SCRIPT_URL}?action=getPlayer&name=${encodeURIComponent(nameInput)}&cls=${encodeURIComponent(classInput)}&passcode=${encodeURIComponent(pinInput)}&t=${new Date().getTime()}`, { cache: "no-store" });
        const data = await response.json();

        if (data && data.error === "WrongPIN") {
            alert("OOPS! The PIN entered is INCORRECT.\n\nPlease enter your correct 4-digit PIN.\n(If you are a new student, please use a different Name that hasn't been taken).");
            startBtn.innerText = "START ADVENTURE";
            startBtn.disabled = false;
            return;
        }

        if (!data) {
            const autoPin = Math.floor(1000 + Math.random() * 9000).toString();
            alert(`👋 WELCOME!\n\nThe system has registered you and generated a secret PIN:\n\n👉 YOUR PIN: ${autoPin} 👈\n\nPLEASE WRITE DOWN & REMEMBER THIS PIN! You will need it to log in next time.`);
            localPlayerData = { 
                name: nameInput, class: classInput, passcode: autoPin,
                coins: 0, inventory: [], avatars: {}, activeAvatar: null,
                achievements: [], totalScore: 0, activeTitle: "Novice", 
                claimedLevels: [], games: {}, lastPlayed: [] 
            };
            studentInfo = { name: nameInput, class: classInput };
            if(typeof saveCloudPlayerData === 'function') await saveCloudPlayerData(); 
        } else {
            if (data.hasPin === false) {
                const autoPin = Math.floor(1000 + Math.random() * 9000).toString();
                alert(`🚨 ANNOUNCEMENT FOR RETURNING STUDENTS 🚨\n\nThe system is now more secure! We have generated a special PIN for your account:\n\n👉 YOUR PIN: ${autoPin} 👈\n\nPLEASE WRITE IT DOWN NOW! You must use this PIN to log in next time.`);
                let parsedGames = {};
                try { parsedGames = typeof data.games === 'string' ? JSON.parse(data.games) : (data.games || {}); } catch(e) {}
                let parsedMem = [];
                if (typeof data.lastPlayed === 'string') {
                    parsedMem = data.lastPlayed.replace(/[\[\]"'\\]/g, '').split(',').map(s => s.trim()).filter(s => s !== "");
                } else if (Array.isArray(data.lastPlayed)) { parsedMem = data.lastPlayed; }
                localPlayerData = {
                    name: nameInput, class: classInput, passcode: autoPin,
                    coins: data.coins || 0, inventory: data.inventory || [],
                    avatars: data.avatars || {}, activeAvatar: data.activeAvatar || null,
                    achievements: data.achievements || [],
                    totalScore: data.Total || data.total || data.TOTAL || data.totalScore || data.coins || 0,
                    activeTitle: data.activeTitle || "Novice", 
                    claimedLevels: Array.isArray(data.claimedLevels) ? data.claimedLevels : [],
                    games: parsedGames, lastPlayed: parsedMem 
                };
                studentInfo = { name: nameInput, class: classInput };
                if (typeof applyTitleStyle === "function") applyTitleStyle(localPlayerData.activeTitle);
                if(typeof saveCloudPlayerData === 'function') await saveCloudPlayerData(); 
            } else {
                if (!pinInput) {
                    alert("Please enter your PIN to continue!");
                    startBtn.innerText = "START ADVENTURE";
                    startBtn.disabled = false;
                    return; 
                }
                let parsedGames = {};
                try { parsedGames = typeof data.games === 'string' ? JSON.parse(data.games) : (data.games || {}); } catch(e) {}
                let parsedMem = [];
                if (typeof data.lastPlayed === 'string') {
                    parsedMem = data.lastPlayed.replace(/[\[\]"'\\]/g, '').split(',').map(s => s.trim()).filter(s => s !== "");
                } else if (Array.isArray(data.lastPlayed)) { parsedMem = data.lastPlayed; }
                localPlayerData = {
                    name: nameInput, class: classInput, passcode: pinInput,
                    coins: data.coins || 0, inventory: data.inventory || [],
                    avatars: data.avatars || {}, activeAvatar: data.activeAvatar || null,
                    achievements: data.achievements || [],
                    totalScore: data.Total || data.total || data.TOTAL || data.totalScore || data.coins || 0,
                    activeTitle: data.activeTitle || "Novice", 
                    claimedLevels: Array.isArray(data.claimedLevels) ? data.claimedLevels : [],
                    games: parsedGames, lastPlayed: parsedMem 
                };
                studentInfo = { name: nameInput, class: classInput };
                if (typeof applyTitleStyle === "function") applyTitleStyle(localPlayerData.activeTitle);
                alert("Login Successful! Welcome back, " + nameInput + "!");
            }
        } 

        // Buka Menu Utama
        document.getElementById('display-name').innerText = studentInfo.name;
        document.getElementById('display-class').innerText = "Class: " + studentInfo.class;
        
        if (typeof updatePlayerLevelUI === 'function') updatePlayerLevelUI();
        
        document.getElementById('auth-screen')?.classList.add('hidden');
        document.getElementById('login-screen')?.classList.add('hidden');
        document.getElementById('menu-screen')?.classList.remove('hidden');
        
        if (typeof updateCategoryProgress === "function") updateCategoryProgress();
        if (typeof checkLevelAccess === 'function') checkLevelAccess();

        const avatarContainer = document.getElementById('dashboard-avatars');
        if(avatarContainer) avatarContainer.innerHTML = '<i class="fas fa-spinner fa-spin text-indigo-500"></i>';
        
        if (typeof updateDashboardAvatars === "function") updateDashboardAvatars();

        if (typeof getCurrentEvent === "function") {
            const currentEvent = getCurrentEvent();
            if (currentEvent) {
                const eventBanner = document.getElementById('event-banner');
                if (eventBanner) {
                    eventBanner.classList.remove('hidden');
                    document.getElementById('event-text').innerText = "ACTIVE EVENT: " + currentEvent.name;
                }
            } else {
                const eventBanner = document.getElementById('event-banner');
                if (eventBanner) eventBanner.classList.add('hidden');
            }
        }

        startBtn.innerText = "START ADVENTURE";
        startBtn.disabled = false;

if (localPlayerData.name && localPlayerData.name.toUpperCase() === "GAME MASTER") {
            document.getElementById('admin-control-btn')?.classList.remove('hidden');
        } else {
            document.getElementById('admin-control-btn')?.classList.add('hidden');
        }
        if (typeof checkGameMaster === 'function') checkGameMaster();
        checkLevelRewardsOnLogin();
        if (typeof checkAchievements === "function") checkAchievements();
	if (typeof checkActiveBossEvent === "function") {
            checkActiveBossEvent();
        }

    } catch (error) {
        console.error(error);
        alert("System error. Please ensure your internet connection is stable and try again.");
        startBtn.innerText = "START ADVENTURE";
        startBtn.disabled = false;
    }
}

function logout() {
    studentInfo = { name: '', class: '' };
    document.getElementById('student-name').value = '';
    document.getElementById('student-class').value = '';
    document.getElementById('student-pin').value = '';
    document.getElementById('admin-control-btn')?.classList.add('hidden');
    localStorage.removeItem('localPlayerData');
    localStorage.removeItem('playerName');
    location.reload();
}


function checkLevelRewardsOnLogin() {
    let currentTotalXP = Number(localPlayerData.totalScore) || 0;
    let currentLevel = Math.floor(currentTotalXP / 100) + 1;
    if (currentLevel > 150) currentLevel = 150; 

    if (!localPlayerData.claimedLevels || !Array.isArray(localPlayerData.claimedLevels)) {
        localPlayerData.claimedLevels = [];
    }
    localPlayerData.lastPlayed = localPlayerData.lastPlayed || [];
    localPlayerData.games = localPlayerData.games || {};

    let claimedArray = localPlayerData.claimedLevels.map(Number); 
    let totalRewardToGive = 0;
    let newlyClaimedLevels = [];

    for (let i = 2; i <= currentLevel; i++) {
        if (!claimedArray.includes(i)) {
            totalRewardToGive += (i * 100); 
            newlyClaimedLevels.push(i);     
            claimedArray.push(i); 
        }
    }

    if (newlyClaimedLevels.length > 0) {
        localPlayerData.claimedLevels = claimedArray;
        localPlayerData.coins = (Number(localPlayerData.coins) || 0) + totalRewardToGive;

        if (typeof saveCloudPlayerData === 'function') saveCloudPlayerData();

        setTimeout(() => {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: '🎁 LEVEL UP REWARD!',
                    html: `Congratulations! Reward for <b>Level ${newlyClaimedLevels.join(', ')}</b> opened.<br><br><b style="color: #d97706; font-size: 20px;">💰 ${totalRewardToGive.toLocaleString()} Coins</b> given!`,
                    icon: 'success',
                    confirmButtonText: 'Hebat!'
                });
            } else {
                alert(`🎁 LEVEL REWARD!\nYou Received +${totalRewardToGive} Coins!`);
            }
            if (typeof updatePlayerLevelUI === 'function') updatePlayerLevelUI();
        }, 1500); 
    }
}

// ==========================================
// SISTEM CLOUD DATABASE
// ==========================================
async function loadCloudPlayerData() {
    const url = SCRIPT_URL + `?action=getPlayer&name=${encodeURIComponent(studentInfo.name)}&cls=${encodeURIComponent(studentInfo.class)}&passcode=${encodeURIComponent(localPlayerData.passcode || '')}&t=${new Date().getTime()}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data && data.error !== "WrongPIN") {
            const currentPasscode = localPlayerData.passcode;
            localPlayerData = data;
            localPlayerData.passcode = currentPasscode;
            if(!localPlayerData.avatars) localPlayerData.avatars = {}; 
        } else if (data && data.error === "WrongPIN") {
            console.error("Security Block: PIN does not match");
        } else {
            localPlayerData = { coins: 0, inventory: [], avatars: {}, passcode: localPlayerData.passcode };
        }
    } catch(e) {
        console.error("Error fetching player data", e);
    }
}

async function saveCloudPlayerData() {
    const payload = {
        action: "updatePlayer",
        name: studentInfo.name,
        class: studentInfo.class,
        passcode: localPlayerData.passcode || "", 
        coins: localPlayerData.coins,
        inventory: localPlayerData.inventory,
        avatars: localPlayerData.avatars,
        activeAvatar: localPlayerData.activeAvatar,
        achievements: localPlayerData.achievements,
        activeTitle: localPlayerData.activeTitle, 
        claimedLevels: localPlayerData.claimedLevels || [],
        lastPlayed: localPlayerData.lastPlayed || [], 
        games: localPlayerData.games || {}            
    };

    try {
        await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });
        if (typeof updateCategoryProgress === 'function') {
            updateCategoryProgress();
        }
    } catch(e) {
        console.error("Error saving player data", e);
    }
}