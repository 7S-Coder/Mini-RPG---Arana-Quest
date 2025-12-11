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

// Rarities and item catalog
const RARITIES = {
  common:    { color: "white", weight: 70 },
  rare:      { color: "blue", weight: 18 },
  epic:      { color: "pink", weight: 8 },
  legendary: { color: "yellow", weight: 3 },
  mythic:    { color: "gold", glow: true, weight: 1 }
};

const ITEMS = {
    potion:       { id: 'potion', name: 'Potion de soin', rarity: 'common', type: 'artefact', heal: 30, cost: 10 },
    
    iron_sword:   { id: 'iron_sword', name: 'Épée en fer', rarity: 'common', type: 'arme', dmg: 3, cost: 30 },
    dague:        { id: 'dague', name: 'Dague courte', rarity: 'common', type: 'arme', dmg: 2, cost: 12 },
    hache:        { id: 'hache', name: 'Hache de bûcheron', rarity: 'rare', type: 'arme', dmg: 5, cost: 45 },
    masse:        { id: 'masse', name: 'Masse lourde', rarity: 'rare', type: 'arme', dmg: 6, cost: 55 },
    lance:        { id: 'lance', name: 'Lance', rarity: 'rare', type: 'arme', dmg: 4, cost: 40 },
    arc:          { id: 'arc', name: 'Arc en bois', rarity: 'common', type: 'arme', dmg: 3, cost: 25 },
    carquois:     { id: 'carquois', name: 'Carquois', rarity: 'common', type: 'artefact', ammo: 20, cost: 8 },

    iron_plate:   { id: 'iron_plate', name: 'Plastron en fer', rarity: 'common', type: 'plastron', def: 3, cost: 35 },
    bottes:       { id: 'bottes', name: 'Bottes de cuir', rarity: 'common', type: 'botte', def: 1, cost: 12 },
    ceinture:     { id: 'ceinture', name: 'Ceinture simple', rarity: 'common', type: 'ceinture', def: 0, cost: 6 },
    coiffe:       { id: 'coiffe', name: 'Coiffe en tissu', rarity: 'common', type: 'chapeau', def: 1, cost: 10 },
    gantelets:    { id: 'gantelets', name: 'Gantelets', rarity: 'rare', type: 'plastron', def: 2, cost: 20 },
    jambières:    { id: 'jambieres', name: 'Jambières', rarity: 'rare', type: 'plastron', def: 2, cost: 28 },
    brassards:    { id: 'brassards', name: 'Brassards', rarity: 'rare', type: 'plastron', def: 1, cost: 18 },

    cape:         { id: 'cape', name: 'Cape', rarity: 'epic', type: 'plastron', def: 2, cost: 90 },
    anneau:       { id: 'anneau', name: 'Anneau simple', rarity: 'rare', type: 'anneau', bonus: 'small', cost: 40 },
    collier:      { id: 'collier', name: 'Collier', rarity: 'rare', type: 'amulette', bonus: 'small', cost: 45 },
    dragon_blade: { id: 'dragon_blade', name: 'Lame du dragon', rarity: 'epic', type: 'arme', dmg: 8, cost: 120 },
    spectral_blade:{ id: 'spectral_blade', name: 'Lame Spectrale', rarity: 'epic', type: 'arme', dmg: 10, cost: 180 },
    stormcaller_staff:{ id: 'stormcaller_staff', name: 'Bâton Stormcaller', rarity: 'epic', type: 'arme', dmg: 9, cost: 170 },
    venom_bow:    { id: 'venom_bow', name: 'Arc du Venin', rarity: 'epic', type: 'arme', dmg: 9, cost: 160 },
    runed_amulet: { id: 'runed_amulet', name: 'Amulette runique', rarity: 'epic', type: 'amulette', bonus: 'mana', cost: 140 },
    ghost_hood:   { id: 'ghost_hood', name: 'Capuche des spectres', rarity: 'epic', type: 'chapeau', def: 2, cost: 130 },
    boots_of_swift:{ id: 'boots_of_swift', name: 'Bottes de Rapidité', rarity: 'epic', type: 'botte', def: 1, bonus: 'speed', cost: 125 },

    soulrender:   { id: 'soulrender', name: 'Tranche-âmes', rarity: 'legendary', type: 'arme', dmg: 14, cost: 480 },
    aegis_plate:  { id: 'aegis_plate', name: "Plastron d'Aegis", rarity: 'legendary', type: 'plastron', def: 10, cost: 520 },
    phoenix_feather:{ id: 'phoenix_feather', name: 'Plume du Phénix', rarity: 'legendary', type: 'plastron', bonus: 'revive', cost: 600 },
    ring_of_eternity:{ id: 'ring_of_eternity', name: 'Anneau de l’Éternité', rarity: 'legendary', type: 'anneau', bonus: 'hpregen', cost: 450 },

    mythos_core:  { id: 'mythos_core', name: 'Noyau de Mythos', rarity: 'mythic', type: 'artefact', dmg: 15, def: 8, cost: 1000 },
    orb_of_ages:   { id: 'orb_of_ages', name: 'Orbe des Âges', rarity: 'mythic', type: 'artefact', bonus: 'time', cost: 2000 },
    void_relic:    { id: 'void_relic', name: 'Relique du Vide', rarity: 'mythic', type: 'artefact', bonus: 'void', cost: 2500 },
    celestial_crown:{ id: 'celestial_crown', name: 'Couronne Céleste', rarity: 'mythic', type: 'chapeau', bonus: 'divine', cost: 3000 }
};

// Catalogue des objets pouvant être dropés en jeu (utilisez les clés correspondant à `ITEMS`)
const DROPPABLE_ITEMS = [
    'potion', 'dague', 'iron_sword', 'hache', 'masse', 'lance', 'arc', 'carquois',
    'iron_plate', 'bottes', 'ceinture', 'coiffe', 'gantelets', 'jambieres', 'brassards',
    'cape', 'anneau', 'collier', 'dragon_blade', 'spectral_blade', 'stormcaller_staff', 'venom_bow', 'runed_amulet', 'ghost_hood', 'boots_of_swift',
    'soulrender', 'aegis_plate', 'phoenix_feather', 'ring_of_eternity', 'aegis_shield',
    'mythos_core', 'orb_of_ages', 'void_relic', 'celestial_crown'
];

// Drop rates per rarity (absolute probability per enemy killed for that rarity)
// You requested: common 30%, epic 8%, legendary 1%, mythic 0.2%.
// We'll set `rare` to 12% by default so overall drop chance remains reasonable.
const RARITY_DROP_RATES = {
    common: 0.30,
    rare:   0.12,
    epic:   0.08,
    legendary: 0.01,
    mythic: 0.002
};

function sumObjectValues(obj) {
    return Object.values(obj).reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0);
}

// Compute per-item absolute drop probability: P(item) = P(rarity) * (1 / count_of_items_of_that_rarity)
function getItemDropRate(key) {
    const item = ITEMS[key];
    if (!item) return 0;
    const rarity = item.rarity || 'common';
    const rateForRarity = RARITY_DROP_RATES[rarity] || 0;
    // count how many droppable items are of this rarity
    let count = 0;
    DROPPABLE_ITEMS.forEach(k => { const it = ITEMS[k]; if (it && it.rarity === rarity) count++; });
    if (count <= 0) return 0;
    return rateForRarity / count;
}

// Pick a random item from a given rarity (uniform among items of that rarity)
function pickItemByRarity(rarity) {
    const list = DROPPABLE_ITEMS.filter(k => ITEMS[k] && ITEMS[k].rarity === rarity).map(k => ITEMS[k]);
    if (!list.length) return null;
    return list[Math.floor(Math.random() * list.length)];
}

// Weighted random picker for items by rarity
function pickRandomItem() {
    // build weighted list using the droppable catalog and rarity weights
    const weighted = [];
    DROPPABLE_ITEMS.forEach(key => {
        const item = ITEMS[key];
        if (!item) return;
        const r = RARITIES[item.rarity] || { weight: 0 };
        const w = Math.max(0, r.weight || 0);
        for (let i = 0; i < w; i++) weighted.push(item);
    });
    if (!weighted.length) return null;
    return weighted[Math.floor(Math.random() * weighted.length)];
}

// Global use function so inline onclick can call it from the DOM
function useItem(index) {
    const it = player.inventory[index];
    if (!it) { log('ℹ️ Item introuvable.'); return; }
    // legacy support if inventory stored strings
    const id = typeof it === 'string' ? it : it.id;
    const itemDef = ITEMS[id] || (typeof it === 'object' && ITEMS[it.id]) || null;
    if (!itemDef) { log(`ℹ️ Impossible d'utiliser cet objet (${id}).`); return; }
    if (itemDef.heal) {
        const heal = itemDef.heal;
        const before = player.hp;
        player.hp = Math.min(player.maxHp, player.hp + heal);
        log(`🧪 Vous utilisez ${itemDef.name} et récupérez ${player.hp - before} HP.`);
        player.inventory.splice(index, 1);
        updateStats();
        return;
    }
    log(`ℹ️ ${itemDef.name} ne peut pas être utilisé pour l'instant.`);
}
window.useItem = useItem;

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
        // decide drop by rarity probabilities
        const totalDrop = sumObjectValues(RARITY_DROP_RATES);
        if (Math.random() < totalDrop) {
            // pick a rarity based on absolute rates
            const r = Math.random() * totalDrop;
            let acc = 0;
            let chosenRarity = null;
            for (const [rk, rv] of Object.entries(RARITY_DROP_RATES)) {
                acc += rv;
                if (r <= acc) { chosenRarity = rk; break; }
            }
            if (!chosenRarity) chosenRarity = 'common';
            const dropped = pickItemByRarity(chosenRarity) || pickRandomItem();
            if (dropped) {
                player.inventory.push({ id: dropped.id, name: dropped.name, rarity: dropped.rarity });
                log(`🎁 ${currentEnemy.name} lâche : ${dropped.name} (${dropped.rarity})`);
            }
        }

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
    sword:  { id: 'iron_sword', name: 'Épée', cost: 30 },
    shield: { id: 'aegis_shield', name: 'Bouclier', cost: 220 },
    potion: { id: 'potion', name: 'Potion', cost: 10 }
};

document.querySelectorAll('#shop button').forEach(btn => {
    btn.addEventListener('click', () => {
        const key = btn.dataset.item;
        const entry = shopItems[key];
        if (!entry) return;
        if (player.gold < entry.cost) { log("❌ Pas assez d'or !"); return; }
        player.gold -= entry.cost;
        // if entry references ITEMS, apply its stats
        if (entry.id && ITEMS[entry.id]) {
            const def = ITEMS[entry.id];
            if (def.dmg) player.damage += def.dmg;
            if (def.def) player.defense += def.def;
            // store a lightweight object in inventory
            player.inventory.push({ id: def.id, name: def.name, rarity: def.rarity });
            log(`🛒 Vous achetez : ${def.name}`);
        } else {
            // fallback
            player.inventory.push({ id: entry.name, name: entry.name, rarity: 'common' });
            log(`🛒 Vous achetez : ${entry.name}`);
        }
        updateStats();
        // save occurs in updateStats but ensure immediate persistence
        savePlayer();
    });
});

function updateInventory() {
    const el = document.getElementById('inventory');
    if (!el) return;
    if (!player.inventory || player.inventory.length === 0) {
        el.textContent = 'Inventaire : vide';
        return;
    }
    el.innerHTML = 'Inventaire : ' + player.inventory.map((it, i) => {
        if (typeof it === 'string') return `<span>${it}</span>`;
        const def = ITEMS[it.id] || it;
        const rarity = def.rarity || 'common';
        const r = RARITIES[rarity] || { color: 'white' };
        const glow = r.glow ? 'text-shadow:0 0 6px rgba(255,215,0,0.8);' : '';
        const style = `color:${r.color};${glow}`;
        const useBtn = def.heal ? ` <button onclick="useItem(${i})">Utiliser</button>` : '';
        return `<span style="${style}">${def.name}</span>${useBtn}`;
    }).join(', ');
}

// Render the droppable items catalog into the #catalog panel
function renderDroppableCatalog() {
    const el = document.getElementById('catalog');
    if (!el) return;
    // build list of droppable items
    const html = DROPPABLE_ITEMS.map(key => {
        const it = ITEMS[key];
        if (!it) return '';
        const r = RARITIES[it.rarity] || { color: 'white' };
        const glow = r.glow ? 'text-shadow:0 0 6px rgba(255,215,0,0.8);' : '';
        const style = `color:${r.color};${glow}`;
        const simpleType = getSimpleType(it);
        const typeLabel = simpleType ? ` <span class="item-type">(${simpleType})</span>` : '';
        const extra = it.heal ? `(+${it.heal} HP)` : (it.dmg ? `(DMG ${it.dmg})` : (it.def ? `(DEF ${it.def})` : ''));
        const rate = getItemDropRate(key);
        const pct = (rate * 100).toFixed(3).replace(/\.000$/, '');
        const rateLabel = ` <span class="drop-rate">Taux de drop: ${pct}%</span>`;
        return `<div class="catalog-item"><strong style="${style}">${it.name}</strong> ${typeLabel} — <em>${it.rarity}</em> ${extra}${rateLabel}</div>`;
    }).join('');
    el.innerHTML = `<div class="catalog-head"><h3>Catalogue des drops</h3><button id="closeCatalog" class="btn">Fermer</button></div>${html}`;
    // wire close button
    const close = document.getElementById('closeCatalog');
    if (close) close.addEventListener('click', () => toggleCatalog(false));
}

function toggleCatalog(show) {
    const el = document.getElementById('catalog');
    const btn = document.getElementById('openCatalogBtn');
    if (!el || !btn) return;
    const willShow = typeof show === 'boolean' ? show : (el.style.display === 'none');
    el.style.display = willShow ? 'flex' : 'none';
    el.setAttribute('aria-hidden', willShow ? 'false' : 'true');
    // reflect state on button (optional)
    btn.classList.toggle('active', willShow);
    if (willShow) renderDroppableCatalog();
}

// hook catalog open button
const catalogBtn = document.getElementById('openCatalogBtn');
if (catalogBtn) catalogBtn.addEventListener('click', () => toggleCatalog());

// Simplify types to the requested set: arme, botte, ceinture, amulette, anneau, plastron, chapeau, artefact
function getSimpleType(def) {
    const t = (def.type || '').toString().toLowerCase();
    // prefer explicit mapping based on properties
    if (def.rarity === 'mythic' || t === 'artifact' || t === 'artefact') return 'artefact';
    if (t.includes('weapon') || t.includes('ranged') || t.includes('staff') || def.dmg) return 'arme';
    if (t.includes('boot') || t.includes('boots') || t === 'botte') return 'botte';
    if (t.includes('belt') || t.includes('ceinture')) return 'ceinture';
    if (t.includes('neck') || t.includes('amulet') || t.includes('runed') || t === 'ammo') return 'amulette';
    if (t.includes('ring') || t === 'anneau') return 'anneau';
    if (t.includes('chest') || t.includes('plate') || t.includes('plastron')) return 'plastron';
    if (t.includes('head') || t.includes('hood') || t.includes('coiffe') || t.includes('crown')) return 'chapeau';
    // fallback: map consumables and others to 'artefact' to avoid showing irrelevant types
    return 'artefact';
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
    // hide catalog if open
    const catalogEl = document.getElementById('catalog');
    if (catalogEl) {
        catalogEl.style.display = 'none';
        catalogEl.setAttribute('aria-hidden', 'true');
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

