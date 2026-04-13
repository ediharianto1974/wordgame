// ==========================================
// KAWALAN ANTARAMUKA PENGGUNA (UI)
// ==========================================

// PENGIRAAN LEVEL PEMAIN (TOTAL SCORE)
function getPlayerLevelInfo(totalScore) {
    let score = parseInt(totalScore) || 0;
    let xpPerLevel = 100; // Kadar tetap 100 XP untuk setiap level
    
    // Formula Level Baharu
    let calculatedLevel = Math.floor(score / xpPerLevel) + 1;
    if (calculatedLevel > 150) calculatedLevel = 150; 

    // Cari senarai pangkat dengan selamat
    const ranksArray = (typeof LEVEL_RANKS !== 'undefined') ? LEVEL_RANKS : 
                       (typeof levelRanks !== 'undefined') ? levelRanks : 
                       (typeof levelData !== 'undefined') ? levelData : [];

    // Cari pangkat dari ranksArray
    let currentRank = ranksArray.find(r => calculatedLevel >= r.minLevel && calculatedLevel <= r.maxLevel);
    
    // Jika tak jumpa (fallback)
    if (!currentRank) {
        currentRank = ranksArray.length > 0 ? ranksArray[ranksArray.length - 1] : {title: "Novice", icon: "🔰", colorClass: "text-gray-500"};
    }

    // PENGIRAAN PROGRESS BAR
    let currentLevelBaseXP = (calculatedLevel - 1) * xpPerLevel;
    let nextLevelBaseXP = calculatedLevel * xpPerLevel;
    
    let xpInCurrentLevel = score - currentLevelBaseXP; 
    let xpNeededForNextLevel = xpPerLevel; 
    
    if (calculatedLevel >= 150) { 
        xpInCurrentLevel = xpNeededForNextLevel; 
    }
    
    let percentage = 100;
    if (calculatedLevel < 150) { 
        percentage = Math.max(0, Math.min(100, (xpInCurrentLevel / xpNeededForNextLevel) * 100));
    }

    return {
        level: calculatedLevel,
        title: currentRank.title,
        icon: currentRank.icon,
        colorClass: currentRank.colorClass || "text-green-500", 
        xpText: `${xpInCurrentLevel} / ${xpNeededForNextLevel} XP`, 
        percentage: percentage 
    };
}
	
// KEMASKINI PAPARAN LEVEL DI DASHBOARD
function updatePlayerLevelUI() {
    if (!localPlayerData) return;
    
    // Tangkap semua kemungkinan nama pembolehubah
    let safeTotalScore = parseInt(localPlayerData.totalScore) || parseInt(localPlayerData.Total) || parseInt(localPlayerData.coins) || 0; 
    let playerStats = getPlayerLevelInfo(safeTotalScore);
    
    // Tarik elemen dari HTML
    let levelElement = document.getElementById('dashboard-level');
    let progressBar = document.getElementById('dashboard-progress-bar');
    let xpTextElement = document.getElementById('dashboard-xp-text');

    // 1. Update Teks & Warna Level
    if (levelElement) {
        levelElement.innerText = `${playerStats.icon} Lv.${playerStats.level} ${playerStats.title}`;
        levelElement.className = `text-sm font-bold ${playerStats.colorClass}`; 
    }
    
    // 2. Update Lebar & Warna Progress Bar
    if (progressBar) {
        progressBar.style.width = `${playerStats.percentage}%`; 
        progressBar.className = `bg-current h-2 rounded-full transition-all duration-1000 ${playerStats.colorClass}`; 
    }
    
    // 3. Update Teks Baki XP
    if (xpTextElement) {
        xpTextElement.innerText = playerStats.xpText; 
    }
}

// ==========================================
// KAWALAN PAPARAN (SCREEN NAVIGATION)
// ==========================================
function hideScreenSafe(id) {
    let screen = document.getElementById(id);
    if (screen) screen.classList.add('hidden');
}

function backToMenu() {
    if (typeof currentTimer !== 'undefined') clearInterval(currentTimer);
    hideScreenSafe('game-arena');
    hideScreenSafe('leaderboard-screen');
    hideScreenSafe('achievements-screen');
    hideScreenSafe('shop-screen');
    hideScreenSafe('avatar-screen'); 
    
    let menuScreen = document.getElementById('menu-screen');
    if (menuScreen) menuScreen.classList.remove('hidden');
    
    if (typeof checkLevelAccess === 'function') checkLevelAccess();
}

function updateDashboardAvatars() {
    const container = document.getElementById('dashboard-avatars');
    if (!container) return; 
    container.innerHTML = ''; 

    if (localPlayerData && localPlayerData.activeAvatar) {
        let active = localPlayerData.activeAvatar;
        const avatarKey = active.key || active.id || active.avatarKey; 
        let visualContent = "";
        let isLegendaryImage = false; 

        const rawData = (typeof avatars !== 'undefined') ? avatars : (typeof avatarsData !== 'undefined' ? avatarsData : null);

        if (rawData && rawData[avatarKey]) {
            const levelInfo = rawData[avatarKey].levels.find(l => l.level === active.level);
            if (levelInfo) {
                if (levelInfo.img) {
                    visualContent = `<img src="${levelInfo.img}" class="w-24 h-24 object-contain drop-shadow-[0_0_15px_rgba(255,140,0,0.8)] mx-auto legendary-avatar" alt="${active.name}">`;
                    isLegendaryImage = true;
                } else {
                    visualContent = `<i class="${levelInfo.icon || active.icon} text-3xl text-green-600"></i>`;
                }
            } else {
                visualContent = `<i class="${active.icon} text-3xl text-green-600"></i>`;
            }
        } else {
            visualContent = `<i class="${active.icon} text-3xl text-green-600"></i>`;
        }

        if (isLegendaryImage) {
            container.innerHTML = `
                <div class="flex items-center justify-center hover:scale-110 transition cursor-pointer" 
                     title="${active.name} (Level ${active.level})" onclick="openInventoryModal()">
                    ${visualContent}
                </div>`;
        } else {
            container.innerHTML = `
                <div class="bg-indigo-100 w-12 h-12 rounded-full shadow-[0_0_10px_rgba(74,222,128,0.5)] border-2 border-green-400 flex items-center justify-center hover:scale-110 transition cursor-pointer" 
                     title="${active.name} (Level ${active.level})" onclick="openInventoryModal()">
                    ${visualContent}
                </div>`;
        }
    } else {
        container.innerHTML = `
            <div class="bg-gray-100 w-12 h-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition" 
                 title="No Guardian Equipped" onclick="openInventoryModal()">
                <i class="fas fa-question text-gray-400 text-xl"></i>
            </div>`;
    }
}

// ==========================================
// FUNGSI PROFIL & TITLE
// ==========================================

// 1. Buka Pop-up Profil
function openProfile() {
    const profileScreen = document.getElementById('profile-screen');
    const menuScreen = document.getElementById('menu-screen'); // Tukar ikut ID menu Cikgu jika berbeza
    
    // Sembunyikan menu, tunjukkan profil
    if (menuScreen) menuScreen.classList.add('hidden');
    if (profileScreen) profileScreen.classList.remove('hidden');

    // Kemaskini butiran profil
    document.getElementById('profile-name').innerText = localPlayerData.name || "Student";
    
    // Paparkan Title Semasa
    const activeTitle = localPlayerData.activeTitle || "Novice";
    document.getElementById('profile-active-title').innerText = activeTitle;

    // Muatkan pilihan Title dari Achievements
    loadTitleOptions();
}

// 2. Tutup Pop-up Profil
function closeProfile() {
    const profileScreen = document.getElementById('profile-screen');
    const menuScreen = document.getElementById('menu-screen');
    
    if (profileScreen) profileScreen.classList.add('hidden');
    if (menuScreen) menuScreen.classList.remove('hidden');
}

// 3. Masukkan senarai Achievements ke dalam Dropdown
function loadTitleOptions() {
    const selector = document.getElementById('title-selector');
    selector.innerHTML = '<option value="">-- Select a Title --</option>'; // Reset senarai

    // Pastikan pelajar ada pencapaian
    if (!localPlayerData.achievements || localPlayerData.achievements.length === 0) {
        const option = document.createElement('option');
        option.text = "No achievements unlocked yet";
        option.disabled = true;
        selector.add(option);
        return;
    }

    // Tapis achievementsData, ambil yang pelajar dah unlock sahaja
    achievementsData.forEach(ach => {
        if (localPlayerData.achievements.includes(ach.id)) {
            const option = document.createElement('option');
            option.value = ach.name;
            option.text = `🏆 ${ach.name}`;
            selector.add(option);
        }
    });
}

function saveEquippedTitle() {
    const selector = document.getElementById('title-selector');
    const selectedTitleName = selector.value;

    if (!selectedTitleName) {
        alert("Please select a title first!");
        return;
    }

    // 1. Simpan dalam data pemain (local)
    localPlayerData.activeTitle = selectedTitleName;

    // 2. Kemaskini paparan di Dashboard dan Profil serentak
    applyTitleStyle(selectedTitleName);
    
    // 3. Notifikasi dan Simpan ke Google Sheet (Cloud)
    alert(`Title Updated: ${selectedTitleName}`);
    saveCloudPlayerData(); 
}

function applyTitleStyle(titleName) {
    const displayHeader = document.getElementById('header-active-title');
    const displayProfile = document.getElementById('profile-active-title');
    
    if (!displayHeader && !displayProfile) return;

    // Cari data achievement berdasarkan nama title
    const ach = achievementsData.find(a => a.name === titleName);
    const tier = ach ? ach.tier : 'common';
    const achId = ach ? ach.id : '';

    const updateElement = (el) => {
        if (!el) return;
        el.className = ""; // Reset semua class
        el.style = "";     // Reset style manual
        
        // 1. SEMAK ID SPESIFIK DULU (Untuk CSS Unik)
        if (achId === 'ach_16') {
            el.classList.add('title-king');
            el.innerHTML = `👑 ${titleName}`;
        } 
        else if (achId === 'ach_15') {
            el.classList.add('title-legendary-beast');
            el.innerHTML = `👾 ${titleName}`;
        }
        else if (achId === 'ach_08') {
            el.classList.add('title-master');
            el.innerHTML = `🔥 ${titleName}`;
        }
        // 2. JIKA TIADA ID KHAS, GUNA CSS TIER BIASA
        else if (tier === 'legendary') {
            el.classList.add('title-legendary'); 
            el.innerHTML = `🏆 ${titleName}`;
        } else if (tier === 'epic') {
            el.classList.add('title-epic');
            el.innerHTML = `✨ ${titleName}`;
        } else if (tier === 'rare') {
            el.classList.add('title-rare');
            el.innerHTML = `⭐ ${titleName}`;
        } else {
            el.classList.add('text-gray-500', 'text-[10px]');
            el.innerHTML = `📜 ${titleName}`;
        }
    };

    updateElement(displayHeader);
    updateElement(displayProfile);
}
