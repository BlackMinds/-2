/**
 * Creates a new pet instance from base data.
 * @param {object} petData - The base data for the pet from pets.json.
 * @returns {object} A new pet instance.
 */
export function createPet (petData) {
  const pet = {
    ...petData,
    id: petData.id, // Ensure the pet's ID is copied
    instanceId: Date.now() + Math.random(), // Unique ID for this instance
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    attributePoints: 0,
    // Ensure base stats are copied correctly
    baseStrength: petData.baseStrength,
    baseAgility: petData.baseAgility,
    baseConstitution: petData.baseConstitution,
    // Derived stats will be calculated by updatePetStats
    strength: 0,
    agility: 0,
    constitution: 0,
    hp: 0,
    maxHp: 0,
    attack: 0,
    defense: 0,
    evasion: 0,
    critChance: 0
  }
  updatePetStats(pet)
  pet.hp = pet.maxHp // Fully heal on creation
  return pet
}

/**
 * Updates a pet's derived stats based on its base attributes and level.
 * @param {object} pet - The pet object to update.
 */
export function updatePetStats (pet) {
  if (!pet) return

  // Recalculate attributes based on base and level
  pet.strength = pet.baseStrength + (pet.level - 1) * 2 // Example growth
  pet.agility = pet.baseAgility + (pet.level - 1) * 2
  pet.constitution = pet.baseConstitution + (pet.level - 1) * 2

  // Recalculate derived stats
  pet.attack = pet.strength * 2
  pet.maxHp = pet.constitution * 10
  pet.defense = pet.constitution * 1
  pet.evasion = pet.agility * 0.001
  pet.critChance = pet.agility * 0.002

  if (pet.hp > pet.maxHp) {
    pet.hp = pet.maxHp
  }
}

/**
 * Assigns an attribute point to a pet.
 * @param {object} pet - The pet to modify.
 * @param {string} attribute - The attribute to increment (e.g., 'baseStrength').
 */
export function assignPetPoint (pet, attribute) {
  if (pet && pet.attributePoints > 0) {
    pet.attributePoints--
    pet[attribute]++
    updatePetStats(pet)
  }
}

/**
 * Checks for pet level up and applies changes.
 * @param {object} pet - The pet to check.
 * @param {function} logCallback - A function to log messages.
 */
export function checkPetLevelUp (pet, logCallback) {
  if (!pet) return

  const maxLevel = 200
  let leveledUp = false
  while (pet.level < maxLevel && pet.xp >= pet.xpToNextLevel) {
    leveledUp = true
    pet.xp -= pet.xpToNextLevel
    pet.level++
    pet.attributePoints += 3
    logCallback(`你的宠物 ${pet.name} 升到了 ${pet.level} 级！获得了3个属性点！`)
    pet.xpToNextLevel = Math.round(100 * Math.pow(1.2, pet.level - 1))
  }

  if (leveledUp) {
    updatePetStats(pet)
    pet.hp = pet.maxHp // Fully heal on level up
  }

  if (pet.level >= maxLevel) {
    pet.xp = 0
  }
}

/**
 * Handles a pet's action during a battle turn based on the phase.
 * @param {object} pet - The active pet.
 * @param {object} player - The player object.
 * @param {object} enemy - The enemy object.
 * @param {function} logCallback - A function to log messages.
 * @param {function} calculateDamage - The damage calculation function.
 * @param {string} turnPhase - The current phase of the turn ('player-turn-start', 'player-turn-end').
 */
export function performPetAction (pet, player, enemy, logCallback, calculateDamage, turnPhase) {
  if (!pet || !enemy || enemy.hp <= 0) return

  switch (pet.id) {
    case 'wolf':
      // Wolf attacks at the end of the player's turn
      if (turnPhase === 'player-turn-end' && enemy.hp > 0) {
        const petDamage = calculateDamage(pet.attack, enemy.defense, pet.critChance, 0, 0)
        enemy.hp -= petDamage
        logCallback(`你的 ${pet.name} 对 ${enemy.name} 造成了 ${petDamage} 点伤害。`)
      }
      break
    case 'fairy':
      // Fairy heals at the start of the player's turn
      if (turnPhase === 'player-turn-start') {
        const petHeal = Math.round(pet.attack)
        player.hp = Math.min(player.maxHp, player.hp + petHeal)
        logCallback(`你的 ${pet.name} 为你恢复了 ${petHeal} 点生命值。`)
      }
      break
    case 'golem':
      // Golem's effect is passive and handled in `updatePlayerStats`, so it does nothing here.
      break
  }
}
