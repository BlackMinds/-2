import * as petService from './petService.js'

function logBattle (battleLog, message) {
  battleLog.push(message)
  if (battleLog.length > 500) {
    battleLog.shift()
  }
}

function calculateDamage (attackerAttack, defenderDefense, attackerCritChance, defenderCritResist, attackerIgnoreDefense = 0, battleLog) {
  const ignoredDefense = defenderDefense * attackerIgnoreDefense
  const effectiveDefense = Math.max(0, defenderDefense - ignoredDefense)
  const damageReductionPercentage = (effectiveDefense / 20) / 100
  const actualReduction = Math.min(0.75, damageReductionPercentage)
  let damage = attackerAttack * (1 - actualReduction)
  if (damage < 1 && attackerAttack > 0) {
    damage = 1
  }
  const actualCritChance = Math.max(0, attackerCritChance - defenderCritResist)
  if (Math.random() < actualCritChance) {
    damage *= 1.5
    logBattle(battleLog, '暴击！')
  }
  return Math.round(damage)
}

function performAttack (attacker, defender, battleLog, activePet, player) {
  const defenderName = defender.name === player.name ? '你' : defender.name

  if (Math.random() < defender.evasion) {
    logBattle(battleLog, `${attacker.name} 的攻击被 ${defenderName} 闪避了！`)
    return
  }

  const damageDealt = calculateDamage(attacker.attack, defender.defense, attacker.critChance, defender.critResist, attacker.ignoreDefense, battleLog)
  defender.hp -= damageDealt
  logBattle(battleLog, `${attacker.name} 对 ${defenderName} 造成了 ${damageDealt} 点伤害。`)

  if (Math.random() < attacker.comboChance) {
    const comboDamage = calculateDamage(attacker.attack * 0.5, defender.defense, attacker.critChance, defender.critResist, attacker.ignoreDefense, battleLog)
    defender.hp -= comboDamage
    logBattle(battleLog, `${attacker.name} 发动了连击，对 ${defenderName} 额外造成了 ${comboDamage} 点伤害！`)
  }

  if (defender.hp > 0 && attacker.name === player.name && Math.random() < defender.counterChance) {
    const counterDamage = calculateDamage(defender.attack * 0.7, attacker.defense, defender.critChance, attacker.critResist, defender.ignoreDefense, battleLog)
    attacker.hp -= counterDamage
    logBattle(battleLog, `${defender.name} 发动了反击，对你造成了 ${counterDamage} 点伤害！`)
  } else if (defender.hp > 0 && defender.name === player.name && Math.random() < defender.counterChance) {
    const counterDamage = calculateDamage(defender.attack * 0.7, attacker.defense, defender.critChance, attacker.critResist, defender.ignoreDefense, battleLog)
    attacker.hp -= counterDamage
    logBattle(battleLog, `你发动了反击，对 ${attacker.name} 造成了 ${counterDamage} 点伤害！`)
  }
  if (player.hp <= 0) {
    logBattle(battleLog, '你被击败了！')
  }
}

function processPlayerTurn (gameContext) {
  const { player, enemies, battleLog, activePet, endBattle, nextTurn } = gameContext // Removed updateState from destructuring

  logBattle(battleLog, '--- 你的回合开始 ---')
  const livingEnemies = enemies.filter(e => e.hp > 0)
  if (livingEnemies.length === 0) {
    endBattle(true, player, enemies)
    return
  }
  const targetEnemy = livingEnemies[Math.floor(Math.random() * livingEnemies.length)]
  logBattle(battleLog, `你选择攻击 ${targetEnemy.name}。`)

  if (activePet) {
    petService.performPetAction(activePet, player, targetEnemy, (msg) => logBattle(battleLog, msg), calculateDamage, 'player-turn-start')
  }
  performAttack(player, targetEnemy, battleLog, activePet, player)
  if (targetEnemy.hp > 0 && activePet) {
    petService.performPetAction(activePet, player, targetEnemy, (msg) => logBattle(battleLog, msg), calculateDamage, 'player-turn-end')
  }

  // Check if all enemies are defeated after player's action
  if (enemies.every(e => e.hp <= 0)) {
    endBattle(true, player, enemies)
    return
  }

  logBattle(battleLog, `你的生命值: ${player.hp}/${player.maxHp}`)
  enemies.forEach(enemy => {
    if (enemy.hp > 0) {
      logBattle(battleLog, `${enemy.name} 的生命值: ${enemy.hp}/${enemy.maxHp}`)
    }
  })
  logBattle(battleLog, '--- 你的回合结束 ---')
  nextTurn() // Pass control to the next combatant
}

function processEnemyTurn (enemy, gameContext) {
  const { player, enemies, battleLog, activePet, endBattle, nextTurn } = gameContext // Removed updateState from destructuring

  logBattle(battleLog, `--- ${enemy.name} 的行动 ---`)
  let target = player
  if (activePet && activePet.hp > 0 && Math.random() < 0.3) {
    target = activePet
    logBattle(battleLog, `${enemy.name} 的目标是你的宠物 ${target.name}！`)
  } else {
    logBattle(battleLog, `${enemy.name} 的目标是你！`)
  }
  performAttack(enemy, target, battleLog, activePet, player)

  // Explicitly update player and activePet state to ensure reactivity
  gameContext.updateState({ player: player }) // Access directly from gameContext
  if (activePet) {
    gameContext.updateState({ activePet: activePet }) // Access directly from gameContext
  }

  // Check if player was defeated
  if (player.hp <= 0) {
    endBattle(false, player, enemies)
    return
  }

  // Unified HP logs after this enemy has acted
  logBattle(battleLog, `你的生命值: ${player.hp}/${player.maxHp}`)
  if (activePet) {
    logBattle(battleLog, `宠物 ${activePet.name} 的生命值: ${activePet.hp}/${activePet.maxHp}`)
  }
  enemies.forEach(e => { // Use 'e' to avoid conflict with 'enemy' parameter
    if (e.hp > 0) {
      logBattle(battleLog, `${e.name} 的生命值: ${e.hp}/${e.maxHp}`)
    }
  })

  nextTurn() // Pass control to the next combatant
}

function getRandomMonster (monsters, playerLevel) {
  if (!monsters || monsters.length === 0) return null
  const relevantMonsters = monsters.filter(
    (monster) => monster.level >= playerLevel - 2 && monster.level <= playerLevel + 2
  )
  if (relevantMonsters.length === 0) {
    const randomMonster = { ...monsters[Math.floor(Math.random() * monsters.length)] }
    randomMonster.maxHp = randomMonster.hp
    return randomMonster
  }
  const randomIndex = Math.floor(Math.random() * relevantMonsters.length)
  const selectedMonster = { ...relevantMonsters[randomIndex] }
  selectedMonster.maxHp = selectedMonster.hp
  return selectedMonster
}

export { logBattle, calculateDamage, performAttack, processPlayerTurn, processEnemyTurn, getRandomMonster }
