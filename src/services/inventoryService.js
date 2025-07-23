import * as characterService from './characterService.js'

export function enhanceItem (player, item, location, logBattle, activePet, hideTooltip) {
  if (!item || item.enhancementLevel >= 10) {
    logBattle('该装备已达到最高强化等级。')
    return
  }

  const cost = (item.enhancementLevel + 1) * 200
  if (player.gold < cost) {
    logBattle(`金币不足，需要 ${cost} 金币。`)
    return
  }

  player.gold -= cost
  logBattle(`花费了 ${cost} 金币尝试强化 ${item.name}。`)

  if (item.enhancementLevel >= 5) {
    const materialCost = item.enhancementLevel - 4
    const material = player.inventory.find(i => i.name === '祝福宝石')
    if (!material || material.quantity < materialCost) {
      logBattle(`祝福宝石不足，需要 ${materialCost} 个。`)
      return
    }
    material.quantity -= materialCost
    if (material.quantity === 0) {
      player.inventory.splice(player.inventory.indexOf(material), 1)
    }
    logBattle(`消耗了 ${materialCost} 个祝福宝石。`)
  }

  let success = true
  if (item.enhancementLevel >= 5) {
    const successChance = 1.0 - (item.enhancementLevel - 4) * 0.1 // 90% for +6, 80% for +7, etc.
    if (Math.random() > successChance) {
      success = false
    }
  }

  if (success) {
    // --- Calculate and apply enhancement ---
    const enhancementMultiplier = 0.1 + Math.random() * 0.2 // 10% to 30%
    const attackBonus = Math.round(item.baseAttack * enhancementMultiplier)
    const defenseBonus = Math.round(item.baseDefense * enhancementMultiplier)
    const hpBonus = Math.round(item.baseHp * enhancementMultiplier)
    const strengthBonus = Math.round(item.baseStrength * enhancementMultiplier)
    const agilityBonus = Math.round(item.baseAgility * enhancementMultiplier)
    const constitutionBonus = Math.round(item.baseConstitution * enhancementMultiplier)

    item.attack += attackBonus
    item.defense += defenseBonus
    item.hp += hpBonus
    item.strength = (item.strength || 0) + strengthBonus
    item.agility = (item.agility || 0) + agilityBonus
    item.constitution = (item.constitution || 0) + constitutionBonus
    item.enhancementLevel++

    logBattle(`强化成功！${item.name} 强化至 +${item.enhancementLevel}。`)
    if (attackBonus > 0) logBattle(`攻击力 +${attackBonus}`)
    if (defenseBonus > 0) logBattle(`防御力 +${defenseBonus}`)
    if (hpBonus > 0) logBattle(`生命值 +${hpBonus}`)
    if (strengthBonus > 0) logBattle(`力量 +${strengthBonus}`)
    if (agilityBonus > 0) logBattle(`敏捷 +${agilityBonus}`)
    if (constitutionBonus > 0) logBattle(`体质 +${constitutionBonus}`)

    // --- Re-apply new stats if item is equipped ---
    if (location === 'equipped') {
      characterService.updatePlayerStats(player, activePet)
    }
    // After successful enhancement, if the tooltip is visible for this item, refresh it
    if (hideTooltip) {
      hideTooltip()
    }
  } else {
    logBattle('强化失败...')
  }
}

export function equipItem (player, item, logBattle) {
  if (!item.slot) return

  const index = player.inventory.findIndex(i => i === item)
  if (index === -1) return

  const currentEquipped = player.equipment[item.slot]
  if (currentEquipped) {
    player.inventory.push(currentEquipped)
  }

  player.equipment[item.slot] = item
  player.inventory.splice(index, 1)
  logBattle(`你装备了 ${item.name}。`)
}

export function unequipItem (player, slot, logBattle) {
  const item = player.equipment[slot]
  if (!item) return

  player.inventory.push(item)
  player.equipment[slot] = null
  logBattle(`你卸下了 ${item.name}。`)
}

export function useItem (player, item, index, logBattle) {
  if (item.type !== 'consumable') return

  if (item.heal) {
    player.hp = Math.min(player.maxHp, player.hp + item.heal)
    logBattle(`你使用了 ${item.name}，恢复了 ${item.heal} 点生命值。`)
  }
  player.inventory.splice(index, 1)
}

export function sellItem (player, item, logBattle) {
  const index = player.inventory.findIndex(i => i === item)
  if (index === -1) return

  let sellPrice = 0
  if (item.type === 'equipment' || item.type === 'necklace') {
    sellPrice = (item.level || 1) * 3
  } else if (item.type === 'skill') {
    sellPrice = 20
  } else if (item.type === 'consumable') {
    sellPrice = 5
  }

  if (sellPrice > 0) {
    player.gold += sellPrice
    logBattle(`你出售了 ${item.name}，获得了 ${sellPrice} 金币。`)
    player.inventory.splice(index, 1)
  } else {
    logBattle(`${item.name} 无法出售。`)
  }
}

export function sellAll (player, logBattle) {
  let totalSellPrice = 0
  const itemsToKeep = []
  const itemsToSell = []

  player.inventory.forEach(item => {
    if (item.type === 'equipment' || item.type === 'necklace') {
      itemsToSell.push(item)
    } else {
      itemsToKeep.push(item)
    }
  })

  if (itemsToSell.length > 0) {
    itemsToSell.forEach(item => {
      const sellPrice = (item.level || 1) * 5
      totalSellPrice += sellPrice
    })
    player.inventory = itemsToKeep
    player.gold += totalSellPrice
    logBattle(`一键出售了 ${itemsToSell.length} 件装备，获得了 ${totalSellPrice} 金币。`)
  } else {
    logBattle('背包中没有可出售的装备。')
  }
}

export function forgeItem (player, logBattle, materialsToUse) {
  for (const material in materialsToUse) {
    if (materialsToUse[material] > 10) {
      logBattle('每种材料最多只能使用10个。')
      return false
    }
  }

  const baseCost = 100
  const materialCost = Object.values(materialsToUse).reduce((a, b) => a + b, 0) * 500
  const totalCost = baseCost + materialCost

  if (player.gold < totalCost) {
    logBattle(`金币不足，无法打造。需要 ${totalCost} 金币。`)
    return false
  }

  const materials = [
    { name: '灵魂精粹', count: materialsToUse.soulEssence },
    { name: '敏捷水晶', count: materialsToUse.agilityCrystal },
    { name: '狂怒之石', count: materialsToUse.rageStone },
    { name: '穿透之眼', count: materialsToUse.penetratingEye },
    { name: '力量之源', count: materialsToUse.strengthSource },
    { name: '敏捷之风', count: materialsToUse.agilityWind },
    { name: '体质之岩', count: materialsToUse.constitutionRock }
  ]

  for (const material of materials) {
    const item = player.inventory.find(i => i.name === material.name)
    const itemCount = item ? item.quantity : 0
    if (itemCount < material.count) {
      logBattle(`${material.name}不足。`)
      return false
    }
  }

  player.gold -= totalCost
  for (const material of materials) {
    if (material.count > 0) {
      const item = player.inventory.find(i => i.name === material.name)
      item.quantity -= material.count
      if (item.quantity === 0) {
        player.inventory.splice(player.inventory.indexOf(item), 1)
      }
    }
  }

  const bonusPerMaterial = 0.005
  const totalBonus = 1 + (materialsToUse.soulEssence * bonusPerMaterial)

  const necklace = {
    name: '新手项链',
    slot: 'necklace',
    type: 'necklace',
    level: 1,
    enhancementLevel: 0,
    evasion: 0.01 + materialsToUse.agilityCrystal * 0.001,
    critChance: 0.01 + materialsToUse.rageStone * 0.001,
    critResist: 0.01 + materialsToUse.penetratingEye * 0.001,
    comboChance: 0.01 + materialsToUse.agilityCrystal * 0.001,
    counterChance: 0.01 + materialsToUse.rageStone * 0.001,
    ignoreDefense: 0.01 + materialsToUse.penetratingEye * 0.001,
    percentAttack: 0.05 * totalBonus,
    percentDefense: 0.05 * totalBonus,
    percentHp: 0.05 * totalBonus,
    attack: 0,
    defense: 0,
    hp: 0,
    strength: materialsToUse.strengthSource * 5,
    agility: materialsToUse.agilityWind * 5,
    constitution: materialsToUse.constitutionRock * 5,
    baseAttack: 0,
    baseDefense: 0,
    baseHp: 0,
    baseStrength: 0,
    baseAgility: 0,
    baseConstitution: 0
  }
  player.inventory.push(necklace)
  logBattle(`你花费了 ${totalCost} 金币和 ${materialsToUse.soulEssence} 个灵魂精粹，成功打造了 ${necklace.name}。`)
  return true
}
