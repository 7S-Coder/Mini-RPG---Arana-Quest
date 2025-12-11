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

// Append an HTML log line (allows styled content)
function logHTML(html) {
    if (!logEl) return;
    const line = document.createElement('div');
    line.className = 'log-line';
    line.innerHTML = html;
    logEl.appendChild(line);
    try { line.scrollIntoView({ behavior: 'auto', block: 'end' }); } catch(e) {}
    logEl.scrollTop = logEl.scrollHeight;
}


class Player {
    constructor() {
        this.name = "Hero";
        this.hp = 100;
        this.maxHp = 100;
        this.baseDamage = 10;
        this.baseDefense = 5;
        this.damage = this.baseDamage;
        this.defense = this.baseDefense;
        this.xp = 0;
        this.lvl = 1;
        this.gold = 50;
        this.inventory = [];
        // equipment slots: one slot per simplified type
        this.equipment = {
            arme: null,
            botte: null,
            ceinture: null,
            amulette: null,
            anneau: null,
            plastron: null,
            chapeau: null,
            artefact: null
        };
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

// Enemy tiers for difficulty scaling (levels and spawn weights)
const ENEMY_TIERS = {
    common:    { weight: 60, levelMin: 1,  levelMax: 5,   color: '#dddddd' },
    rare:      { weight: 25, levelMin: 6,  levelMax: 15,  color: '#55aaff' },
    epic:      { weight: 9,  levelMin: 16, levelMax: 30,  color: '#d46cff' },
    legendary: { weight: 4,  levelMin: 31, levelMax: 59,  color: '#ffcc33' },
    mythic:    { weight: 2,  levelMin: 60, levelMax: 100, color: '#ffd700', glow: true }
};

function sumWeights(obj) {
    return Object.values(obj).reduce((s, v) => s + (v.weight || 0), 0);
}

function weightedPickEnemyTier() {
    const total = sumWeights(ENEMY_TIERS);
    const r = Math.random() * total;
    let acc = 0;
    for (const [k, v] of Object.entries(ENEMY_TIERS)) {
        acc += v.weight;
        if (r <= acc) return k;
    }
    return 'common';
}

function createEnemyFromTier(tier, index) {
    const cfg = ENEMY_TIERS[tier] || ENEMY_TIERS.common;
    const level = randInt(cfg.levelMin, cfg.levelMax);
    // choose name pools per tier
    const pools = {
        common: ['Gobelin','Slime','Loup','Rôdeur','Squelette','Bouftou'],
        rare: ['Brigand','Ogre','Warg','Garde','Satyre','Maraudeur'],
        epic: ['Chasseur sombre','Golem','Wyrm','Nécromancien','Rôdeur ancien'],
        legendary: ['Seigneur du Fléau','Géant de pierre','Drake','Chevalier noir'],
        mythic: ['Ancien Primordial','Dragon Ancien','Titan','Démon Primordial']
    };
    const names = pools[tier] || pools.common;
    const baseName = names[Math.floor(Math.random() * names.length)];
    const name = `${baseName} #${index+1}`;
    // HP/défense/dégâts scaling: non-linéaire pour rendre les niveaux supérieurs significativement plus dangereux
    const hp = Math.floor(20 + Math.pow(level, 1.35) * (6 + Math.random() * 3));
    const dmg = Math.max(1, Math.floor(level * (0.8 + Math.random() * 1.2)));
    const def = Math.floor(level * (0.5 + Math.random() * 0.6));
    const e = new Enemy(name, hp, dmg);
    e.maxHp = hp;
    e.level = level;
    e.tier = tier;
    e.defense = def;
    return e;
}

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

// Equip an item from inventory into its slot (only 1 slot per type)
function equipItem(index) {
    const entry = player.inventory[index];
    if (!entry) { log('ℹ️ Objet introuvable.'); return; }
    const id = typeof entry === 'string' ? entry : entry.id;
    const def = ITEMS[id] || null;
    if (!def) { log('ℹ️ Objet inconnu, impossible d\'équiper.'); return; }
    const slot = getSimpleType(def);
    if (!slot) { log(`ℹ️ Cet objet ne peut pas être équipé.`); return; }
    // if a different item is currently equipped in that slot, move it back to inventory
    const currently = player.equipment[slot];
    if (currently) {
        player.inventory.push({ id: currently, name: ITEMS[currently]?.name ?? currently, rarity: ITEMS[currently]?.rarity ?? 'common' });
    }
    // equip
    player.equipment[slot] = id;
    // remove from inventory (remove first matching index)
    player.inventory.splice(index, 1);
    log(`⚙️ Vous équipez ${def.name} dans la slot ${slot}.`);
    // apply immediate stat changes if relevant (simple approach)
    // recalc player stats from base + equipment (simple additive)
    recalcStatsFromEquipment();
    updateStats();
}
window.equipItem = equipItem;

function unequipSlot(slot) {
    const cur = player.equipment[slot];
    if (!cur) { log('ℹ️ Rien à déséquiper ici.'); return; }
    player.inventory.push({ id: cur, name: ITEMS[cur]?.name ?? cur, rarity: ITEMS[cur]?.rarity ?? 'common' });
    player.equipment[slot] = null;
    log(`⚙️ Vous déséquipez ${ITEMS[cur]?.name ?? cur}.`);
    recalcStatsFromEquipment();
    updateStats();
}
window.unequipSlot = unequipSlot;

// Recalculate player.damage and defense from base + equipment (naive additive)
function recalcStatsFromEquipment() {
    // start from base defaults (could store base values elsewhere)
    player.damage = 10; // base
    player.defense = 5; // base
    Object.values(player.equipment).forEach(eid => {
        if (!eid) return;
        const def = ITEMS[eid];
        if (!def) return;
        if (def.dmg) player.damage += def.dmg;
        if (def.def) player.defense += def.def;
    });
}

const player = new Player();
let currentEnemies = [];

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
            baseDamage: player.baseDamage,
            baseDefense: player.baseDefense,
            damage: player.damage,
            defense: player.defense,
            xp: player.xp,
            lvl: player.lvl,
            gold: player.gold,
            inventory: player.inventory,
            equipment: player.equipment
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
        player.baseDamage = typeof data.baseDamage === 'number' ? data.baseDamage : player.baseDamage;
        player.baseDefense = typeof data.baseDefense === 'number' ? data.baseDefense : player.baseDefense;
        player.damage = typeof data.damage === 'number' ? data.damage : player.damage;
        player.defense = typeof data.defense === 'number' ? data.defense : player.defense;
        player.inventory = Array.isArray(data.inventory) ? data.inventory : player.inventory;
        // restore equipment if present
        if (data.equipment && typeof data.equipment === 'object') {
            Object.keys(player.equipment).forEach(k => {
                player.equipment[k] = data.equipment[k] ?? null;
            });
        }
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
        if (!currentEnemies || currentEnemies.length === 0) {
            el.textContent = '';
            return;
        }
        // render as cards
        const html = currentEnemies.map((e, i) => {
            const cfg = ENEMY_TIERS[e.tier] || {};
            const color = cfg.color || '#fff';
            const glow = cfg.glow ? 'text-shadow:0 0 8px rgba(255,215,0,0.9);' : '';
            const dead = e.hp <= 0;
            const name = `<span class="ec-name" style="color:${color};${glow}">${e.name}</span>`;
            const meta = `<span class="ec-meta">${e.tier} — lvl ${e.level}</span>`;
            const hpText = `${Math.max(0, e.hp)}${e.maxHp ? ` / ${e.maxHp}` : ''}`;
            return `<div class="enemy-card" data-index="${i}" data-dead="${dead}"><div class="ec-head"><div>${name} ${meta}</div><div class="ec-hp">HP: ${hpText}</div></div><div class="ec-stats"><div class="stat ec-dmg">DMG: ${e.damage}</div><div class="stat ec-def">DEF: ${e.defense || 0}</div></div></div>`;
        }).join('');
        el.innerHTML = `<div class="enemy-cards">${html}</div>`;
}

// Render the tier legend into the sidebar
function renderTierLegend() {
    const el = document.getElementById('tierLegend');
    if (!el) return;
    const items = Object.entries(ENEMY_TIERS).map(([k, v]) => {
        const color = v.color || '#fff';
        const glow = v.glow ? 'box-shadow:0 0 8px rgba(255,215,0,0.8);' : '';
        const range = v.levelMin && v.levelMax ? `lvl ${v.levelMin}-${v.levelMax}` : '';
        return `<div class="tier-item"><span class="swatch" style="background:${color};${glow}"></span><span class="tier-name">${k}</span><span class="tier-range">${range}</span></div>`;
    }).join('');
    el.innerHTML = `<h4>Palier ennemis</h4><div class="tier-items">${items}</div>`;
}

// render legend on load
renderTierLegend();

function newEncounter() {
    // spawn 1-3 enemies
    const names = ['Bouftou','Gobelin','Loup','Slime','Squelette','Rôdeur'];
    const count = Math.floor(Math.random() * 3) + 1; // 1..3
    currentEnemies = [];
    for (let i=0;i<count;i++) {
        const tier = weightedPickEnemyTier();
        const e = createEnemyFromTier(tier, i);
        currentEnemies.push(e);
        // styled appearance log using tier color
        const cfg = ENEMY_TIERS[e.tier] || {};
        const color = cfg.color || '#fff';
        const glow = cfg.glow ? 'text-shadow:0 0 8px rgba(255,215,0,0.9);' : '';
        const nameHtml = `<strong style="color:${color};${glow}">${e.name}</strong>`;
        const tierHtml = `<em style="color:${color}">${e.tier}</em>`;
        logHTML(`🐺 ${nameHtml} apparaît ! Niveau ${e.level} — Palier: ${tierHtml}`);
    }
    updateStats();
}

document.getElementById('goToArena').addEventListener('click', () => {
    newEncounter();
});

document.getElementById('attackBtn').addEventListener('click', () => {
    if (!currentEnemies || currentEnemies.filter(e => e.hp > 0).length === 0) { log('ℹ️ Aucun ennemi présent. Allez à l\'arène !'); return; }
    // target the first alive enemy
    const targetIndex = currentEnemies.findIndex(e => e.hp > 0);
    if (targetIndex === -1) { log('ℹ️ Aucun ennemi vivant.'); return; }
    const target = currentEnemies[targetIndex];
    const actualDamage = Math.max(1, player.damage - (target.defense || 0));
    target.hp -= actualDamage;
    log(`⚔️ Vous infligez ${actualDamage} dégâts à ${target.name} (def ${target.defense || 0})`);
    if (target.hp <= 0) {
        // reward for this kill
        const xpGain = randInt(6, 16);
        const goldGain = randInt(4, 14);
        log(`💀 ${target.name} vaincu ! Vous gagnez ${xpGain} XP et ${goldGain} or.`);
        player.xp += xpGain; player.gold += goldGain;
        // decide drop by rarity probabilities
        const totalDrop = sumObjectValues(RARITY_DROP_RATES);
        if (Math.random() < totalDrop) {
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
                log(`🎁 ${target.name} lâche : ${dropped.name} (${dropped.rarity})`);
            }
        }
        // remove dead enemy
        currentEnemies.splice(targetIndex, 1);
        if (!currentEnemies || currentEnemies.filter(e => e.hp > 0).length === 0) {
            endCombatCleanup('victoire');
            return;
        }
        updateStats();
        return;
    }

    // enemy retaliation: pick a random alive enemy to strike back
    const alive = currentEnemies.filter(e => e.hp > 0);
    if (alive.length > 0) {
        const attacker = alive[Math.floor(Math.random() * alive.length)];
        const edmg = Math.max(0, attacker.damage - player.defense);
        player.hp -= edmg;
        log(`🛡️ ${attacker.name} riposte et inflige ${edmg} dégâts.`);
        if (player.hp <= 0) {
            // Respawn: restore HP to max and end combat
            player.hp = player.maxHp;
            log('☠️ Vous êtes mort. Vous ressuscitez et récupérez vos PV au maximum.');
            endCombatCleanup('mort');
            return;
        }
    }
    updateStats();
});

document.getElementById('runBtn').addEventListener('click', () => {
    if (!currentEnemies || currentEnemies.filter(e => e.hp > 0).length === 0) { log('ℹ️ Rien à fuir.'); return; }
    const chance = Math.random();
    if (chance > 0.45) {
        log('🏃 Vous réussissez à fuir !');
        endCombatCleanup('fuite réussie');
    } else {
        log('❌ Fuite échouée. Un ennemi attaque.');
        const alive = currentEnemies.filter(e => e.hp > 0);
        if (alive.length > 0) {
            const attacker = alive[Math.floor(Math.random() * alive.length)];
            const edmg = Math.max(0, attacker.damage - player.defense);
            player.hp -= edmg;
            if (player.hp <= 0) {
                player.hp = player.maxHp;
                log('☠️ Vous êtes mort. Vous ressuscitez et récupérez vos PV au maximum.');
                endCombatCleanup('mort');
                return;
            }
        }
    }
    updateStats();
});

// Shop logic (toggle + dynamic render)
const shopEl = document.getElementById('shop');
document.getElementById('openShop').addEventListener('click', () => {
    if (!shopEl) return;
    // render/shop refresh when opening
    renderShop();
    const shown = shopEl.style.display === 'flex';
    shopEl.style.display = shown ? 'none' : 'flex';
    shopEl.setAttribute('aria-hidden', shown ? 'true' : 'false');
});

// Rotating expensive equipment pool (ids from ITEMS)
const ROTATING_EQUIPMENTS = ['soulrender','aegis_plate','phoenix_feather','ring_of_eternity','dragon_blade','spectral_blade','stormcaller_staff','venom_bow','mythos_core','orb_of_ages','void_relic','celestial_crown'];

function getHourSeedIndex() {
    const hours = Math.floor(Date.now() / 3600000); // hours since epoch
    return hours % ROTATING_EQUIPMENTS.length;
}

function getRotatingShopItems() {
    const start = getHourSeedIndex();
    const out = [];
    for (let i = 0; i < 3; i++) {
        out.push(ROTATING_EQUIPMENTS[(start + i) % ROTATING_EQUIPMENTS.length]);
    }
    return out;
}

function getSellPrice(id) {
    const def = ITEMS[id];
    if (!def) return 1;
    const cost = def.cost || 1;
    return Math.max(1, Math.floor(cost * 0.5));
}

function sellItem(index) {
    const it = player.inventory[index];
    if (!it) { log('ℹ️ Rien à vendre à cet emplacement.'); return; }
    const id = typeof it === 'string' ? it : it.id;
    const price = getSellPrice(id);
    player.inventory.splice(index, 1);
    player.gold += price;
    log(`💰 Vous vendez ${ITEMS[id]?.name ?? id} pour ${price} or.`);
    updateStats();
    savePlayer();
}
window.sellItem = sellItem;

function renderShop() {
    if (!shopEl) return;
    // potion buy at fixed price 20g
    const pR = RARITIES['common'] || { color: '#fff' };
    const pGlow = pR.glow ? 'text-shadow:0 0 6px rgba(255,215,0,0.8);' : '';
    const pStyle = `color:${pR.color};${pGlow}`;
    let html = `<div class="shop-item"><span style="${pStyle}">Potion de soin</span> — 20g <button data-action="buy" data-id="potion">Acheter</button></div>`;
    // rotating equipments
    const rot = getRotatingShopItems();
    html += `<div style="margin-top:8px;font-weight:700">Équipements en boutique (rotation horaire)</div>`;
    rot.forEach(id => {
        const def = ITEMS[id];
        if (!def) return;
        const r = RARITIES[def.rarity] || { color: '#fff' };
        const glow = r.glow ? 'text-shadow:0 0 6px rgba(255,215,0,0.8);' : '';
        const style = `color:${r.color};${glow}`;
        html += `<div class="shop-item"><span style="${style}">${def.name}</span> — ${def.rarity} — ${def.cost || 'N/A'}g <button data-action="buy" data-id="${id}">Acheter</button></div>`;
    });
    shopEl.innerHTML = html;
}

// delegation for buy buttons
if (shopEl) {
    shopEl.addEventListener('click', (ev) => {
        const btn = ev.target.closest('button[data-action="buy"]');
        if (!btn) return;
        const id = btn.dataset.id;
        if (!id) return;
        // price
        if (id === 'potion') {
            const cost = 20;
            if (player.gold < cost) { log('❌ Pas assez d\'or pour acheter la potion.'); return; }
            player.gold -= cost;
            player.inventory.push({ id: 'potion', name: ITEMS['potion'].name, rarity: 'common' });
            log(`🛒 Vous achetez une Potion pour ${cost} or.`);
            updateStats(); savePlayer();
            return;
        }
        const def = ITEMS[id];
        if (!def) { log('ℹ️ Objet indisponible.'); return; }
        const cost = def.cost || 0;
        if (player.gold < cost) { log('❌ Pas assez d\'or pour cet objet.'); return; }
        player.gold -= cost;
        player.inventory.push({ id: def.id, name: def.name, rarity: def.rarity });
        log(`🛒 Vous achetez ${def.name} pour ${cost} or.`);
        updateStats(); savePlayer();
    });
}

function updateInventory() {
    const invEl = document.getElementById('inventory');
    const equipEl = document.getElementById('equipment');
    if (!invEl || !equipEl) return;

    // render equipment slots
    const slotLabels = {
        arme: 'Arme', botte: 'Botte', ceinture: 'Ceinture', amulette: 'Amulette', anneau: 'Anneau', plastron: 'Plastron', chapeau: 'Chapeau', artefact: 'Artefact'
    };
    equipEl.innerHTML = Object.keys(player.equipment).map(slot => {
        const id = player.equipment[slot];
        if (!id) return `<div class="equip-slot"><div class="slot-name">${slotLabels[slot]}</div><div class="slot-item muted">vide</div></div>`;
        const def = ITEMS[id] || { name: id, rarity: 'common' };
        const r = RARITIES[def.rarity] || { color: 'white' };
        const glow = r.glow ? 'text-shadow:0 0 6px rgba(255,215,0,0.8);' : '';
        const style = `color:${r.color};${glow}`;
        return `<div class="equip-slot"><div class="slot-name">${slotLabels[slot]}</div><div class="slot-item" style="${style}">${def.name}</div><button onclick="unequipSlot('${slot}')">Déséquiper</button></div>`;
    }).join('');

    // render inventory items
    if (!player.inventory || player.inventory.length === 0) {
        invEl.innerHTML = '<div class="inv-item muted">Inventaire vide</div>';
        return;
    }
    invEl.innerHTML = player.inventory.map((it, i) => {
        const id = typeof it === 'string' ? it : it.id;
        const def = ITEMS[id] || (typeof it === 'object' ? it : { name: id, rarity: 'common' });
        const r = RARITIES[def.rarity] || { color: 'white' };
        const glow = r.glow ? 'text-shadow:0 0 6px rgba(255,215,0,0.8);' : '';
        const style = `color:${r.color};${glow}`;
        const simpleType = getSimpleType(def);
        const equipBtn = `<button onclick="equipItem(${i})">Équiper (${simpleType})</button>`;
        const useBtn = def.heal ? ` <button onclick="useItem(${i})">Utiliser</button>` : '';
        const sellBtn = `<button onclick="sellItem(${i})">Vendre (${getSellPrice(id)}g)</button>`;
        return `<div class="inv-item" style="${style}"><div>${def.name}</div><div>${equipBtn}${useBtn}${sellBtn}</div></div>`;
    }).join('');
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

    // clear enemies and enemy display
    currentEnemies = [];
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

