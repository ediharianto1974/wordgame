// ==========================================
// SISTEM KEDAI (EDU SHOP, AVATAR, BADGES)
// ==========================================

// --- FUNGSI TUKAR TAB KEDAI ---
function switchShopTab(tabId) {
    document.querySelectorAll('.shop-tab-content').forEach(el => {
        el.classList.add('hidden');
    });
    
    document.querySelectorAll('.shop-tab-btn').forEach(btn => {
        btn.classList.remove('bg-indigo-600', 'text-white', 'shadow-md');
        btn.classList.add('bg-indigo-200', 'text-indigo-800');
    });

    document.getElementById(tabId).classList.remove('hidden');
    
    const activeBtn = document.getElementById('btn-' + tabId);
    if(activeBtn) {
        activeBtn.classList.remove('bg-indigo-200', 'text-indigo-800');
        activeBtn.classList.add('bg-indigo-600', 'text-white', 'shadow-md');
    }
}

// --- FUNGSI BUKA KEDAI ---
async function openShop() {
    if (typeof hideScreenSafe === 'function') hideScreenSafe('menu-screen');
    const shopScreen = document.getElementById('shop-screen');
    if (shopScreen) shopScreen.classList.remove('hidden');
    
    switchShopTab('tab-avatars');
    
    const avatarsTab = document.getElementById('tab-avatars');
    if (avatarsTab) {
        avatarsTab.innerHTML = '<div class="col-span-full text-center py-10 text-indigo-500 font-bold"><i class="fas fa-spinner fa-spin text-3xl mb-3"></i><br>Connecting to Cloud & Checking Edu Stock...</div>';
    }
    
    // Tarik data terkini dari Cloud (Jika fungsi wujud di auth.js)
    if (typeof loadCloudPlayerData === 'function') await loadCloudPlayerData();
    
    // Semak stok live (Jika fungsi syncEduStock atau checkLiveInventory wujud)
    if (typeof checkLiveInventory === 'function') await checkLiveInventory();
    else if (typeof syncEduStock === 'function') await syncEduStock();
    
    renderShop();
}

// --- FUNGSI TUTUP KEDAI ---
function backToMenuFromShop() {
    if (typeof hideScreenSafe === 'function') hideScreenSafe('shop-screen');
    const menuScreen = document.getElementById('menu-screen');
    if (menuScreen) menuScreen.classList.remove('hidden');
    
    if (typeof updateDashboardAvatars === 'function') updateDashboardAvatars(); 
}

// --- FUNGSI LUKIS (RENDER) KEDAI ---
function renderShop() {
    const coinBal = document.getElementById('coin-balance');
    if (coinBal) coinBal.innerText = localPlayerData.coins || 0;
    
    const avatarsContainer = document.getElementById('tab-avatars');
    const badgesContainer = document.getElementById('tab-badges');
    const eduContainer = document.getElementById('tab-edu');
    
    if (avatarsContainer) avatarsContainer.innerHTML = ''; 
    if (badgesContainer) badgesContainer.innerHTML = '';
    if (eduContainer) eduContainer.innerHTML = '';

    // ==========================================
    // 1. RENDER AVATARS / GUARDIANS
    // ==========================================
    if (typeof avatars !== 'undefined' && avatarsContainer) {
        for (const [key, avatar] of Object.entries(avatars)) {
            let currentLevel = localPlayerData.avatars[key] || 0;
            let nextLevelData = avatar.levels.find(l => l.level > currentLevel);
            let displayData = nextLevelData || avatar.levels[avatar.levels.length - 1]; 

            let btnHtml = '';
            if (currentLevel >= avatar.maxLevel) {
                btnHtml = `<button disabled class="w-full mt-4 bg-gray-300 text-gray-500 font-bold py-2 rounded-xl border border-gray-400 cursor-not-allowed">MAX LEVEL REACHED</button>`;
            } else {
                const canAfford = localPlayerData.coins >= nextLevelData.price;
                const playerTotalScore = Number(localPlayerData.Total || localPlayerData.totalScore || 0);
                const actualPlayerLevel = (typeof getPlayerLevelInfo === 'function') ? getPlayerLevelInfo(playerTotalScore).level : 1;
                const levelMet = actualPlayerLevel >= nextLevelData.level;

                if (canAfford && levelMet) {
                    btnHtml = `<button onclick="buyAvatar('${key}', ${nextLevelData.level}, ${nextLevelData.price})" class="w-full mt-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 rounded-xl transition shadow shadow-indigo-300">Unlock Lvl ${nextLevelData.level} (${nextLevelData.price} 🪙)</button>`;
                } else if (!levelMet) {
                    btnHtml = `<button disabled class="w-full mt-4 bg-gray-200 text-gray-400 font-bold py-2 rounded-xl border border-gray-300 cursor-not-allowed">Locked (Need Player Lvl ${nextLevelData.level})</button>`;
                } else {
                    btnHtml = `<button disabled class="w-full mt-4 bg-red-100 text-red-400 font-bold py-2 rounded-xl cursor-not-allowed border border-red-200">Need ${nextLevelData.price} 🪙</button>`;
                }
            }

            const avatarVisual = displayData.img 
                ? `<img src="${displayData.img}" class="h-16 w-auto object-contain mx-auto drop-shadow-xl" alt="${displayData.name}">` 
                : `<i class="${displayData.icon}"></i>`;

            avatarsContainer.innerHTML += `
                <div class="bg-indigo-50 p-5 rounded-2xl border-2 border-indigo-200 hover:border-indigo-400 transition shadow-sm text-center flex flex-col justify-between">
                    <div>
                        <div class="text-xs font-bold text-indigo-400 uppercase mb-1 tracking-wider">${avatar.theme}</div>
                        <div class="text-5xl mb-3 mt-2 flex justify-center h-16 items-center">${avatarVisual}</div>
                        <h3 class="font-bold text-gray-800 text-lg">${displayData.name}</h3>
                        <p class="text-[10px] font-bold text-indigo-600 mb-2">Current: Level ${currentLevel}/${avatar.maxLevel}</p>
                        <p class="text-xs text-gray-600 mt-1">${displayData.desc}</p>
                    </div>
                    ${btnHtml}
                </div>
            `;
        }
    }
	
    // ==========================================
    // 2. RENDER BADGES (Game & Achievements)
    // ==========================================
    if (typeof shopBadges !== 'undefined' && badgesContainer) {
        shopBadges.forEach(badge => {
            const isOwned = localPlayerData.inventory.includes(badge.id);
            const canAfford = Number(localPlayerData.coins) >= badge.price;
            let isUnlocked = true;
            let lockReason = "";

            if (badge.type === "achievement") {
                let currentTotalScore = Number(localPlayerData.totalScore) || 0;
                let currentLevel = Math.floor(currentTotalScore / 100) + 1;
                let currentCoins = Number(localPlayerData.coins) || 0;
                let estimatedGames = Math.floor(currentTotalScore / 100);

                if (badge.reqType === "level" && currentLevel < badge.reqValue) { isUnlocked = false; lockReason = `Reach Lvl ${badge.reqValue}`; } 
                else if (badge.reqType === "total_coins" && currentCoins < badge.reqValue) { isUnlocked = false; lockReason = `Collect ${badge.reqValue.toLocaleString()} Coins`; }
                else if (badge.reqType === "total_games" && estimatedGames < badge.reqValue) { isUnlocked = false; lockReason = `Play ${badge.reqValue} Games`; }
                else if (badge.reqType === "unique_games" && estimatedGames < badge.reqValue) { isUnlocked = false; lockReason = `Explore ${badge.reqValue} Games`; }
                else if (badge.reqType === "perfect_scores" && estimatedGames < badge.reqValue) { isUnlocked = false; lockReason = `Need ${badge.reqValue} Perfects`; }
            }

            let btnHtml = '';
            if (isOwned) {
                btnHtml = `<button disabled class="w-full mt-4 bg-gray-200 text-gray-500 font-bold py-2 rounded-xl cursor-not-allowed border border-gray-300">Owned</button>`;
            } else if (!isUnlocked) {
                btnHtml = `<button disabled class="w-full mt-4 bg-gray-700 text-gray-300 font-bold py-2 rounded-xl cursor-not-allowed border border-gray-800"><i class="fas fa-lock mr-1"></i> ${lockReason}</button>`;
            } else if (canAfford) {
                btnHtml = `<button onclick="buyItem('${badge.id}', ${badge.price})" class="w-full mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-xl transition shadow shadow-green-300">Buy (${badge.price.toLocaleString()} <i class="fas fa-coins"></i>)</button>`;
            } else {
                btnHtml = `<button disabled class="w-full mt-4 bg-red-100 text-red-400 font-bold py-2 rounded-xl cursor-not-allowed border border-red-200">Need ${badge.price.toLocaleString()} <i class="fas fa-coins"></i></button>`;
            }

            let tierBorder = "border-gray-200 hover:border-gray-400";
            let nameColor = "text-gray-800";
            if (badge.tier === "rare") { tierBorder = "border-blue-300 hover:border-blue-500 shadow-blue-100"; nameColor = "text-blue-700"; }
            if (badge.tier === "epic") { tierBorder = "border-purple-400 hover:border-purple-600 shadow-purple-200"; nameColor = "text-purple-700"; }
            if (badge.tier === "legendary") { tierBorder = "border-yellow-400 hover:border-yellow-600 shadow-yellow-300 bg-yellow-50"; nameColor = "text-yellow-700"; }

            let lockIconHtml = !isUnlocked ? `<div class="absolute top-2 right-2 text-gray-400 text-xl"><i class="fas fa-lock"></i></div>` : '';

            badgesContainer.innerHTML += `
                <div class="bg-white p-5 rounded-2xl border-2 ${tierBorder} transition shadow-sm text-center flex flex-col justify-between relative ${!isUnlocked ? 'opacity-80 grayscale-[40%]' : ''}">
                    ${lockIconHtml}
                    <div>
                        <div class="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-wider">${badge.tier || 'common'}</div>
                        <div class="text-5xl mb-3 h-16 flex items-center justify-center ${!isUnlocked ? 'text-gray-400' : 'text-gray-700'}"><i class="${badge.icon}"></i></div>
                        <h3 class="font-bold ${nameColor} text-lg">${badge.name}</h3>
                        ${badge.desc ? `<p class="text-[10px] text-gray-500 mt-2 leading-tight">${badge.desc}</p>` : ''}
                    </div>
                    ${btnHtml}
                </div>
            `;
        });
    }

    // ==========================================
    // 3. RENDER EDU ITEMS (Jika Ada)
    // ==========================================
    if (typeof shopItems !== 'undefined' && eduContainer) {
        shopItems.forEach(item => {
            if (item.category === 'edu') {
                const canAfford = localPlayerData.coins >= item.price;
                let btnHtml = '';
                if (canAfford) {
                    btnHtml = `<button onclick="openEduCheckout('${item.id}', '${item.name}', ${item.price}, ${item.stock || 0})" class="w-full mt-4 bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-xl transition shadow shadow-green-300">Buy (${item.price} <i class="fas fa-coins"></i>)</button>`;
                } else {
                    btnHtml = `<button disabled class="w-full mt-4 bg-red-100 text-red-400 font-bold py-2 rounded-xl cursor-not-allowed border border-red-200">Need ${item.price} <i class="fas fa-coins"></i></button>`;
                }

                eduContainer.innerHTML += `
                    <div class="bg-white p-5 rounded-2xl border-2 border-gray-100 hover:border-green-300 transition shadow-sm text-center flex flex-col justify-between">
                        <div>
                            <div class="text-5xl mb-3 h-16 flex items-center justify-center"><i class="${item.icon}"></i></div>
                            <h3 class="font-bold text-gray-800 text-lg">${item.name}</h3>
                            <p class="text-xs text-gray-500 mt-2">${item.desc}</p>
                        </div>
                        ${btnHtml}
                    </div>
                `;
            }
        });
    }

    if (badgesContainer && badgesContainer.innerHTML === '') badgesContainer.innerHTML = '<p class="col-span-full text-center text-gray-400 italic">No badges available.</p>';
    if (eduContainer && eduContainer.innerHTML === '') eduContainer.innerHTML = '<p class="col-span-full text-center text-gray-400 italic">No items available.</p>';

    renderInventory(); 
}
		
// --- FUNGSI BELI AVATAR ---
async function buyAvatar(avatarKey, level, price) {
    if(localPlayerData.coins >= price) {
        localPlayerData.coins -= price;
        localPlayerData.avatars[avatarKey] = level;
        
        let displayData = avatars[avatarKey].levels.find(l => l.level === level);
        
        if (localPlayerData.activeAvatar && localPlayerData.activeAvatar.key === avatarKey) {
            localPlayerData.activeAvatar.level = level;
            localPlayerData.activeAvatar.name = displayData.name;
            localPlayerData.activeAvatar.icon = displayData.icon;
            localPlayerData.activeAvatar.img = displayData.img || null;
        }
        
        renderShop();
        if (typeof updateDashboardAvatars === 'function') updateDashboardAvatars(); 
        if (typeof saveCloudPlayerData === 'function') await saveCloudPlayerData(); 
        
        alert(`✨ MAGIC UNLOCKED! ✨\nYour guardian has evolved to [${displayData.name}] (Level ${level})!`);
    }
}
	
// --- FUNGSI BELI ITEM/LENCANA ---
async function buyItem(itemId) {
    const item = (typeof shopItems !== 'undefined' ? shopItems.find(i => i.id === itemId) : null) || 
                 (typeof shopBadges !== 'undefined' ? shopBadges.find(i => i.id === itemId) : null);
    
    if (!item) return;

    const isEdu = item.category === 'edu'; 
    const isOwned = localPlayerData.inventory.includes(itemId);

    if (!isEdu && isOwned) {
        alert("You already owned this badge!");
        return;
    }

    let quantity = 1;
    if (isEdu) {
        const promptVal = prompt(`How many [${item.name}] you want to buy?\nPrice 1 unit: ${item.price} Coins\n\nPlease put the quantity:`, "1");
        if (promptVal === null || promptVal.trim() === "") return;
        quantity = parseInt(promptVal);
        if (isNaN(quantity) || quantity <= 0) {
            alert("Please put the correct amount.");
            return;
        }
    }

    const totalPrice = item.price * quantity;

    if (localPlayerData.coins >= totalPrice) {
        localPlayerData.coins -= totalPrice;
        for (let i = 0; i < quantity; i++) {
            localPlayerData.inventory.push(itemId);
        }
        
        renderShop(); 
        if (typeof saveCloudPlayerData === 'function') await saveCloudPlayerData(); 
        alert(`🎉 Congratulation! You have bought ${quantity}x [${item.name}]. The items have been added to your inventory!`);
        if (typeof checkAchievements === 'function') checkAchievements();
    } else {
        alert(`Sorry, your coins is not enough to buy ${quantity} unit.\nYou need ${totalPrice} Coins.`);
    }
}

// --- FUNGSI RENDER INVENTORI (BEG GALAS) ---
function renderInventory() {
    const container = document.getElementById('inventory-container');
    if (!container) return;
    container.innerHTML = '';
    let hasItems = false;

    if (localPlayerData.avatars) {
        for (const [key, level] of Object.entries(localPlayerData.avatars)) {
            if (level > 0 && avatars[key]) {
                hasItems = true;
                let displayData = avatars[key].levels.find(l => l.level === level);
                let isEquipped = localPlayerData.activeAvatar && localPlayerData.activeAvatar.key === key;

                let actionBtn = isEquipped
                    ? `<button disabled class="mt-2 text-[10px] bg-green-500 text-white px-3 py-1 rounded-full font-bold shadow-sm">EQUIPPED <i class="fas fa-check-circle"></i></button>`
                    : `<button onclick="equipAvatar('${key}')" class="mt-2 text-[10px] bg-indigo-500 hover:bg-indigo-600 text-white px-3 py-1 rounded-full font-bold shadow-sm transition transform hover:scale-105">EQUIP</button>`;

                const avatarVisual = displayData.img
                    ? `<img src="${displayData.img}" class="w-12 h-12 mb-1 object-contain legendary-avatar ${isEquipped ? 'drop-shadow-[0_0_8px_rgba(74,222,128,0.8)]' : ''}" alt="${displayData.name}">`
                    : `<i class="${displayData.icon} text-3xl mb-1 ${isEquipped ? 'text-green-600' : 'text-indigo-500'}"></i>`;

                container.innerHTML += `
                    <div class="bg-gradient-to-r from-indigo-50 to-purple-50 p-3 rounded-xl border-2 ${isEquipped ? 'border-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]' : 'border-indigo-200'} flex flex-col items-center shadow-sm w-32">
                        ${avatarVisual}
                        <span class="text-xs font-bold text-center h-8 flex items-center text-indigo-900">${displayData.name}</span>
                        <span class="text-[10px] bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full font-bold mt-1">Lvl ${level}</span>
                        ${actionBtn}
                    </div>
                `;
            }
        }
    }

    if (localPlayerData.inventory && localPlayerData.inventory.length > 0) {
        localPlayerData.inventory.forEach(itemId => {
            const item = (typeof shopItems !== 'undefined' ? shopItems.find(i => i.id === itemId) : null) || 
                         (typeof shopBadges !== 'undefined' ? shopBadges.find(i => i.id === itemId) : null);
            if (item) {
                hasItems = true;
                container.innerHTML += `
                    <div class="bg-green-50 px-4 py-2 rounded-xl border-2 border-green-200 flex items-center gap-3 shadow-sm hover:scale-105 transition transform cursor-pointer" title="${item.desc || item.name}">
                        <i class="${item.icon} text-xl"></i> 
                        <span class="text-sm font-bold text-green-900">${item.name}</span>
                    </div>
                `;
            }
        });
    }

    if (!hasItems) {
        container.innerHTML = '<p class="text-sm text-gray-400 italic">Your inventory is empty. Play more games to buy guardians and stationeries!</p>';
    }
}
        
// --- FUNGSI EQUIP AVATAR ---
async function equipAvatar(avatarKey) {
    let myLevel = localPlayerData.avatars[avatarKey] || 1; 
    let displayData = avatars[avatarKey].levels.find(l => l.level === myLevel);
    
    if (displayData) {
        localPlayerData.activeAvatar = {
            key: avatarKey,
            level: myLevel,
            name: displayData.name,
            icon: displayData.icon,
            img: displayData.img || null
        };
        
        renderInventory(); 
        if (typeof saveCloudPlayerData === 'function') await saveCloudPlayerData(); 
        if (typeof updateDashboardAvatars === 'function') updateDashboardAvatars(); 
        alert(`✅ Avatar bertukar! Anda kini menggunakan [${displayData.name} Lvl ${myLevel}].`);
    } else {
        console.error("Data level tidak dijumpai!");
    }
}

// ==========================================
// 3. EDU SHOP CHECKOUT SYSTEM
// ==========================================
async function submitEduOrder(event) {
    event.preventDefault();
    
    const btn = document.getElementById('btn-submit-order');
    if(btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> HANTAR PESANAN...';
    }

    const itemName = document.getElementById('edu-item-name').value;
    const itemPrice = parseInt(document.getElementById('edu-item-price').value);
    const quantity = parseInt(document.getElementById('edu-quantity').value);
    const totalCost = itemPrice * quantity;

    if (localPlayerData.coins < totalCost) {
        alert("Maaf, Coins anda tidak mencukupi untuk pembelian ini!");
        if(btn) {
            btn.disabled = false;
            btn.innerHTML = 'PENGESAHAN: BELI SEKARANG';
        }
        return;
    }

    const payload = {
        action: "buyEduItem",
        studentName: localPlayerData.name,
        studentClass: localPlayerData.class || "-",
        itemName: itemName,
        quantity: quantity,
        totalCost: totalCost
    };

    try {
        const response = await fetch(SCRIPT_URL, {
            method: "POST",
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
        if (result.success) {
            localPlayerData.coins -= totalCost;
            if (typeof saveCloudPlayerData === 'function') saveCloudPlayerData();
            if (typeof updatePlayerLevelUI === 'function') updatePlayerLevelUI();
            
            alert(`🎉 BERJAYA! Pesanan anda untuk ${quantity}x ${itemName} telah dihantar kepada Cikgu.\n\nSila tunggu Cikgu panggil nama anda untuk mengambil barang di kaunter!`);
            closeEduModal();
            if (typeof openShop === 'function') openShop(); 
        } else {
            alert("Ralat: " + (result.error || "Gagal menghantar pesanan. Sila cuba lagi."));
        }
    } catch (e) {
        alert("Ralat sambungan. Sila semak internet anda dan cuba lagi.");
    } finally {
        if(btn) {
            btn.disabled = false;
            btn.innerHTML = 'PENGESAHAN: BELI SEKARANG';
        }
    }
}

function openEduModal(id, name, price, stock) {
    document.getElementById('edu-item-name').value = name;
    document.getElementById('edu-item-price').value = price;
    
    // Hadkan kuantiti berdasarkan stok atau jumlah Coins pemain
    const maxQtyByCoins = Math.floor(localPlayerData.coins / price);
    const maxQty = Math.min(stock, maxQtyByCoins);
    
    const qtyInput = document.getElementById('edu-quantity');
    qtyInput.max = maxQty > 0 ? maxQty : 1;
    qtyInput.value = 1;
    
    updateEduTotal();
    document.getElementById('edu-modal').classList.remove('hidden');
}

function closeEduModal() {
    document.getElementById('edu-modal').classList.add('hidden');
}

function updateEduTotal() {
    const price = parseInt(document.getElementById('edu-item-price').value);
    let qtyInput = document.getElementById('edu-quantity');
    let qty = parseInt(qtyInput.value) || 1;
    const maxQty = parseInt(qtyInput.max);
    
    if (qty > maxQty) {
        alert("Kuantiti melebihi stok yang ada atau Coins anda tidak mencukupi!");
        qtyInput.value = maxQty;
        qty = maxQty;
    }
    
    document.getElementById('edu-total-price').innerText = price * qty;
}

// ==========================================
// ADMIN & MASTER CONTROL LOGIC
// ==========================================

let currentAdminTab = 'orders';

// 1. Fungsi Buka/Tutup Dashboard
function openAdminDashboard() {
    document.getElementById('admin-modal').classList.remove('hidden');
    switchAdminTab('orders'); 
}

function closeAdminDashboard() {
    document.getElementById('admin-modal').classList.add('hidden');
}

// 2. Tukar Tab (Orders vs Inventory)
function switchAdminTab(tab) {
    currentAdminTab = tab;
    const btnOrders = document.getElementById('tab-orders');
    const btnInv = document.getElementById('tab-inv');
    
    // Reset Style Tab
    btnOrders.className = btnInv.className = "flex-1 py-3 font-bold text-sm rounded-xl transition-all text-gray-500 hover:bg-gray-200";
    
    if(tab === 'orders') {
        btnOrders.className = "flex-1 py-3 font-bold text-sm rounded-xl transition-all bg-white shadow-sm text-indigo-600 border-b-2 border-indigo-600";
        loadAdminOrders();
    } else {
        btnInv.className = "flex-1 py-3 font-bold text-sm rounded-xl transition-all bg-white shadow-sm text-indigo-600 border-b-2 border-indigo-600";
        loadAdminInventory();
    }
}

// 3. Muat Turun Senarai Pesanan (Orders)
async function loadAdminOrders() {
    const container = document.getElementById('admin-content');
    container.innerHTML = `<div class="text-center py-10"><i class="fas fa-spinner fa-spin text-3xl text-indigo-600"></i><p class="mt-2 text-gray-500">Menyemak pesanan...</p></div>`;

    try {
        const res = await fetch(`${SCRIPT_URL}?action=getAllOrders`);
        const orders = await res.json();
        
        if (!orders || orders.length === 0) {
            container.innerHTML = "<p class='text-center py-10 text-gray-400'>Tiada pesanan ditemui.</p>";
            return;
        }

        let html = `<div class="grid gap-4">`;
        orders.reverse().forEach(ord => {
            const isPending = ord.status.toLowerCase() === 'pending';
            html += `
                <div class="bg-white p-4 rounded-2xl border ${isPending ? 'border-yellow-300 bg-yellow-50/30' : 'border-gray-200'} shadow-sm flex flex-wrap justify-between items-center">
                    <div>
                        <div class="text-[10px] font-bold text-gray-400 uppercase">${ord.orderID} • ${new Date(ord.timestamp).toLocaleString()}</div>
                        <div class="font-bold text-lg text-indigo-900">${ord.studentName} <span class="text-sm font-normal text-gray-500">(${ord.studentClass})</span></div>
                        <div class="text-sm font-semibold text-gray-700">Membeli: <span class="text-indigo-600">${ord.itemName} (x${ord.quantity})</span></div>
                        <div class="mt-1 text-xs font-bold text-yellow-700"><i class="fas fa-coins mr-1"></i>${ord.totalCost} Koin</div>
                    </div>
                    <div class="flex items-center gap-2">
                        ${isPending ? 
                            `<button onclick="approveOrder('${ord.orderID}')" class="bg-green-500 hover:bg-green-600 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-md transition-all">SAHKAN PENYERAHAN</button>` : 
                            `<span class="bg-green-100 text-green-700 px-4 py-2 rounded-xl font-bold text-sm"><i class="fas fa-check-circle mr-1"></i> SELESAI</span>`
                        }
                    </div>
                </div>`;
        });
        container.innerHTML = html + "</div>";
    } catch (e) {
        container.innerHTML = "<p class='text-center text-red-500'>Gagal memuatkan data pesanan.</p>";
    }
}

// 4. Sahkan Pesanan (Selesaikan)
async function approveOrder(id) {
    if(!confirm("Pastikan anda telah memberikan barang fizikal kepada pelajar. Teruskan?")) return;
    
    try {
        const res = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: "completeOrder", orderID: id })
        });
        const result = await res.json();
        if(result.result === "success") {
            alert("Pesanan berjaya diselesaikan!");
            loadAdminOrders();
        }
    } catch (e) {
        alert("Gagal mengemaskini status pesanan.");
    }
}

// 5. Muat Turun Inventori (Stok)
async function loadAdminInventory() {
    const container = document.getElementById('admin-content');
    container.innerHTML = `<div class="text-center py-10"><i class="fas fa-spinner fa-spin text-3xl text-indigo-600"></i><p>Memuatkan stok...</p></div>`;

    try {
        const res = await fetch(`${SCRIPT_URL}?action=getEduInventory`);
        const items = await res.json();
	adminInventoryData = items;

        let html = `
            <div class="mb-6 flex justify-between items-center bg-indigo-50 p-4 rounded-2xl">
                <h3 class="font-bold text-indigo-800">Senarai Stok EduShop</h3>
                <button onclick="openAddItemForm()" class="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-xs"><i class="fas fa-plus mr-1"></i> TAMBAH BARANG</button>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left bg-white rounded-xl overflow-hidden shadow-sm">
                    <thead class="bg-gray-100 text-[10px] uppercase text-gray-500">
                        <tr>
                            <th class="p-3">Item</th><th class="p-3">Harga</th><th class="p-3">Stok</th><th class="p-3">Had</th><th class="p-3">Tindakan</th>
                        </tr>
                    </thead>
                    <tbody class="text-sm">`;

        items.forEach(item => {
            html += `
                <tr class="border-b">
                    <td class="p-3">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 bg-gray-100 rounded flex items-center justify-center"><i class="${item.icon}"></i></div>
                            <div>
                                <div class="font-bold">${item.name}</div>
                                <div class="text-[10px] text-gray-400">${item.id}</div>
                            </div>
                        </div>
                    </td>
                    <td class="p-3 font-bold text-yellow-600">${item.price}</td>
                    <td class="p-3 font-bold ${item.stock <= 5 ? 'text-red-500' : 'text-green-600'}">${item.stock}</td>
                    <td class="p-3 uppercase text-[10px] font-bold">${item.limitType}</td>
                    <td class="p-3">
                         <button onclick="editItem('${item.id}')" class="text-blue-500 hover:underline mr-2 text-xs">Edit</button>
                    </td>
                </tr>`;
        });
        container.innerHTML = html + "</tbody></table></div>";
    } catch (e) {
        container.innerHTML = "Gagal memuatkan stok.";
    }
}

// ==========================================
// FUNGSI EDU SHOP: BORANG & CHECKOUT
// ==========================================

// 1. Fungsi membuka borang pembelian
function openEduCheckout(itemId, itemName, itemPrice, currentStock) {
    // --- PENGESAN NAMA SUPER KEBAL ---
    let playerName = "PELAJAR";
    
    // Semak Kotak Log Masuk Utama (Tempat anda taip Game Master)
    const loginInput = document.getElementById('student-name');
    const profileName = document.getElementById('profile-name');
    
    if (loginInput && loginInput.value.trim() !== "") {
        playerName = loginInput.value.trim().toUpperCase(); // Cara 1 (Paling Tepat)
    } else if (typeof localPlayerData !== 'undefined' && localPlayerData.name) {
        playerName = localPlayerData.name; // Cara 2 (Dari memori)
    } else if (profileName && profileName.textContent.trim() !== "Nama Pelajar" && profileName.textContent.trim() !== "") {
        playerName = profileName.textContent.trim().toUpperCase(); // Cara 3 (Dari profil)
    }
    // ---------------------------------

    // Semak jika kotak borang wujud sebelum masukkan data
    const elStudentName = document.getElementById('eduStudentName');
    const elItemID = document.getElementById('eduItemID');
    const elItemName = document.getElementById('eduItemName');
    const elBasePrice = document.getElementById('eduBasePrice');
    const elItemStock = document.getElementById('eduItemStock');
    const elQuantity = document.getElementById('eduQuantity');

    if (!elStudentName || !elItemID || !elItemName || !elBasePrice || !elItemStock || !elQuantity) {
        alert("Ralat HTML: Ada bahagian borang Edu Shop yang tertinggal/hilang.");
        return;
    }

    // Masukkan maklumat ke dalam borang
    elStudentName.value = playerName;
    elItemID.value = itemId;
    elItemName.value = itemName;
    elBasePrice.value = itemPrice;
    
    // Papar stok sebenar
    const stockToShow = currentStock !== undefined ? currentStock : 0;
    elItemStock.value = stockToShow;
    elQuantity.value = 1;
    
    // Kira jumlah kos awal
    calculateEduTotal();

    // Sembunyikan mesej ralat & aktifkan butang
    document.getElementById('eduWarningMsg').classList.add('hidden');
    const btn = document.getElementById('eduConfirmBtn');
    if (btn) {
        btn.disabled = false;
        btn.classList.remove('opacity-50', 'cursor-not-allowed');
        btn.innerHTML = '<i class="fas fa-check"></i> Sahkan';
    }

    // Jika stok habis, halang
    if(stockToShow <= 0) {
        showEduWarning("Maaf, stok item ini telah habis di stor cikgu!");
        disableEduConfirmBtn();
    }

    // Paparkan Modal
    const modal = document.getElementById('eduCheckoutModal');
    if (modal) modal.classList.remove('hidden');
}
	
// 2. Fungsi tutup borang
function closeEduCheckout() {
    const modal = document.getElementById('eduCheckoutModal');
    if (modal) modal.classList.add('hidden');
}

// 3. FUNGSI PENGIRAAN HARGA AUTO (INI YANG HILANG TADI)
function calculateEduTotal() {
    const qty = parseInt(document.getElementById('eduQuantity').value) || 1;
    const price = parseInt(document.getElementById('eduBasePrice').value) || 0;
    const stock = parseInt(document.getElementById('eduItemStock').value) || 0;
    
    const total = qty * price;
    const elTotalCost = document.getElementById('eduTotalCost');
    if(elTotalCost) elTotalCost.value = total;

    if (qty > stock) {
        showEduWarning(`Stok cikgu tidak mencukupi! Hanya tinggal ${stock} unit.`);
        disableEduConfirmBtn();
    } else if (qty < 1) {
        showEduWarning(`Kuantiti mesti sekurang-kurangnya 1.`);
        disableEduConfirmBtn();
    } else if (typeof localPlayerData !== 'undefined' && localPlayerData.coins < total) {
        showEduWarning(`Koin anda tidak mencukupi! Perlu ${total} koin.`);
        disableEduConfirmBtn();
    } else {
        const warningEl = document.getElementById('eduWarningMsg');
        if(warningEl) warningEl.classList.add('hidden');
        
        const btn = document.getElementById('eduConfirmBtn');
        if (btn) {
            btn.disabled = false;
            btn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    }
}

function showEduWarning(msg) {
    const warningEl = document.getElementById('eduWarningMsg');
    if(warningEl) {
        warningEl.textContent = msg;
        warningEl.classList.remove('hidden');
    }
}

function disableEduConfirmBtn() {
    const btn = document.getElementById('eduConfirmBtn');
    if(btn) {
        btn.disabled = true;
        btn.classList.add('opacity-50', 'cursor-not-allowed');
    }
}

// 4. FUNGSI HANTAR DATA KE GOOGLE SHEETS
async function submitEduCheckout() {
    const btn = document.getElementById('eduConfirmBtn');
    const itemID = document.getElementById('eduItemID').value;
    const qty = parseInt(document.getElementById('eduQuantity').value);
    let playerName = document.getElementById('eduStudentName').value.trim().toUpperCase();
    let playerClass = (typeof localPlayerData !== 'undefined' && localPlayerData.class) ? localPlayerData.class : "-";

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menghantar Pesanan...';
    btn.classList.add('opacity-50', 'cursor-not-allowed');

    try {
        const payload = {
            action: "buyEduItem",
            name: playerName, 
            class: playerClass, 
            itemID: itemID,
            quantity: qty
        };

        const response = await fetch(SCRIPT_URL, {
            method: "POST",
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.error) {
            showEduWarning("Gagal: " + result.error);
            resetConfirmBtn();
        } else if (result.result === "success") {
            // NOTA: Kita tidak lagi mengemaskini localPlayerData.coins di sini
            // kerana koin hanya akan ditolak selepas admin sahkan.
            
            closeEduCheckout();
            
            // Makluman kepada pelajar
            alert("✅ PESANAN DIHANTAR!\n\nKoin anda belum ditolak. Koin hanya akan ditolak selepas Game Master mengesahkan pesanan anda semasa penyerahan barang fizikal.");
            
            // Refresh untuk kosongkan borang
            window.location.reload(); 
        }
    } catch (error) {
        console.error("Checkout Error:", error);
        showEduWarning("Ralat rangkaian. Cuba lagi.");
        resetConfirmBtn();
    }
}

function resetConfirmBtn() {
    const btn = document.getElementById('eduConfirmBtn');
    btn.innerHTML = '<i class="fas fa-check"></i> Sahkan';
    btn.disabled = false;
    btn.classList.remove('opacity-50', 'cursor-not-allowed');
}

// ==========================================
// FUNGSI LIVE STOCK SYNC DARI GOOGLE SHEETS
// ==========================================
async function syncEduStock() {
    // 1. Tukar teks butang/tajuk kedai supaya murid tahu sistem sedang muat turun data
    const eduContainer = document.getElementById('edu-container') || document.querySelector('.edu-items-container');
    if (eduContainer) {
        eduContainer.innerHTML = '<div class="col-span-full text-center text-indigo-500 py-4"><i class="fas fa-spinner fa-spin text-2xl mb-2"></i><br>Menyemak stok terkini di stor cikgu...</div>';
    }

    try {
        // 2. Panggil Google Sheets untuk minta data EduInventory
        const response = await fetch(SCRIPT_URL + "?action=getEduInventory");
        const realTimeInventory = await response.json();

        if (realTimeInventory && realTimeInventory.length > 0) {
            // 3. Kemaskini stok di dalam memori data.js kita
            realTimeInventory.forEach(dbItem => {
                // Cari item yang sepadan dalam shopItems
                let localItem = shopItems.find(item => item.id === dbItem.id);
                if (localItem) {
                    localItem.stock = dbItem.stock;   // Kemaskini stok terkini
                    localItem.price = dbItem.price;   // Kemaskini harga (jika cikgu ubah di Sheet)
                }
            });
            
            // 4. Lukis semula paparan kedai dengan stok dan harga yang betul!
            // Gantikan dengan nama fungsi yang anda guna untuk lukis kedai.
            // Contohnya: showShop() atau renderShop() atau bahagian render Edu items anda.
            if (typeof renderShop === 'function') {
                renderShop();
            }
        }
    } catch (error) {
        console.error("Gagal menyemak stok:", error);
        if (eduContainer) eduContainer.innerHTML = '<div class="col-span-full text-center text-red-500 py-4">Gagal menyambung ke pangkalan data stor.</div>';
    }
}

// ==========================================
// ADMIN: BORANG TAMBAH / EDIT ITEM
// ==========================================

// Global variable untuk simpan data sementara
let adminInventoryData = []; 

// 1. Buka Borang untuk Tambah Item Baru
function openAddItemForm() {
    document.getElementById('admin-item-title').innerHTML = '<i class="fas fa-plus-circle mr-2"></i> Tambah Item Baru';
    document.getElementById('admin-item-action').value = 'add';
    
    // Kosongkan form
    document.getElementById('admin-item-id').value = '';
    document.getElementById('admin-item-id').readOnly = false; // Boleh taip ID baru
    document.getElementById('admin-item-id').classList.remove('bg-gray-100');
    
    document.getElementById('admin-item-name').value = '';
    document.getElementById('admin-item-category').value = 'AlatTulis';
    document.getElementById('admin-item-price').value = '100';
    document.getElementById('admin-item-stock').value = '10';
    document.getElementById('admin-item-limit').value = 'None';
    document.getElementById('admin-item-icon').value = 'fas fa-box';
    document.getElementById('admin-item-desc').value = '';

    document.getElementById('admin-item-modal').classList.remove('hidden');
}

// 2. Buka Borang untuk Edit Item Sedia Ada
function editItem(itemId) {
    // Cari item dalam data yang di-load
    const item = adminInventoryData.find(i => i.id === itemId);
    if (!item) {
        alert("Ralat: Item tidak dijumpai.");
        return;
    }

    document.getElementById('admin-item-title').innerHTML = `<i class="fas fa-edit mr-2"></i> Edit Item: ${itemId}`;
    document.getElementById('admin-item-action').value = 'edit';
    
    // Masukkan data sedia ada
    document.getElementById('admin-item-id').value = item.id;
    document.getElementById('admin-item-id').readOnly = true; // Kunci ID supaya tak bertukar
    document.getElementById('admin-item-id').classList.add('bg-gray-100');
    
    document.getElementById('admin-item-name').value = item.name;
    document.getElementById('admin-item-category').value = item.category || 'AlatTulis';
    document.getElementById('admin-item-price').value = item.price;
    document.getElementById('admin-item-stock').value = item.stock;
    document.getElementById('admin-item-limit').value = item.limitType || 'None';
    document.getElementById('admin-item-icon').value = item.icon || 'fas fa-box';
    document.getElementById('admin-item-desc').value = item.descriptions || '';

    document.getElementById('admin-item-modal').classList.remove('hidden');
}

// 3. Tutup Borang
function closeItemForm() {
    document.getElementById('admin-item-modal').classList.add('hidden');
}

// 4. Hantar Data ke Google Sheets (Simpan/Kemaskini)
async function submitItemForm() {
    const actionType = document.getElementById('admin-item-action').value;
    const btn = document.getElementById('admin-save-item-btn');
    
    // Kumpul data dari form
    const itemData = {
        action: actionType === 'add' ? "addEduItem" : "updateEduItem",
        id: document.getElementById('admin-item-id').value.trim().toUpperCase(),
        name: document.getElementById('admin-item-name').value.trim(),
        price: parseInt(document.getElementById('admin-item-price').value) || 0,
        stock: parseInt(document.getElementById('admin-item-stock').value) || 0,
        limitType: document.getElementById('admin-item-limit').value,
        category: document.getElementById('admin-item-category').value,
        icon: document.getElementById('admin-item-icon').value.trim(),
        desc: document.getElementById('admin-item-desc').value.trim()
    };

    // Validasi ringkas
    if (!itemData.id || !itemData.name) {
        alert("Sila isikan ID Item dan Nama Item!");
        return;
    }

    // Tukar butang ke loading
    const originalBtnHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

    try {
        const response = await fetch(SCRIPT_URL, {
            method: "POST",
            body: JSON.stringify(itemData)
        });

        const result = await response.json();

        if (result.result === "success") {
            alert(`Berjaya! Item ${itemData.id} telah ${actionType === 'add' ? 'ditambah' : 'dikemaskini'}.`);
            closeItemForm();
            loadAdminInventory(); // Refresh jadual inventori
        } else {
            alert("Gagal: " + (result.error || "Ralat tidak diketahui."));
        }
    } catch (e) {
        alert("Ralat rangkaian. Sila cuba lagi.");
        console.error(e);
    } finally {
        // Kembalikan butang ke asal
        btn.disabled = false;
        btn.innerHTML = originalBtnHTML;
    }
}
