import equipmentData from '../data/equipment.json'
import * as skillService from './skillService.js'
import { storageService } from './storageService.js'

/**
 * Initializes a new player object with default attributes and state.
 * @param {object} skillsData - Data for all available skills.
 * @returns {object} The initialized player object.
 */
export function initializePlayer (skillsData) {
  let player = {
    name: '自定义角色',
    level: 1,
    xp: 0,
    xpToNextLevel: 100,
    attributePoints: 0,
    baseStrength: 10,
    baseAgility: 10,
    baseConstitution: 10,
    strength: 10,
    agility: 10,
    constitution: 10,
    hp: 100,
    maxHp: 100,
    attack: 10,
    defense: 5,
    evasion: 0.05,
    critChance: 0.1,
    critResist: 0.05,
    moveSpeed: 3,
    comboChance: 0.05,
    counterChance: 0.03,
    ignoreDefense: 0.0,
    gold: 1000,
    pets: [],
    activePetId: null,
    highestTowerLevel: 1,
    equipment: {
      weapon: null,
      armor: null,
      boots: null,
      ring: null,
      necklace: null
    },
    activeSkillSlots: [null, null, null],
    passiveSkillSlots: [null, null, null],
    skillLevels: {},
    inventory: []
  }

  // Setup Initial Equipment
  const initialEquipment = {
    wood_sword: 'weapon',
    cloth_armor: 'armor',
    old_shoes: 'boots',
    copper_ring: 'ring'
  }

  Object.keys(initialEquipment).forEach(itemId => {
    const itemData = equipmentData.find(e => e.id === itemId)
    if (itemData) {
      const item = {
        ...itemData,
        enhancementLevel: 0,
        baseAttack: itemData.attack || 0,
        baseDefense: itemData.defense || 0,
        baseHp: itemData.hp || 0,
        baseStrength: itemData.strength || 0,
        baseAgility: itemData.agility || 0,
        baseConstitution: itemData.constitution || 0
      }
      const slot = initialEquipment[itemId]
      player.equipment[slot] = item
    }
  })

  // Setup Initial Skills
  player = skillService.initializeSkills(player, skillsData)
  updatePlayerStats(player) // Recalculate all stats
  return player
}

/**
 * Recalculates all derived player stats based on base attributes, equipment, and skills.
 * @param {object} player - The player object.
 * @param {object} activePet - The currently active pet, if any.
 */
export function updatePlayerStats (player, activePet) {
  // Initialize with base character stats
  let str = player.baseStrength
  let agi = player.baseAgility
  let con = player.baseConstitution

  let flatAttack = 0
  let flatDefense = 0
  let flatHp = 0
  let flatEvasion = 0
  let flatCritChance = 0.1
  let flatCritResist = 0.05
  let flatMoveSpeed = 3
  let flatComboChance = 0.05
  let flatCounterChance = 0.03
  let flatIgnoreDefense = 0.0
  let percentAttack = 0
  let percentDefense = 0
  let percentHp = 0

  // Add stats from equipment
  for (const slot in player.equipment) {
    const item = player.equipment[slot]
    if (item) {
      str += item.strength || 0
      agi += item.agility || 0
      con += item.constitution || 0
      flatAttack += item.attack || 0
      flatDefense += item.defense || 0
      flatHp += item.hp || 0
      flatEvasion += item.evasion || 0
      flatCritChance += item.critChance || 0
      flatCritResist += item.critResist || 0
      flatMoveSpeed += item.moveSpeed || 0
      flatComboChance += item.comboChance || 0
      flatCounterChance += item.counterChance || 0
      flatIgnoreDefense += item.ignoreDefense || 0
      percentAttack += item.percentAttack || 0
      percentDefense += item.percentDefense || 0
      percentHp += item.percentHp || 0
    }
  }

  // Add stats from passive skills
  player.passiveSkillSlots.forEach(skill => {
    if (skill) {
      str += skill.strength || 0
      agi += skill.agility || 0
      con += skill.constitution || 0
      flatAttack += skill.attack || 0
      flatDefense += skill.defense || 0
      flatHp += skill.maxHp || 0
      flatEvasion += skill.evasion || 0
      flatCritChance += skill.critChance || 0
      flatCritResist += skill.critResist || 0
      flatMoveSpeed += skill.moveSpeed || 0
      flatComboChance += skill.comboChance || 0
      flatCounterChance += skill.counterChance || 0
      flatIgnoreDefense += skill.ignoreDefense || 0
      if (skill.goldBonus) player.goldBonus = (player.goldBonus || 0) + skill.goldBonus
      if (skill.hpRegen) player.hpRegen = (player.hpRegen || 0) + skill.hpRegen
    }
  })

  // Assign final base attributes
  player.strength = str
  player.agility = agi
  player.constitution = con

  // Calculate derived stats from base attributes
  let totalAttack = player.strength * 2
  let totalMaxHp = player.constitution * 10 + player.strength * 2
  let totalDefense = player.constitution * 1 + player.agility * 0.5

  // Apply percentage bonuses to the base values
  totalAttack *= (1 + percentAttack)
  totalDefense *= (1 + percentDefense)
  totalMaxHp *= (1 + percentHp)

  // Add flat bonuses from all sources
  totalAttack += flatAttack
  totalMaxHp += flatHp
  totalDefense += flatDefense

  const totalEvasion = player.agility * 0.001 + flatEvasion

  // Add bonuses from active pet
  if (activePet) {
    // Assuming pet stats are already updated elsewhere
    if (activePet.id === 'golem') {
      totalDefense += activePet.defense
    }
  }

  // Assign final calculated stats to player
  player.attack = Math.round(totalAttack)
  player.defense = Math.round(totalDefense)
  player.maxHp = Math.round(totalMaxHp)
  player.evasion = totalEvasion
  player.critChance = flatCritChance
  player.critResist = flatCritResist
  player.moveSpeed = flatMoveSpeed
  player.comboChance = flatComboChance
  player.counterChance = flatCounterChance
  player.ignoreDefense = flatIgnoreDefense

  // Ensure current HP is not over max HP
  if (player.hp > player.maxHp) {
    player.hp = player.maxHp
  }
}

/**
 * Assigns an attribute point to a specified attribute.
 * @param {object} player - The player object.
 * @param {string} attribute - The attribute to increment (e.g., 'baseStrength').
 * @param {object} activePet - The currently active pet, if any.
 */
export function assignPoint (player, attribute, activePet) {
  if (player.attributePoints > 0) {
    player.attributePoints--
    player[attribute]++
    updatePlayerStats(player, activePet)
  }
}

/**
 * Checks if the player has enough XP to level up and handles the level-up process.
 * @param {object} player - The player object.
 * @param {function} logCallback - A function to log messages.
 * @param {object} activePet - The currently active pet, if any.
 */
export function checkLevelUp (player, logCallback, activePet) {
  const maxLevel = 500
  let leveledUp = false
  while (player.level < maxLevel && player.xp >= player.xpToNextLevel) {
    leveledUp = true
    player.xp -= player.xpToNextLevel
    player.level++
    player.attributePoints += 3
    logCallback(`恭喜！你升到了 ${player.level} 级！获得了3个属性点！`)

    player.xpToNextLevel = Math.round(100 * Math.pow(1.15, player.level - 1))
  }

  if (leveledUp) {
    updatePlayerStats(player, activePet)
    player.hp = player.maxHp // Restore health on level up
  }

  if (player.level >= maxLevel) {
    player.xp = 0 // Cap XP at max level
  }
}

/**
 * Loads player data from localStorage, applying compatibility fixes for older save files.
 * @param {object} skillsData - Data for all available skills.
 * @returns {object} The loaded player object.
 */
export function loadPlayer (skillsData) {
  const savedData = storageService.getItem('playerData')
  let player
  if (savedData) {
    player = savedData
    // Compatibility for old save files
    if (player.baseStrength === undefined) player.baseStrength = 10
    if (player.baseAgility === undefined) player.baseAgility = 10
    if (player.baseConstitution === undefined) player.baseConstitution = 10
    if (player.xp === undefined) player.xp = 0
    if (player.xpToNextLevel === undefined) player.xpToNextLevel = 100
    if (player.attributePoints === undefined) player.attributePoints = 0
    if (player.pet) { // Old system had a single pet object
      player.pets = [player.pet]
      player.activePetId = player.pet.instanceId || null
      delete player.pet
    }
    if (player.pets === undefined) player.pets = []
    if (player.activePetId === undefined) player.activePetId = null
    if (player.highestTowerLevel === undefined) player.highestTowerLevel = 1
    // Add necklace slot if it doesn't exist in saved data
    if (player.equipment.necklace === undefined) {
      player.equipment.necklace = null
    }
  } else {
    player = initializePlayer(skillsData)
  }
  updatePlayerStats(player)
  return player
}

/**
 * Saves the player data to localStorage.
 * @param {object} player - The player object.
 */
export function savePlayer (player) {
  storageService.setItem('playerData', player)
}
