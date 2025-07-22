<template>
  <div id="game-container" style="padding-top: 100px">
    <app-header ref="appHeader" :player="player" @forge-item="handleForgeItem" @open-blind-box="handleOpenBlindBox"></app-header>
    <div class="left-panel" >
      <div class="section character-attributes">
        <h2 @click="toggleSection('character')">
          角色属性界面 (Character Attributes)
          <span class="toggle-arrow">{{ sections.character.collapsed ? '▼' : '▲' }}</span>
        </h2>
        <div v-if="!sections.character.collapsed" class="attributes-grid">
          <div class="primary-attributes">
            <p>姓名: {{ player.name }}</p>
            <p>等级: {{ player.level }}</p>
            <p>经验: {{ player.xp }} / {{ player.xpToNextLevel }}</p>
            <p v-if="player.attributePoints > 0">可用属性点: {{ player.attributePoints }}</p>
            <p>生命值: {{ player.hp }}/{{ player.maxHp }}</p>
            <p>力量: {{ player.strength }} <button v-if="player.attributePoints > 0" @click="assignPoint('baseStrength')" :disabled="inBattle">+</button></p>
            <p>敏捷: {{ player.agility }} <button v-if="player.attributePoints > 0" @click="assignPoint('baseAgility')" :disabled="inBattle">+</button></p>
            <p>体质: {{ player.constitution }} <button v-if="player.attributePoints > 0" @click="assignPoint('baseConstitution')" :disabled="inBattle">+</button></p>
            <p>攻击力: {{ player.attack }}</p>
            <p>防御力: {{ player.defense }}</p>
          </div>
          <div class="special-attributes">
            <h3>特殊属性</h3>
            <p>闪避率: {{ ((player.evasion || 0) * 100).toFixed(1) }}%</p>
            <p>暴击率: {{ ((player.critChance || 0) * 100).toFixed(1) }}%</p>
            <p>抗暴击率: {{ ((player.critResist || 0) * 100).toFixed(1) }}%</p>
            <p>移动速度: {{ player.moveSpeed }}</p>
            <p>连击几率: {{ ((player.comboChance || 0) * 100).toFixed(1) }}%</p>
            <p>反击几率: {{ ((player.counterChance || 0) * 100).toFixed(1) }}%</p>
            <p>忽视防御力: {{ ((player.ignoreDefense || 0) * 100).toFixed(1) }}%</p>
            <p>金币: {{ player.gold }}</p>
          </div>
        </div>
      </div>
      <div class="section pet-interface" :style="petInterfaceStyle">
        <h2 @click="toggleSection('pet')">
          宠物界面 (Pet)
          <span class="toggle-arrow">{{ sections.pet.collapsed ? '▼' : '▲' }}</span>
        </h2>
        <div v-if="!sections.pet.collapsed">
          <div v-if="player.pets.length > 0">
            <div v-for="(pet, index) in player.pets" :key="index" class="pet-details">
              <hr v-if="index > 0">
              <p><strong>{{ pet.name }}</strong> ({{ player.activePetId === pet.instanceId ? '出战中' : '休息中' }})</p>
              <p>等级: {{ pet.level }}</p>
              <div v-if="player.activePetId === pet.instanceId">
                <p>经验: {{ pet.xp }} / {{ pet.xpToNextLevel }}</p>
                <p v-if="pet.attributePoints > 0">可用属性点: {{ pet.attributePoints }}</p>
                <p>生命值: {{ pet.hp }}/{{ pet.maxHp }}</p>
                <p>力量: {{ pet.strength }} <button v-if="pet.attributePoints > 0" @click="assignPetPoint(pet.instanceId, 'baseStrength')" :disabled="inBattle">+</button></p>
                <p>敏捷: {{ pet.agility }} <button v-if="pet.attributePoints > 0" @click="assignPetPoint(pet.instanceId, 'baseAgility')" :disabled="inBattle">+</button></p>
                <p>体质: {{ pet.constitution }} <button v-if="pet.attributePoints > 0" @click="assignPetPoint(pet.instanceId, 'baseConstitution')" :disabled="inBattle">+</button></p>
                <p>攻击力: {{ pet.attack }}</p>
                <p>防御力: {{ pet.defense }}</p>
                <p>闪避率: {{ ((pet.evasion || 0) * 100).toFixed(1) }}%</p>
                <p>暴击率: {{ ((pet.critChance || 0) * 100).toFixed(1) }}%</p>
              </div>
              <button v-if="player.activePetId !== pet.instanceId" @click="setPetStatus(pet.instanceId, true)" :disabled="inBattle">出战</button>
              <button v-if="player.activePetId === pet.instanceId" @click="setPetStatus(pet.instanceId, false)" :disabled="inBattle">休息</button>
              <button @click="releasePet(pet.instanceId)" :disabled="inBattle">放生</button>
            </div>
          </div>
          <p v-else>无</p>
        </div>
      </div>
      <div class="section equipment-interface">
        <h2 @click="toggleSection('equipment')">
          装备界面 (Equipment)
          <span class="toggle-arrow">{{ sections.equipment.collapsed ? '▼' : '▲' }}</span>
        </h2>
        <ul v-if="!sections.equipment.collapsed">
          <li v-for="(item, slot) in player.equipment" :key="slot" @mouseover="showTooltip($event, item)" @mouseout="hideTooltip">
            {{ slot }}: {{ item ? `${item.name} ${item.enhancementLevel > 0 ? '+' + item.enhancementLevel : ''}` : '无' }}
            <button v-if="item && item.type !== 'necklace'" @click="enhanceItem(item, 'equipped', slot)" :disabled="inBattle">强化</button>
            <button v-if="item" @click="unequipItem(slot)" :disabled="inBattle">卸下</button>
          </li>
        </ul>
      </div>
      <div class="section skill-interface">
        <h2 @click="toggleSection('skill')">
          技能界面 (Skills)
          <span class="toggle-arrow">{{ sections.skill.collapsed ? '▼' : '▲' }}</span>
        </h2>
        <div v-if="!sections.skill.collapsed">
          <h3>主动技能槽位 (Active Skills)</h3>
          <ul>
            <li v-for="(skill, index) in player.activeSkillSlots" :key="'active-' + index" @mouseover="showTooltip($event, skill)" @mouseout="hideTooltip">
            槽位 {{ index + 1 }}: {{ skill ? `L${skill.level} ${skill.description}` : '空' }}
            <button v-if="skill" @click="upgradeSkill(skill, index, 'active')" :disabled="inBattle">升级</button>
            <button v-if="skill" @click="unequipSkill(skill, index, 'active')" :disabled="inBattle">卸下</button>
          </li>
        </ul>
        <h3>被动技能槽位 (Passive Skills)</h3>
        <ul>
          <li v-for="(skill, index) in player.passiveSkillSlots" :key="'passive-' + index" @mouseover="showTooltip($event, skill)" @mouseout="hideTooltip">
            槽位 {{ index + 1 }}: {{ skill ? `L${skill.level} ${skill.description}` : '空' }}
            <button v-if="skill" @click="upgradeSkill(skill, index, 'passive')" :disabled="inBattle">升级</button>
            <button v-if="skill" @click="unequipSkill(skill, index, 'passive')" :disabled="inBattle">卸下</button>
          </li>
        </ul>
        </div>
      </div>
    </div>
    <div class="right-panel">
      <div class="section text-battle-interface">
        <h2>文字战斗界面 (Text Battle)</h2>
        <div class="battle-controls">
          <div class="tower-section">
            <h3>锁妖塔？</h3>
            <label for="tower-level-select">选择层数:</label>
            <select id="tower-level-select" v-model="currentTowerLevel" :disabled="inBattle">
              <option v-for="level in player.highestTowerLevel" :key="level" :value="level">
                第 {{ level }} 层
              </option>
            </select>
            <button @click="startTowerBattle" :disabled="inBattle">挑战锁妖塔</button>
          </div>
          <label for="monster-level-select">地图:</label>
          <select id="monster-level-select" v-model="selectedMonsterLevel" :disabled="inBattle">
            <option v-for="level in availableMonsterLevels" :key="level" :value="level">
              等级 {{ level }}
            </option>
          </select>
          <button @click="startBattle" :disabled="inBattle">开始战斗</button>
          <button @click="fleeBattle" :disabled="!inBattle">逃跑</button>
        </div>
        <div v-if="inBattle" class="battle-status">
          <div class="character-status">
            <span>{{ player.name }}</span>
            <div class="health-bar-container">
              <div class="health-bar" :style="{ width: (player.hp / player.maxHp) * 100 + '%' }"></div>
            </div>
            <span>{{ player.hp }} / {{ player.maxHp }}</span>
          </div>
          <div v-if="activePet" class="character-status">
            <span>{{ activePet.name }}</span>
            <div class="health-bar-container">
              <div class="health-bar" :style="{ width: (activePet.hp / activePet.maxHp) * 100 + '%' }"></div>
            </div>
            <span>{{ activePet.hp }} / {{ activePet.maxHp }}</span>
          </div>
            <div v-if="enemy" class="character-status" @mouseover="showEnemyTooltip($event, enemy)" @mouseout="hideTooltip">
              <span>{{ enemy.name }}</span>
              <div class="health-bar-container">
              <div class="health-bar enemy" :style="{ width: (enemy.hp / enemy.maxHp) * 100 + '%' }"></div>
            </div>
            <span>{{ enemy.hp }} / {{ enemy.maxHp }}</span>
          </div>
        </div>
        <div class="battle-log" ref="battleLogContainer">
          <p v-for="(log, index) in battleLog" :key="index">{{ log }}</p>
        </div>
      </div>
      <div class="section backpack-interface" :style="backpackInterfaceStyle">
        <h2 @click="toggleSection('backpack')">
          背包界面 (Backpack)
          <span class="toggle-arrow">{{ sections.backpack.collapsed ? '▼' : '▲' }}</span>
        </h2>
        <div v-if="!sections.backpack.collapsed">
          <div class="backpack-controls">
            <button @click="backpackCategory = 'equipment'" :class="{ 'active-category': backpackCategory === 'equipment' }">装备</button>
            <button @click="backpackCategory = 'skills'" :class="{ 'active-category': backpackCategory === 'skills' }">技能</button>
            <button @click="backpackCategory = 'materials'" :class="{ 'active-category': backpackCategory === 'materials' }">材料</button>
            <button @click="sellAllItems">一键出售装备</button>
          </div>
          <ul>
            <li v-for="(item, index) in filteredInventory" :key="index" @mouseover="showTooltip($event, item)" @mouseout="hideTooltip">
            {{ item.name }} <span v-if="item.quantity">x{{ item.quantity }}</span> {{ item.enhancementLevel > 0 ? '+' + item.enhancementLevel : '' }} ({{ item.type }})
            <button v-if="item.slot && item.type !== 'necklace'" @click="enhanceItem(item, 'inventory', index)" :disabled="inBattle">强化</button>
            <button v-if="item.slot" @click="equipItem(item, index)" :disabled="inBattle">装备</button>
            <button v-if="item.type === 'consumable'" @click="useItem(item, index)" :disabled="inBattle">使用</button>
            <span v-if="item.type === 'skill'">
              <span v-if="getSkillType(item) === 'active'">
                <button @click="equipSkill(item, 0, 'active')" :disabled="inBattle">装备主动1</button>
                <button @click="equipSkill(item, 1, 'active')" :disabled="inBattle">装备主动2</button>
                <button @click="equipSkill(item, 2, 'active')" :disabled="inBattle">装备主动3</button>
              </span>
              <span v-if="getSkillType(item) === 'passive'">
                <button @click="equipSkill(item, 0, 'passive')" :disabled="inBattle">装备被动1</button>
                <button @click="equipSkill(item, 1, 'passive')" :disabled="inBattle">装备被动2</button>
                <button @click="equipSkill(item, 2, 'passive')" :disabled="inBattle">装备被动3</button>
              </span>
            </span>
            <button @click="sellItem(item, index)" :disabled="inBattle">出售</button>
          </li>
        </ul>
        </div>
      </div>
    </div>

    <div v-if="tooltip.visible" class="tooltip" :style="{ top: tooltip.top + 'px', left: tooltip.left + 'px' }" v-html="tooltip.content"></div>
  </div>

</template>

<script>
import monstersData from '../data/monsters.json'
import equipmentData from '../data/equipment.json'
import skillsData from '../data/skills.json'
import petsData from '../data/pets.json'
import towerMonstersData from '../data/tower-monsters.json'
import * as skillService from '../services/skillService.js'
import * as inventoryService from '../services/inventoryService.js'
import * as characterService from '../services/characterService.js'
import * as petService from '../services/petService.js'
import AppHeader from './Header.vue'

export default {
  name: 'TextGame',
  components: {
    AppHeader
  },
  data () {
    return {
      player: characterService.initializePlayer(skillsData),
      enemy: null,
      inBattle: false,
      battleLog: [],
      monsters: monstersData,
      equipment: equipmentData,
      skillsData: skillsData, // All skills data from JSON
      pets: petsData,
      towerMonsters: towerMonstersData,
      currentTowerLevel: 1,
      selectedMonsterLevel: 1, // Default selected level
      currentTurn: null, // 'player' or 'enemy'
      battleEndTimer: null,
      turnTimer: null,
      tooltip: {
        visible: false,
        content: '',
        top: 0,
        left: 0
      },
      sections: {
        character: { collapsed: false },
        pet: { collapsed: false },
        equipment: { collapsed: false },
        skill: { collapsed: false },
        backpack: { collapsed: false }
      },
      backpackCategory: 'equipment'
    }
  },
  created () {
    this.loadGame()
  },
  watch: {
    // Watch for changes in equipment or passive skills and update stats
    'player.equipment': {
      handler () {
        characterService.updatePlayerStats(this.player, this.activePet)
      },
      deep: true
    },
    'player.passiveSkillSlots': {
      handler () {
        characterService.updatePlayerStats(this.player, this.activePet)
      },
      deep: true
    },
    battleLog () {
      this.$nextTick(() => {
        const container = this.$refs.battleLogContainer
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      })
    }
  },
  computed: {
    availableMonsterLevels () {
      const levels = new Set()
      this.monsters.forEach(monster => levels.add(monster.level))
      return Array.from(levels).sort((a, b) => a - b)
    },
    activePet () {
      if (!this.player.activePetId) return null
      return this.player.pets.find(p => p.instanceId === this.player.activePetId)
    },
    petInterfaceStyle () {
      if (this.sections.pet.collapsed) {
        return { height: 'auto', flex: '0 0 auto' }
      }
      if (this.player.pets.length === 0) {
        return { height: '160px' }
      }
      return {} // Fallback to CSS height
    },
    backpackInterfaceStyle () {
      if (this.sections.backpack.collapsed) {
        return { flex: '0 0 auto' }
      }
      return {} // Fallback to CSS
    },
    filteredInventory () {
      switch (this.backpackCategory) {
        case 'equipment':
          return this.player.inventory.filter(item => item.slot)
        case 'skills':
          return this.player.inventory.filter(item => item.type === 'skill')
        case 'materials':
          return this.player.inventory.filter(item => item.type === 'material' || item.type === 'consumable')
        default:
          return this.player.inventory
      }
    }
  },
  methods: {
    handleOpenBlindBox ({ cost, times }, callback) {
      if (this.player.gold < cost) {
        this.logBattle(`金币不足，需要 ${cost} 金币。`)
        return
      }

      this.player.gold -= cost
      this.logBattle(`花费 ${cost} 金币，进行了 ${times} 次盲盒抽取。`)

      const rewards = []
      const results = []
      for (let i = 0; i < times; i++) {
        const rand = Math.random()
        if (cost === 1000) {
          if (rand < 0.01) { // 1% chance for 10000 gold
            const reward = { type: 'gold', amount: 10000, name: '10000 金币' }
            rewards.push(reward)
            results.push(reward)
          } else if (rand < 0.05) { // 4% chance for crafting materials
            const materials = ['灵魂精粹', '敏捷水晶', '狂怒之石', '穿透之眼', '力量之源', '敏捷之风', '体质之岩']
            const materialName = materials[Math.floor(Math.random() * materials.length)]
            const reward = { type: 'material', name: materialName, quantity: 1 }
            rewards.push(reward)
            results.push(reward)
          } else if (rand < 0.5) { // 45% chance for small amount of gold
            const amount = Math.floor(Math.random() * 100) + 1
            const reward = { type: 'gold', amount, name: `${amount} 金币` }
            rewards.push(reward)
            results.push(reward)
          } else { // 50% chance for nothing
            const reward = { type: 'nothing', name: '谢谢惠顾' }
            rewards.push(reward)
            results.push(reward)
          }
        } else if (cost === 10000) {
          if (rand < 0.05) { // 5% chance for 10000 gold
            const reward = { type: 'gold', amount: 10000, name: '10000 金币' }
            rewards.push(reward)
            results.push(reward)
          } else if (rand < 0.15) { // 10% chance for crafting materials
            const materials = ['灵魂精粹', '敏捷水晶', '狂怒之石', '穿透之眼', '力量之源', '敏捷之风', '体质之岩']
            const materialName = materials[Math.floor(Math.random() * materials.length)]
            const reward = { type: 'material', name: materialName, quantity: 3 }
            rewards.push(reward)
            results.push(reward)
          } else if (rand < 0.55) { // 40% chance for small amount of gold
            const amount = Math.floor(Math.random() * 1000) + 100
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
          this.player.gold += reward.amount
          this.logBattle(`恭喜你！获得了 ${reward.name}！`)
        } else if (reward.type === 'material') {
          const existingMaterial = this.player.inventory.find(item => item.name === reward.name)
          if (existingMaterial) {
            existingMaterial.quantity += reward.quantity
          } else {
            this.player.inventory.push({ name: reward.name, type: 'material', quantity: reward.quantity })
          }
          this.logBattle(`恭喜你！获得了 ${reward.name} x${reward.quantity}！`)
        } else if (reward.type === 'nothing') {
          this.logBattle('谢谢惠顾！')
        }
      })

      if (callback) {
        callback(results)
      }

      this.saveGame()
    },
    handleForgeItem (materialsToUse) {
      const success = inventoryService.forgeItem(this.player, this.logBattle, materialsToUse)
      if (success) {
        this.$refs.appHeader.closeForgeModal()
        this.saveGame()
      }
    },
    saveGame () {
      characterService.savePlayer(this.player)
      this.logBattle('游戏进度已保存。')
    },
    loadGame () {
      this.player = characterService.loadPlayer(this.skillsData)
      this.currentTowerLevel = this.player.highestTowerLevel || 1
      this.logBattle('游戏进度已加载。')
    },
    initializePlayerState () {
      this.player = characterService.initializePlayer(this.skillsData)
      this.updatePlayerStats() // Recalculate all stats
    },
    showTooltip (event, item) {
      if (!item) return
      let content = `<strong>${item.name} ${item.enhancementLevel > 0 ? '+' + item.enhancementLevel : ''}</strong><br>`
      if (item.quantity) {
        content += `数量: ${item.quantity}<br>`
      }

      // Check if it's an equipment item (they have a 'slot' property)
      if (item.slot) {
        content += `类型: 装备 (${item.type})<br>`
        if (item.baseAttack) content += `攻击力: ${item.baseAttack} (${item.attack})<br>`
        else if (item.attack) content += `攻击力: ${item.attack}<br>`
        if (item.baseDefense) content += `防御力: ${item.baseDefense} (${item.defense})<br>`
        else if (item.defense) content += `防御力: ${item.defense}<br>`
        if (item.baseHp) content += `生命值: ${item.baseHp} (${item.hp})<br>`
        else if (item.hp) content += `生命值: ${item.hp}<br>`
        if (item.strength) content += `力量: ${item.baseStrength} (${item.strength})<br>`
        if (item.agility) content += `敏捷: ${item.baseAgility} (${item.agility})<br>`
        if (item.constitution) content += `体质: ${item.baseConstitution} (${item.constitution})<br>`
        if (item.evasion) content += `闪避率: ${((item.evasion || 0) * 100).toFixed(1)}%<br>`
        if (item.critChance) content += `暴击率: ${((item.critChance || 0) * 100).toFixed(1)}%<br>`
        if (item.critResist) content += `抗暴击率: ${((item.critResist || 0) * 100).toFixed(1)}%<br>`
        if (item.moveSpeed) content += `移动速度: ${item.moveSpeed}<br>`
        if (item.comboChance) content += `连击几率: ${((item.comboChance || 0) * 100).toFixed(1)}%<br>`
        if (item.counterChance) content += `反击几率: ${((item.counterChance || 0) * 100).toFixed(1)}%<br>`
        if (item.ignoreDefense) content += `忽视防御力: ${((item.ignoreDefense || 0) * 100).toFixed(1)}%<br>`
        if (item.percentAttack) content += `攻击力: +${(item.percentAttack * 100).toFixed(0)}%<br>`
        if (item.percentDefense) content += `防御力: +${(item.percentDefense * 100).toFixed(0)}%<br>`
        if (item.percentHp) content += `生命值: +${(item.percentHp * 100).toFixed(0)}%<br>`
      } else if (item.type === 'active' || item.type === 'passive' || item.skillId) {
        let skillData
        let skillLevelData

        if (item.skillId) { // It's a skill book from inventory
          skillData = this.skillsData.find(s => s.id === item.skillId)
          if (skillData) {
            const currentLevel = this.player.skillLevels[item.skillId] || 1
            skillLevelData = skillData.levels[currentLevel - 1]
          }
        } else { // It's an equipped skill
          skillData = item
          skillLevelData = item
        }

        if (skillData && skillLevelData) {
          content += `类型: ${skillData.type === 'active' ? '主动技能' : '被动技能'} (等级 ${skillLevelData.level})<br>`
          if (skillLevelData.description) content += `描述: ${skillLevelData.description}<br>`
          // Show next level description
          const nextLevelData = skillData.levels[skillLevelData.level]
          if (nextLevelData) {
            content += `<hr>下一级 (L${nextLevelData.level}):<br>${nextLevelData.description}`
          }
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
    upgradeSkill (skill, slotIndex, slotType) {
      skillService.upgradeSkill(this.player, skill, slotIndex, slotType, this.skillsData, this.logBattle, this.saveGame)
      characterService.updatePlayerStats(this.player, this.activePet)
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

        this.logBattle(`强化成功！${item.name} 强化至 +${item.enhancementLevel}。`)
        if (attackBonus > 0) this.logBattle(`攻击力 +${attackBonus}`)
        if (defenseBonus > 0) this.logBattle(`防御力 +${defenseBonus}`)
        if (hpBonus > 0) this.logBattle(`生命值 +${hpBonus}`)
        if (strengthBonus > 0) this.logBattle(`力量 +${strengthBonus}`)
        if (agilityBonus > 0) this.logBattle(`敏捷 +${agilityBonus}`)
        if (constitutionBonus > 0) this.logBattle(`体质 +${constitutionBonus}`)

        // --- Re-apply new stats if item is equipped ---
        if (location === 'equipped') {
          characterService.updatePlayerStats(this.player, this.activePet)
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
    startTowerBattle () {
      if (this.battleEndTimer) {
        clearTimeout(this.battleEndTimer)
        this.battleEndTimer = null
      }
      if (this.turnTimer) {
        clearTimeout(this.turnTimer)
        this.turnTimer = null
      }

      const towerMonster = this.towerMonsters.find(m => m.level === this.currentTowerLevel)
      if (!towerMonster) {
        this.logBattle('你已经通关了锁妖塔！')
        return
      }

      this.enemy = { ...towerMonster }
      this.enemy.maxHp = this.enemy.hp
      this.inBattle = true
      this.battleLog = [`你开始挑战锁妖塔第 ${this.currentTowerLevel} 层！`]
      this.logBattle(`你遇到了一个 ${this.enemy.name}！`)
      this.logBattle(`你的生命值: ${this.player.hp}/${this.player.maxHp}`)
      this.logBattle(`${this.enemy.name} 的生命值: ${this.enemy.hp}/${this.enemy.maxHp}`)

      if (this.player.moveSpeed >= this.enemy.moveSpeed) {
        this.currentTurn = 'player'
        this.logBattle('你获得了先手！')
        this.processTurn()
      } else {
        this.currentTurn = 'enemy'
        this.logBattle(`${this.enemy.name} 获得了先手！`)
        this.processTurn()
      }
    },
    getSkillType (skillItem) {
      return skillService.getSkillType(skillItem, this.skillsData)
    },
    sellAllItems () {
      inventoryService.sellAll(this.player, this.logBattle)
      this.saveGame()
    },
    sellItem (item, index) {
      inventoryService.sellItem(this.player, item, index, this.logBattle)
      this.saveGame()
    },
    startBattle () {
      if (this.battleEndTimer) {
        clearTimeout(this.battleEndTimer)
        this.battleEndTimer = null
      }
      if (this.turnTimer) {
        clearTimeout(this.turnTimer)
        this.turnTimer = null
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
    updatePlayerStats () {
      characterService.updatePlayerStats(this.player, this.activePet)
    },
    processTurn () {
      if (!this.inBattle || this.player.hp <= 0 || this.enemy.hp <= 0) {
        this.endBattle(this.enemy.hp <= 0)
        return
      }

      if (this.activePet && this.activePet.hp <= 0) {
        this.logBattle(`你的宠物 ${this.activePet.name} 被击败了！`)
        // We don't end the battle here, just log it.
      }

      if (this.currentTurn === 'player') {
        this.logBattle('你的回合：')
        // Pet action at the start of the turn
        if (this.activePet) {
          petService.performPetAction(this.activePet, this.player, this.enemy, this.logBattle, this.calculateDamage, 'player-turn-start')
        }

        this.performAttack(this.player, this.enemy)

        // Pet action after the turn
        if (this.enemy && this.enemy.hp > 0 && this.activePet) {
          petService.performPetAction(this.activePet, this.player, this.enemy, this.logBattle, this.calculateDamage, 'player-turn-end')
        }

        if (this.enemy.hp <= 0) {
          this.endBattle(true)
          return
        }
        this.currentTurn = 'enemy'
        // Enemy turn after a short delay for readability
        this.turnTimer = setTimeout(() => this.processTurn(), 1000)
      } else if (this.currentTurn === 'enemy') {
        this.logBattle(`${this.enemy.name} 的回合：`)

        // Target selection for enemy
        let target = this.player
        if (this.activePet && this.activePet.hp > 0 && Math.random() < 0.3) { // 30% chance to target pet
          target = this.activePet
          this.logBattle(`${this.enemy.name} 的目标是你的宠物 ${target.name}！`)
        } else {
          this.logBattle(`${this.enemy.name} 的目标是你！`)
        }

        this.performAttack(this.enemy, target)

        if (this.player.hp <= 0) {
          this.endBattle(false)
          return
        }
        this.currentTurn = 'player'
        // Player turn after a short delay for readability
        this.turnTimer = setTimeout(() => this.processTurn(), 1000)
      }

      this.logBattle(`你的生命值: ${this.player.hp}/${this.player.maxHp}`)
      this.logBattle(`${this.enemy.name} 的生命值: ${this.enemy.hp}/${this.enemy.maxHp}`)
    },
    performAttack (attacker, defender) {
      const defenderName = defender === this.player ? '你' : defender.name
      // --- Evasion Check ---
      if (Math.random() < defender.evasion) {
        this.logBattle(`${attacker.name} 的攻击被 ${defenderName} 闪避了！`)
        return // Attack misses
      }

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
          this.logBattle(`对 ${defenderName} 造成了 ${damageDealt} 点技能伤害。`)
        } else if (skillUsed.heal) {
          attacker.hp = Math.min(attacker.maxHp, attacker.hp + skillUsed.heal)
          this.logBattle(`${attacker.name} 恢复了 ${skillUsed.heal} 点生命值。`)
        }
        // Handle other skill types like dot, debuff etc. for monsters if needed
      } else {
        // Normal attack
        damageDealt = this.calculateDamage(attacker.attack, defender.defense, attacker.critChance, defender.critResist, attacker.ignoreDefense)
        defender.hp -= damageDealt
        this.logBattle(`${attacker.name} 对 ${defenderName} 造成了 ${damageDealt} 点伤害。`)

        // Check for combo
        if (Math.random() < attacker.comboChance) {
          const comboDamage = this.calculateDamage(attacker.attack * 0.5, defender.defense, attacker.critChance, defender.critResist, attacker.ignoreDefense)
          defender.hp -= comboDamage
          this.logBattle(`${attacker.name} 发动了连击，对 ${defenderName} 额外造成了 ${comboDamage} 点伤害！`)
        }
      }

      // Check for counter-attack (only if defender is still alive and attacker is player)
      if (defender.hp > 0 && attacker === this.player && Math.random() < defender.counterChance) {
        const counterDamage = this.calculateDamage(defender.attack * 0.7, attacker.defense, defender.critChance, attacker.critResist, defender.ignoreDefense)
        attacker.hp -= counterDamage
        this.logBattle(`${defender.name} 发动了反击，对你造成了 ${counterDamage} 点伤害！`)
      } else if (defender.hp > 0 && defender === this.player && Math.random() < defender.counterChance) {
        // Player can also counter-attack
        const counterDamage = this.calculateDamage(defender.attack * 0.7, attacker.defense, defender.critChance, attacker.critResist, defender.ignoreDefense)
        attacker.hp -= counterDamage
        this.logBattle(`你发动了反击，对 ${attacker.name} 造成了 ${counterDamage} 点伤害！`)
      }
    },
    fleeBattle () {
      if (!this.inBattle) return
      this.logBattle('你成功逃跑了！')
      this.endBattle(false) // Player fled, no victory
    },
    endBattle (isVictory) {
      if (this.turnTimer) {
        clearTimeout(this.turnTimer)
        this.turnTimer = null
      }
      const wasFlee = !isVictory && this.player.hp > 0
      const isTowerBattle = this.towerMonsters.some(m => m.name === this.enemy.name)

      if (isVictory) {
        this.logBattle(`你击败了 ${this.enemy.name}！`)
        this.handleMonsterDefeated()
        this.saveGame() // Save progress on victory
        if (isTowerBattle) {
          this.battleEndTimer = setTimeout(() => {
            this.startTowerBattle()
          }, 3000)
          return // Important to return here to not start a normal battle
        }
      } else if (this.player.hp <= 0) {
        this.logBattle('你被击败了...')
        if (isTowerBattle) {
          this.currentTowerLevel = this.player.highestTowerLevel
        }
      }

      this.inBattle = false
      this.enemy = null
      this.player.hp = this.player.maxHp // Restore to full health
      if (this.activePet) {
        this.activePet.hp = this.activePet.maxHp // Restore pet's health
      }
      this.logBattle('你的生命值已完全恢复。')

      // Only start a new normal battle if it wasn't a tower battle
      if (!wasFlee && !isTowerBattle) {
        this.logBattle('3秒后将开始新的战斗...')
        this.battleEndTimer = setTimeout(() => {
          this.startBattle()
        }, 3000)
      }
    },
    handleMonsterDefeated () {
      const monster = this.enemy
      if (!monster || !monster.drops) return

      if (this.towerMonsters.some(m => m.name === monster.name)) {
        if (this.currentTowerLevel === this.player.highestTowerLevel) {
          this.player.highestTowerLevel++
        }
        this.currentTowerLevel++
        this.logBattle(`恭喜你通过锁妖塔第 ${this.currentTowerLevel - 1} 层！`)
      }

      // Grant Gold & XP
      const goldGained = monster.level * 5
      const xpGained = monster.level * 10
      this.player.gold += goldGained
      this.player.xp += xpGained
      this.logBattle(`你获得了 ${goldGained} 金币和 ${xpGained} 经验值。`)
      this.checkLevelUp()
      if (this.activePet) {
        this.activePet.xp += xpGained
        this.logBattle(`你的宠物获得了 ${xpGained} 经验值。`)
        petService.checkPetLevelUp(this.activePet, this.logBattle)
      }

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
                baseHp: equipmentData.hp || 0,
                baseStrength: equipmentData.strength || 0,
                baseAgility: equipmentData.agility || 0,
                baseConstitution: equipmentData.constitution || 0
              }
              this.player.inventory.push(newEquipment)
              this.logBattle(`掉落了装备：${newEquipment.name}！`)
            }
          } else if (drop.type === 'material') {
            const existingMaterial = this.player.inventory.find(item => item.name === drop.name)
            if (existingMaterial) {
              existingMaterial.quantity = (existingMaterial.quantity || 1) + 1
            } else {
              this.player.inventory.push({ name: drop.name, type: 'material', quantity: 1 })
            }
            this.logBattle(`掉落了材料：${drop.name}！`)
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
          } else if (drop.type === 'pet') {
            if (this.player.pets.length < 5) {
              const petData = this.pets.find(p => p.id === drop.petId)
              if (petData) {
                const newPet = petService.createPet(petData)
                this.player.pets.push(newPet)
                this.logBattle(`你获得了新的宠物：${petData.name}！`)
                if (!this.player.activePetId) {
                  this.setPetStatus(newPet.instanceId, true)
                }
              }
            } else {
              this.logBattle('你找到了一个宠物，但你的宠物栏已满。')
            }
          }
        }
      })
    },
    equipItem (item, index) {
      inventoryService.equipItem(this.player, item, index, this.logBattle)
      characterService.updatePlayerStats(this.player, this.activePet)
    },
    unequipItem (slot) {
      inventoryService.unequipItem(this.player, slot, this.logBattle)
      characterService.updatePlayerStats(this.player, this.activePet)
    },
    useItem (item, index) {
      inventoryService.useItem(this.player, item, index, this.logBattle)
    },
    equipSkill (skillItem, slotIndex, slotType) {
      skillService.equipSkill(this.player, skillItem, slotIndex, slotType, this.skillsData, this.logBattle)
      characterService.updatePlayerStats(this.player, this.activePet)
    },
    unequipSkill (skill, slotIndex, slotType) {
      skillService.unequipSkill(this.player, skill, slotIndex, slotType, this.logBattle)
      characterService.updatePlayerStats(this.player, this.activePet)
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
      // This method is now obsolete as stats are calculated in updatePlayerStats.
      // Kept for reference, but can be removed.
      console.warn('removePassiveSkillEffects is deprecated.')
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
      // New percentage-based damage formula
      const ignoredDefense = defenderDefense * attackerIgnoreDefense
      const effectiveDefense = Math.max(0, defenderDefense - ignoredDefense)

      const damageReductionPercentage = (effectiveDefense / 20) / 100
      const actualReduction = Math.min(0.75, damageReductionPercentage) // Capped at 75%

      let damage = attackerAttack * (1 - actualReduction)

      // Ensure at least some damage is done if attack is positive
      if (damage < 1 && attackerAttack > 0) {
        damage = 1
      }

      const actualCritChance = Math.max(0, attackerCritChance - defenderCritResist)
      if (Math.random() < actualCritChance) {
        damage *= 1.5 // 1.5x critical damage
        this.logBattle('暴击！')
      }
      return Math.round(damage)
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
    },
    createPet (petData) {
      return petService.createPet(petData)
    },
    updatePetStats (petObject) {
      petService.updatePetStats(petObject || this.activePet)
    },
    assignPetPoint (petInstanceId, attribute) {
      const pet = this.player.pets.find(p => p.instanceId === petInstanceId)
      petService.assignPetPoint(pet, attribute)
    },
    checkPetLevelUp () {
      petService.checkPetLevelUp(this.activePet, this.logBattle)
    },
    setPetStatus (petInstanceId, isActive) {
      if (isActive) {
        this.player.activePetId = petInstanceId
        const pet = this.player.pets.find(p => p.instanceId === petInstanceId)
        if (pet) {
          this.logBattle(`${pet.name} 已设置为出战状态。`)
        }
      } else {
        const pet = this.activePet
        if (pet) {
          this.logBattle(`${pet.name} 已设置为休息状态。`)
        }
        this.player.activePetId = null
      }
      this.updatePlayerStats()
    },
    releasePet (petInstanceId) {
      const petIndex = this.player.pets.findIndex(p => p.instanceId === petInstanceId)
      if (petIndex > -1) {
        const petName = this.player.pets[petIndex].name
        if (this.player.activePetId === petInstanceId) {
          this.player.activePetId = null
        }
        this.player.pets.splice(petIndex, 1)
        this.logBattle(`你放生了 ${petName}。`)
        characterService.updatePlayerStats(this.player, this.activePet)
      }
    },
    assignPoint (attribute) {
      characterService.assignPoint(this.player, attribute, this.activePet)
    },
    checkLevelUp () {
      characterService.checkLevelUp(this.player, this.logBattle, this.activePet)
    },
    toggleSection (sectionName) {
      if (this.sections[sectionName]) {
        this.sections[sectionName].collapsed = !this.sections[sectionName].collapsed
      }
    },
    showEnemyTooltip (event, enemy) {
      if (!enemy) return
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
            const itemData = this.equipment.find(e => e.id === drop.itemId)
            if (itemData) itemName = itemData.name
          } else if (drop.type === 'skill') {
            const skillData = this.skillsData.find(s => s.id === drop.skillId)
            if (skillData) itemName = `${skillData.name} 技能书`
          } else if (drop.type === 'pet') {
            const petData = this.pets.find(p => p.id === drop.petId)
            if (petData) itemName = petData.name
          }
          if (itemName) {
            content += `${itemName} (${((drop.chance || 0) * 100).toFixed(1)}%)<br>`
          }
        })
      }

      this.tooltip.content = content
      this.tooltip.visible = true
      this.tooltip.top = event.pageY + 10
      this.tooltip.left = event.pageX + 10
    }
  }
}
</script>

<style scoped>
.backpack-controls {
  margin-bottom: 10px;
}

.backpack-controls button {
  margin-right: 10px;
}

.backpack-controls button.active-category {
  background-color: #4299E1; /* Brighter blue */
  border: 2px solid #90CDF4; /* Light blue border */
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.3);
  transform: translateY(1px);
}
</style>
