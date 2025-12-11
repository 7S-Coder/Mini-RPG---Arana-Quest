function log(t) {
    document.getElementById("log").textContent += t + "\n";
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
        this.gold = 0;
        this.inventory = [];
    }
}

const player = new Player();

function updateStats() {
    document.getElementById("playerStats").textContent = `
    HP: ${player.hp}/${player.maxHp}
    Niveau: ${player.lvl}
    XP: ${player.xp}
    Dégâts: ${player.damage}
    Défense: ${player.defense}
    Or: ${player.gold}
    `;
}

updateStats();

class Enemy {
    constructor(name, hp, damage) {
        this.name = name;
        this.hp = hp;
        this.damage = damage;
    }
}

let currentEnemy = null;

document.getElementById("goToArena").addEventListener("click", () => {
    currentEnemy = new Enemy("Bouftou", 30, 6);
    log("🐺 Un Bouftou apparaît !");
});

const shopItems = {
    sword: { name: "Épée", dmg: 5, cost: 20 },
    shield: { name: "Bouclier", def: 3, cost: 15 }
};

document.getElementById("openShop").addEventListener("click", () => {
    document.getElementById("shop").style.display = "block";
});

document.querySelectorAll("#shop button").forEach(btn => {
    btn.addEventListener("click", () => {
        const item = shopItems[btn.dataset.item];

        if (player.gold < item.cost) {
            log("❌ Pas assez d'or !");
            return;
        }

        player.gold -= item.cost;

        if (item.dmg) player.damage += item.dmg;
        if (item.def) player.defense += item.def;

        player.inventory.push(item.name);

        log(`🛒 Vous achetez : ${item.name}`);
        updateStats();
    });
});

function updateInventory() {
    document.getElementById("inventory").textContent =
        "Inventaire : " + player.inventory.join(", ");
}

setInterval(updateInventory, 500);
