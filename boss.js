// ==========================================
// 🛠️ LOGIK PANEL GAME MASTER (BOSS)
// ==========================================

// URL Web App Google Apps Script Anda
// const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwG1uiPv8Z0LCpHxmmcs5H3ZT_aPh0uOTfTCqmb5lyGF4C224BXObkeGJgq8pnj8W6C/exec";

let selectedBossAvatar = "";
let bossTimerInterval;
let bossTimeLeft = 10;
const MAX_TIME = 10;
let bossPlayerHP = 100;

// 1. Fungsi untuk check adakah pemain ini Game Master?
function checkGameMaster() {
    if (!localPlayerData) return;
    
    // Semak adakah namanya GAME MASTER
    const isAdmin = (localPlayerData.name && localPlayerData.name.toUpperCase() === "GAME MASTER"); 

    if (isAdmin) {
        document.getElementById('gm-boss-btn').classList.remove('hidden');
    }
}

// 2. Buka Modal bila Butang Biru ditekan
document.getElementById('gm-boss-btn')?.addEventListener('click', () => {
    document.getElementById('gm-boss-modal').classList.remove('hidden');
    
    // Set masa automatik (Sekarang hingga 24 Jam akan datang)
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // Format khas ke format ISO untuk input datetime-local HTML
    const formatDateTime = (d) => {
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().slice(0, 16);
    };
    
    document.getElementById('gm-boss-start').value = formatDateTime(now);
    document.getElementById('gm-boss-end').value = formatDateTime(tomorrow);
});

// 3. Tutup Modal
function closeGmModal() {
    document.getElementById('gm-boss-modal').classList.add('hidden');
}

// 4. Highlight Boss yang dipilih
function selectBoss(element, imageName) {
    // Reset warna border semua pilihan
    document.querySelectorAll('.boss-option').forEach(el => {
        el.classList.remove('border-blue-500', 'bg-blue-50');
        el.classList.add('border-gray-200');
    });
    
    // Warnakan boss yang ditekan
    element.classList.remove('border-gray-200');
    element.classList.add('border-blue-500', 'bg-blue-50');
    
    selectedBossAvatar = imageName;
}

// 5. Fungsi Mengaktifkan Boss (Hantar ke Google Sheets)
async function activateBossEvent() {
    if (!selectedBossAvatar) {
        alert("Sila pilih Avatar Boss terlebih dahulu!");
        return;
    }
    
    const hpValue = document.getElementById('gm-boss-hp').value;
    const startTime = document.getElementById('gm-boss-start').value;
    const endTime = document.getElementById('gm-boss-end').value;
    const category = document.getElementById('gm-boss-category').value; 
    
    if (!hpValue || hpValue <= 0) {
        alert("Sila masukkan jumlah HP yang sah (contoh: 10000)!");
        return;
    }

    if (!category) {
        alert("Sila pilih Kategori Permainan untuk Boss ini!");
        return;
    }

    // Pakej data yang akan dihantar ke Google Sheets
    const bossPayload = {
        action: "createBossEvent",
        bossAvatar: selectedBossAvatar,
        maxHp: parseInt(hpValue),
        currentHp: parseInt(hpValue),
        gameCategory: category, 
        startTime: startTime,
        endTime: endTime,
        createdBy: localPlayerData.name
    };

    console.log("🎮 MENGHANTAR DATA BOSS KE DATABASE...", bossPayload);
    
    try {
        // Hantar ke Apps Script
        const response = await fetch(SCRIPT_URL, {
            method: "POST",
	    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(bossPayload)
        });
        
        const result = await response.json();
        
        if (result.result === "success") {
            alert(`⚡ BOSS CHALLENGE AKTIF! ⚡\n\nBoss: ${selectedBossAvatar}\nKategori: ${category.toUpperCase()}\nHP: ${hpValue}\n\nAcara telah berjaya didaftarkan ke pangkalan data!`);
            closeGmModal();
        } else {
            alert("Ralat dari server: " + (result.error || "Gagal menyimpan data boss."));
        }
    } catch (error) {
        console.error("Gagal mengaktifkan Boss:", error);
        alert("Ralat teknikal berlaku! Sila pastikan talian internet anda stabil atau semak URL Google Script.");
    }
}

// ==========================================
// FUNGSI SEMAK BOSS AKTIF UNTUK MURID
// ==========================================
async function checkActiveBossEvent() {
    console.log("🔍 Memulakan semakan Boss..."); // Semakan 1
    
    // Ganti dengan URL skrip anda jika SCRIPT_URL tiada dalam fail ini
    const SCRIPT_URL_BOSS = "https://script.google.com/macros/s/AKfycbwG1uiPv8Z0LCpHxmmcs5H3ZT_aPh0uOTfTCqmb5lyGF4C224BXObkeGJgq8pnj8W6C/exec";

    try {
        // Kita tambah masa rawak (timestamp) supaya pautan sentiasa unik dan browser tidak guna cache
const timeStamp = new Date().getTime();
const response = await fetch(`${SCRIPT_URL_BOSS}?action=getActiveBoss&t=${timeStamp}`);
        const bossData = await response.json();

        console.log("📦 Data Boss diterima dari server:", bossData); // Semakan 2

        // Cek jika tiada error dan ada avatar boss
        if (bossData && bossData.bossAvatar && bossData.currentHp > 0) {
            
            const now = new Date();
            const startTime = new Date(bossData.startTime);
            const endTime = new Date(bossData.endTime);

            console.log(`⏱️ Masa: Sekarang (${now.toLocaleString()}), Mula (${startTime.toLocaleString()}), Tamat (${endTime.toLocaleString()})`);

            // Semak adakah waktu sekarang berada dalam waktu event
            if (now >= startTime && now <= endTime) {
                const bossBtn = document.getElementById('boss-challenge-btn');
                
                if (bossBtn) {
                    bossBtn.classList.remove('hidden');
                    bossBtn.classList.add('animate-bounce'); 
                    window.currentActiveBoss = bossData;
                    console.log("✅ Butang Boss BERJAYA dipaparkan!");
                } else {
                    console.error("❌ Ralat: Elemen butang HTML 'boss-challenge-btn' tidak wujud di skrin.");
                }
            } else {
                console.log("⚠️ Acara Boss wujud tetapi MASA belum bermula atau sudah luput.");
            }
        } else {
            console.log("⚠️ Tiada acara Boss yang aktif sekarang atau HP Boss sudah 0.");
        }
    } catch (error) {
        console.error("❌ Gagal berhubung dengan Google Sheets untuk semak Boss:", error);
    }
}

function startBossFight() {
    const bossData = window.currentActiveBoss;
    
    if (!bossData) {
        alert("Ops! Data Boss hilang. Sila refresh halaman.");
        return;
    }

    const overlay = document.getElementById('boss-battle-overlay');
    const avatar = document.getElementById('battle-boss-avatar');
    const hpBar = document.getElementById('boss-hp-bar');
    const hpText = document.getElementById('boss-hp-text');

    if (overlay) {
        // 1. Tunjukkan overlay
        overlay.classList.remove('hidden');

        // 2. Masukkan data boss ke UI
        avatar.src = bossData.bossAvatar;
        
        // 3. Kemaskini HP bar
        const hpPercent = (bossData.currentHp / bossData.maxHp) * 100;
        hpBar.style.width = hpPercent + "%";
        hpText.innerText = `HP: ${bossData.currentHp} / ${bossData.maxHp}`;

        console.log("⚔️ Perlawanan bermula menentang:", bossData.eventID);
        
        // Seterusnya: Panggil fungsi untuk menjana soalan pertama
        generateBossQuestion(); 
    }
}

// Fungsi untuk tutup tetingkap
function closeBossBattle() {
    const overlay = document.getElementById('boss-battle-overlay');
    if (confirm("Adakah anda pasti mahu lari? Kemajuan serangan tidak akan dikira.")) {
        overlay.classList.add('hidden');
    }
}

// -----------------------------------------------------------------
// 1. JANA SOALAN DARI DATA.JS
// -----------------------------------------------------------------
function generateBossQuestion() {
    clearInterval(bossTimerInterval); // Reset timer

    const zone = document.getElementById('boss-answer-zone');
    const questionText = document.getElementById('boss-question-text');
    
    const categoryFromSheet = window.currentActiveBoss.gameCategory || "missing";
    const categoryKey = Object.keys(gameData).find(key => key.toLowerCase() === categoryFromSheet.toLowerCase().trim());
    const questions = gameData[categoryKey];

    if (!questions || questions.length === 0) {
        questionText.innerText = `Kategori '${categoryFromSheet}' tiada dalam data!`;
        return;
    }

    const randomQ = questions[Math.floor(Math.random() * questions.length)];
    questionText.innerText = randomQ.q;
    zone.innerHTML = '';

    const choices = randomQ.options || randomQ.choices || [];

    // JIKA ADA PILIHAN JAWAPAN (BUTANG)
    if (choices.length > 0) {
        zone.className = "grid grid-cols-2 gap-3 w-full";
        choices.forEach(alt => {
            const btn = document.createElement('button');
            btn.className = "bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-2 rounded-xl shadow-md transform active:scale-95 transition-all text-sm";
            btn.innerText = alt;
            btn.onclick = () => checkBossAnswer(alt, randomQ.a);
            zone.appendChild(btn);
        });
    } 
    // JIKA TIADA PILIHAN (KOTAK TEKS UNTUK TAIP JAWAPAN)
    else {
        zone.className = "w-full flex flex-col gap-2";
        zone.innerHTML = `
            <input type="text" id="boss-text-input" class="border-2 border-gray-400 p-3 rounded-xl text-center font-bold text-lg focus:outline-none focus:border-blue-500" placeholder="Taip jawapan anda di sini..." autocomplete="off">
            <button id="boss-submit-btn" class="bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-xl shadow-md transform active:scale-95 transition-all text-lg">Serang! ⚔️</button>
        `;
        
        const inputField = document.getElementById('boss-text-input');
        inputField.focus(); // Auto-focus ke kotak teks

        document.getElementById('boss-submit-btn').onclick = () => {
            checkBossAnswer(inputField.value.trim(), randomQ.a);
        };

        // Boleh tekan 'Enter' untuk jawab
        inputField.addEventListener("keypress", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                checkBossAnswer(inputField.value.trim(), randomQ.a);
            }
        });
    }

    // Mulakan timer selepas soalan dipaparkan
    startBossTimer();
}

// -----------------------------------------------------------------
// 3. LOGIK SEMAK JAWAPAN & DAMAGE
// -----------------------------------------------------------------
function checkBossAnswer(chosen, correct) {
    clearInterval(bossTimerInterval); // Hentikan timer serta merta

    // Semak jawapan (Abaikan huruf besar/kecil)
    if (String(chosen).toLowerCase() === String(correct).toLowerCase()) {
        
        // JAWAPAN BETUL: Damage boss ikut baki masa (bossTimeLeft)
        let damageToBoss = bossTimeLeft; 
        if (damageToBoss < 1) damageToBoss = 1; // Minimum damage = 1

        showDamageIndicator("-" + damageToBoss, "boss"); 
        updateBossHPOnServer(damageToBoss);
        
        // Teruskan ke soalan seterusnya
        setTimeout(generateBossQuestion, 1500);

    } else {
        
        // JAWAPAN SALAH: Tolak HP Murid 10
        bossPlayerHP -= 10;
        updatebossPlayerHPUI();
        
        const box = document.getElementById('boss-question-box');
        box.classList.add('animate-shake'); 
        setTimeout(() => box.classList.remove('animate-shake'), 500);
        
        alert(`❌ Wrong! Boss counter attack! (-10 HP)`);
        
        if(checkPlayerAlive()) {
            setTimeout(generateBossQuestion, 500);
        }
    }
}

// -----------------------------------------------------------------
// 4. LOGIK MASA TAMAT
// -----------------------------------------------------------------
function handleTimeout() {
    // TIDAK JAWAB: Tolak HP Murid 20
    bossPlayerHP -= 20;
    updatebossPlayerHPUI();
    
    alert("⏳ Times Up! You've failed to dodge the attack! (-20 HP)");
    
    if(checkPlayerAlive()) {
        setTimeout(generateBossQuestion, 500);
    }
}

// -----------------------------------------------------------------
// 5. UPDATE UI HP PEMAIN
// -----------------------------------------------------------------
function updatebossPlayerHPUI() {
    const hpText = document.getElementById('player-hp-text');
    if(hpText) hpText.innerText = bossPlayerHP;
}

function checkPlayerAlive() {
    if (bossPlayerHP <= 0) {
        alert("💀 Your HP has run out! You're defeated...");
        
        // JANGAN RELOAD TERUS! Kita hantar report ke server dulu untuk ganjaran 'First Die'
        notifyServerPlayerDied(); 
        
        return false;
    }
    return true;
}

// -----------------------------------------------------------------
// FUNGSI HANTAR INFO "MATI" KE SERVER
// -----------------------------------------------------------------
function notifyServerPlayerDied() {
    // PENTING: Ganti dengan URL Web App Google Apps Script anda
    const scriptURL = "https://script.google.com/macros/s/AKfycbwG1uiPv8Z0LCpHxmmcs5H3ZT_aPh0uOTfTCqmb5lyGF4C224BXObkeGJgq8pnj8W6C/exec"; 
    
    const payload = {
        action: "submitPlayerDeath",
        eventID: window.currentActiveBoss.eventID,
        studentName: (localPlayerData && localPlayerData.name) ? localPlayerData.name : "Pemain Berani"
    };

    fetch(scriptURL, { 
        method: 'POST', 
        body: JSON.stringify(payload) 
    })
    .then(res => res.json())
    .then(data => {
        // Selepas server berjaya terima mesej, barulah kita refresh game
        location.reload(); 
    })
    .catch(err => {
        console.error("Ralat hantar data kematian:", err);
        location.reload(); // Refresh juga kalau ada error internet
    });
}

// -----------------------------------------------------------------
// 3. FUNGSI VISUAL DAMAGE (ANIMASI)
// -----------------------------------------------------------------
function showDamageIndicator(val) {
    const indicator = document.getElementById('damage-indicator');
    if (!indicator) return;

    indicator.innerText = val;
    indicator.classList.remove('hidden');
    
    // Animasi menggunakan Tailwind
    indicator.classList.add('animate-bounce'); 
    
    setTimeout(() => {
        indicator.classList.add('hidden');
        indicator.classList.remove('animate-bounce');
    }, 1000);
}

// -----------------------------------------------------------------
// 7. KEMASKINI HP BOSS KE SERVER
// -----------------------------------------------------------------
function updateBossHPOnServer(damageAmt) {
    // PENTING: Masukkan URL Web App anda
    const scriptURL = "https://script.google.com/macros/s/AKfycbwG1uiPv8Z0LCpHxmmcs5H3ZT_aPh0uOTfTCqmb5lyGF4C224BXObkeGJgq8pnj8W6C/exec"; 
    
    const payload = {
        action: "submitDamage",
        eventID: window.currentActiveBoss.eventID,
        damage: damageAmt, // Hantar nilai masa (timer) sebagai damage
        studentName: (localPlayerData && localPlayerData.name) ? localPlayerData.name : "Pemain Berani"
    };

    fetch(scriptURL, { method: 'POST', body: JSON.stringify(payload) })
    .then(res => res.json())
    .then(data => {
        if(data.result === "success") {
            const hpBar = document.getElementById('boss-hp-bar');
            const hpText = document.getElementById('boss-hp-text');
            
            const newHP = data.newHP;
            const maxHP = window.currentActiveBoss.maxHp;
            
            hpBar.style.width = (newHP / maxHP) * 100 + "%";
            hpText.innerText = `HP: ${newHP} / ${maxHP}`;
            
            if(newHP <= 0) {
                alert("🎉 AMAZING! BOSS HAVE BEEN DEFEATED!");
                location.reload(); 
            }
        }
    })
    .catch(err => console.error("Ralat server:", err));
}

// -----------------------------------------------------------------
// 2. SISTEM TIMER SOALAN
// -----------------------------------------------------------------
function startBossTimer() {
    bossTimeLeft = MAX_TIME;
    const timerBar = document.getElementById('boss-timer-bar');
    const timerText = document.getElementById('timer-text');
    
    timerBar.style.width = '100%';
    timerBar.className = "bg-blue-500 h-full transition-all duration-1000 ease-linear";
    timerText.innerText = bossTimeLeft;

    bossTimerInterval = setInterval(() => {
        bossTimeLeft--;
        timerText.innerText = bossTimeLeft;
        timerBar.style.width = ((bossTimeLeft / MAX_TIME) * 100) + "%";

        // Tukar warna amaran jika baki masa sikit
        if(bossTimeLeft <= 3) {
            timerBar.className = "bg-red-500 h-full transition-all duration-1000 ease-linear";
        }

        // MASA TAMAT
        if (bossTimeLeft <= 0) {
            clearInterval(bossTimerInterval);
            handleTimeout();
        }
    }, 1000);
}