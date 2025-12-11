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
        this.baseMaxHp = 100;
        this.baseDamage = 10;
        this.baseDefense = 5;
        this.damage = this.baseDamage;
        this.defense = this.baseDefense;
        this.dodge = 0; // % chance to avoid incoming hit
        this.crit = 0; // % chance to crit on attack
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
            artefact: null,
            familliers: null
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
    mythic:    { color: "#ff4d4d", glow: true, glowColor: 'rgba(255,80,80,0.95)', weight: 1 }
};

// Helper to produce glow style string for a rarity or tier config
function getGlowStyle(cfg, opts = {}) {
        if (!cfg || !cfg.glow) return '';
        const type = opts.type || 'text';
        const size = typeof opts.size === 'number' ? opts.size : (type === 'box' ? 8 : 6);
        const color = cfg.glowColor || 'rgba(255,215,0,0.9)';
        if (type === 'box') return `box-shadow:0 0 ${size}px ${color};`;
        return `text-shadow:0 0 ${size}px ${color};`;
}

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
    celestial_crown:{ id: 'celestial_crown', name: 'Couronne Céleste', rarity: 'mythic', type: 'chapeau', bonus: 'divine', cost: 3000 },
    /* Familiers */
    pet_dragon:   { id: 'pet_dragon', name: 'Dragon familier', rarity: 'epic', type: 'familliers', famAttack: 6, def: 2, cost: 800 },
    pet_dog:      { id: 'pet_dog', name: 'Chien fidèle', rarity: 'rare', type: 'familliers', famAttack: 2, def: 1, cost: 120 }

};

// Additional items to ensure each equipment type has at least one item per rarity (except familiers)
Object.assign(ITEMS, {
    // armes: ensure mythic present
    celestial_saber: { id: 'celestial_saber', name: 'Sabre Céleste', rarity: 'mythic', type: 'arme', dmg: 40, dodge: 8, hp: 20, cost: 2200 },
    // bottes
    swift_boots_rare: { id: 'swift_boots_rare', name: 'Bottes rapides', rarity: 'rare', type: 'botte', def: 2, hp: 10, dodge: 6, dmg: 2, cost: 45 },
    boots_of_valor: { id: 'boots_of_valor', name: 'Bottes de Vaillance', rarity: 'legendary', type: 'botte', def: 6, hp: 28, dodge: 12, dmg: 4, bonus: 'stability', cost: 520 },
    winged_boots: { id: 'winged_boots', name: 'Bottes ailées', rarity: 'mythic', type: 'botte', def: 3, hp: 40, dodge: 20, dmg: 8, bonus: 'flight', cost: 1800 },
    // ceinture
    girdle_simple: { id: 'girdle_simple', name: 'Gourdin de cuir', rarity: 'common', type: 'ceinture', def: 2, hp: 8, cost: 8 },
    girdle_of_might: { id: 'girdle_of_might', name: 'Ceinture de Puissance', rarity: 'rare', type: 'ceinture', def: 6, hp: 20, cost: 60 },
    girdle_legend: { id: 'girdle_legend', name: 'Ceinture des Légendes', rarity: 'epic', type: 'ceinture', def: 10, hp: 36, cost: 200 },
    belt_of_titans: { id: 'belt_of_titans', name: 'Ceinture des Titans', rarity: 'legendary', type: 'ceinture', def: 14, hp: 56, cost: 650 },
    void_belt: { id: 'void_belt', name: 'Ceinture du Vide', rarity: 'mythic', type: 'ceinture', def: 22, hp: 90, bonus: 'void', cost: 1600 },
    // amulette
    amulet_simple: { id: 'amulet_simple', name: 'Amulette simple', rarity: 'common', type: 'amulette', dmg: 1, hp: 6, cost: 12 },
    amulet_rare: { id: 'amulet_rare', name: 'Amulette de Soin', rarity: 'rare', type: 'amulette', bonus: 'regen', hp: 30, cost: 55 },
    amulet_epic: { id: 'amulet_epic', name: 'Amulette d’Énergie', rarity: 'epic', type: 'amulette', bonus: 'mana', hp: 50, cost: 210 },
    amulet_legend: { id: 'amulet_legend', name: 'Amulette des Âges', rarity: 'legendary', type: 'amulette', bonus: 'time', hp: 120, cost: 900 },
    heart_of_void: { id: 'heart_of_void', name: 'Cœur du Vide', rarity: 'mythic', type: 'amulette', bonus: 'void', hp: 300, cost: 2400 },
    // anneau
    simple_ring: { id: 'simple_ring', name: 'Anneau simple', rarity: 'common', type: 'anneau', hp: 8, crit: 2, dodge: 2, cost: 10 },
    band_of_storms: { id: 'band_of_storms', name: 'Bague des Tempêtes', rarity: 'epic', type: 'anneau', bonus: 'crit', hp: 28, crit: 8, dodge: 6, cost: 220 },
    ring_mythic: { id: 'ring_mythic', name: 'Anneau du Cosmos', rarity: 'mythic', type: 'anneau', bonus: 'cosmic', hp: 120, crit: 14, dodge: 10, cost: 2100 },
    // plastron
    leather_armor: { id: 'leather_armor', name: 'Armure en cuir', rarity: 'common', type: 'plastron', def: 2, hp: 14, cost: 25 },
    scale_mail: { id: 'scale_mail', name: 'Cotte d’écailles', rarity: 'rare', type: 'plastron', def: 6, hp: 36, cost: 95 },
    legend_plate: { id: 'legend_plate', name: 'Plastron légendaire', rarity: 'epic', type: 'plastron', def: 11, hp: 88, cost: 380 },
    mythic_armor: { id: 'mythic_armor', name: 'Armure Mythique', rarity: 'mythic', type: 'plastron', def: 20, hp: 260, cost: 3000 },
    // chapeau
    simple_hat: { id: 'simple_hat', name: 'Chapeau simple', rarity: 'common', type: 'chapeau', def: 1, hp: 8, dmg: 1, cost: 6 },
    helm_guard: { id: 'helm_guard', name: 'Casque du Gardien', rarity: 'rare', type: 'chapeau', def: 4, hp: 22, dmg: 3, cost: 70 },
    crown_command: { id: 'crown_command', name: 'Couronne de Commandement', rarity: 'legendary', type: 'chapeau', def: 8, hp: 74, dmg: 8, bonus: 'lead', cost: 800 },
    // artefact
    talisman_rare: { id: 'talisman_rare', name: 'Talisman ancien', rarity: 'rare', type: 'artefact', bonus: 'ward', cost: 75 },
    chronicle_epic: { id: 'chronicle_epic', name: 'Chronique du temps', rarity: 'epic', type: 'artefact', bonus: 'xp', cost: 300 },
    time_core_legend: { id: 'time_core_legend', name: 'Noyau du Temps', rarity: 'legendary', type: 'artefact', bonus: 'time', cost: 1400 }
});

// Enemy tiers for difficulty scaling (levels and spawn weights)
const ENEMY_TIERS = {
    common:    { weight: 60, levelMin: 1,  levelMax: 5,   color: '#dddddd' },
    rare:      { weight: 25, levelMin: 6,  levelMax: 15,  color: '#55aaff' },
    epic:      { weight: 9,  levelMin: 16, levelMax: 30,  color: '#d46cff' },
    legendary: { weight: 4,  levelMin: 31, levelMax: 59,  color: '#ffcc33' },
    mythic:    { weight: 2,  levelMin: 60, levelMax: 100, color: '#ff4d4d', glow: true, glowColor: 'rgba(255,80,80,0.95)' }
};

// Global multiplier to scale enemy stats (easy tuning knob)
const ENEMY_GLOBAL_POWER = 1.5; // 1.5 => 1.5x HP/DMG/DEF
// Multiplier for enemy combat stats (dodge / crit)
const ENEMY_STAT_MULTIPLIER = 1.5; // 1.5 => 1.5x ESQ and CRIT

// Global name pools extracted so maps can include them in their own enemy pools
const GLOBAL_ENEMY_POOLS = {
    common: ['Gobelin','Slime','Loup','Rôdeur','Squelette','Bouftou'],
    rare: ['Brigand','Ogre','Warg','Garde','Satyre','Maraudeur'],
    epic: ['Chasseur sombre','Golem','Wyrm','Nécromancien','Rôdeur ancien'],
    legendary: ['Seigneur du Fléau','Géant de pierre','Drake','Chevalier noir'],
    mythic: ['Ancien Primordial','Dragon Ancien','Titan','Démon Primordial']
};

// --- Maps definition: first map with unique mobs and two dungeons (4 rooms each) ---
const MAPS = {
    forest_of_dawn: {
        id: 'forest_of_dawn',
        name: "Forêt de l'Aube",
        description: "Une forêt brumeuse où l'on rencontre des créatures endémiques.",
        uniqueEnemies: [
            { name: 'Lynx des brumes', tier: 'rare', baseHp: 36, damage: 6, defense: 2 },
            { name: 'Dryade mineure', tier: 'common', baseHp: 24, damage: 4, defense: 1 },
            { name: 'Esprit sylvestre', tier: 'epic', baseHp: 58, damage: 9, defense: 3 }
        ],
        // visual theme for the map (used in logs and bestiary rendering)
        theme: { color: '#2ecc71', glow: true, glowColor: 'rgba(46,204,113,0.9)' },
        lootPool: [ 'potion', 'dague', 'bottes', 'coiffe', 'anneau', 'collier' ],
        dungeons: [
            { id: 'grotte_souterraine', name: 'Grotte Souterraine', rooms: 4 },
            { id: 'ruines_anciennes', name: 'Ruines Anciennes', rooms: 4 }
        ]
    },
    crater_noir: {
        id: 'crater_noir',
        name: "Cratère Noir",
        description: "Un ancien cratère fumant, où la terre est fracturée et les cendres volent.",
        uniqueEnemies: [
            { name: 'Charognard ardent', tier: 'common', baseHp: 30, damage: 5, defense: 1 },
            { name: 'Golem de lave', tier: 'rare', baseHp: 72, damage: 12, defense: 4 },
            { name: 'Cendre spectrale', tier: 'epic', baseHp: 48, damage: 9, defense: 2 }
        ],
        theme: { color: '#e74c3c', glow: true, glowColor: 'rgba(231,76,60,0.9)' },
        lootPool: [ 'potion', 'iron_sword', 'hache', 'dragon_blade', 'phoenix_feather', 'venom_bow' ],
        dungeons: [
            { id: 'fournaise', name: 'La Fournaise', rooms: 3 },
            { id: 'antre_du_braise', name: 'Antre du Braise', rooms: 5 }
        ]
    }
};

// --- Deterministic dungeon room generation ---
// simple string hash to produce a 32-bit seed
function hashStringToSeed(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
}

// Mulberry32 PRNG (seeded) returning function that yields [0,1)
function mulberry32(seed) {
    let t = seed >>> 0;
    return function() {
        t += 0x6D2B79F5;
        let r = Math.imul(t ^ (t >>> 15), 1 | t);
        r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
        return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
}

function seededWeightedPick(obj, rand) {
    const total = Object.values(obj).reduce((s, v) => s + (v.weight || 0), 0);
    const r = rand() * total;
    let acc = 0;
    for (const [k, v] of Object.entries(obj)) {
        acc += v.weight || 0;
        if (r <= acc) return k;
    }
    return Object.keys(obj)[0];
}

function generateDungeonRooms(mapId, dungeonId) {
    const mapCfg = MAPS[mapId] || null;
    const dungeonCfg = mapCfg && Array.isArray(mapCfg.dungeons) ? mapCfg.dungeons.find(d => d.id === dungeonId) : null;
    const roomsCount = (dungeonCfg && dungeonCfg.rooms) ? dungeonCfg.rooms : 3;
    const seed = hashStringToSeed(`${mapId}|${dungeonId}`);
    const rand = mulberry32(seed);
    const rooms = [];
    for (let r = 0; r < roomsCount; r++) {
        const enemies = [];
        // deterministic number of enemies: 1..3
        const count = Math.floor(rand() * 3) + 1;
        for (let i = 0; i < count; i++) {
            // 60% pick unique map enemy if available
            let tpl = null;
            if (mapCfg && Array.isArray(mapCfg.uniqueEnemies) && mapCfg.uniqueEnemies.length > 0 && rand() < 0.6) {
                const def = mapCfg.uniqueEnemies[Math.floor(rand() * mapCfg.uniqueEnemies.length)];
                const name = `${def.name} #${r+1}-${i+1}`;
                const hp = def.baseHp || Math.max(12, 18 + Math.floor(rand()*12));
                const dmg = def.damage || Math.max(1, Math.floor(hp/8));
                tpl = {
                    name, maxHp: Math.floor(hp), hp: Math.floor(hp), damage: Math.floor(dmg), tier: def.tier || 'common', level: (ENEMY_TIERS[def.tier] && ENEMY_TIERS[def.tier].levelMin) ? Math.floor(rand() * (ENEMY_TIERS[def.tier].levelMax - ENEMY_TIERS[def.tier].levelMin + 1)) + ENEMY_TIERS[def.tier].levelMin : 1, defense: def.defense || def.def || 0, originMap: mapId
                };
            } else {
                // pick a tier deterministically using seeded weights
                const tier = seededWeightedPick(ENEMY_TIERS, rand);
                const cfg = ENEMY_TIERS[tier] || ENEMY_TIERS.common;
                const level = Math.floor(rand() * (cfg.levelMax - cfg.levelMin + 1)) + cfg.levelMin;
                const names = GLOBAL_ENEMY_POOLS[tier] || GLOBAL_ENEMY_POOLS.common;
                const baseName = names[Math.floor(rand() * names.length)];
                const name = `${baseName} #${r+1}-${i+1}`;
                const hp = Math.floor(20 + Math.pow(level, 1.35) * (6 + rand()*3));
                const dmg = Math.max(1, Math.floor(level * (0.8 + rand() * 1.2)));
                const def = Math.floor(level * (0.5 + rand() * 0.6));
                tpl = { name, maxHp: hp, hp: hp, damage: dmg, tier, level, defense: def, originMap: mapId };
            }
            if (tpl) enemies.push(tpl);
        }
        rooms.push(enemies);
    }
    return rooms;
}

// convert hex color like '#aabbcc' to {r,g,b}
function hexToRgb(hex) {
    if (!hex) return null;
    try {
        let h = hex.replace('#','').trim();
        if (h.length === 3) h = h.split('').map(c=>c+c).join('');
        const v = parseInt(h,16);
        if (Number.isNaN(v)) return null;
        return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
    } catch(e){ return null; }
}

// Apply the map theme color as a subtle background to the log area
function applyMapThemeToLog(mapId) {
    try {
        const el = document.getElementById('log');
        if (!el) return;
        const map = MAPS[mapId];
        if (!map || !map.theme || !map.theme.color) {
            el.style.background = '';
            return;
        }
        const theme = map.theme;
        const rgb = hexToRgb(theme.color) || null;
        const alpha = typeof theme.opacity === 'number' ? theme.opacity : 0.06;
        let stop = '';
        if (rgb) stop = `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
        else stop = theme.color;
        // subtle gradient using the theme color at small opacity
        el.style.background = `linear-gradient(180deg, ${stop}, rgba(0,0,0,0))`;
    } catch (e) { console.warn('applyMapThemeToLog', e); }
}

// Return styled HTML for a map name using its theme (fallback to plain text)
function mapNameHTML(mapId) {
    try {
        const m = MAPS[mapId];
        if (!m) return (mapId || 'Unknown');
        const theme = m.theme || {};
        const color = theme.color || '#fff';
        const glow = getGlowStyle(theme, { type: 'text', size: 6 });
        return `<span style="color:${color};${glow}">${m.name}</span>`;
    } catch (e) { return MAPS[mapId] ? MAPS[mapId].name : mapId; }
}

// Pick an item from a map-specific loot pool by rarity
function pickMapItemByRarity(mapId, rarity) {
    try {
        if (!mapId) return null;
        const map = MAPS[mapId];
        if (!map || !Array.isArray(map.lootPool) || map.lootPool.length === 0) return null;
        const candidates = map.lootPool.filter(id => ITEMS[id] && (ITEMS[id].rarity || 'common') === rarity);
        if (candidates.length === 0) return null;
        const id = candidates[Math.floor(Math.random() * candidates.length)];
        return ITEMS[id] || null;
    } catch (e) { console.warn('pickMapItemByRarity', e); return null; }
}

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
    const names = GLOBAL_ENEMY_POOLS[tier] || GLOBAL_ENEMY_POOLS.common;
    const baseName = names[Math.floor(Math.random() * names.length)];
    const name = `${baseName} #${index+1}`;
    // HP/défense/dégâts scaling: stronger non-linéaire growth
    let hp = Math.floor(22 + Math.pow(level, 1.4) * (7 + Math.random() * 4));
    let dmg = Math.max(1, Math.floor(level * (1.0 + Math.random() * 1.6)));
    let def = Math.floor(level * (0.7 + Math.random() * 0.8));
    // Apply a player-independent multiplier based on how the enemy's level compares
    // to the average level for its tier. This keeps monsters consistent for all players.
    const avgTierLevel = Math.max(1, Math.floor((cfg.levelMin + cfg.levelMax) / 2));
    const lvlRatio = level / avgTierLevel;
    const tierMul = { common: 1, rare: 1.08, epic: 1.18, legendary: 1.35, mythic: 1.7 }[tier] || 1;
    let extraMul = 1.0;
    if (lvlRatio >= 2) extraMul = 1.75;
    else if (lvlRatio >= 1.5) extraMul = 1.3;
    // apply multipliers (deterministic, not using player state)
    const finalHp = Math.max(1, Math.floor(hp * extraMul * tierMul * ENEMY_GLOBAL_POWER));
    const finalDmg = Math.max(1, Math.floor(dmg * extraMul * tierMul * ENEMY_GLOBAL_POWER));
    const finalDef = Math.max(0, Math.floor(def * extraMul * tierMul * ENEMY_GLOBAL_POWER));

    let e = new Enemy(name, finalHp, finalDmg);
    e.maxHp = finalHp;
    e.hp = finalHp;
    e.level = level;
    e.tier = tier;
    e.defense = finalDef;
    // compute enemy dodge/crit based on level and tier (deterministic)
    const stats = computeEnemyCombatStats(level, tier);
    e.dodge = stats.dodge;
    e.crit = stats.crit;
    return e;
}

// Compute simple enemy combat stats (dodge %, crit %) from level and tier
function computeEnemyCombatStats(level, tier) {
    const tierBonus = { common: 0, rare: 1, epic: 2, legendary: 4, mythic: 8 };
    const bonus = tierBonus[tier] || 0;
    // Base dodge/crit from level and tier
    let dodge = Math.floor(level * 0.30) + bonus; // slightly higher base
    let crit = Math.floor(level * 0.14) + Math.floor(bonus * 0.9);
    // If enemy is a true elite relative to player, boost their evasiveness and crit chance
    try {
        if (typeof player !== 'undefined' && player && player.lvl) {
            const playerLvl = Math.max(1, player.lvl || 1);
            if (level >= playerLvl * 2) {
                dodge += 10; // significant evasiveness
                crit += 5;   // higher crit chance
            } else if (level >= Math.ceil(playerLvl * 1.5)) {
                dodge += 4;
                crit += 2;
            }
        }
    } catch (e) { /* ignore */ }
    // apply global stat multiplier (e.g., triple ESQ/CRIT)
    try {
        const mult = (typeof ENEMY_STAT_MULTIPLIER === 'number' && ENEMY_STAT_MULTIPLIER > 0) ? ENEMY_STAT_MULTIPLIER : 1;
        dodge = Math.floor(dodge * mult);
        crit = Math.floor(crit * mult);
        // caps scaled with multiplier
        dodge = Math.min(60 * mult, dodge);
        crit = Math.min(40 * mult, crit);
    } catch (e) {
        dodge = Math.min(60, dodge);
        crit = Math.min(40, crit);
    }
    return { dodge, crit };
}

// Create a map-specific enemy using the map's uniqueEnemies definitions
function createMapEnemy(mapId, index) {
    const mapCfg = MAPS[mapId] || null;
    if (!mapCfg || !Array.isArray(mapCfg.uniqueEnemies) || mapCfg.uniqueEnemies.length === 0) {
        // fallback to generic tier enemy
        return createEnemyFromTier(weightedPickEnemyTier(), index);
    }
    const def = mapCfg.uniqueEnemies[Math.floor(Math.random() * mapCfg.uniqueEnemies.length)];
    const name = `${def.name} #${(index||0)+1}`;
    const hp = def.baseHp || Math.max(12, 18 + Math.floor(Math.random()*12));
    const dmg = def.damage || Math.max(1, Math.floor(hp/8));
    let e = new Enemy(name, Math.floor(hp), Math.floor(dmg));
    e.maxHp = Math.floor(hp);
    e.hp = Math.floor(hp);
    e.level = (ENEMY_TIERS[def.tier] && ENEMY_TIERS[def.tier].levelMin) ? Math.floor(Math.random() * (ENEMY_TIERS[def.tier].levelMax - ENEMY_TIERS[def.tier].levelMin + 1)) + ENEMY_TIERS[def.tier].levelMin : 1;
    e.tier = def.tier || 'common';
    e.defense = def.defense || def.def || 0;
    e.originMap = mapId;
    // Apply deterministic multipliers based on enemy level vs its tier average
    const tierCfg = ENEMY_TIERS[e.tier] || { levelMin: 1, levelMax: 1 };
    const avgTierLevel = Math.max(1, Math.floor((tierCfg.levelMin + tierCfg.levelMax) / 2));
    const lvlRatio = e.level / avgTierLevel;
    const tierMul = { common: 1, rare: 1.08, epic: 1.18, legendary: 1.35, mythic: 1.7 }[e.tier] || 1;
    let extraMul = 1.0;
    if (lvlRatio >= 2) extraMul = 1.75;
    else if (lvlRatio >= 1.5) extraMul = 1.3;
    e.maxHp = Math.max(1, Math.floor(e.maxHp * extraMul * tierMul * ENEMY_GLOBAL_POWER));
    e.hp = e.maxHp;
    e.damage = Math.max(1, Math.floor((e.damage || dmg) * extraMul * tierMul * ENEMY_GLOBAL_POWER));
    e.defense = Math.max(0, Math.floor((e.defense || 0) * extraMul * tierMul * ENEMY_GLOBAL_POWER));
    // enemy combat stats (deterministic)
    const stats = computeEnemyCombatStats(e.level, e.tier);
    e.dodge = stats.dodge;
    e.crit = stats.crit;
    return e;
}

// Catalogue des objets pouvant être dropés en jeu (utilisez les clés correspondant à `ITEMS`)
const DROPPABLE_ITEMS = [
    'potion', 'dague', 'iron_sword', 'hache', 'masse', 'lance', 'arc', 'carquois',
    'iron_plate', 'bottes', 'ceinture', 'coiffe', 'gantelets', 'jambieres', 'brassards',
    'cape', 'anneau', 'collier', 'dragon_blade', 'spectral_blade', 'stormcaller_staff', 'venom_bow', 'runed_amulet', 'ghost_hood', 'boots_of_swift',
    'soulrender', 'aegis_plate', 'phoenix_feather', 'ring_of_eternity', 'aegis_shield',
    'mythos_core', 'orb_of_ages', 'void_relic', 'celestial_crown',
    /* familiers */ 'pet_dragon', 'pet_dog'
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
    // start from player's base values
    player.damage = typeof player.baseDamage === 'number' ? player.baseDamage : 10;
    player.defense = typeof player.baseDefense === 'number' ? player.baseDefense : 5;
    // reset max HP to base and other derived stats
    player.maxHp = typeof player.baseMaxHp === 'number' ? player.baseMaxHp : 100;
    player.dodge = 0;
    player.crit = 0;
    // reset familiar attack info
    player.familiarAttack = 0;
    player.familiarName = null;
    Object.values(player.equipment).forEach(eid => {
        if (!eid) return;
        const def = ITEMS[eid];
        if (!def) return;
        if (def.dmg) player.damage += def.dmg;
        if (def.def) player.defense += def.def;
        if (def.hp) player.maxHp += def.hp;
        if (def.dodge) player.dodge += def.dodge;
        if (def.crit) player.crit += def.crit;
        // accumulate familiar attack if this item is a familier
        if (def.famAttack) {
            player.familiarAttack += def.famAttack;
            if (!player.familiarName && def.name) player.familiarName = def.name;
        }
    });
    // ensure current HP does not exceed max
    player.hp = Math.min(player.hp || player.maxHp, player.maxHp);
}

// Check and apply level ups if player has enough XP. Multiple levels possible.
function checkLevelUp() {
    const MAX_LEVEL = 80;
    let leveled = false;
    // while enough XP for next level and not already at max level
    while (player.lvl < MAX_LEVEL && player.xp >= xpToNextLevel(player.lvl)) {
        const needed = xpToNextLevel(player.lvl);
        // consume XP for this level
        player.xp -= needed;
        player.lvl += 1;
        // stat gains (simple scaling): HP grows with level, damage and defense small increments
        const hpGain = 10 + Math.floor(player.lvl * 1.5);
        const dmgGain = 2 + Math.floor(player.lvl / 10);
        const defGain = 1 + Math.floor(player.lvl / 15);
        player.maxHp = (typeof player.maxHp === 'number' ? player.maxHp : 100) + hpGain;
        // heal the player by the gained HP so they feel rewarded
        player.hp = Math.min(player.maxHp, (typeof player.hp === 'number' ? player.hp : player.maxHp) + hpGain);
        // keep baseMaxHp in sync with level-driven maxHp increases
        player.baseMaxHp = player.maxHp;
        player.baseDamage = (typeof player.baseDamage === 'number' ? player.baseDamage : 10) + dmgGain;
        player.baseDefense = (typeof player.baseDefense === 'number' ? player.baseDefense : 5) + defGain;
        leveled = true;
        logHTML(`🎉 Niveau supérieur ! Vous êtes maintenant niveau <strong>${player.lvl}</strong> — +${hpGain} PV, +${dmgGain} DMG, +${defGain} DEF.`);
    }
    if (leveled) {
        // reapply equipment modifiers on top of new base stats
        recalcStatsFromEquipment();
        try { showLevelUp(player.lvl); } catch(e) {}
        // persist and refresh UI (but avoid infinite recursion: updateStats will still render)
        savePlayer();
    }
    // if player reached max level, ensure XP cannot trigger further levels and notify
    if (player.lvl >= MAX_LEVEL) {
        player.lvl = Math.min(player.lvl, MAX_LEVEL);
        // cap XP so it doesn't allow another level-up
        try {
            const cap = Math.max(0, xpToNextLevel(player.lvl) - 1);
            player.xp = Math.min(player.xp, cap);
        } catch (e) { /* ignore */ }
        logHTML(`🔒 Niveau maximum atteint (${MAX_LEVEL}). Plus de montée de niveau disponible.`);
        savePlayer();
    }
}

const player = new Player();
let currentEnemies = [];
// current location state (map / dungeon)
let currentMap = null; // e.g. 'forest_of_dawn'
let currentDungeon = null; // e.g. { mapId, dungeonId, roomIndex }

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
            baseMaxHp: player.baseMaxHp,
            baseDamage: player.baseDamage,
            baseDefense: player.baseDefense,
            damage: player.damage,
            defense: player.defense,
            dodge: player.dodge,
            crit: player.crit,
            xp: player.xp,
            lvl: player.lvl,
            gold: player.gold,
            inventory: player.inventory,
            equipment: player.equipment
            // persist current location (map / dungeon)
            , currentMap: currentMap || null,
            currentDungeon: currentDungeon || null
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
        player.baseMaxHp = typeof data.baseMaxHp === 'number' ? data.baseMaxHp : player.baseMaxHp;
        player.dodge = typeof data.dodge === 'number' ? data.dodge : player.dodge;
        player.crit = typeof data.crit === 'number' ? data.crit : player.crit;
        player.inventory = Array.isArray(data.inventory) ? data.inventory : player.inventory;
        // restore equipment if present
        if (data.equipment && typeof data.equipment === 'object') {
            Object.keys(player.equipment).forEach(k => {
                player.equipment[k] = data.equipment[k] ?? null;
            });
        }
        // restore current map / dungeon if saved
        try {
            if (data.currentMap) currentMap = data.currentMap;
            if (data.currentDungeon) currentDungeon = data.currentDungeon;
        } catch(e) { /* ignore malformed saved location */ }
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

// XP progression: simple formula for XP required to next level
function xpToNextLevel(lvl) {
    // linear growth: 100 * level (level 1 -> 100 XP to next)
    return Math.max(20, 100 * (lvl || 1));
}

function renderXPBar() {
    const el = document.getElementById('xpFill');
    if (!el) return;
    const needed = xpToNextLevel(player.lvl);
    const pct = Math.max(0, Math.min(100, (player.xp / needed) * 100));
    el.style.width = pct + '%';
}

function updateStats() {
    // apply any pending level ups first
    checkLevelUp();
    const neededXP = xpToNextLevel(player.lvl);
    let s = `HP: ${player.hp}/${player.maxHp}\nNiveau: ${player.lvl}  XP: ${player.xp}/${neededXP}xp\nDégâts: ${player.damage}  Défense: ${player.defense}  ESQ: ${player.dodge || 0}%  CRIT: ${player.crit || 0}%\nOr: ${player.gold}`;
    // show current location: dungeon with room progress or current map
    try {
        if (currentDungeon && typeof currentDungeon === 'object') {
            const mapId = currentDungeon.mapId || currentDungeon.map || currentMap || null;
            const dungeonId = currentDungeon.dungeonId || currentDungeon.dungeon || 'unknown';
            const mapCfg = MAPS[mapId] || null;
            const dungeonCfg = mapCfg && Array.isArray(mapCfg.dungeons) ? mapCfg.dungeons.find(d => d.id === dungeonId) : null;
            const totalRooms = (dungeonCfg && dungeonCfg.rooms) ? dungeonCfg.rooms : 0;
            const roomIndex = (typeof currentDungeon.room === 'number') ? currentDungeon.room : 0;
            const displayRoom = totalRooms > 0 ? `${Math.min(roomIndex + 1, totalRooms)}/${totalRooms}` : `${roomIndex + 1}`;
            const dName = dungeonCfg ? dungeonCfg.name : dungeonId;
            s += `\nDonjon: ${dName} — Salle ${displayRoom}`;
        } else if (currentMap) {
            const mName = MAPS[currentMap] ? MAPS[currentMap].name : currentMap;
            s += `\nLieu: ${mName}`;
        }
    } catch (e) { /* ignore UI location errors */ }
    const statsEl = document.getElementById('playerStats');
    if (statsEl) statsEl.textContent = s;
    renderHPBar();
    renderXPBar();
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
            const glow = getGlowStyle(cfg, { type: 'text', size: 8 });
            const dead = e.hp <= 0;
            const name = `<span class="ec-name" style="color:${color};${glow}">${e.name}</span>`;
            const meta = `<span class="ec-meta">${e.tier} — lvl ${e.level}</span>`;
            const hpText = `${Math.max(0, e.hp)}${e.maxHp ? ` / ${e.maxHp}` : ''}`;
            const esq = e.dodge ? `${e.dodge}%` : '—';
            const crit = e.crit ? `${e.crit}%` : '—';
            return `<div class="enemy-card" data-index="${i}" data-dead="${dead}"><div class="ec-head"><div>${name} ${meta}</div><div class="ec-hp">HP: ${hpText}</div></div><div class="ec-stats"><div class="stat ec-dmg">DMG: ${e.damage}</div><div class="stat ec-def">DEF: ${e.defense || 0}</div><div class="stat ec-esq">ESQ: ${esq}</div><div class="stat ec-crit">CRIT: ${crit}</div></div></div>`;
            }).join('');
        el.innerHTML = `<div class="enemy-cards">${html}</div>`;
}

// Render the tier legend into the sidebar
function renderTierLegend() {
    const el = document.getElementById('tierLegend');
    if (!el) return;
    const items = Object.entries(ENEMY_TIERS).map(([k, v]) => {
        const color = v.color || '#fff';
        const glow = getGlowStyle(v, { type: 'box', size: 8 });
        const range = v.levelMin && v.levelMax ? `lvl ${v.levelMin}-${v.levelMax}` : '';
        return `<div class="tier-item"><span class="swatch" style="background:${color};${glow}"></span><span class="tier-name">${k}</span><span class="tier-range">${range}</span></div>`;
    }).join('');
    el.innerHTML = `<h4>Palier ennemis</h4><div class="tier-items">${items}</div>`;
}

// render legend on load
renderTierLegend();

function newEncounter() {
    // spawn enemies
    currentEnemies = [];
    // If we are in a dungeon and rooms were pre-generated, use the stored templates
    if (currentDungeon && Array.isArray(currentDungeon.rooms)) {
        const roomIndex = (typeof currentDungeon.room === 'number') ? currentDungeon.room : 0;
        const templates = currentDungeon.rooms[roomIndex] || [];
        templates.forEach((tpl, i) => {
            const hp = tpl.maxHp || tpl.hp || 20;
            const dmg = tpl.damage || 1;
            const e = new Enemy(tpl.name || `Monstre ${i+1}`, Math.floor(hp), Math.floor(dmg));
            e.maxHp = Math.floor(tpl.maxHp || tpl.hp || hp);
            e.hp = Math.floor(tpl.hp || tpl.maxHp || e.maxHp);
            e.level = tpl.level || 1;
            e.tier = tpl.tier || 'common';
            e.defense = tpl.defense || 0;
            e.originMap = tpl.originMap || currentDungeon.mapId || currentMap;
            currentEnemies.push(e);
            const cfg = ENEMY_TIERS[e.tier] || {};
            const color = cfg.color || '#fff';
            const glow = cfg.glow ? 'text-shadow:0 0 8px rgba(255,215,0,0.9);' : '';
            const nameHtml = `<strong style="color:${color};${glow}">${e.name}</strong>`;
            const tierHtml = `<em style="color:${color}">${e.tier}</em>`;
            const mapLabel = currentMap ? ` — Lieu: ${mapNameHTML(currentMap)}` : '';
            const dungeonLabel = currentDungeon ? ` — Donjon: ${currentDungeon.dungeonId}` : '';
            logHTML(`🐺 ${nameHtml} apparaît ! Niveau ${e.level} — Palier: ${tierHtml}${mapLabel}${dungeonLabel}`);
        });
    } else {
        // spawn 1-3 enemies (map-aware)
        const count = Math.floor(Math.random() * 3) + 1; // 1..3
        for (let i=0;i<count;i++) {
            let e = null;
            // if a map is selected, prefer its unique enemies sometimes
            if (currentMap && MAPS[currentMap]) {
                if (Math.random() < 0.6) {
                    e = createMapEnemy(currentMap, i);
                }
            }
            // fallback to generic tier enemy
            if (!e) {
                const tier = weightedPickEnemyTier();
                e = createEnemyFromTier(tier, i);
            }
            currentEnemies.push(e);
            // styled appearance log using tier color
            const cfg = ENEMY_TIERS[e.tier] || {};
            const color = cfg.color || '#fff';
            const glow = cfg.glow ? 'text-shadow:0 0 8px rgba(255,215,0,0.9);' : '';
            const nameHtml = `<strong style="color:${color};${glow}">${e.name}</strong>`;
            const tierHtml = `<em style="color:${color}">${e.tier}</em>`;
            const mapLabel = currentMap ? ` — Lieu: ${mapNameHTML(currentMap)}` : '';
            const dungeonLabel = currentDungeon ? ` — Donjon: ${currentDungeon.dungeonId}` : '';
            logHTML(`🐺 ${nameHtml} apparaît ! Niveau ${e.level} — Palier: ${tierHtml}${mapLabel}${dungeonLabel}`);
        }
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
    // check for enemy dodge
    const targetDodge = target.dodge || 0;
    if (targetDodge > 0 && Math.random() < (targetDodge/100)) {
        // miss
        showDamageOnEnemy(targetIndex, 'Miss');
        log(`⚠️ ${target.name} esquive votre attaque !`);
        // enemy may still retaliate below
    } else {
        // base damage after defense
        let actualDamage = Math.max(1, player.damage - (target.defense || 0));
        // crit check
        const critChance = player.crit || 0;
        const isCrit = (critChance > 0 && Math.random() < (critChance/100));
        if (isCrit) {
            actualDamage = Math.max(1, Math.round(actualDamage * 1.5));
        }
        target.hp -= actualDamage;
        // visual feedback (mark crit visually)
        const dmgLabel = isCrit ? `${actualDamage} ⚡` : actualDamage;
        showDamageOnEnemy(targetIndex, dmgLabel);
        log(`⚔️ Vous infligez ${actualDamage} dégâts à ${target.name} (def ${target.defense || 0})${isCrit ? ' — COUP CRITIQUE !' : ''}`);

        if (target.hp <= 0) {
            // show kill effect
            showEnemyKill(targetIndex);
            // reward for this kill
            // XP: base roll scaled by enemy level and rarity multiplier
            const baseXp = randInt(6, 16);
            const levelFactor = 1 + (target.level || 1) / 10; // multiplicative factor from enemy level
            const RARITY_XP_MULT = { common: 1, rare: 1.5, epic: 2, legendary: 3, mythic: 6 };
            const tier = target.tier || 'common';
            const rarityMult = RARITY_XP_MULT[tier] || 1;
            const xpGain = Math.max(1, Math.floor(baseXp * levelFactor * rarityMult));
            const goldGain = randInt(4, 14);
            log(`💀 ${target.name} vaincu ! Vous gagnez ${xpGain} XP et ${goldGain} or. (${tier} ×${rarityMult}, lvl ${target.level})`);
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
                // try map-specific loot first (enemy may carry originMap)
                const mapId = target.originMap || currentMap;
                const dropped = (pickMapItemByRarity(mapId, chosenRarity) || pickItemByRarity(chosenRarity) || pickRandomItem());
                if (dropped) {
                    player.inventory.push({ id: dropped.id, name: dropped.name, rarity: dropped.rarity });
                    const rDef = RARITIES[dropped.rarity] || { color: 'white' };
                    const glow = getGlowStyle(rDef, { type: 'text', size: 6 });
                    const style = `color:${rDef.color};${glow}`;
                    const itemHtml = `<span style="${style}">${dropped.name}</span> <em>(${dropped.rarity})</em>`;
                    logHTML(`🎁 ${target.name} lâche : ${itemHtml}`);
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
    }
    if (target.hp <= 0) {
        // show kill effect
        showEnemyKill(targetIndex);
        // reward for this kill
        // XP: base roll scaled by enemy level and rarity multiplier
        const baseXp = randInt(6, 16);
        const levelFactor = 1 + (target.level || 1) / 10; // multiplicative factor from enemy level
        const RARITY_XP_MULT = { common: 1, rare: 1.5, epic: 2, legendary: 3, mythic: 6 };
        const tier = target.tier || 'common';
        const rarityMult = RARITY_XP_MULT[tier] || 1;
        const xpGain = Math.max(1, Math.floor(baseXp * levelFactor * rarityMult));
        const goldGain = randInt(4, 14);
        log(`💀 ${target.name} vaincu ! Vous gagnez ${xpGain} XP et ${goldGain} or. (${tier} ×${rarityMult}, lvl ${target.level})`);
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
            // try map-specific loot first (enemy may carry originMap)
            const mapId = target.originMap || currentMap;
            const dropped = (pickMapItemByRarity(mapId, chosenRarity) || pickItemByRarity(chosenRarity) || pickRandomItem());
            if (dropped) {
                player.inventory.push({ id: dropped.id, name: dropped.name, rarity: dropped.rarity });
                const rDef = RARITIES[dropped.rarity] || { color: 'white' };
                const glow = getGlowStyle(rDef, { type: 'text', size: 6 });
                const style = `color:${rDef.color};${glow}`;
                const itemHtml = `<span style="${style}">${dropped.name}</span> <em>(${dropped.rarity})</em>`;
                logHTML(`🎁 ${target.name} lâche : ${itemHtml}`);
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

    // familiers attack with the player (after player hit, if target still alive)
    if (player.familiarAttack && player.familiarAttack > 0) {
        const famName = player.familiarName || 'Votre familier';
        const famDamage = Math.max(1, Math.floor(player.familiarAttack));
        target.hp -= famDamage;
        showDamageOnEnemy(targetIndex, famDamage);
        log(`🐾 ${famName} inflige ${famDamage} dégâts à ${target.name}.`);
        if (target.hp <= 0) {
            showEnemyKill(targetIndex);
            // reward for this kill (same logic as player kill)
            const baseXp2 = randInt(6, 16);
            const levelFactor2 = 1 + (target.level || 1) / 10;
            const RARITY_XP_MULT2 = { common: 1, rare: 1.5, epic: 2, legendary: 3, mythic: 6 };
            const tier2 = target.tier || 'common';
            const rarityMult2 = RARITY_XP_MULT2[tier2] || 1;
            const xpGain2 = Math.max(1, Math.floor(baseXp2 * levelFactor2 * rarityMult2));
            const goldGain2 = randInt(4, 14);
            log(`💀 ${target.name} vaincu ! Vous gagnez ${xpGain2} XP et ${goldGain2} or. (${tier2} ×${rarityMult2}, lvl ${target.level})`);
            player.xp += xpGain2; player.gold += goldGain2;
            // decide drop by rarity probabilities
            const totalDrop2 = sumObjectValues(RARITY_DROP_RATES);
            if (Math.random() < totalDrop2) {
                const r2 = Math.random() * totalDrop2;
                let acc2 = 0;
                let chosenRarity2 = null;
                for (const [rk2, rv2] of Object.entries(RARITY_DROP_RATES)) {
                    acc2 += rv2;
                    if (r2 <= acc2) { chosenRarity2 = rk2; break; }
                }
                if (!chosenRarity2) chosenRarity2 = 'common';
                const mapId2 = target.originMap || currentMap;
                const dropped2 = (pickMapItemByRarity(mapId2, chosenRarity2) || pickItemByRarity(chosenRarity2) || pickRandomItem());
                if (dropped2) {
                    player.inventory.push({ id: dropped2.id, name: dropped2.name, rarity: dropped2.rarity });
                    log(`🎁 ${target.name} lâche : ${dropped2.name} (${dropped2.rarity})`);
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
    }

    // enemy retaliation: pick a random alive enemy to strike back
    const alive = currentEnemies.filter(e => e.hp > 0);
    if (alive.length > 0) {
        const attacker = alive[Math.floor(Math.random() * alive.length)];
        // enemy attack: consider player's dodge
        const attackerDmgBase = Math.max(0, attacker.damage - player.defense);
        const playerDodge = player.dodge || 0;
        if (playerDodge > 0 && Math.random() < (playerDodge/100)) {
            showDamageOnPlayer('Miss');
            log(`✨ Vous esquivez l'attaque de ${attacker.name} !`);
        } else {
            // enemy crit chance
            const attackerCrit = attacker.crit || 0;
            const isCrit = attackerCrit > 0 && Math.random() < (attackerCrit/100);
            const attackerDmg = isCrit ? Math.max(1, Math.round(attackerDmgBase * 1.5)) : attackerDmgBase;
            player.hp -= attackerDmg;
            showDamageOnPlayer(isCrit ? `${attackerDmg} ⚡` : attackerDmg);
            log(`🛡️ ${attacker.name} riposte et inflige ${attackerDmg} dégâts.${isCrit ? ' — COUP CRITIQUE !' : ''}`);
        }
        if (player.hp <= 0) {
            showPlayerDeath();
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
            const attackerDmgBase = Math.max(0, attacker.damage - player.defense);
            const playerDodge = player.dodge || 0;
            if (playerDodge > 0 && Math.random() < (playerDodge/100)) {
                showDamageOnPlayer('Miss');
                log(`✨ Vous esquivez l'attaque de ${attacker.name} !`);
            } else {
                const attackerCrit = attacker.crit || 0;
                const isCrit = attackerCrit > 0 && Math.random() < (attackerCrit/100);
                const attackerDmg = isCrit ? Math.max(1, Math.round(attackerDmgBase * 1.5)) : attackerDmgBase;
                player.hp -= attackerDmg;
                showDamageOnPlayer(isCrit ? `${attackerDmg} ⚡` : attackerDmg);
                if (player.hp <= 0) {
                    showPlayerDeath();
                    player.hp = player.maxHp;
                    log('☠️ Vous êtes mort. Vous ressuscitez et récupérez vos PV au maximum.');
                    endCombatCleanup('mort');
                    return;
                }
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
    const backdrop = document.getElementById('modalBackdrop');
    const shown = shopEl.style.display && shopEl.style.display !== 'none';
    if (shown) {
        shopEl.style.display = 'none';
        if (backdrop) backdrop.style.display = 'none';
        shopEl.setAttribute('aria-hidden', 'true');
    } else {
        shopEl.style.display = 'block';
        if (backdrop) backdrop.style.display = 'block';
        shopEl.setAttribute('aria-hidden', 'false');
    }
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
    try { showTransactionMessage(`Vente: ${ITEMS[id]?.name ?? id} — ${price}g`, { type: 'sell', anchorId: 'inventory' }); } catch (e) {}
}
window.sellItem = sellItem;

function renderShop() {
    if (!shopEl) return;
    // potion buy at fixed price 20g
    const pR = RARITIES['common'] || { color: '#fff' };
    const pGlow = getGlowStyle(pR);
    const pStyle = `color:${pR.color};${pGlow}`;
    const potionTooltip = getItemTooltipHTML('potion');
    const potionSimpleType = getSimpleType(ITEMS['potion']);
    const potionTypeLabel = potionSimpleType ? ` <span class="item-type">(${potionSimpleType})</span>` : '';
    let html = `<div class="shop-item" data-item-id="potion"><span style="${pStyle}">Potion de soin${potionTypeLabel}</span> ${potionTooltip} — 20g <button data-action="buy" data-id="potion">Acheter</button></div>`;
    // rotating equipments
    const rot = getRotatingShopItems();
    html += `<div style="margin-top:8px;font-weight:700">Équipements en boutique (rotation horaire)</div>`;
    rot.forEach(id => {
        const def = ITEMS[id];
        if (!def) return;
        const r = RARITIES[def.rarity] || { color: '#fff' };
        const glow = getGlowStyle(r);
        const style = `color:${r.color};${glow}`;
        const tooltip = getItemTooltipHTML(id);
        const stats = getItemStatsSummary(def);
        const simpleType = getSimpleType(def);
        const typeLabel = simpleType ? ` <span class="item-type">(${simpleType})</span>` : '';
        html += `<div class="shop-item" data-item-id="${id}"><span style="${style}">${def.name}${typeLabel} ${stats}</span> ${tooltip} — ${def.rarity} — ${def.cost || 'N/A'}g <button data-action="buy" data-id="${id}">Acheter</button></div>`;
    });
    // include a close control for modal behavior
    shopEl.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><strong>Magasin</strong><button id="closeShop" class="btn">Fermer</button></div>${html}`;
    // wire close button
    const close = document.getElementById('closeShop');
    const backdrop = document.getElementById('modalBackdrop');
    if (close) close.addEventListener('click', () => {
        shopEl.style.display = 'none';
        if (backdrop) backdrop.style.display = 'none';
        shopEl.setAttribute('aria-hidden', 'true');
    });
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
            try { showTransactionMessage(`Achat: Potion de soin — ${cost}g`, { type: 'buy', anchorId: 'shop' }); } catch (e) {}
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
        try { showTransactionMessage(`Achat: ${def.name} — ${cost}g`, { type: 'buy', anchorId: 'shop' }); } catch (e) {}
    });
}

function updateInventory() {
    const invEl = document.getElementById('inventory');
    const equipEl = document.getElementById('equipment');
    const equipSlotsEl = equipEl ? equipEl.querySelector('.equipment-slots') : null;
    if (!invEl || !equipEl || !equipSlotsEl) return;

    // render equipment slots into the positioned slots container
    const slotLabels = {
        arme: 'Arme', botte: 'Botte', ceinture: 'Ceinture', amulette: 'Amulette', anneau: 'Anneau', plastron: 'Plastron', chapeau: 'Chapeau', artefact: 'Artefact', familliers: 'Familliers'
    };
    equipSlotsEl.innerHTML = Object.keys(player.equipment).map(slot => {
        const cls = `equip-slot slot-${slot}`;
        const id = player.equipment[slot];
        if (!id) return `<div class="${cls}" data-slot="${slot}" role="button" tabindex="0"><div class="slot-name">${slotLabels[slot]}</div><div class="slot-item muted">vide</div></div>`;
        const def = ITEMS[id] || { name: id, rarity: 'common' };
        const r = RARITIES[def.rarity] || { color: 'white' };
        const glow = getGlowStyle(r);
        const style = `color:${r.color};${glow}`;
        const tooltip = getItemTooltipHTML(id);
        return `<div class="${cls}" data-slot="${slot}" data-item-id="${id}" role="button" tabindex="0"><div class="slot-name">${slotLabels[slot]}</div><div class="slot-item" style="${style}">${def.name}${tooltip}</div><button onclick="unequipSlot('${slot}')">Déséquiper</button></div>`;
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
        const tooltip = getItemTooltipHTML(id);
        return `<div class="inv-item" data-item-id="${id}" style="${style}"><div>${def.name}${tooltip}</div><div>${equipBtn}${useBtn}${sellBtn}</div></div>`;
    }).join('');

    // Attach mobile-friendly handlers: single tap on equip slot unequips (only for touch/mobile sizes)
    (function attachMobileEquipHandlers() {
        try {
            if (!equipSlotsEl) return;
            const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const isMobileSize = window.matchMedia && window.matchMedia('(max-width:899px)').matches;
            if (!isTouch || !isMobileSize) return;
            const slots = equipSlotsEl.querySelectorAll('.equip-slot');
            slots.forEach(el => {
                const slotName = el.dataset.slot;
                if (!slotName) return;
                if (el.dataset.mobileHandled) return; // avoid duplicate handlers
                el.dataset.mobileHandled = '1';
                // ignore taps on inner buttons (keep explicit Déséquiper button as fallback)
                el.addEventListener('click', (ev) => {
                    if (ev.target.closest('button')) return;
                    // direct unequip on tap
                    try { unequipSlot(slotName); } catch (e) { console.warn(e); }
                });
                // keyboard accessibility: Enter/Space also unequip
                el.addEventListener('keydown', (ev) => {
                    if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); try { unequipSlot(slotName); } catch (e) {} }
                });
            });
        } catch (e) { console.warn('attachMobileEquipHandlers error', e); }
    })();
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
        const glow = getGlowStyle(r);
        const style = `color:${r.color};${glow}`;
        const simpleType = getSimpleType(it);
        const typeLabel = simpleType ? ` <span class="item-type">(${simpleType})</span>` : '';
        const stats = getItemStatsSummary(it);
        const extra = it.heal ? `(+${it.heal} HP)` : (it.dmg ? `(DMG ${it.dmg})` : (it.def ? `(DEF ${it.def})` : ''));
        const rate = getItemDropRate(key);
        const pct = (rate * 100).toFixed(3).replace(/\.000$/, '');
        const rateLabel = ` <span class="drop-rate">Taux de drop: ${pct}%</span>`;
        const tooltip = getItemTooltipHTML(key);
        return `<div class="catalog-item" data-item-id="${key}"><strong style="${style}">${it.name} ${stats}</strong> ${typeLabel} — <em>${it.rarity}</em> ${extra}${rateLabel}${tooltip}</div>`;
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
    const backdrop = document.getElementById('modalBackdrop');
    const willShow = typeof show === 'boolean' ? show : (el.style.display === 'none');
    el.style.display = willShow ? 'block' : 'none';
    if (backdrop) backdrop.style.display = willShow ? 'block' : 'none';
    el.setAttribute('aria-hidden', willShow ? 'false' : 'true');
    // reflect state on button (optional)
    btn.classList.toggle('active', willShow);
    if (willShow) renderDroppableCatalog();
}

// hook catalog open button
const catalogBtn = document.getElementById('openCatalogBtn');
if (catalogBtn) catalogBtn.addEventListener('click', () => toggleCatalog());

// --- Bestiary (montres) rendering and modal control ---
function renderBestiary() {
    const el = document.getElementById('bestiary');
    if (!el) return;
    let html = `<div class="bestiary-head"><h3>Bestiaire</h3><button id="closeBestiary" class="btn">Fermer</button></div>`;
    // Per-map pools: include unique enemies and samples from global pools
    for (const [mapId, mapCfg] of Object.entries(MAPS)) {
        html += `<div class="bestiary-map"><h4>${mapCfg.name}</h4><div class="map-desc">${mapCfg.description || ''}</div>`;
        // unique enemies
        if (Array.isArray(mapCfg.uniqueEnemies) && mapCfg.uniqueEnemies.length) {
            html += `<div class="bestiary-unique"><strong>Ennemis uniques</strong>`;
            mapCfg.uniqueEnemies.forEach((ue, idx) => {
                const name = ue.name || `Monstre ${idx+1}`;
                const tier = ue.tier || 'common';
                const hp = ue.baseHp || ue.hp || '—';
                const dmg = ue.damage || ue.dmg || '—';
                const def = ue.defense || ue.def || 0;
                const r = ENEMY_TIERS[tier] || {};
                const glow = getGlowStyle(r, { type: 'text', size: 6 });
                html += `<div class="bestiary-entry"><div class="be-name" style="color:${r.color || '#fff'};${glow}">${name}</div><div class="be-meta">${tier} — HP ${hp} — DMG ${dmg} — DEF ${def}</div></div>`;
            });
            html += `</div>`;
        } else {
            html += `<div class="muted">Aucun monstre unique listé pour cette map.</div>`;
        }
        // pool local: include unique enemies + samples from global pools
        html += `<div class="bestiary-local-pool"><strong>Pool local (exemples)</strong>`;
        // list unique enemies first (if any)
        if (Array.isArray(mapCfg.uniqueEnemies) && mapCfg.uniqueEnemies.length) {
            html += `<div class="bestiary-unique-pool"><em>Ennemis de la map</em>`;
            mapCfg.uniqueEnemies.forEach((ue, ui) => {
                const name = ue.name || `Monstre ${ui+1}`;
                const tier = ue.tier || 'common';
                const hp = ue.baseHp || ue.hp || '—';
                const dmg = ue.damage || ue.dmg || '—';
                const def = ue.defense || ue.def || 0;
                const r = ENEMY_TIERS[tier] || {};
                const glow = getGlowStyle(r, { type: 'text', size: 6 });
                html += `<div class="bestiary-entry"><div class="be-name" style="color:${r.color || '#fff'};${glow}">${name}</div><div class="be-meta">${tier} — HP ${hp} — DMG ${dmg} — DEF ${def}</div></div>`;
            });
            html += `</div>`;
        }
        // then show samples merged from global pools
        for (const [tierKey, cfg] of Object.entries(ENEMY_TIERS)) {
            const names = GLOBAL_ENEMY_POOLS[tierKey] || [];
            if (!names.length) continue;
            const r = cfg || {};
            const glow = getGlowStyle(r, { type: 'text', size: 6 });
            html += `<div class="bestiary-tier"><h5 style="color:${r.color || '#fff'};${glow}">${tierKey.toUpperCase()}</h5>`;
            // show up to 2 examples from this tier
            for (let i = 0; i < Math.min(2, names.length); i++) {
                const sample = createEnemyFromTier(tierKey, i);
                const hp = sample.maxHp || sample.hp || 0;
                const dmg = sample.damage || 0;
                const def = sample.defense || 0;
                html += `<div class="bestiary-entry"><div class="be-name">${sample.name}</div><div class="be-meta">Lvl ${sample.level} — HP ${hp} — DMG ${dmg} — DEF ${def}</div></div>`;
            }
            html += `</div>`;
        }
        html += `</div>`;
        html += `</div>`;
    }
    el.innerHTML = html;
    const close = document.getElementById('closeBestiary');
    if (close) close.addEventListener('click', () => toggleBestiary(false));
}

function toggleBestiary(show) {
    const el = document.getElementById('bestiary');
    const btn = document.getElementById('openBestiaryBtn');
    if (!el || !btn) return;
    const backdrop = document.getElementById('modalBackdrop');
    const willShow = typeof show === 'boolean' ? show : (el.style.display === 'none');
    el.style.display = willShow ? 'block' : 'none';
    if (backdrop) backdrop.style.display = willShow ? 'block' : 'none';
    el.setAttribute('aria-hidden', willShow ? 'false' : 'true');
    btn.classList.toggle('active', willShow);
    if (willShow) renderBestiary();
}

// hook bestiary open button
const bestiaryBtn = document.getElementById('openBestiaryBtn');
if (bestiaryBtn) bestiaryBtn.addEventListener('click', () => toggleBestiary());

// --- Maps UI: render and toggle ---
function renderMaps() {
    const el = document.getElementById('maps');
    if (!el) return;
    let html = `<div class="maps-head"><h3>Maps</h3><button id="closeMaps" class="btn">Fermer</button></div>`;
    for (const [mid, m] of Object.entries(MAPS)) {
        html += `<div class="map-entry"><strong>${m.name}</strong><div class="map-desc">${m.description || ''}</div><div style="margin-top:6px;"><button class="btn" data-action="enter-map" data-id="${mid}">Entrer</button></div>`;
        if (Array.isArray(m.dungeons) && m.dungeons.length) {
            html += `<div class="map-dungeons" style="margin-top:8px"><em>Donjons:</em>`;
            m.dungeons.forEach(d => {
                html += `<div style="margin-top:6px;display:flex;gap:8px;align-items:center"><div style="flex:1">${d.name} — ${d.rooms} salles</div><button class="btn" data-action="enter-dungeon" data-map="${mid}" data-dungeon="${d.id}">Entrer donjon</button></div>`;
            });
            html += `</div>`;
        }
        html += `</div>`;
    }
    el.innerHTML = html;
    const close = document.getElementById('closeMaps');
    if (close) close.addEventListener('click', () => toggleMaps(false));
    // delegation for enter buttons
    el.addEventListener('click', (ev) => {
        const btn = ev.target.closest('button[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;
        if (action === 'enter-map') {
            const id = btn.dataset.id;
            if (id) {
                currentMap = id;
                currentDungeon = null;
                try { logHTML(`🗺️ Vous entrez dans la map: ${mapNameHTML(id)}`); } catch(e) { log(`🗺️ Vous entrez dans la map: ${MAPS[id].name}`); }
                try { applyMapThemeToLog(currentMap); } catch(e){}
                // close maps modal for a clean transition
                try { toggleMaps(false); } catch(e) { try { const m = document.getElementById('maps'); if (m) m.style.display='none'; const b = document.getElementById('modalBackdrop'); if (b) b.style.display='none'; } catch(_) {} }
                try { savePlayer(); } catch(e){}
                newEncounter();
            }
        } else if (action === 'enter-dungeon') {
            const mapId = btn.dataset.map;
            const dungeonId = btn.dataset.dungeon;
            if (mapId && dungeonId) {
                currentMap = mapId;
                // generate deterministic rooms for this dungeon (seeded by mapId|dungeonId)
                const rooms = generateDungeonRooms(mapId, dungeonId);
                currentDungeon = { mapId, dungeonId, room: 0, rooms };
                try { logHTML(`🚪 Vous entrez dans le donjon ${dungeonId} de ${mapNameHTML(mapId)}`); } catch(e) { log(`🚪 Vous entrez dans le donjon ${dungeonId} de ${MAPS[mapId].name}`); }
                // close maps modal and backdrop immediately for a clean transition
                try { toggleMaps(false); } catch(e) { try { const m = document.getElementById('maps'); if (m) { m.style.display='none'; } const b = document.getElementById('modalBackdrop'); if (b) b.style.display='none'; } catch(_) {} }
                try { applyMapThemeToLog(currentMap); } catch(e){}
                try { savePlayer(); } catch(e){}
                newEncounter();
            }
        }
    });
}

function toggleMaps(show) {
    const el = document.getElementById('maps');
    const btn = document.getElementById('openMapsBtn');
    if (!el || !btn) return;
    const backdrop = document.getElementById('modalBackdrop');
    const willShow = typeof show === 'boolean' ? show : (el.style.display === 'none');
    el.style.display = willShow ? 'block' : 'none';
    if (backdrop) backdrop.style.display = willShow ? 'block' : 'none';
    el.setAttribute('aria-hidden', willShow ? 'false' : 'true');
    btn.classList.toggle('active', willShow);
    if (willShow) {
        // set modal index to currentMap if possible
        const keys = Object.keys(MAPS);
        const idx = Math.max(0, keys.indexOf(currentMap));
        window._mapsModalIndex = idx >= 0 ? idx : 0;
        renderMaps();
    }
}

const mapsBtn = document.getElementById('openMapsBtn');
if (mapsBtn) mapsBtn.addEventListener('click', () => toggleMaps());

// clicking backdrop closes any open modal
const modalBackdropEl = document.getElementById('modalBackdrop');
if (modalBackdropEl) {
    modalBackdropEl.addEventListener('click', () => {
        const shop = document.getElementById('shop');
        const catalog = document.getElementById('catalog');
        const bestiary = document.getElementById('bestiary');
        const maps = document.getElementById('maps');
        if (shop) { shop.style.display = 'none'; shop.setAttribute('aria-hidden', 'true'); }
        if (catalog) { catalog.style.display = 'none'; catalog.setAttribute('aria-hidden', 'true'); }
        if (bestiary) { bestiary.style.display = 'none'; bestiary.setAttribute('aria-hidden', 'true'); }
        if (maps) { maps.style.display = 'none'; maps.setAttribute('aria-hidden', 'true'); }
        const inv = document.getElementById('invEquipModal');
        if (inv) { inv.style.display = 'none'; inv.setAttribute('aria-hidden', 'true'); }
        modalBackdropEl.style.display = 'none';
    });
}

// Inventory/Equipment modal open/close wiring
const invModal = document.getElementById('invEquipModal');
const openInvBtn = document.getElementById('openInventoryBtn');
const closeInvBtn = document.getElementById('closeInvEquipModal');
if (openInvBtn && invModal) {
    openInvBtn.addEventListener('click', () => {
        updateInventory();
        invModal.style.display = 'block';
        invModal.setAttribute('aria-hidden', 'false');
        if (modalBackdropEl) modalBackdropEl.style.display = 'block';
    });
}
if (closeInvBtn && invModal) {
    closeInvBtn.addEventListener('click', () => {
        invModal.style.display = 'none';
        invModal.setAttribute('aria-hidden', 'true');
        if (modalBackdropEl) modalBackdropEl.style.display = 'none';
    });
}

// Initialize hover / touch comparison handlers (delayed to ensure DOM elements exist)
setTimeout(() => { try { setupItemCompareHover(); } catch(e) { console.warn('setupItemCompareHover init failed', e); } }, 200);

// Simplify types to the requested set: arme, botte, ceinture, amulette, anneau, plastron, chapeau, artefact
function getSimpleType(def) {
    const t = (def.type || '').toString().toLowerCase();
    // familiers/pets
    if (t === 'familliers' || t.includes('fam') || t.includes('pet') || def.famAttack) return 'familliers';
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

// Auto-apply stats (hp, dodge, crit, etc.) to ITEMS based on simple type and rarity.
function applyAutoStatsToItems() {
    const rarityMult = { common: 1, rare: 1.4, epic: 1.8, legendary: 2.6, mythic: 4 };
    const baseByType = {
        botte: { dodge: 3, hp: 6, dmg: 1 },
        ceinture: { hp: 12, def: 1 },
        arme: { dmg: 6, dodge: 2 },
        anneau: { hp: 6, crit: 2, dodge: 1 },
        plastron: { hp: 18, def: 3 },
        chapeau: { hp: 6, dmg: 1, def: 1 },
        artefact: {}
    };

    Object.keys(ITEMS).forEach(k => {
        const it = ITEMS[k];
        if (!it || typeof it !== 'object') return;
        const t = getSimpleType(it);
        if (t === 'familliers') return; // skip familiars
        const base = baseByType[t] || {};
        const mult = rarityMult[(it.rarity || 'common')] || 1;

        // helper to add numeric stat
        const add = (prop, amount) => {
            if (amount === undefined || amount === 0) return;
            const v = Math.max(0, Math.round(amount * mult));
            if (v === 0) return;
            if (it[prop] === undefined) it[prop] = v; else if (typeof it[prop] === 'number') it[prop] = Math.round(it[prop] + v);
        };

        // apply base stats
        Object.keys(base).forEach(p => add(p, base[p]));

        // Rarity bonus: add small extra stats for higher rarities
        if (it.rarity === 'epic' || it.rarity === 'legendary' || it.rarity === 'mythic') {
            add('hp', Math.round((base.hp || 4) * (it.rarity === 'epic' ? 1.2 : it.rarity === 'legendary' ? 1.8 : 3)));
            if ((base.dodge || 0) > 0) add('dodge', Math.round((base.dodge || 1) * (it.rarity === 'epic' ? 1.2 : it.rarity === 'legendary' ? 1.6 : 2)));
            if ((base.def || 0) > 0) add('def', Math.round((base.def || 1) * (it.rarity === 'epic' ? 1.2 : it.rarity === 'legendary' ? 1.6 : 2)));
            if ((base.dmg || 0) > 0) add('dmg', Math.round((base.dmg || 1) * (it.rarity === 'epic' ? 1.1 : it.rarity === 'legendary' ? 1.5 : 2)));
            // chance for a crit stat on high rarities
            if (!it.crit && (it.rarity === 'legendary' || it.rarity === 'mythic')) add('crit', it.rarity === 'legendary' ? 3 : 6);
        }
    });
}


// Returns tooltip HTML for an item key (used inside .inv-item, .shop-item, .catalog-item)
function getItemTooltipHTML(key, compareHtml) {
    const it = ITEMS[key] || {};
    const parts = [];
    if (it.name) parts.push(`<div class="tt-name">${it.name}</div>`);
    if (it.heal) parts.push(`<div class="tt-row"><div class="label">Soigne</div><div class="value">+${it.heal} HP</div></div>`);
    if (it.dmg) parts.push(`<div class="tt-row"><div class="label">DMG</div><div class="value">${it.dmg}</div></div>`);
    if (it.def) parts.push(`<div class="tt-row"><div class="label">DEF</div><div class="value">${it.def}</div></div>`);
    if (it.dodge) parts.push(`<div class="tt-row"><div class="label">Esquive</div><div class="value">+${it.dodge}%</div></div>`);
    if (it.crit) parts.push(`<div class="tt-row"><div class="label">Crit</div><div class="value">+${it.crit}%</div></div>`);
    if (it.famAttack) parts.push(`<div class="tt-row"><div class="label">Attaque (familier)</div><div class="value">+${it.famAttack}</div></div>`);
    // HP / PV stat (single value or array of values)
    if (it.hp !== undefined) {
        if (Array.isArray(it.hp)) {
            it.hp.forEach(h => parts.push(`<div class="tt-row"><div class="label">PV</div><div class="value">${h >= 0 ? '+'+h : h} PV</div></div>`));
        } else if (typeof it.hp === 'object' && it.hp !== null) {
            // object form: {label: 'Max PV', value: 10}
            const label = it.hp.label || 'PV';
            const value = it.hp.value !== undefined ? it.hp.value : '';
            parts.push(`<div class="tt-row"><div class="label">${label}</div><div class="value">${value >= 0 ? '+'+value : value} PV</div></div>`);
        } else {
            parts.push(`<div class="tt-row"><div class="label">PV</div><div class="value">${it.hp >= 0 ? '+'+it.hp : it.hp} PV</div></div>`);
        }
    }
    // legacy alias 'pv'
    if (it.pv !== undefined) {
        if (Array.isArray(it.pv)) {
            it.pv.forEach(h => parts.push(`<div class="tt-row"><div class="label">PV</div><div class="value">${h >= 0 ? '+'+h : h} PV</div></div>`));
        } else {
            parts.push(`<div class="tt-row"><div class="label">PV</div><div class="value">${it.pv >= 0 ? '+'+it.pv : it.pv} PV</div></div>`);
        }
    }
    // generic stats array: [{label:'...', value:'...'}]
    if (it.stats && Array.isArray(it.stats)) {
        it.stats.forEach(s => {
            if (!s) return;
            const label = s.label || 'Stat';
            const value = s.value !== undefined ? s.value : '';
            parts.push(`<div class="tt-row"><div class="label">${label}</div><div class="value">${value}</div></div>`);
        });
    }
    if (it.cost) parts.push(`<div class="tt-row"><div class="label">Prix</div><div class="value">${it.cost} g</div></div>`);
    if (it.rarity) parts.push(`<div class="tt-row"><div class="label">Rareté</div><div class="value">${it.rarity}</div></div>`);
    if (it.desc) parts.push(`<div class="tt-row"><div class="label">Info</div><div class="value">${it.desc}</div></div>`);
    if (parts.length === 0) return '';
    const base = `<div class="item-tooltip">${parts.join('')}`;
    const cmp = compareHtml ? `<div class="item-compare">${compareHtml}</div>` : '';
    return `${base}${cmp}</div>`;
}

// Return a short inline stats summary for display in lists (catalog/shop/inventory)
function getItemStatsSummary(it) {
    if (!it) return '';
    const parts = [];
    const fmt = (v) => (typeof v === 'number' ? v : v);
    // hp can be array/object/number
    if (it.hp !== undefined) {
        if (Array.isArray(it.hp)) parts.push(`PV ${it.hp.map(fmt).join('/')}`);
        else if (typeof it.hp === 'object' && it.hp !== null) parts.push(`${it.hp.label || 'PV'} ${fmt(it.hp.value)}`);
        else parts.push(`PV ${fmt(it.hp)}`);
    } else if (it.pv !== undefined) {
        if (Array.isArray(it.pv)) parts.push(`PV ${it.pv.map(fmt).join('/')}`); else parts.push(`PV ${fmt(it.pv)}`);
    }
    if (it.dmg !== undefined) parts.push(`DMG ${fmt(it.dmg)}`);
    if (it.def !== undefined) parts.push(`DEF ${fmt(it.def)}`);
    if (it.dodge !== undefined) parts.push(`ESQ ${fmt(it.dodge)}%`);
    if (it.crit !== undefined) parts.push(`CRIT ${fmt(it.crit)}%`);
    if (parts.length === 0) return '';
    return `<span class="item-stats-inline">(${parts.join(' | ')})</span>`;
}

// Compare two items (hovered vs equipped) and return HTML rows showing deltas
function compareItemStats(hoverId) {
    try {
        const hover = ITEMS[hoverId] || null;
        if (!hover) return '';
        const slot = getSimpleType(hover) || 'artefact';
        const equippedId = player.equipment[slot] || null;
        const equip = equippedId ? (ITEMS[equippedId] || null) : null;

        const stats = ['dmg','def','hp','dodge','crit','famAttack'];
        const rows = [];
        rows.push(`<div class="tt-name">Comparatif (${slot})</div>`);
        stats.forEach(s => {
            const hVal = getStatValue(hover, s);
            const eVal = getStatValue(equip, s);
            // normalize names for label
            let label = s.toUpperCase();
            if (s === 'dmg') label = 'DMG';
            if (s === 'def') label = 'DEF';
            if (s === 'hp') label = 'PV';
            if (s === 'dodge') label = 'Esquive';
            if (s === 'crit') label = 'Crit';
            if (s === 'famAttack') label = 'Attaques (fam.)';
            // compute delta
            const delta = (hVal || 0) - (eVal || 0);
            if (hVal === 0 && eVal === 0) return; // skip irrelevant stats
            const cls = delta > 0 ? 'stat-up' : (delta < 0 ? 'stat-down' : '');
            const displayH = formatStatValue(s, hVal);
            const displayDelta = delta === 0 ? '±0' : (delta > 0 ? `+${formatStatValue(s, delta)}` : `${formatStatValue(s, delta)}`);
            rows.push(`<div class="tt-row compare-row"><div class="label">${label}</div><div class="value ${cls}">${displayH} <span class="delta">(${displayDelta})</span></div></div>`);
        });
        return rows.join('');
    } catch (e) { return ''; }
}

function getStatValue(it, stat) {
    if (!it) return 0;
    if (stat === 'hp') {
        if (it.hp !== undefined) {
            if (typeof it.hp === 'number') return it.hp;
            if (Array.isArray(it.hp)) return it.hp[0] || 0;
            if (typeof it.hp === 'object' && it.hp.value !== undefined) return it.hp.value;
        }
        if (it.pv !== undefined) return (typeof it.pv === 'number') ? it.pv : (Array.isArray(it.pv) ? it.pv[0] : 0);
        return 0;
    }
    return (typeof it[stat] === 'number') ? it[stat] : 0;
}

function formatStatValue(stat, v) {
    if (stat === 'dodge' || stat === 'crit') return `${v}%`;
    return `${v}`;
}

// Setup event delegation for hover/touch comparison in shop/catalog/inventory
function setupItemCompareHover() {
    try {
        const attachTo = [];
        const shop = document.getElementById('shop'); if (shop) attachTo.push(shop);
        const catalog = document.getElementById('catalog'); if (catalog) attachTo.push(catalog);
        const inv = document.getElementById('inventory'); if (inv) attachTo.push(inv);
        const equip = document.querySelector('.equipment-slots'); if (equip) attachTo.push(equip);

        attachTo.forEach(container => {
            // mouseover: show comparison in existing tooltip
            container.addEventListener('mouseover', (ev) => {
                const itemEl = ev.target.closest('[data-item-id]');
                if (!itemEl) return;
                const id = itemEl.dataset.itemId;
                if (!id) return;
                const tooltip = itemEl.querySelector('.item-tooltip');
                if (!tooltip) return;
                // only add if not already present
                if (tooltip.querySelector('.item-compare')) return;
                const cmp = compareItemStats(id);
                if (!cmp) return;
                const wrapper = document.createElement('div');
                wrapper.className = 'item-compare';
                wrapper.innerHTML = cmp;
                tooltip.appendChild(wrapper);
            });
            // mouseout: remove comparison block
            container.addEventListener('mouseout', (ev) => {
                const itemEl = ev.target.closest('[data-item-id]');
                if (!itemEl) return;
                const tooltip = itemEl.querySelector('.item-tooltip');
                if (!tooltip) return;
                const cmp = tooltip.querySelector('.item-compare');
                if (cmp) cmp.remove();
            });
            // touch/click: toggle comparison for mobile (useful when tooltips disabled)
            container.addEventListener('click', (ev) => {
                const itemEl = ev.target.closest('[data-item-id]');
                if (!itemEl) return;
                const id = itemEl.dataset.itemId;
                if (!id) return;
                const tooltip = itemEl.querySelector('.item-tooltip');
                if (!tooltip) return;
                const cmp = tooltip.querySelector('.item-compare');
                if (cmp) { cmp.remove(); return; }
                const html = compareItemStats(id);
                if (!html) return;
                const wrapper = document.createElement('div'); wrapper.className='item-compare'; wrapper.innerHTML = html; tooltip.appendChild(wrapper);
            }, { passive: true });
        });
    } catch (e) { console.warn('setupItemCompareHover failed', e); }
}

// load saved player if present (before first save in updateStats)
let _hadSaved = false;
try { _hadSaved = !!localStorage.getItem(STORAGE_KEY); } catch(e) { _hadSaved = false; }
// enrich items with auto stats before UI renders tooltips
try { applyAutoStatsToItems(); } catch(e) { console.warn('applyAutoStatsToItems failed', e); }
loadPlayer();
// recalc derived stats from equipment after loading saved player
try { recalcStatsFromEquipment(); } catch(e) { console.warn('recalcStatsFromEquipment failed', e); }
if (_hadSaved) 
updateStats();

// Ensure player starts in the first map by default
if (!currentMap) {
    currentMap = 'forest_of_dawn';
    try { logHTML(`🗺️ Vous arrivez dans la map: ${mapNameHTML(currentMap)}`); } catch (e) {}
    // spawn initial encounter for the starting map
    try { newEncounter(); } catch (e) {}
}
// apply theme to the log for the starting map
try { applyMapThemeToLog(currentMap); } catch (e) {}

// persist the inferred starting map/dungeon if none existed before
try { savePlayer(); } catch(e) {}

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

    // If we are in a dungeon, handle room progression
    if (currentDungeon) {
        try {
            const mapId = currentDungeon.mapId;
            const dungeonId = currentDungeon.dungeonId;
            const mapCfg = MAPS[mapId];
            const dungeonCfg = mapCfg && Array.isArray(mapCfg.dungeons) ? mapCfg.dungeons.find(d => d.id === dungeonId) : null;
            const totalRooms = (dungeonCfg && dungeonCfg.rooms) ? dungeonCfg.rooms : 0;
            // on victory, advance room index; else (flee/death) abandon the dungeon
            if (reason === 'victoire') {
                currentDungeon.room = (typeof currentDungeon.room === 'number' ? currentDungeon.room : 0) + 1;
                // still more rooms to clear
                if (currentDungeon.room < totalRooms) {
                    logHTML(`🔦 Vous progressez dans le donjon — Salle ${currentDungeon.room + 1} / ${totalRooms}`);
                    try { savePlayer(); } catch (e) {}
                    try { applyMapThemeToLog(mapId); } catch (e) {}
                    // small delay before next room
                    setTimeout(() => { try { newEncounter(); } catch (e) { console.warn(e); } }, 600);
                    return; // skip the usual cleanup reset so the next encounter runs
                }
                // finished the dungeon
                const rooms = Math.max(1, totalRooms || 1);
                const goldReward = 20 * rooms;
                const xpReward = 25 * rooms;
                player.gold += goldReward;
                player.xp += xpReward;
                // give a bonus item from the map pool if available
                let bonusItem = null;
                if (mapCfg && Array.isArray(mapCfg.lootPool) && mapCfg.lootPool.length) {
                    const id = mapCfg.lootPool[Math.floor(Math.random() * mapCfg.lootPool.length)];
                    bonusItem = ITEMS[id] || null;
                    if (bonusItem) player.inventory.push({ id: bonusItem.id, name: bonusItem.name, rarity: bonusItem.rarity });
                }
                logHTML(`🏆 Donjon terminé ! Récompense : ${xpReward} XP, ${goldReward} or${bonusItem ? ` et <strong>${bonusItem.name}</strong>` : ''}.`);
                // clear dungeon state
                currentDungeon = null;
                try { savePlayer(); } catch (e) {}
                try { applyMapThemeToLog(mapId); } catch (e) {}
                // continue cleanup below to reset UI and clear enemies
            } else {
                // failed to progress (fuite/mort) — leave the dungeon
                logHTML(`↩️ Vous quittez le donjon (${reason}).`);
                currentDungeon = null;
                try { savePlayer(); } catch (e) {}
                try { applyMapThemeToLog(currentMap); } catch (e) {}
                // continue cleanup below
            }
        } catch (e) { console.warn('Dungeon progression error', e); }
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

// --- Mobile touch helpers: map big bottom buttons to existing actions ---
function addTouchClick(el, handler) {
    if (!el) return;
    let active = false;
    el.addEventListener('touchstart', (e) => { try{ e.preventDefault(); } catch(e){} active = true; el.classList.add('active'); }, { passive: false });
    el.addEventListener('touchend', (e) => { if (active) { try{ e.preventDefault(); } catch(e){} handler(); } active = false; el.classList.remove('active'); }, { passive: false });
    // fallback/click for desktop and accessibility
    el.addEventListener('click', (e) => { handler(); });
}

addTouchClick(document.getElementById('mobileAttack'), () => { const b = document.getElementById('attackBtn'); if (b) b.click(); });
addTouchClick(document.getElementById('mobileRun'), () => { const b = document.getElementById('runBtn'); if (b) b.click(); });
addTouchClick(document.getElementById('mobileArena'), () => { const b = document.getElementById('goToArena'); if (b) b.click(); });

// --- Combat visual helpers ---
function showDamageOnEnemy(index, amount) {
    try {
        const card = document.querySelector(`.enemy-card[data-index="${index}"]`);
        if (!card) return;
        // add shake
        card.classList.remove('shake');
        // force reflow to restart animation
        void card.offsetWidth;
        card.classList.add('shake');
        const dmgEl = document.createElement('div');
        dmgEl.className = 'damage-float enemy-damage';
        dmgEl.textContent = (typeof amount === 'number') ? `-${amount}` : amount;
        card.appendChild(dmgEl);
        dmgEl.addEventListener('animationend', () => dmgEl.remove());
        setTimeout(() => card.classList.remove('shake'), 500);
    } catch (e) { console.warn('showDamageOnEnemy', e); }
}

function showDamageOnPlayer(amount) {
    try {
        const panel = document.getElementById('playerPanel');
        const hp = document.querySelector('.hp-bar');
        if (hp) {
            hp.classList.remove('player-hit');
            void hp.offsetWidth;
            hp.classList.add('player-hit');
            setTimeout(() => hp.classList.remove('player-hit'), 600);
        }
        if (!panel) return;
        const dmgEl = document.createElement('div');
        dmgEl.className = 'damage-float player-damage';
        dmgEl.style.right = '12px';
        dmgEl.style.top = '12px';
        dmgEl.textContent = (typeof amount === 'number') ? `-${amount}` : amount;
        panel.appendChild(dmgEl);
        dmgEl.addEventListener('animationend', () => dmgEl.remove());
    } catch (e) { console.warn('showDamageOnPlayer', e); }
}

function showEnemyKill(index) {
    try {
        const card = document.querySelector(`.enemy-card[data-index="${index}"]`);
        if (!card) return;
        card.classList.add('enemy-dead');
        const burst = document.createElement('div');
        burst.className = 'kill-burst';
        burst.textContent = '💥';
        card.appendChild(burst);
        burst.addEventListener('animationend', () => burst.remove());
        setTimeout(() => card.classList.remove('enemy-dead'), 700);
    } catch (e) { console.warn('showEnemyKill', e); }
}

function showPlayerDeath() {
    try {
        const panel = document.getElementById('playerPanel');
        if (!panel) return;
        panel.classList.add('player-dead');
        // quick flash
        const hp = document.querySelector('.hp-bar');
        if (hp) { hp.classList.add('player-hit'); setTimeout(() => hp.classList.remove('player-hit'), 900); }
        setTimeout(() => panel.classList.remove('player-dead'), 900);
    } catch (e) { console.warn('showPlayerDeath', e); }
}

// --- Transaction message (purchase / sell) ---
function showTransactionMessage(text, options = {}) {
    try {
        const type = options.type === 'sell' ? 'sell' : 'buy';
        // choose anchor: prefer provided element id or shop panel, fallback to playerPanel
        let anchor = null;
        if (options.anchorId) anchor = document.getElementById(options.anchorId);
        if (!anchor && type === 'buy') anchor = document.getElementById('shop') || document.getElementById('playerPanel');
        if (!anchor) anchor = document.getElementById('playerPanel') || document.body;

        // create float at top-left of anchor
        const rect = anchor.getBoundingClientRect ? anchor.getBoundingClientRect() : { left: 0, top: 0 };
        const el = document.createElement('div');
        el.className = `tx-float ${type}`;
        el.textContent = text;
        // position relative to anchor: absolute within body using anchor coords
        el.style.left = (rect.left + 12) + 'px';
        el.style.top = (rect.top + 8) + 'px';
        document.body.appendChild(el);
        // remove after animation
        el.addEventListener('animationend', () => { try { el.remove(); } catch(e){} });
        // safety cleanup (slightly longer than animation to ensure visibility)
        setTimeout(() => { if (el && el.parentNode) el.remove(); }, 3200);
    } catch (e) { console.warn('showTransactionMessage', e); }
}

// --- Level up visuals ---
function showLevelUp(newLevel) {
    try {
        // badge
        const existing = document.querySelector('.levelup-badge');
        if (existing) existing.remove();
        const badge = document.createElement('div');
        badge.className = 'levelup-badge';
        badge.textContent = `🎉 Niveau ${newLevel} !`;
        document.body.appendChild(badge);
        // force reflow then show
        void badge.offsetWidth;
        badge.classList.add('show');
        // pulse player panel
        const playerPanel = document.getElementById('playerPanel');
        if (playerPanel) {
            playerPanel.classList.add('player-panel-pulse');
            setTimeout(() => playerPanel.classList.remove('player-panel-pulse'), 900);
        }
        // confetti (simple DOM particles)
        const colors = ['#ffd36b','#ff9aa2','#9ee6ff','#c8ffb3','#f4c1ff'];
        const pieces = [];
        for (let i=0;i<10;i++) {
            const p = document.createElement('div');
            p.className = 'confetti-piece';
            p.style.background = colors[i%colors.length];
            p.style.left = (50 + (Math.random()-0.5)*40) + 'vw';
            p.style.top = (10 + Math.random()*6) + 'vh';
            p.style.transform = `rotate(${Math.random()*360}deg)`;
            p.style.opacity = '1';
            document.body.appendChild(p);
            // start animation
            const dur = 800 + Math.floor(Math.random()*600);
            p.style.animation = `confettiFall ${dur}ms cubic-bezier(.2,.7,.2,1) forwards`;
            pieces.push(p);
        }
        // cleanup
        setTimeout(() => { badge.classList.remove('show'); setTimeout(()=>badge.remove(),400); }, 2200);
        setTimeout(() => { pieces.forEach(px=>px.remove()); }, 2000);
    } catch (e) { console.warn('showLevelUp error', e); }
}

