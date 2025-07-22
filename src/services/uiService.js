function getItemStatsHtml (item) {
  if (!item) return '无'
  let statsHtml = `<strong>${item.name} ${item.enhancementLevel > 0 ? '+' + item.enhancementLevel : ''}</strong><br>`
  statsHtml += `类型: 装备 (${item.type})<br>`
  if (item.attack) statsHtml += `攻击力: ${item.attack}<br>`
  if (item.defense) statsHtml += `防御力: ${item.defense}<br>`
  if (item.hp) statsHtml += `生命值: ${item.hp}<br>`
  if (item.strength) statsHtml += `力量: ${item.strength}<br>`
  if (item.agility) statsHtml += `敏捷: ${item.agility}<br>`
  if (item.constitution) statsHtml += `体质: ${item.constitution}<br>`
  if (item.evasion) statsHtml += `闪避率: ${(item.evasion * 100).toFixed(1)}%<br>`
  if (item.critChance) statsHtml += `暴击率: ${(item.critChance * 100).toFixed(1)}%<br>`
  if (item.critResist) statsHtml += `抗暴击率: ${(item.critResist * 100).toFixed(1)}%<br>`
  if (item.moveSpeed) statsHtml += `移动速度: ${item.moveSpeed}<br>`
  if (item.comboChance) statsHtml += `连击几率: ${(item.comboChance * 100).toFixed(1)}%<br>`
  if (item.counterChance) statsHtml += `反击几率: ${(item.counterChance * 100).toFixed(1)}%<br>`
  if (item.ignoreDefense) statsHtml += `忽视防御力: ${(item.ignoreDefense * 100).toFixed(1)}%<br>`
  if (item.percentAttack) statsHtml += `攻击力: +${(item.percentAttack * 100).toFixed(0)}%<br>`
  if (item.percentDefense) statsHtml += `防御力: +${(item.percentDefense * 100).toFixed(0)}%<br>`
  if (item.percentHp) statsHtml += `生命值: +${(item.percentHp * 100).toFixed(0)}%<br>`
  return statsHtml
}

function showTooltip (event, item, player, skillsData) {
  if (!item) return null

  let content = ''
  if (item.slot) { // It's an equipment item
    const equippedItem = player.equipment[item.slot]
    content = '<div class="tooltip-comparison">'
    content += `<div class="tooltip-panel"><h4>当前装备</h4>${getItemStatsHtml(equippedItem)}</div>`
    content += `<div class="tooltip-panel"><h4>选中装备</h4>${getItemStatsHtml(item)}</div>`
    content += '</div>'
  } else { // For other item types
    content = `<strong>${item.name} ${item.enhancementLevel > 0 ? '+' + item.enhancementLevel : ''}</strong><br>`
    if (item.quantity) {
      content += `数量: ${item.quantity}<br>`
    }
    if (item.type === 'active' || item.type === 'passive' || item.skillId) {
      let skillData
      let skillLevelData

      if (item.skillId) { // It's a skill book from inventory
        skillData = skillsData.find(s => s.id === item.skillId)
        if (skillData) {
          const currentLevel = player.skillLevels[item.skillId] || 1
          skillLevelData = skillData.levels[currentLevel - 1]
        }
      } else { // It's an equipped skill
        skillData = item
        skillLevelData = item
      }

      if (skillData && skillLevelData) {
        content += `类型: ${skillData.type === 'active' ? '主动技能' : '被动技能'} (等级 ${skillLevelData.level})<br>`
        if (skillLevelData.description) content += `描述: ${skillLevelData.description}<br>`
        const nextLevelData = skillData.levels[skillLevelData.level]
        if (nextLevelData) {
          content += `<hr>下一级 (L${nextLevelData.level}):<br>${nextLevelData.description}`
        }
      }
    }
  }

  return {
    content,
    visible: true,
    top: event.pageY + 10,
    left: event.pageX + 10
  }
}

function showEnemyTooltip (event, enemy, equipment, skillsData, pets) {
  if (!enemy) return null
  let content = `<strong>${enemy.name}</strong><br>`
  content += `等级: ${enemy.level}<br>`
  content += `生命值: ${enemy.hp}/${enemy.maxHp}<br>`
  content += `攻击力: ${enemy.attack}<br>`
  content += `防御力: ${enemy.defense}<br>`
  if (enemy.skills && enemy.skills.length > 0) {
    content += '<hr><strong>技能:</strong><br>'
    enemy.skills.forEach(skill => {
      content += `${skill.name}<br>`
    })
  }
  if (enemy.drops && enemy.drops.length > 0) {
    content += '<hr><strong>掉落物:</strong><br>'
    enemy.drops.forEach(drop => {
      let itemName = ''
      if (drop.type === 'equipment') {
        const itemData = equipment.find(e => e.id === drop.itemId)
        if (itemData) itemName = itemData.name
      } else if (drop.type === 'skill') {
        const skillData = skillsData.find(s => s.id === drop.skillId)
        if (skillData) itemName = `${skillData.name} 技能书`
      } else if (drop.type === 'pet') {
        const petData = pets.find(p => p.id === drop.petId)
        if (petData) itemName = petData.name
      }
      if (itemName) {
        content += `${itemName} (${((drop.chance || 0) * 100).toFixed(1)}%)<br>`
      }
    })
  }

  return {
    content,
    visible: true,
    top: event.pageY + 10,
    left: event.pageX + 10
  }
}

function hideTooltip () {
  return {
    visible: false,
    content: '',
    top: 0,
    left: 0
  }
}

export { showTooltip, hideTooltip, showEnemyTooltip }
