function handleOpenBlindBox (player, { cost, times }, logBattle, callback) {
  if (player.gold < cost) {
    logBattle(`金币不足，需要 ${cost} 金币。`)
    return
  }

  player.gold -= cost
  logBattle(`花费 ${cost} 金币，进行了 ${times} 次盲盒抽取。`)

  const rewards = []
  const results = []
  for (let i = 0; i < times; i++) {
    const rand = Math.random()
    if (cost === 10000) {
      if (rand < 0.01) { // 1% chance for 100000 gold
        const reward = { type: 'gold', amount: 100000, name: '10000 金币' }
        rewards.push(reward)
        results.push(reward)
      } else if (rand < 0.05) { // 4% chance for crafting materials
        const materials = ['灵魂精粹', '敏捷水晶', '狂怒之石', '穿透之眼', '力量之源', '敏捷之风', '体质之岩', '祝福宝石']
        const materialName = materials[Math.floor(Math.random() * materials.length)]
        const reward = { type: 'material', name: materialName, quantity: 1 }
        rewards.push(reward)
        results.push(reward)
      } else if (rand < 0.5) { // 45% chance for small amount of gold
        const amount = Math.floor(Math.random() * 100) + 10
        const reward = { type: 'gold', amount, name: `${amount} 金币` }
        rewards.push(reward)
        results.push(reward)
      } else { // 50% chance for nothing
        const reward = { type: 'nothing', name: '谢谢惠顾' }
        rewards.push(reward)
        results.push(reward)
      }
    } else if (cost === 100000) {
      if (rand < 0.05) { // 5% chance for 100000 gold
        const reward = { type: 'gold', amount: 100000, name: '10000 金币' }
        rewards.push(reward)
        results.push(reward)
      } else if (rand < 0.15) { // 10% chance for crafting materials
        const materials = ['灵魂精粹', '敏捷水晶', '狂怒之石', '穿透之眼', '力量之源', '敏捷之风', '体质之岩', '祝福宝石']
        const materialName = materials[Math.floor(Math.random() * materials.length)]
        const reward = { type: 'material', name: materialName, quantity: 3 }
        rewards.push(reward)
        results.push(reward)
      } else if (rand < 0.55) { // 40% chance for small amount of gold
        const amount = Math.floor(Math.random() * 1000) + 1000
        const reward = { type: 'gold', amount, name: `${amount} 金币` }
        rewards.push(reward)
        results.push(reward)
      } else { // 45% chance for nothing
        const reward = { type: 'nothing', name: '谢谢惠顾' }
        rewards.push(reward)
        results.push(reward)
      }
    }
  }

  rewards.forEach(reward => {
    if (reward.type === 'gold') {
      player.gold += reward.amount
      logBattle(`恭喜你！获得了 ${reward.name}！`)
    } else if (reward.type === 'material') {
      const existingMaterial = player.inventory.find(item => item.name === reward.name)
      if (existingMaterial) {
        existingMaterial.quantity += reward.quantity
      } else {
        player.inventory.push({ name: reward.name, type: 'material', quantity: reward.quantity })
      }
      logBattle(`恭喜你！获得了 ${reward.name} x${reward.quantity}！`)
    } else if (reward.type === 'nothing') {
      logBattle('谢谢惠顾！')
    }
  })

  if (callback) {
    callback(results)
  }
}

export { handleOpenBlindBox }
