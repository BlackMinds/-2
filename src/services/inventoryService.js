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
