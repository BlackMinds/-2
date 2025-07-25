<template>
  <div id="game-container" style="padding-top: 100px">
    <app-header ref="appHeader" :player="player" @forge-item="handleForgeItem" @open-blind-box="handleOpenBlindBox" @open-profession-system="openProfessionSystem"></app-header>
    <div class="left-panel" >
      <div class="section character-attributes">
        <h2 @click="toggleSection('character')">
          角色属性界面 (Character Attributes)
          <span class="toggle-arrow">{{ sections.character.collapsed ? '▼' : '▲' }}</span>
        </h2>
        <div v-if="!sections.character.collapsed" class="attributes-grid">
          <div class="primary-attributes">
            <p>姓名:
              <span v-if="!isEditingName" @click="isEditingName = true">{{ player.name }}</span>
              <input v-else type="text" v-model="player.name" @blur="saveName" @keyup.enter="saveName" ref="nameInput">
            </p>
            <p>等级: {{ player.level }}</p>
            <p>经验: {{ player.xp }} / {{ player.xpToNextLevel }}</p>
            <p v-if="player.attributePoints > 0">可用属性点: {{ player.attributePoints }}</p>
            <p>生命值: {{ player.hp }}/{{ player.maxHp }}</p>
            <p>力量: {{ player.strength }} <button v-if="player.attributePoints > 0" @click="assignPoint('baseStrength')" :disabled="inBattle">+</button></p>
            <p>敏捷: {{ player.agility }} <button v-if="player.attributePoints > 0" @click="assignPoint('baseAgility')" :disabled="inBattle">+</button></p>
            <p>体质: {{ player.constitution }} <button v-if="player.attributePoints > 0" @click="assignPoint('baseConstitution')" :disabled="inBattle">+</button></p>
            <button @click="resetAttributePoints" :disabled="inBattle">重置属性点</button>
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
            <div v-for="(enemy, index) in enemies" :key="index" class="character-status" @mouseover="showEnemyTooltip($event, enemy)" @mouseout="hideTooltip">
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
            <button @click="backpackCategory = 'materials'" :class="{ 'active-category': backpackCategory === 'materials' }">材料</button>
            <button @click="sellAllItems">一键出售装备</button>
          </div>
          <ul>
            <li v-for="(item, index) in filteredInventory" :key="index" @mouseover="showTooltip($event, item)" @mouseout="hideTooltip">
            {{ item.name }} <span v-if="item.quantity">x{{ item.quantity }}</span> {{ item.enhancementLevel > 0 ? '+' + item.enhancementLevel : '' }} ({{ item.type }})
            <button v-if="item.slot && item.type !== 'necklace'" @click="enhanceItem(item, 'inventory', index)" :disabled="inBattle">强化</button>
            <button v-if="item.slot" @click="equipItem(item)" :disabled="inBattle">装备</button>
            <button v-if="item.type === 'consumable'" @click="useItem(item, index)" :disabled="inBattle">使用</button>
            <button @click="sellItem(item)" :disabled="inBattle">出售</button>
          </li>
        </ul>
        </div>
      </div>
    </div>

    <div v-if="tooltip.visible" class="tooltip" :style="{ top: tooltip.top + 'px', left: tooltip.left + 'px' }" v-html="tooltip.content"></div>

    <profession-system
      :is-visible="isProfessionSystemVisible"
      :player="player"
      @close="isProfessionSystemVisible = false"
      @select-profession="handleSelectProfession"
      @select-branch="handleSelectBranch"
      @learn-skill="handleLearnSkill"
    ></profession-system>
  </div>

</template>

<script>
import monstersData from '../data/monsters.json'
import equipmentData from '../data/equipment.json'
import petsData from '../data/pets.json'
import towerMonstersData from '../data/tower-monsters.json'
import * as inventoryService from '../services/inventoryService.js'
import * as characterService from '../services/characterService.js'
import * as petService from '../services/petService.js'
import * as battleService from '../services/battleService.js'
import * as uiService from '../services/uiService.js'
import * as shopService from '../services/shopService.js'
import AppHeader from './Header.vue'
import ProfessionSystem from './ProfessionSystem.vue' // Import ProfessionSystem

export default {
  name: 'TextGame',
  components: {
    AppHeader,
    ProfessionSystem // Register ProfessionSystem
  },
  data () {
    return {
      isEditingName: false,
      isProfessionSystemVisible: false, // New data property for visibility
      player: characterService.initializePlayer(),
      enemies: [],
      inBattle: false,
      battleLog: [],
      monsters: monstersData,
      equipment: equipmentData,
      pets: petsData,
      towerMonsters: towerMonstersData,
      currentTowerLevel: 1,
      selectedMonsterLevel: 1, // Default selected level
      combatants: [], // Array of all participants (player + enemies)
      currentCombatantIndex: 0, // Index of the current combatant acting
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
    isEditingName (newValue) {
      if (newValue) {
        this.$nextTick(() => this.$refs.nameInput.focus())
      }
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
        case 'materials':
          return this.player.inventory.filter(item => item.type === 'material' || item.type === 'consumable')
        default:
          return this.player.inventory
      }
    }
  },
  methods: {
    saveName () {
      this.isEditingName = false
      this.saveGame()
    },
    handleOpenBlindBox ({ cost, times }, callback) {
      shopService.handleOpenBlindBox(this.player, { cost, times }, this.logBattle, callback)
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
      this.player = characterService.loadPlayer()
      this.currentTowerLevel = this.player.highestTowerLevel || 1
      this.logBattle('游戏进度已加载。')
    },
    showTooltip (event, item) {
      const tooltipData = uiService.showTooltip(event, item, this.player)
      if (tooltipData) {
        this.tooltip = tooltipData
      }
    },
    hideTooltip () {
      this.tooltip = uiService.hideTooltip()
    },
    showEnemyTooltip (event, enemy) {
      const tooltipData = uiService.showEnemyTooltip(event, enemy, this.equipment, this.pets)
      if (tooltipData) {
        this.tooltip = tooltipData
      }
    },
    enhanceItem (item, location, identifier) {
      inventoryService.enhanceItem(this.player, item, location, this.logBattle, this.activePet, this.hideTooltip)
      this.saveGame()
    },
    startTowerBattle () {
      if (this.battleEndTimer) clearTimeout(this.battleEndTimer)
      if (this.turnTimer) clearTimeout(this.turnTimer)

      const towerMonster = this.towerMonsters.find(m => m.level === this.currentTowerLevel)
      if (!towerMonster) {
        this.logBattle('你已经通关了锁妖塔！')
        return
      }

      this.enemies = []
      const enemyCount = Math.floor(Math.random() * 5) + 1
      for (let i = 0; i < enemyCount; i++) {
        this.enemies.push({ ...towerMonster, maxHp: towerMonster.hp, instanceId: `enemy-${Date.now()}-${i}` }) // Add unique instanceId
      }
      this.inBattle = true
      this.battleLog = [`你开始挑战锁妖塔第 ${this.currentTowerLevel} 层！`]
      this.logBattle(`你遇到了 ${this.enemies.length} 个 ${this.enemies[0].name}！`)

      // Initialize combatants array with direct references and sort by moveSpeed
      this.combatants = [
        this.player, // Direct reference to player
        ...this.enemies // Direct references to enemies
      ]
      // Add isPlayer flag to player object for combatant logic
      this.player.isPlayer = true
      this.player.instanceId = 'player' // Ensure player has an instanceId

      this.combatants.sort((a, b) => b.moveSpeed - a.moveSpeed) // Higher moveSpeed acts first
      this.currentCombatantIndex = 0
      this.logBattle('战斗开始！')
      this.nextCombatantTurn() // Start the first combatant's turn
    },
    sellAllItems () {
      inventoryService.sellAll(this.player, this.logBattle)
      this.saveGame()
    },
    sellItem (item) {
      inventoryService.sellItem(this.player, item, this.logBattle)
      this.saveGame()
    },
    startBattle () {
      if (this.inBattle) return
      if (this.battleEndTimer) clearTimeout(this.battleEndTimer)
      if (this.turnTimer) clearTimeout(this.turnTimer)

      if (!this.selectedMonsterLevel) {
        this.logBattle('请选择一个怪物等级开始战斗！')
        return
      }
      this.enemies = []
      const enemyCount = Math.floor(Math.random() * 5) + 1
      for (let i = 0; i < enemyCount; i++) {
        const monster = battleService.getRandomMonster(this.monsters, this.selectedMonsterLevel)
        if (monster) {
          this.enemies.push({ ...monster, instanceId: `enemy-${Date.now()}-${i}` }) // Add unique instanceId
        }
      }
      if (this.enemies.length === 0) {
        this.logBattle('错误：没有可用的怪物数据！')
        return
      }
      this.inBattle = true
      this.battleLog = [`你遇到了 ${this.enemies.length} 个 ${this.enemies[0].name}！`]

      // Initialize combatants array with direct references and sort by moveSpeed
      this.combatants = [
        this.player, // Direct reference to player
        ...this.enemies // Direct references to enemies
      ]
      // Add isPlayer flag to player object for combatant logic
      this.player.isPlayer = true
      this.player.instanceId = 'player' // Ensure player has an instanceId

      this.combatants.sort((a, b) => b.moveSpeed - a.moveSpeed) // Higher moveSpeed acts first
      this.currentCombatantIndex = 0
      this.logBattle('战斗开始！')
      this.nextCombatantTurn() // Start the first combatant's turn
    },
    updatePlayerStats () {
      characterService.updatePlayerStats(this.player, this.activePet)
    },
    updateState (newState) { // Changed to regular function
      for (const key in newState) {
        this[key] = newState[key]
      }
    },
    nextCombatantTurn () { // Renamed from processTurn
      const { player, enemies, battleLog, activePet, endBattle } = this // Removed updateState from destructuring here
      if (!this.inBattle || player.hp <= 0 || enemies.every(e => e.hp <= 0)) {
        endBattle(enemies.every(e => e.hp <= 0), player, enemies)
        return
      }

      // Find the next living combatant
      let currentCombatant = null
      const originalIndex = this.currentCombatantIndex
      let foundNext = false

      for (let i = 0; i < this.combatants.length; i++) {
        const index = (originalIndex + i) % this.combatants.length
        const combatant = this.combatants[index] // This is now a direct reference

        if (combatant && combatant.hp > 0) {
          currentCombatant = combatant // Use the direct reference
          this.currentCombatantIndex = index
          foundNext = true
          break
        }
      }

      if (!foundNext) {
        // No living combatants left, battle should end
        endBattle(enemies.every(e => e.hp <= 0), player, enemies)
        return
      }

      // Prepare gameContext for battleService
      const gameContext = {
        player: player,
        enemies: enemies,
        battleLog: battleLog,
        activePet: activePet,
        endBattle: endBattle,
        updateState: this.updateState, // Pass the component's method directly
        nextTurn: () => {
          // Schedule next combatant's turn after a delay
          this.turnTimer = setTimeout(() => {
            this.currentCombatantIndex = (this.currentCombatantIndex + 1) % this.combatants.length
            this.nextCombatantTurn()
          }, 1000)
        }
      }

      if (currentCombatant.isPlayer) {
        battleService.processPlayerTurn(gameContext)
      } else {
        battleService.processEnemyTurn(currentCombatant, gameContext)
      }
    },
    fleeBattle () {
      if (!this.inBattle) return
      if (this.turnTimer) clearTimeout(this.turnTimer)
      this.logBattle('你成功逃跑了！')
      this.endBattle(false, this.player, this.enemies)
    },
    endBattle (isVictory, player, enemies) {
      if (this.turnTimer) clearTimeout(this.turnTimer)
      const isTowerBattle = enemies.length > 0 && this.towerMonsters.some(m => m.name === enemies[0].name)

      this.inBattle = false // Always exit battle state
      this.enemies = [] // Clear enemies
      this.combatants = [] // Clear combatants
      player.hp = player.maxHp // Restore player HP
      if (this.activePet) this.activePet.hp = this.activePet.maxHp // Restore pet HP
      this.logBattle('你的生命值已完全恢复。')

      if (isVictory) {
        this.logBattle('你击败了所有敌人！')
        enemies.forEach(enemy => this.handleMonsterDefeated(enemy, player))
        this.saveGame()
        if (isTowerBattle) {
          this.logBattle('3秒后将继续挑战锁妖塔...')
          this.battleEndTimer = setTimeout(() => this.startTowerBattle(), 3000)
        } else {
          this.logBattle('3秒后将开始新的战斗...')
          this.battleEndTimer = setTimeout(() => this.startBattle(), 3000)
        }
      } else if (player.hp <= 0) { // Player defeated
        this.logBattle('你被击败了...')
        if (isTowerBattle) {
          this.currentTowerLevel = player.highestTowerLevel // Reset tower level on defeat
          this.logBattle('3秒后将重新挑战锁妖塔...')
          this.battleEndTimer = setTimeout(() => this.startTowerBattle(), 3000)
        } else {
          this.logBattle('3秒后将开始新的战斗...')
          this.battleEndTimer = setTimeout(() => this.startBattle(), 3000)
        }
      } else { // Player fled
        this.logBattle('你成功逃跑了！')
        if (!isTowerBattle) { // If fled from a non-tower battle, restart
          this.logBattle('3秒后将开始新的战斗...')
          this.battleEndTimer = setTimeout(() => this.startBattle(), 3000)
        }
      }
    },
    handleMonsterDefeated (monster, player) {
      if (!monster || !monster.drops) return

      if (this.towerMonsters.some(m => m.name === monster.name)) {
        if (this.currentTowerLevel === this.player.highestTowerLevel) {
          this.player.highestTowerLevel++
        }
        this.currentTowerLevel++
        this.logBattle(`恭喜你通过锁妖塔第 ${this.currentTowerLevel - 1} 层！`)

        // New: Tower monsters on floors 50-100 drop pet skill books
        if (this.currentTowerLevel >= 50 && this.currentTowerLevel <= 100) {
          if (Math.random() < 0.15) { // 15% chance to drop a pet skill book
            const petSkillBook = { name: '宠物技能书', type: 'skill', skillId: 'generic_pet_skill_book' } // Placeholder skillId
            player.inventory.push(petSkillBook)
            this.logBattle('掉落了宠物技能书！')
          }
        }
      }

      const goldGained = Math.round(monster.level * 5 * (1 + (player.goldBonus || 0)))
      const xpGained = monster.level * 10
      player.gold += goldGained
      player.xp += xpGained
      this.logBattle(`你获得了 ${goldGained} 金币和 ${xpGained} 经验值。`)
      characterService.checkLevelUp(player, this.logBattle, this.activePet)
      if (this.activePet) {
        this.activePet.xp += xpGained
        this.logBattle(`你的宠物获得了 ${xpGained} 经验值。`)
        petService.checkPetLevelUp(this.activePet, this.logBattle)
      }

      monster.drops.forEach(drop => {
        if (Math.random() < drop.chance) {
          if (drop.type === 'equipment') {
            const equipmentData = this.equipment.find(e => e.id === drop.itemId)
            if (equipmentData) {
              const newEquipment = { ...equipmentData, type: 'equipment', enhancementLevel: 0, baseAttack: equipmentData.attack || 0, baseDefense: equipmentData.defense || 0, baseHp: equipmentData.hp || 0, baseStrength: equipmentData.strength || 0, baseAgility: equipmentData.agility || 0, baseConstitution: equipmentData.constitution || 0 }
              player.inventory.push(newEquipment)
              this.logBattle(`掉落了装备：${newEquipment.name}！`)
            }
          } else if (drop.type === 'material') {
            const existingMaterial = player.inventory.find(item => item.name === drop.name)
            if (existingMaterial) existingMaterial.quantity = (existingMaterial.quantity || 1) + 1
            else player.inventory.push({ name: drop.name, type: 'material', quantity: 1 })
            this.logBattle(`掉落了材料：${drop.name}！`)
          } else if (drop.type === 'skill') {
            // Removed skill drop logic
          } else if (drop.type === 'pet') {
            if (player.pets.length < 5) {
              const petData = this.pets.find(p => p.id === drop.petId)
              if (petData) {
                const newPet = petService.createPet(petData)
                player.pets.push(newPet)
                this.logBattle(`你获得了新的宠物：${petData.name}！`)
                if (!player.activePetId) this.setPetStatus(newPet.instanceId, true)
              }
            } else {
              this.logBattle('你找到了一个宠物，但你的宠物栏已满。')
            }
          }
        }
      })
    },
    equipItem (item) {
      inventoryService.equipItem(this.player, item, this.logBattle)
      characterService.updatePlayerStats(this.player, this.activePet)
    },
    unequipItem (slot) {
      inventoryService.unequipItem(this.player, slot, this.logBattle)
      characterService.updatePlayerStats(this.player, this.activePet)
    },
    useItem (item, index) {
      inventoryService.useItem(this.player, item, index, this.logBattle)
    },
    logBattle (message) {
      battleService.logBattle(this.battleLog, message)
    },
    assignPetPoint (petInstanceId, attribute) {
      const pet = this.player.pets.find(p => p.instanceId === petInstanceId)
      petService.assignPetPoint(pet, attribute)
    },
    setPetStatus (petInstanceId, isActive) {
      petService.setPetStatus(this.player, petInstanceId, isActive, this.logBattle, this.updatePlayerStats)
    },
    releasePet (petInstanceId) {
      petService.releasePet(this.player, petInstanceId, this.logBattle, this.updatePlayerStats)
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
    resetAttributePoints () {
      characterService.resetAttributePoints(this.player, this.logBattle, this.activePet)
      this.saveGame()
    },
    openProfessionSystem () {
      this.isProfessionSystemVisible = true
    },
    handleSelectProfession (professionId) {
      this.player.profession = professionId
      // Skill point is granted when selecting a branch, not just profession
      this.logBattle(`你选择了职业：${professionId}！现在请选择你的分支。`)
      this.saveGame()
      // Do not close modal here, wait for branch selection
    },
    handleSelectBranch (branchId) {
      this.player.branch = branchId
      this.player.skillPoints += 1 // Grant 1 skill point upon branch selection
      this.logBattle(`你选择了分支：${branchId}，并获得了1个技能点！`)
      this.saveGame()
      this.isProfessionSystemVisible = false // Close after branch selection
    },
    handleLearnSkill (skillId) {
      if (this.player.skillPoints > 0 && !this.player.learnedSkills.includes(skillId)) {
        this.player.learnedSkills.push(skillId)
        this.player.skillPoints--
        this.logBattle(`你学习了技能：${skillId}！`)
        this.saveGame()
      } else {
        this.logBattle('无法学习技能：技能点不足或已学习。')
      }
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
