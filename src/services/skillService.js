export function initializeSkills (player, skillsData) {
  const initialActiveSkills = []
  const initialPassiveSkills = []

  initialActiveSkills.forEach((skillId, index) => {
    const skillData = skillsData.find(s => s.id === skillId)
    if (skillData) {
      const skill = { ...skillData, ...skillData.levels[0] } // Level 1
      player.activeSkillSlots[index] = skill
    }
  })

  initialPassiveSkills.forEach((skillId, index) => {
    const skillData = skillsData.find(s => s.id === skillId)
    if (skillData) {
      const skill = { ...skillData, ...skillData.levels[0] } // Level 1
      player.passiveSkillSlots[index] = skill
    }
  })
  return player
}

export function getSkillType (skillItem, skillsData) {
  if (!skillItem || skillItem.type !== 'skill') return null
  const skillData = skillsData.find(s => s.id === skillItem.skillId)
  return skillData ? skillData.type : null
}

export function upgradeSkill (player, skill, slotIndex, slotType, skillsData, logBattle, saveGame) {
  if (!skill) return

  const skillBaseData = skillsData.find(s => s.id === skill.id)
  if (!skillBaseData) {
    logBattle('错误：找不到技能基础数据。')
    return
  }

  const currentLevel = player.skillLevels[skill.id] || 1
  if (currentLevel >= skillBaseData.levels.length) {
    logBattle(`${skill.name} 已达到最高等级。`)
    return
  }

  const nextLevelData = skillBaseData.levels[currentLevel]
  const cost = nextLevelData.cost
  if (player.gold < cost) {
    logBattle(`金币不足，需要 ${cost} 金币升级。`)
    return
  }

  player.gold -= cost
  logBattle(`花费了 ${cost} 金币尝试升级 ${skill.name}。`)

  const failureRates = { 1: 0.1, 2: 0.3, 3: 0.6, 4: 0.9 }
  const failureChance = failureRates[currentLevel] || 0
  if (Math.random() < failureChance) {
    logBattle('技能升级失败...')
    saveGame()
    return
  }

  logBattle(`恭喜！${skill.name} 升级至 ${nextLevelData.level} 级！`)

  const newSkill = { ...skillBaseData, ...nextLevelData }
  player.skillLevels[skill.id] = newSkill.level

  if (slotType === 'active') {
    player.activeSkillSlots.splice(slotIndex, 1, newSkill)
  } else {
    player.passiveSkillSlots.splice(slotIndex, 1, newSkill)
  }
  saveGame()
}

export function equipSkill (player, skillItem, slotIndex, slotType, skillsData, logBattle) {
  const skillBaseData = skillsData.find(s => s.id === skillItem.skillId)
  if (!skillBaseData) return

  if (skillBaseData.type !== slotType) {
    logBattle(`不能将 ${skillBaseData.type === 'active' ? '主动' : '被动'} 技能装备到 ${slotType === 'active' ? '主动' : '被动'} 槽位。`)
    return
  }

  const currentLevel = player.skillLevels[skillItem.skillId] || 1
  const skill = { ...skillBaseData, ...skillBaseData.levels[currentLevel - 1] }

  let targetSlots = null
  let slotName = ''
  if (slotType === 'active') {
    targetSlots = player.activeSkillSlots
    slotName = '主动技能槽位'
  } else if (slotType === 'passive') {
    targetSlots = player.passiveSkillSlots
    slotName = '被动技能槽位'
  } else {
    return
  }

  if (targetSlots[slotIndex] !== null) {
    logBattle(`${slotName} ${slotIndex + 1} 已经有技能了，请先卸下。`)
    return
  }

  targetSlots.splice(slotIndex, 1, skill)
  player.inventory.splice(player.inventory.indexOf(skillItem), 1)
  logBattle(`你将 ${skill.name} (等级 ${currentLevel}) 装备到了 ${slotName} ${slotIndex + 1}。`)
}

export function unequipSkill (player, skill, slotIndex, slotType, logBattle) {
  let targetSlots = null
  let slotName = ''
  if (slotType === 'active') {
    targetSlots = player.activeSkillSlots
    slotName = '主动技能槽位'
  } else if (slotType === 'passive') {
    targetSlots = player.passiveSkillSlots
    slotName = '被动技能槽位'
  } else {
    return
  }

  if (targetSlots[slotIndex] === null) return

  player.inventory.push({ name: `${skill.name} 技能书`, type: 'skill', skillId: skill.id })
  targetSlots.splice(slotIndex, 1, null)
  logBattle(`你从 ${slotName} ${slotIndex + 1} 卸下了 ${skill.name}。`)
}
