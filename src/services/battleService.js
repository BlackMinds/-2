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

  let damageDealt = 0
  let attackType = 'normal'
  let skillUsed = null

  const skillRoll = Math.random()
  if (attacker.skills && attacker.skills.length > 0 && skillRoll < 0.5) {
    skillUsed = attacker.skills[Math.floor(Math.random() * attacker.skills.length)]
    attackType = 'skill'
  } else if (attacker.name === player.name) {
    const skillProbabilities = [0.45, 0.35, 0.25]
    const rand = Math.random()
    let cumulativeProb = 0

    for (let i = 0; i < player.activeSkillSlots.length; i++) {
      const skill = player.activeSkillSlots[i]
      if (skill && skill.type === 'active' && player.hp >= skill.cost) {
        cumulativeProb += skillProbabilities[i]
        if (rand < cumulativeProb) {
          skillUsed = skill
          attackType = 'skill'
          break
        }
      }
    }
  }

  if (attackType === 'skill' && skillUsed) {
    logBattle(battleLog, `${attacker.name} 使用了技能：${skillUsed.name}！`)
    if (attacker.name === player.name) {
      player.hp -= skillUsed.cost
    }

    if (skillUsed.damageMultiplier) {
      const skillAttack = attacker.attack * skillUsed.damageMultiplier
      damageDealt = calculateDamage(skillAttack, defender.defense, attacker.critChance, defender.critResist, attacker.ignoreDefense, battleLog)
      defender.hp -= damageDealt
      logBattle(battleLog, `对 ${defenderName} 造成了 ${damageDealt} 点技能伤害。`)
      if (skillUsed.lifesteal) {
        const lifestealAmount = Math.round(damageDealt * skillUsed.lifesteal)
        attacker.hp = Math.min(attacker.maxHp, attacker.hp + lifestealAmount)
        logBattle(battleLog, `${attacker.name} 汲取了 ${lifestealAmount} 点生命值。`)
      }
    } else if (skillUsed.heal) {
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + skillUsed.heal)
      logBattle(battleLog, `${attacker.name} 恢复了 ${skillUsed.heal} 点生命值。`)
      return
    }
  } else {
    damageDealt = calculateDamage(attacker.attack, defender.defense, attacker.critChance, defender.critResist, attacker.ignoreDefense, battleLog)
    defender.hp -= damageDealt
    logBattle(battleLog, `${attacker.name} 对 ${defenderName} 造成了 ${damageDealt} 点伤害。`)

    if (Math.random() < attacker.comboChance) {
      const comboDamage = calculateDamage(attacker.attack * 0.5, defender.defense, attacker.critChance, defender.critResist, attacker.ignoreDefense, battleLog)
      defender.hp -= comboDamage
      logBattle(battleLog, `${attacker.name} 发动了连击，对 ${defenderName} 额外造成了 ${comboDamage} 点伤害！`)
    }
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

function processTurn (gameContext) {
  const { player, enemies, battleLog, activePet, endBattle, updateState } = gameContext
  if (!gameContext.inBattle || player.hp <= 0 || enemies.every(e => e.hp <= 0)) {
    endBattle(enemies.every(e => e.hp <= 0))
    return
  }

  if (activePet && activePet.hp <= 0) {
    logBattle(battleLog, `你的宠物 ${activePet.name} 被击败了！`)
  }

  if (gameContext.currentTurn === 'player') {
    logBattle(battleLog, '你的回合：')
    const livingEnemies = enemies.filter(e => e.hp > 0)
    if (livingEnemies.length === 0) {
      endBattle(true)
      return
    }
    const targetEnemy = livingEnemies[Math.floor(Math.random() * livingEnemies.length)]

    if (activePet) {
      petService.performPetAction(activePet, player, targetEnemy, (msg) => logBattle(battleLog, msg), calculateDamage, 'player-turn-start')
    }
    performAttack(player, targetEnemy, battleLog, activePet, player)
    if (targetEnemy.hp > 0 && activePet) {
      petService.performPetAction(activePet, player, targetEnemy, (msg) => logBattle(battleLog, msg), calculateDamage, 'player-turn-end')
    }
    if (enemies.every(e => e.hp <= 0)) {
      endBattle(true)
      return
    }
    updateState({ currentTurn: 'enemy' })
    gameContext.turnTimer = setTimeout(() => gameContext.nextTurn(), 1000)
  } else if (gameContext.currentTurn === 'enemy') {
    enemies.forEach(enemy => {
      if (enemy.hp > 0) {
        logBattle(battleLog, `${enemy.name} 的回合：`)
        let target = player
        if (activePet && activePet.hp > 0 && Math.random() < 0.3) {
          target = activePet
          logBattle(battleLog, `${enemy.name} 的目标是你的宠物 ${target.name}！`)
        } else {
          logBattle(battleLog, `${enemy.name} 的目标是你！`)
        }
        performAttack(enemy, target, battleLog, activePet, player)
        // Explicitly update player and activePet state to ensure reactivity
        updateState({ player: player })
        if (activePet) {
          updateState({ activePet: activePet })
        }

        if (player.hp <= 0 || (activePet && activePet.hp <= 0 && target === activePet)) {
          endBattle(false)
        }
      }
    })
    // Filter out defeated enemies
    updateState({ enemies: enemies.filter(e => e.hp > 0) })

    if (player.hp <= 0) return
    updateState({ currentTurn: 'player' })
    gameContext.turnTimer = setTimeout(() => gameContext.nextTurn(), 1000)
  }
  logBattle(battleLog, `你的生命值: ${player.hp}/${player.maxHp}`)
  enemies.forEach(enemy => {
    if (enemy.hp > 0) {
      logBattle(battleLog, `${enemy.name} 的生命值: ${enemy.hp}/${enemy.maxHp}`)
    }
  })
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

export { logBattle, calculateDamage, performAttack, processTurn, getRandomMonster }
