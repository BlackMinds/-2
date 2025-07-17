<template>
  <div id="game-container">
    <div class="left-panel">
      <div class="section character-attributes">
        <h2>角色属性界面 (Character Attributes)</h2>
        <p>姓名: {{ player.name }}</p>
        <p>生命值: {{ player.hp }}/{{ player.maxHp }}</p>
        <p>攻击力: {{ player.attack }}</p>
        <p>防御力: {{ player.defense }}</p>
        <p>暴击率: {{ (player.critChance * 100).toFixed(1) }}%</p>
        <p>抗暴击率: {{ (player.critResist * 100).toFixed(1) }}%</p>
        <p>移动速度: {{ player.moveSpeed }}</p>
        <p>连击几率: {{ (player.comboChance * 100).toFixed(1) }}%</p>
        <p>反击几率: {{ (player.counterChance * 100).toFixed(1) }}%</p>
        <p>忽视防御力: {{ (player.ignoreDefense * 100).toFixed(1) }}%</p>
        <p>金币: {{ player.gold }}</p>
      </div>
      <div class="section equipment-interface">
        <h2>装备界面 (Equipment)</h2>
        <ul>
          <li v-for="(item, slot) in player.equipment" :key="slot" @mouseover="showTooltip($event, item)" @mouseout="hideTooltip">
            {{ slot }}: {{ item ? `${item.name} ${item.enhancementLevel > 0 ? '+' + item.enhancementLevel : ''}` : '无' }}
            <button v-if="item" @click="enhanceItem(item, 'equipped', slot)">强化</button>
            <button v-if="item" @click="unequipItem(slot)">卸下</button>
          </li>
        </ul>
      </div>
      <div class="section skill-interface">
        <h2>技能界面 (Skills)</h2>
        <h3>主动技能槽位 (Active Skills)</h3>
        <ul>
          <li v-for="(skill, index) in player.activeSkillSlots" :key="'active-' + index" @mouseover="showTooltip($event, skill)" @mouseout="hideTooltip">
            槽位 {{ index + 1 }}: {{ skill ? skill.description : '空' }}
            <button v-if="skill" @click="unequipSkill(skill, index, 'active')">卸下</button>
          </li>
        </ul>
        <h3>被动技能槽位 (Passive Skills)</h3>
        <ul>
          <li v-for="(skill, index) in player.passiveSkillSlots" :key="'passive-' + index" @mouseover="showTooltip($event, skill)" @mouseout="hideTooltip">
            槽位 {{ index + 1 }}: {{ skill ? skill.description : '空' }}
            <button v-if="skill" @click="unequipSkill(skill, index, 'passive')">卸下</button>
          </li>
        </ul>
      </div>
    </div>
    <div class="right-panel">
      <div class="section text-battle-interface">
        <h2>文字战斗界面 (Text Battle)</h2>
        <div class="battle-controls">
          <label for="monster-level-select">选择怪物等级:</label>
          <select id="monster-level-select" v-model="selectedMonsterLevel" :disabled="inBattle">
            <option v-for="level in availableMonsterLevels" :key="level" :value="level">
              等级 {{ level }}
            </option>
          </select>
          <button @click="startBattle" :disabled="inBattle">开始战斗</button>
          <button @click="fleeBattle" :disabled="!inBattle">逃跑</button>
        </div>
        <div class="battle-log">
          <p v-for="(log, index) in battleLog" :key="index">{{ log }}</p>
        </div>
      </div>
      <div class="section backpack-interface">
        <h2>背包界面 (Backpack)</h2>
        <ul>
          <li v-for="(item, index) in player.inventory" :key="index" @mouseover="showTooltip($event, item)" @mouseout="hideTooltip">
            {{ item.name }} {{ item.enhancementLevel > 0 ? '+' + item.enhancementLevel : '' }} ({{ item.type }})
            <button v-if="item.slot" @click="enhanceItem(item, 'inventory', index)">强化</button>
            <button v-if="item.slot" @click="equipItem(item, index)">装备</button>
            <button v-if="item.type === 'consumable'" @click="useItem(item, index)">使用</button>
            <span v-if="item.type === 'skill'">
              <span v-if="getSkillType(item) === 'active'">
                <button @click="equipSkill(item, 0, 'active')">装备主动1</button>
                <button @click="equipSkill(item, 1, 'active')">装备主动2</button>
                <button @click="equipSkill(item, 2, 'active')">装备主动3</button>
              </span>
              <span v-if="getSkillType(item) === 'passive'">
                <button @click="equipSkill(item, 0, 'passive')">装备被动1</button>
                <button @click="equipSkill(item, 1, 'passive')">装备被动2</button>
                <button @click="equipSkill(item, 2, 'passive')">装备被动3</button>
              </span>
            </span>
            <button @click="sellItem(item, index)">出售</button>
          </li>
        </ul>
      </div>
    </div>

    <div v-if="tooltip.visible" class="tooltip" :style="{ top: tooltip.top + 'px', left: tooltip.left + 'px' }" v-html="tooltip.content"></div>
  </div>

</template>

<script>
import monstersData from '../data/monsters.json'
import equipmentData from '../data/equipment.json'
import skillsData from '../data/skills.json'

export default {
  name: 'TextGame',
  data () {
    return {
      player: {
        name: '英雄',
        level: 1,
        hp: 100,
        maxHp: 100,
        attack: 10,
        defense: 5,
        critChance: 0.1,
        critResist: 0.05,
        moveSpeed: 3,
        comboChance: 0.05,
        counterChance: 0.03,
        ignoreDefense: 0.0,
        gold: 1000000000000,
        equipment: {
          weapon: null,
          armor: null,
          boots: null,
          ring: null
        },
        activeSkillSlots: [null, null, null], // 3 active skill slots
        passiveSkillSlots: [null, null, null], // 3 passive skill slots
        skillLevels: { // Track current level of each skill
          strike: 1,
          heal: 1,
          fireball: 1,
          iceshard: 1,
          thunderbolt: 1,
          poisoncloud: 1,
          shieldbash: 1,
          lifedrain: 1,
          stunstrike: 1,
          cleave: 1,
          berserk: 1,
          toughskin: 1,
          critmastery: 1,
          evasion: 1,
          goldfinder: 1,
          regen: 1,
          toughness: 1,
          counterattack: 1,
          comboattack: 1,
          defignore: 1
        },
        inventory: [
        ]
      },
      enemy: null,
      inBattle: false,
      battleLog: [],
      monsters: monstersData,
      equipment: equipmentData,
      skillsData: skillsData, // All skills data from JSON
      selectedMonsterLevel: 1, // Default selected level
      currentTurn: null, // 'player' or 'enemy'
      battleEndTimer: null,
      tooltip: {
        visible: false,
        content: '',
        top: 0,
        left: 0
      }
    }
  },
  created () {
    this.loadGame()
  },
  computed: {
    availableMonsterLevels () {
      const levels = new Set()
      this.monsters.forEach(monster => levels.add(monster.level))
      return Array.from(levels).sort((a, b) => a - b)
    }
  },
  methods: {
    saveGame () {
      localStorage.setItem('playerData', JSON.stringify(this.player))
      this.logBattle('游戏进度已保存。')
    },
    loadGame () {
      const savedData = localStorage.getItem('playerData')
      if (savedData) {
        this.player = JSON.parse(savedData)
        this.logBattle('游戏进度已加载。')
      } else {
        this.initializePlayerState()
      }
    },
    initializePlayerState () {
      // --- Setup Initial Equipment ---
      const initialEquipment = {
        wood_sword: 'weapon',
        cloth_armor: 'armor',
        old_shoes: 'boots',
        copper_ring: 'ring'
      }

      Object.keys(initialEquipment).forEach(itemId => {
        const itemData = this.equipment.find(e => e.id === itemId)
        if (itemData) {
          const item = {
            ...itemData,
            enhancementLevel: 0,
            baseAttack: itemData.attack || 0,
            baseDefense: itemData.defense || 0,
            baseHp: itemData.hp || 0
          }
          const slot = initialEquipment[itemId]
          this.player.equipment[slot] = item

          // Apply stats
          this.player.attack += item.attack || 0
          this.player.defense += item.defense || 0
          this.player.maxHp += item.hp || 0
          this.player.critChance += item.critChance || 0
          this.player.critResist += item.critResist || 0
          this.player.moveSpeed += item.moveSpeed || 0
          this.player.comboChance += item.comboChance || 0
          this.player.counterChance += item.counterChance || 0
          this.player.ignoreDefense += item.ignoreDefense || 0
        }
      })
      this.player.hp = this.player.maxHp // Set HP to new max HP

      // --- Setup Initial Skills ---
      const initialActiveSkills = ['strike', 'heal', 'fireball']
      const initialPassiveSkills = ['berserk', 'toughskin', 'critmastery']

      initialActiveSkills.forEach((skillId, index) => {
        const skillData = this.skillsData.find(s => s.id === skillId)
        if (skillData) {
          const skill = { ...skillData, ...skillData.levels[0] } // Level 1
          this.player.activeSkillSlots[index] = skill
        }
      })

      initialPassiveSkills.forEach((skillId, index) => {
        const skillData = this.skillsData.find(s => s.id === skillId)
        if (skillData) {
          const skill = { ...skillData, ...skillData.levels[0] } // Level 1
          this.player.passiveSkillSlots[index] = skill
          this.applyPassiveSkillEffects(skill) // Apply stats for passive skills
        }
      })
    },
    showTooltip (event, item) {
      if (!item) return
      let content = `<strong>${item.name} ${item.enhancementLevel > 0 ? '+' + item.enhancementLevel : ''}</strong><br>`

      // Check if it's an equipment item (they have a 'slot' property)
      if (item.slot) {
        content += `类型: 装备 (${item.type})<br>`
        if (item.baseAttack) content += `攻击力: ${item.baseAttack} (${item.attack})<br>`
        else if (item.attack) content += `攻击力: ${item.attack}<br>`
        if (item.baseDefense) content += `防御力: ${item.baseDefense} (${item.defense})<br>`
        else if (item.defense) content += `防御力: ${item.defense}<br>`
        if (item.baseHp) content += `生命值: ${item.baseHp} (${item.hp})<br>`
        else if (item.hp) content += `生命值: ${item.hp}<br>`
        if (item.critChance) content += `暴击率: ${(item.critChance * 100).toFixed(1)}%<br>`
        if (item.critResist) content += `抗暴击率: ${(item.critResist * 100).toFixed(1)}%<br>`
        if (item.moveSpeed) content += `移动速度: ${item.moveSpeed}<br>`
        if (item.comboChance) content += `连击几率: ${(item.comboChance * 100).toFixed(1)}%<br>`
        if (item.counterChance) content += `反击几率: ${(item.counterChance * 100).toFixed(1)}%<br>`
        if (item.ignoreDefense) content += `忽视防御力: ${(item.ignoreDefense * 100).toFixed(1)}%<br>`
      } else if (item.type === 'active' || item.type === 'passive' || item.skillId) {
        let skillData
        let skillLevelData

        if (item.skillId) { // It's a skill book from inventory
          skillData = this.skillsData.find(s => s.id === item.skillId)
          if (skillData) {
            skillLevelData = skillData.levels[0] // Get level 1 data for description
          }
        } else { // It's an equipped skill
          skillData = item
          skillLevelData = item
        }

        if (skillData && skillLevelData) {
          content += `类型: ${skillData.type === 'active' ? '主动技能' : '被动技能'}<br>`
          if (skillLevelData.description) content += `描述: ${skillLevelData.description}<br>`
        }
      }

      this.tooltip.content = content
      this.tooltip.visible = true
      this.tooltip.top = event.pageY + 10
      this.tooltip.left = event.pageX + 10
    },
    hideTooltip () {
      this.tooltip.visible = false
    },
    enhanceItem (item, location, identifier) {
      if (!item || item.enhancementLevel >= 10) {
        this.logBattle('该装备已达到最高强化等级。')
        return
      }

      const cost = (item.enhancementLevel + 1) * 100
      if (this.player.gold < cost) {
        this.logBattle(`金币不足，需要 ${cost} 金币。`)
        return
      }

      this.player.gold -= cost
      this.logBattle(`花费了 ${cost} 金币尝试强化 ${item.name}。`)

      let success = true
      if (item.enhancementLevel >= 5) {
        const successChance = 1.0 - (item.enhancementLevel - 4) * 0.1 // 90% for +6, 80% for +7, etc.
        if (Math.random() > successChance) {
          success = false
        }
      }

      if (success) {
        // --- Remove old stats if item is equipped ---
        if (location === 'equipped') {
          this.player.attack -= item.attack || 0
          this.player.defense -= item.defense || 0
          this.player.maxHp -= item.hp || 0
        }

        // --- Calculate and apply enhancement ---
        const enhancementMultiplier = 0.1 + Math.random() * 0.2 // 10% to 30%
        const attackBonus = Math.round(item.baseAttack * enhancementMultiplier)
        const defenseBonus = Math.round(item.baseDefense * enhancementMultiplier)
        const hpBonus = Math.round(item.baseHp * enhancementMultiplier)

        item.attack += attackBonus
        item.defense += defenseBonus
        item.hp += hpBonus
        item.enhancementLevel++

        this.logBattle(`强化成功！${item.name} 强化至 +${item.enhancementLevel}。`)
        if (attackBonus > 0) this.logBattle(`攻击力 +${attackBonus}`)
        if (defenseBonus > 0) this.logBattle(`防御力 +${defenseBonus}`)
        if (hpBonus > 0) this.logBattle(`生命值 +${hpBonus}`)

        // --- Re-apply new stats if item is equipped ---
        if (location === 'equipped') {
          this.player.attack += item.attack || 0
          this.player.defense += item.defense || 0
          this.player.maxHp += item.hp || 0
          this.player.hp = Math.min(this.player.hp, this.player.maxHp)
        }
        // After successful enhancement, if the tooltip is visible for this item, refresh it
        if (this.tooltip.visible) {
          // We need a way to check if the tooltip is for the item being enhanced.
          // A simple approach is to just hide it, forcing the user to mouseover again.
          // A better approach would require passing the event to showTooltip, which we don't have here.
          this.hideTooltip()
        }
      } else {
        this.logBattle('强化失败...')
      }
      this.saveGame() // Save progress on victory
    },
    getSkillType (skillItem) {
      if (!skillItem || skillItem.type !== 'skill') return null
      const skillData = this.skillsData.find(s => s.id === skillItem.skillId)
      return skillData ? skillData.type : null
    },
    sellItem (item, index) {
      let sellPrice = 0
      if (item.slot) { // It's an equipment
        sellPrice = (item.level || 1) * 5
      } else if (item.type === 'skill') { // It's a skill book
        sellPrice = 20
      } else if (item.type === 'consumable') {
        sellPrice = 5
      }

      if (sellPrice > 0) {
        this.player.gold += sellPrice
        this.logBattle(`你出售了 ${item.name}，获得了 ${sellPrice} 金币。`)
        this.player.inventory.splice(index, 1)
      } else {
        this.logBattle(`${item.name} 无法出售。`)
      }
    },
    startBattle () {
      if (this.battleEndTimer) {
        clearTimeout(this.battleEndTimer)
        this.battleEndTimer = null
      }
      if (!this.selectedMonsterLevel) {
        this.logBattle('请选择一个怪物等级开始战斗！')
        return
      }
      this.enemy = this.getRandomMonster(this.selectedMonsterLevel)
      this.inBattle = true
      this.battleLog = [`你遇到了一个 ${this.enemy.name}！`]
      this.logBattle(`你的生命值: ${this.player.hp}/${this.player.maxHp}`)
      this.logBattle(`${this.enemy.name} 的生命值: ${this.enemy.hp}/${this.enemy.maxHp}`)

      // Determine initiative
      if (this.player.moveSpeed >= this.enemy.moveSpeed) {
        this.currentTurn = 'player'
        this.logBattle('你获得了先手！')
        this.processTurn() // Start player's turn immediately
      } else {
        this.currentTurn = 'enemy'
        this.logBattle(`${this.enemy.name} 获得了先手！`)
        this.processTurn() // Enemy takes first turn immediately
      }
    },
    playerAttackAction () {
      // This method is no longer directly called by a button, but kept for clarity if needed
      // The battle now progresses automatically via processTurn
      if (!this.inBattle || !this.enemy || this.currentTurn !== 'player') return
      this.processTurn()
    },
    processTurn () {
      if (!this.inBattle || this.player.hp <= 0 || this.enemy.hp <= 0) {
        this.endBattle(this.enemy.hp <= 0)
        return
      }

      if (this.currentTurn === 'player') {
        this.logBattle('你的回合：')
        this.performAttack(this.player, this.enemy)
        if (this.enemy.hp <= 0) {
          this.endBattle(true)
          return
        }
        this.currentTurn = 'enemy'
        // Enemy turn after a short delay for readability
        setTimeout(() => this.processTurn(), 1000)
      } else if (this.currentTurn === 'enemy') {
        this.logBattle(`${this.enemy.name} 的回合：`)
        this.performAttack(this.enemy, this.player)
        if (this.player.hp <= 0) {
          this.endBattle(false)
          return
        }
        this.currentTurn = 'player'
        // Player turn after a short delay for readability
        setTimeout(() => this.processTurn(), 1000)
      }

      this.logBattle(`你的生命值: ${this.player.hp}/${this.player.maxHp}`)
      this.logBattle(`${this.enemy.name} 的生命值: ${this.enemy.hp}/${this.enemy.maxHp}`)
    },
    performAttack (attacker, defender) {
      let damageDealt = 0
      let attackType = 'normal'
      let skillUsed = null

      // Determine if a skill is used
      const skillRoll = Math.random()
      if (attacker.skills && attacker.skills.length > 0 && skillRoll < 0.5) { // 50% chance for enemy to use a skill
        skillUsed = attacker.skills[Math.floor(Math.random() * attacker.skills.length)]
        attackType = 'skill'
      } else if (attacker === this.player) {
        const skillProbabilities = [0.45, 0.35, 0.25] // Slot 1, 2, 3 probabilities
        const rand = Math.random()
        let cumulativeProb = 0

        for (let i = 0; i < this.player.activeSkillSlots.length; i++) {
          const skill = this.player.activeSkillSlots[i]
          if (skill && skill.type === 'active' && this.player.hp >= skill.cost) {
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
        this.logBattle(`${attacker.name} 使用了技能：${skillUsed.name}！`)
        if (attacker === this.player) {
          this.player.hp -= skillUsed.cost // Consume cost only for player
        }

        if (skillUsed.damageMultiplier) {
          const skillAttack = attacker.attack * skillUsed.damageMultiplier
          damageDealt = this.calculateDamage(skillAttack, defender.defense, attacker.critChance, defender.critResist, attacker.ignoreDefense)
          defender.hp -= damageDealt
          this.logBattle(`对 ${defender.name} 造成了 ${damageDealt} 点技能伤害。`)
        } else if (skillUsed.heal) {
          attacker.hp = Math.min(attacker.maxHp, attacker.hp + skillUsed.heal)
          this.logBattle(`${attacker.name} 恢复了 ${skillUsed.heal} 点生命值。`)
        }
        // Handle other skill types like dot, debuff etc. for monsters if needed
      } else {
        // Normal attack
        damageDealt = this.calculateDamage(attacker.attack, defender.defense, attacker.critChance, defender.critResist, attacker.ignoreDefense)
        defender.hp -= damageDealt
        this.logBattle(`${attacker.name} 对 ${defender.name} 造成了 ${damageDealt} 点伤害。`)

        // Check for combo
        if (Math.random() < attacker.comboChance) {
          const comboDamage = this.calculateDamage(attacker.attack * 0.5, defender.defense, attacker.critChance, defender.critResist, attacker.ignoreDefense)
          defender.hp -= comboDamage
          this.logBattle(`${attacker.name} 发动了连击，对 ${defender.name} 额外造成了 ${comboDamage} 点伤害！`)
        }
      }

      // Check for counter-attack (only if defender is still alive and attacker is player)
      if (defender.hp > 0 && attacker === this.player && Math.random() < defender.counterChance) {
        const counterDamage = this.calculateDamage(defender.attack * 0.7, attacker.defense, defender.critChance, attacker.critResist, defender.ignoreDefense)
        attacker.hp -= counterDamage
        this.logBattle(`${defender.name} 发动了反击，对你造成了 ${counterDamage} 点伤害！`)
      }
    },
    fleeBattle () {
      if (!this.inBattle) return
      this.logBattle('你成功逃跑了！')
      this.endBattle(false) // Player fled, no victory
    },
    endBattle (isVictory) {
      const wasFlee = !isVictory && this.player.hp > 0

      if (isVictory) {
        this.logBattle(`你击败了 ${this.enemy.name}！`)
        this.handleMonsterDefeated()
        this.saveGame() // Save progress on victory
      } else if (this.player.hp <= 0) {
        this.logBattle('你被击败了...')
      }

      this.inBattle = false
      this.enemy = null
      this.player.hp = this.player.maxHp // Restore to full health
      this.logBattle('你的生命值已完全恢复。')

      if (!wasFlee) {
        this.logBattle('3秒后将开始新的战斗...')
        this.battleEndTimer = setTimeout(() => {
          this.startBattle()
        }, 3000)
      }
    },
    handleMonsterDefeated () {
      const monster = this.enemy
      if (!monster || !monster.drops) return

      // Grant Gold
      const goldGained = monster.level * 5 // Example: 5 gold per level
      this.player.gold += goldGained
      this.logBattle(`你获得了 ${goldGained} 金币。`)

      // Handle Drops
      monster.drops.forEach(drop => {
        if (Math.random() < drop.chance) {
          if (drop.type === 'equipment') {
            const equipmentData = this.equipment.find(e => e.id === drop.itemId)
            if (equipmentData) {
              const newEquipment = {
                ...equipmentData,
                type: 'equipment',
                enhancementLevel: 0,
                baseAttack: equipmentData.attack || 0,
                baseDefense: equipmentData.defense || 0,
                baseHp: equipmentData.hp || 0
              }
              this.player.inventory.push(newEquipment)
              this.logBattle(`掉落了装备：${newEquipment.name}！`)
            }
          } else if (drop.type === 'skill') {
            const skill = this.skillsData.find(s => s.id === drop.skillId)
            if (skill) {
              // Check if player already has this skill book
              const hasSkillBook = this.player.inventory.some(item => item.type === 'skill' && item.skillId === skill.id)
              if (!hasSkillBook) {
                this.player.inventory.push({ name: `${skill.name} 技能书`, type: 'skill', skillId: skill.id })
                this.logBattle(`掉落了技能书：${skill.name}！`)
              }
            }
          }
        }
      })
    },
    equipItem (item, index) {
      if (!item.slot) return // Equipment must have a slot

      // Unequip current item in slot if any
      const currentEquipped = this.player.equipment[item.slot]
      if (currentEquipped) {
        this.player.inventory.push(currentEquipped) // Move to inventory
        this.player.attack -= currentEquipped.attack || 0
        this.player.defense -= currentEquipped.defense || 0
        this.player.maxHp -= currentEquipped.hp || 0
        this.player.hp = Math.min(this.player.hp, this.player.maxHp) // Adjust current HP if max HP drops
        this.player.critChance -= currentEquipped.critChance || 0
        this.player.critResist -= currentEquipped.critResist || 0
        this.player.moveSpeed -= currentEquipped.moveSpeed || 0
        this.player.comboChance -= currentEquipped.comboChance || 0
        this.player.counterChance -= currentEquipped.counterChance || 0
        this.player.ignoreDefense -= currentEquipped.ignoreDefense || 0
      }

      // Equip new item
      this.player.equipment[item.slot] = item
      this.player.attack += item.attack || 0
      this.player.defense += item.defense || 0
      this.player.maxHp += item.hp || 0
      this.player.hp = Math.min(this.player.hp, this.player.maxHp) // Ensure current HP doesn't exceed new max HP
      this.player.critChance += item.critChance || 0
      this.player.critResist += item.critResist || 0
      this.player.moveSpeed += item.moveSpeed || 0
      this.player.comboChance += item.comboChance || 0
      this.player.counterChance += item.counterChance || 0
      this.player.ignoreDefense += item.ignoreDefense || 0

      // Remove from inventory
      this.player.inventory.splice(index, 1)
      this.logBattle(`你装备了 ${item.name}。`)
    },
    unequipItem (slot) {
      const item = this.player.equipment[slot]
      if (!item) return

      this.player.inventory.push(item) // Move to inventory
      this.player.attack -= item.attack || 0
      this.player.defense -= item.defense || 0
      this.player.maxHp -= item.hp || 0
      this.player.hp = Math.min(this.player.hp, this.player.maxHp) // Adjust current HP if max HP drops
      this.player.critChance -= item.critChance || 0
      this.player.critResist -= item.critResist || 0
      this.player.moveSpeed -= item.moveSpeed || 0
      this.player.comboChance -= item.comboChance || 0
      this.player.counterChance -= item.counterChance || 0
      this.player.ignoreDefense -= item.ignoreDefense || 0
      this.player.equipment[slot] = null
      this.logBattle(`你卸下了 ${item.name}。`)
    },
    useItem (item, index) {
      if (item.type !== 'consumable') return

      if (item.heal) {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + item.heal)
        this.logBattle(`你使用了 ${item.name}，恢复了 ${item.heal} 点生命值。`)
      }
      // Remove from inventory
      this.player.inventory.splice(index, 1)
    },
    equipSkill (skillItem, slotIndex, slotType) {
      const skillBaseData = this.skillsData.find(s => s.id === skillItem.skillId)
      if (!skillBaseData) return

      // --- Type Check ---
      if (skillBaseData.type !== slotType) {
        this.logBattle(`不能将 ${skillBaseData.type === 'active' ? '主动' : '被动'} 技能装备到 ${slotType === 'active' ? '主动' : '被动'} 槽位。`)
        return
      }

      const currentLevel = this.player.skillLevels[skillItem.skillId] || 1
      const skill = { ...skillBaseData, ...skillBaseData.levels[currentLevel - 1] } // Get skill data for current level

      let targetSlots = null
      let slotName = ''
      if (slotType === 'active') {
        targetSlots = this.player.activeSkillSlots
        slotName = '主动技能槽位'
      } else if (slotType === 'passive') {
        targetSlots = this.player.passiveSkillSlots
        slotName = '被动技能槽位'
      } else {
        return
      }

      if (targetSlots[slotIndex] !== null) {
        this.logBattle(`${slotName} ${slotIndex + 1} 已经有技能了，请先卸下。`)
        return
      }

      targetSlots.splice(slotIndex, 1, skill)
      this.player.inventory.splice(this.player.inventory.indexOf(skillItem), 1)
      this.logBattle(`你将 ${skill.name} (等级 ${currentLevel}) 装备到了 ${slotName} ${slotIndex + 1}。`)

      // Apply passive effects
      if (skill.type === 'passive') {
        this.applyPassiveSkillEffects(skill)
      }
    },
    unequipSkill (skill, slotIndex, slotType) {
      let targetSlots = null
      let slotName = ''
      if (slotType === 'active') {
        targetSlots = this.player.activeSkillSlots
        slotName = '主动技能槽位'
      } else if (slotType === 'passive') {
        targetSlots = this.player.passiveSkillSlots
        slotName = '被动技能槽位'
      } else {
        return
      }

      if (targetSlots[slotIndex] === null) return

      this.player.inventory.push({ name: `${skill.name} 技能书`, type: 'skill', skillId: skill.id })
      targetSlots.splice(slotIndex, 1, null)
      this.logBattle(`你从 ${slotName} ${slotIndex + 1} 卸下了 ${skill.name}。`)

      // Remove passive effects
      if (skill.type === 'passive') {
        this.removePassiveSkillEffects(skill)
      }
    },
    applyPassiveSkillEffects (skill) {
      // Apply effects based on the skill's current level data
      if (skill.attack) {
        this.player.attack += skill.attack
        this.logBattle(`你的攻击力增加了 ${skill.attack} 点。`)
      }
      if (skill.defense) {
        this.player.defense += skill.defense
        this.logBattle(`你的防御力增加了 ${skill.defense} 点。`)
      }
      if (skill.maxHp) {
        this.player.maxHp += skill.maxHp
        this.player.hp += skill.maxHp // Also increase current HP
        this.logBattle(`你的最大生命值增加了 ${skill.maxHp} 点。`)
      }
      if (skill.critChance) {
        this.player.critChance += skill.critChance
        this.logBattle(`你的暴击率增加了 ${Math.round(skill.critChance * 100)}%。`)
      }
      if (skill.critResist) {
        this.player.critResist += skill.critResist
        this.logBattle(`你的抗暴击率增加了 ${Math.round(skill.critResist * 100)}%。`)
      }
      if (skill.moveSpeed) {
        this.player.moveSpeed += skill.moveSpeed
        this.logBattle(`你的移动速度增加了 ${skill.moveSpeed} 点。`)
      }
      if (skill.comboChance) {
        this.player.comboChance += skill.comboChance
        this.logBattle(`你的连击几率增加了 ${Math.round(skill.comboChance * 100)}%。`)
      }
      if (skill.counterChance) {
        this.player.counterChance += skill.counterChance
        this.logBattle(`你的反击几率增加了 ${Math.round(skill.counterChance * 100)}%。`)
      }
      if (skill.ignoreDefense) {
        this.player.ignoreDefense += skill.ignoreDefense
        this.logBattle(`你的忽视防御力增加了 ${Math.round(skill.ignoreDefense * 100)}%。`)
      }
      if (skill.goldBonus) {
        this.player.goldBonus = (this.player.goldBonus || 0) + skill.goldBonus
        this.logBattle(`你获得的金币增加了 ${Math.round(skill.goldBonus * 100)}%。`)
      }
      if (skill.hpRegen) {
        this.player.hpRegen = (this.player.hpRegen || 0) + skill.hpRegen
        this.logBattle(`你每回合生命恢复增加了 ${skill.hpRegen} 点。`)
      }
    },
    removePassiveSkillEffects (skill) {
      // Remove effects based on the skill's current level data
      if (skill.attack) {
        this.player.attack -= skill.attack
        this.logBattle(`你的攻击力减少了 ${skill.attack} 点。`)
      }
      if (skill.defense) {
        this.player.defense -= skill.defense
        this.logBattle(`你的防御力减少了 ${skill.defense} 点。`)
      }
      if (skill.maxHp) {
        this.player.maxHp -= skill.maxHp
        this.player.hp = Math.min(this.player.hp, this.player.maxHp) // Adjust current HP if max HP drops
        this.logBattle(`你的最大生命值减少了 ${skill.maxHp} 点。`)
      }
      if (skill.critChance) {
        this.player.critChance -= skill.critChance
        this.logBattle(`你的暴击率减少了 ${Math.round(skill.critChance * 100)}%。`)
      }
      if (skill.critResist) {
        this.player.critResist -= skill.critResist
        this.logBattle(`你的抗暴击率减少了 ${Math.round(skill.critResist * 100)}%。`)
      }
      if (skill.moveSpeed) {
        this.player.moveSpeed -= skill.moveSpeed
        this.logBattle(`你的移动速度减少了 ${skill.moveSpeed} 点。`)
      }
      if (skill.comboChance) {
        this.player.comboChance -= skill.comboChance
        this.logBattle(`你的连击几率减少了 ${Math.round(skill.comboChance * 100)}%。`)
      }
      if (skill.counterChance) {
        this.player.counterChance -= skill.counterChance
        this.logBattle(`你的反击几率减少了 ${Math.round(skill.counterChance * 100)}%。`)
      }
      if (skill.ignoreDefense) {
        this.player.ignoreDefense -= skill.ignoreDefense
        this.logBattle(`你的忽视防御力减少了 ${Math.round(skill.ignoreDefense * 100)}%。`)
      }
      if (skill.goldBonus) {
        this.player.goldBonus = (this.player.goldBonus || 0) - skill.goldBonus
        this.logBattle(`你获得的金币减少了 ${Math.round(skill.goldBonus * 100)}%。`)
      }
      if (skill.hpRegen) {
        this.player.hpRegen = (this.player.hpRegen || 0) - skill.hpRegen
        this.logBattle(`你每回合生命恢复减少了 ${skill.hpRegen} 点。`)
      }
    },
    // The original useSkill method is now internal to performAttack, but we keep it for direct use if needed
    useSkill (skill) {
      // This method might be called directly from UI for non-battle skills or for testing
      // For battle skills, performAttack handles the cost and effects
      if (this.player.hp < skill.cost) {
        this.logBattle(`生命值不足以使用 ${skill.name}。`)
        return
      }
      this.player.hp -= skill.cost
      this.logBattle(`你使用了 ${skill.name}，消耗了 ${skill.cost} 点生命值。`)
      // Apply skill effects here if it's a non-battle skill or for direct use
      if (skill.heal) {
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + skill.heal)
        this.logBattle(`恢复了 ${skill.heal} 点生命值。`)
      }
      // For damage skills, they are handled in performAttack
    },
    logBattle (message) {
      this.battleLog.push(message)
      // Keep log concise, remove oldest if too long
      if (this.battleLog.length > 500) {
        this.battleLog.shift()
      }
    },
    calculateDamage (attackerAttack, defenderDefense, attackerCritChance, defenderCritResist, attackerIgnoreDefense = 0) {
      const effectiveDefense = Math.max(0, defenderDefense * (1 - attackerIgnoreDefense))
      let damage = Math.max(0, attackerAttack - effectiveDefense)
      const actualCritChance = Math.max(0, attackerCritChance - defenderCritResist)
      if (Math.random() < actualCritChance) {
        damage *= 1.5 // 1.5x critical damage
        this.logBattle('暴击！')
      }
      return damage
    },
    getRandomMonster (playerLevel) {
      if (!this.monsters || this.monsters.length === 0) {
        this.logBattle('错误：没有可用的怪物数据！')
        return null // Or a default fallback monster
      }

      // For simplicity, get monsters around player's level
      const relevantMonsters = this.monsters.filter(
        (monster) => monster.level >= playerLevel - 2 && monster.level <= playerLevel + 2
      )
      if (relevantMonsters.length === 0) {
        this.logBattle('警告：没有找到与玩家等级相近的怪物，将随机选择一个怪物。')
        // Fallback to any monster if no relevant ones found
        const randomMonster = { ...this.monsters[Math.floor(Math.random() * this.monsters.length)] }
        randomMonster.maxHp = randomMonster.hp // Set maxHp for enemy
        return randomMonster
      }
      const randomIndex = Math.floor(Math.random() * relevantMonsters.length)
      const selectedMonster = { ...relevantMonsters[randomIndex] } // Return a copy to avoid modifying original data
      selectedMonster.maxHp = selectedMonster.hp // Set maxHp for enemy
      return selectedMonster
    }
  }
}
</script>

<style scoped>
.tooltip {
  position: absolute;
  background-color: #333;
  color: #fff;
  border: 1px solid #fff;
  padding: 10px;
  border-radius: 5px;
  pointer-events: none; /* Prevents the tooltip from interfering with mouse events */
  z-index: 100;
  white-space: pre-wrap; /* Ensures line breaks are respected */
}
</style>
