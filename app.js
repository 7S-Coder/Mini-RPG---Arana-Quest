const logEl = document.getElementById("log");
function log(t) {
    if (!logEl) return;
    const line = document.createElement('div');
    line.className = 'log-line';
    line.textContent = t;
    logEl.appendChild(line);
    // keep latest visible (use scrollIntoView for reliable behavior)
    try { line.scrollIntoView({ behavior: 'auto', block: 'end' }); } catch(e) { /* fallback */ }
    logEl.scrollTop = logEl.scrollHeight;
}

class Player {
    constructor() {
        this.name = "Hero";
        this.hp = 100;
        this.maxHp = 100;
        this.damage = 10;
        this.defense = 5;
        this.xp = 0;
        this.lvl = 1;
        this.gold = 50;
        this.inventory = [];
    }
}

class Enemy {
    constructor(name, hp, damage) {
        this.name = name;
        this.hp = hp;
        this.damage = damage;
    }
}

const player = new Player();
let currentEnemy = null;

// LocalStorage key
const STORAGE_KEY = 'tpgame_player_v1';

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function savePlayer() {
    try {
        const payload = {
            name: player.name,
            hp: player.hp,
            maxHp: player.maxHp,
            damage: player.damage,
            defense: player.defense,
            xp: player.xp,
            lvl: player.lvl,
            gold: player.gold,
            inventory: player.inventory
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
        console.warn('Impossible de sauvegarder le player', e);
    }
}

function loadPlayer() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const data = JSON.parse(raw);
        if (!data) return;
        // assign saved values to current player object
        player.name = data.name ?? player.name;
        player.hp = typeof data.hp === 'number' ? data.hp : player.hp;
        player.maxHp = typeof data.maxHp === 'number' ? data.maxHp : player.maxHp;
        player.damage = typeof data.damage === 'number' ? data.damage : player.damage;
        player.defense = typeof data.defense === 'number' ? data.defense : player.defense;
        player.xp = typeof data.xp === 'number' ? data.xp : player.xp;
        player.lvl = typeof data.lvl === 'number' ? data.lvl : player.lvl;
        player.gold = typeof data.gold === 'number' ? data.gold : player.gold;
        player.inventory = Array.isArray(data.inventory) ? data.inventory : player.inventory;
    } catch (e) {
        console.warn('Impossible de charger le player depuis localStorage', e);
    }
}

function renderHPBar() {
    const el = document.getElementById('hpFill');
    if (!el) return;
    const pct = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
    el.style.width = pct + '%';
}

function updateStats() {
    const s = `HP: ${player.hp}/${player.maxHp}\nNiveau: ${player.lvl}  XP: ${player.xp}\nDégâts: ${player.damage}  Défense: ${player.defense}\nOr: ${player.gold}`;
    const statsEl = document.getElementById('playerStats');
    if (statsEl) statsEl.textContent = s;
    renderHPBar();
    updateInventory();
    renderEnemyInfo();
    // persist progress automatically whenever stats update
    savePlayer();
}

function renderEnemyInfo() {
    const el = document.getElementById('enemyInfo');
    if (!el) return;
    if (!currentEnemy) {
        el.textContent = '';
    } else {
        el.textContent = `${currentEnemy.name} — HP: ${currentEnemy.hp}`;
    }
}

function newEnemy() {
    currentEnemy = new Enemy('Bouftou', 30 + Math.floor(Math.random() * 20), 5 + Math.floor(Math.random() * 4));
    log(`🐺 ${currentEnemy.name} apparaît !`);
    updateStats();
}

document.getElementById('goToArena').addEventListener('click', () => {
    newEnemy();
});

document.getElementById('attackBtn').addEventListener('click', () => {
    if (!currentEnemy) { log('ℹ️ Aucun ennemi présent. Allez à l\'arène !'); return; }
    currentEnemy.hp -= player.damage;
    log(`⚔️ Vous infligez ${player.damage} dégâts à ${currentEnemy.name}`);
    if (currentEnemy.hp <= 0) {
        // randomize rewards
        const xpGain = randInt(6, 16); // example: 6-16 xp
        const goldGain = randInt(4, 14); // example: 4-14 gold
        log(`💀 ${currentEnemy.name} vaincu ! Vous gagnez ${xpGain} XP et ${goldGain} or.`);
        player.xp += xpGain; player.gold += goldGain;
        // cleanup UI after victory
        endCombatCleanup('victoire');
        return;
    }

    // Ennemi riposte
    const edmg = Math.max(0, currentEnemy.damage - player.defense);
    player.hp -= edmg;
    log(`🛡️ ${currentEnemy.name} riposte et inflige ${edmg} dégâts.`);
    if (player.hp <= 0) {
        player.hp = 0;
        log('☠️ Vous êtes mort. Rechargez la page pour recommencer.');
        document.querySelectorAll('.btn').forEach(b => b.disabled = true);
    }
    updateStats();
});

document.getElementById('runBtn').addEventListener('click', () => {
    if (!currentEnemy) { log('ℹ️ Rien à fuir.'); return; }
    const chance = Math.random();
    if (chance > 0.45) {
        log('🏃 Vous réussissez à fuir !');
        // cleanup UI after successful flee
        endCombatCleanup('fuite réussie');
    } else {
        log('❌ Fuite échouée. L\'ennemi attaque.');
        const edmg = Math.max(0, currentEnemy.damage - player.defense);
        player.hp -= edmg;
        if (player.hp <= 0) { player.hp = 0; log('☠️ Vous êtes mort.'); document.querySelectorAll('.btn').forEach(b => b.disabled = true); }
    }
    updateStats();
});

// Shop logic (toggle + buy)
const shopEl = document.getElementById('shop');
document.getElementById('openShop').addEventListener('click', () => {
    if (!shopEl) return;
    const shown = shopEl.style.display === 'flex';
    shopEl.style.display = shown ? 'none' : 'flex';
    shopEl.setAttribute('aria-hidden', shown ? 'true' : 'false');
});

const shopItems = {
    sword: { name: 'Épée', dmg: 5, cost: 20 },
    shield: { name: 'Bouclier', def: 3, cost: 15 }
};

document.querySelectorAll('#shop button').forEach(btn => {
    btn.addEventListener('click', () => {
        const key = btn.dataset.item;
        const item = shopItems[key];
        if (!item) return;
        if (player.gold < item.cost) { log("❌ Pas assez d'or !"); return; }
        player.gold -= item.cost;
        if (item.dmg) player.damage += item.dmg;
        if (item.def) player.defense += item.def;
        player.inventory.push(item.name);
        log(`🛒 Vous achetez : ${item.name}`);
        updateStats();
        // save occurs in updateStats but ensure immediate persistence
        savePlayer();
    });
});

function updateInventory() {
    const el = document.getElementById('inventory');
    if (!el) return;
    el.textContent = 'Inventaire : ' + (player.inventory.length ? player.inventory.join(', ') : 'vide');
}

// load saved player if present (before first save in updateStats)
let _hadSaved = false;
try { _hadSaved = !!localStorage.getItem(STORAGE_KEY); } catch(e) { _hadSaved = false; }
loadPlayer();
if (_hadSaved) 
updateStats();

// Cleanup UI at the end of a combat (victory or successful flee)
function endCombatCleanup(reason) {
    // mark end
    log(`— Fin du combat : ${reason} —`);

    // hide shop if open
    if (shopEl) {
        shopEl.style.display = 'none';
        shopEl.setAttribute('aria-hidden', 'true');
    }

    // clear enemy and enemy display
    currentEnemy = null;
    renderEnemyInfo();

    // After a short delay, clear the log to keep the UI clean and show a ready message
    setTimeout(() => {
        if (!logEl) return;
        logEl.innerHTML = '';
        const ready = document.createElement('div');
        ready.className = 'log-line muted';
        ready.textContent = 'Prêt pour un nouveau combat.';
        logEl.appendChild(ready);
        try { ready.scrollIntoView({ behavior: 'auto', block: 'end' }); } catch (e) {}
    }, 900);

    // refresh stats UI
    updateStats();
}

