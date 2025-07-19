export function equipItem (player, item, index, logBattle) {
  if (!item.slot) return

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

export function sellItem (player, item, index, logBattle) {
  let sellPrice = 0
  if (item.slot) { // It's an equipment
    sellPrice = (item.level || 1) * 5
  } else if (item.type === 'skill') { // It's a skill book
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

  player.inventory.forEach(item => {
    if (item.type === 'skill' || item.type === 'consumable') {
      itemsToKeep.push(item)
    } else {
      const sellPrice = (item.level || 1) * 5
      totalSellPrice += sellPrice
    }
  })

  if (totalSellPrice > 0) {
    player.inventory = itemsToKeep
    player.gold += totalSellPrice
    logBattle(`一键出售了所有装备，获得了 ${totalSellPrice} 金币。`)
  } else {
    logBattle('背包中没有可出售的装备。')
  }
}

export function forgeItem (player, logBattle, materialsToUse) {
  const baseCost = 100
  const materialCost = Object.values(materialsToUse).reduce((a, b) => a + b, 0) * 500
  const totalCost = baseCost + materialCost

  if (player.gold < totalCost) {
    logBattle(`金币不足，无法打造。需要 ${totalCost} 金币。`)
    return
  }

  const materials = [
    { name: '灵魂精粹', count: materialsToUse.soulEssence },
    { name: '敏捷水晶', count: materialsToUse.agilityCrystal },
    { name: '狂怒之石', count: materialsToUse.rageStone },
    { name: '穿透之眼', count: materialsToUse.penetratingEye }
  ]

  for (const material of materials) {
    const item = player.inventory.find(i => i.name === material.name)
    const itemCount = item ? item.quantity : 0
    if (itemCount < material.count) {
      logBattle(`${material.name}不足。`)
      return
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
    strength: 0,
    agility: 0,
    constitution: 0,
    baseAttack: 0,
    baseDefense: 0,
    baseHp: 0,
    baseStrength: 0,
    baseAgility: 0,
    baseConstitution: 0
  }
  player.inventory.push(necklace)
  logBattle(`你花费了 ${totalCost} 金币和 ${materialsToUse.soulEssence} 个灵魂精粹，成功打造了 ${necklace.name}。`)
}
