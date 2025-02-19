import { projectiles } from "./projectiles.js";
import { setAlert } from "../../GunQuest.js";

export function showAchievementContent(player) {
  const unlockContainer = document.getElementById(
    "achievement-unlock-container"
  );

  // Combine all achievement arrays into one
  const allAchievements = [
    ...player.killAchievements,
    ...player.itemAchievements,
    ...player.purchaseAchievements,
  ];

  // Clear the existing content in the achievement container
  unlockContainer.innerHTML = "";

  // Loop through each achievement and create the HTML
  allAchievements.forEach((entry) => {
    unlockContainer.innerHTML += `
      <div class="achievement-unlock ${entry.achieved ? "unlocked" : "locked"}">
        ${
          entry.achieved
            ? `<div>${entry.text}</div>
             <div class="achievement-description">${entry.description}</div>`
            : `<div></div><div>???</div><div></div>`
        }
      </div>
    `;
  });
}

export const killAchievements = [
  {
    id: 1,
    count: 0,
    requirement: 25,
    achieved: false,
    text: "Easy pickins",
    perk: "score",
    value: 1000,
    description: "+1000 Points",
  },
  {
    id: 2,
    count: 0,
    requirement: 50,
    achieved: false,
    text: "Unstoppable",
    perk: "maxHealth",
    value: 20,
    description: "+20 Max Health",
  },
  {
    id: 3,
    count: 0,
    requirement: 75,
    achieved: false,
    text: "Not so fast",
    perk: "maxStamina",
    value: 20,
    description: "+20 Max Stamina",
  },
  {
    id: 4,
    count: 0,
    requirement: 150,
    achieved: false,
    text: "Newtons third law",
    perk: "knockbackForce",
    value: 100,
    description: "Increased Knockback Force",
  },
  {
    id: 5,
    count: 0,
    requirement: 300,
    achieved: false,
    text: "Blood thirsty",
    perk: "healthRecoveryRate",
    value: -200,
    description: "Faster Health Recovery",
  },
  {
    id: 6,
    count: 0,
    requirement: 400,
    achieved: false,
    text: "Energizer bunny",
    perk: "staminaDrain",
    value: -1,
    description: "Lower Stamina Drain",
  },
  {
    id: 7,
    count: 0,
    requirement: 500,
    achieved: false,
    text: "Spoils of war",
    perk: "score",
    value: 15000,
    description: "+15000 Points",
  },
  {
    id: 8,
    count: 0,
    requirement: 500,
    achieved: false,
    text: "The stone tower",
    perk: "maxHealth",
    value: 100,
    description: "+100 Max Health",
  },
  {
    id: 9,
    count: 0,
    requirement: 500,
    achieved: false,
    text: "Quick on your feet",
    perk: "maxStamina",
    description: "+100 Max Stamina",
  },
  {
    id: 10,
    count: 0,
    requirement: 500,
    achieved: false,
    text: "Night vision",
    perk: "visibilityRadius",
    value: 200,
    description: "Increased View Distance",
  },
  {
    id: 11,
    count: 0,
    requirement: 500,
    achieved: false,
    text: "Battering ram",
    perk: "knockbackForce",
    value: 400,
    description: "Greatly Increased Knockback Force",
  },
];

export const itemAchievements = [
  {
    name: "Rotten Cherries",
    count: 0,
    requirement: 250,
    achieved: false,
    text: "Cherry picker",
    unlock: { type: "item", value: {} },
    description: "Uh Oh, No Unlock . . .",
  },
  {
    name: "Moldy Corn",
    count: 0,
    requirement: 250,
    achieved: false,
    text: "Moldy corn aquired",
    unlock: {
      // type: "weapon",
      type: "item",
      value: {
        id: 8,
        price: 0,
        type: "melee",
        name: "Corn Cob",
        upgrades: {
          speed: 1,
          damage: 1,
          maxAmmo: 1,
          emitCooldown: 1,
        },
        speed: 100,
        lifespan: 15,
        damage: 5,
        color: "rgb(255, 236, 62)",
        glowColor: "rgb(255,242,123)",
        size: 24,
        emitCooldown: 400,
        remainingAmmo: null,
        defaultMaxAmmo: null,
        maxAmmo: null,
        knockbackForce: 1000,
        visibility: 1.4,
        image: "./assets/images/GunQuest/slingshot.png",
        sound: "./assets/audio/effects/gunshot1.wav",
      },
    },
    description: "Uh Oh, No Unlock . . .",
  },
  {
    name: "Ammo",
    count: 0,
    requirement: 250,
    achieved: false,
    text: "Pack mule",
    unlock: { type: "item", value: {} },
    description: "Uh Oh, No Unlock . . .",
  },
  {
    name: "Points",
    count: 0,
    requirement: 250,
    achieved: false,
    text: "Deep pockets",
    unlock: { type: "item", value: {} },
    description: "Uh Oh, No Unlock . . .",
  },
  {
    name: "Lantern",
    count: 0,
    requirement: 250,
    achieved: false,
    text: "Who left the lights on?",
    unlock: { type: "item", value: {} },
    description: "Uh Oh, No Unlock . . .",
  },
];

export const purchaseAchievements = [
  {
    count: 1,
    requirement: projectiles.length,
    achieved: false,
    text: "Weapon Master",
    perk: "score",
    value: 20000,
    description: "+20000 points",
  },
];

export function checkForAchievements(player) {
  // Check for kill achievements
  const killAchievement = player.killAchievements.find(
    (kill) => kill.count >= kill.requirement && !kill.achieved
  );

  // Check for item achievements
  const itemAchievement = player.itemAchievements.find(
    (item) => item.count >= item.requirement && !item.achieved
  );

  const purchaseAchievement = player.purchaseAchievements.find(
    (purchase) => purchase.count >= purchase.requirement && !purchase.achieved
  );

  if (!killAchievement && !itemAchievement && !purchaseAchievement) return;

  if (killAchievement) {
    killAchievement.achieved = true;
    player[killAchievement.perk] += killAchievement.value;
    setAlert(
      {
        text: `Achievement Unlocked: ${killAchievement.text}!`,
        font: "14px 'Press Start 2P'",
        color: "yellow",
      },
      player
    );
  }

  if (purchaseAchievement) {
    purchaseAchievement.achieved = true;
    player[purchaseAchievement.perk] += purchaseAchievement.value;
    setAlert(
      {
        text: `Achievement Unlocked: ${purchaseAchievement.text}!`,
        font: "14px 'Press Start 2P'",
        color: "yellow",
      },
      player
    );
  }

  if (itemAchievement) {
    itemAchievement.achieved = true;
    console.log("deal with this", itemAchievement);
    if (itemAchievement.unlock.type === "weapon") {
      player.acquiredProjectiles = [
        ...player.acquiredProjectiles,
        itemAchievement.unlock.value,
      ];
    }
    // itemAchievement.achieved = true;
    // player[itemAchievement.perk] += itemAchievement.value;
    setAlert(
      {
        text: `Achievement unlocked: ${itemAchievement.text}!`,
        font: "22px monospace",
        color: "yellow",
      },
      player
    );
  }
}
