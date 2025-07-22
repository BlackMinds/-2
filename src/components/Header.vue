<template>
  <div class="header">
    <button @click="showForgeModal = true">打造</button>
    <button @click="showBlindBoxModal = true" style="margin-left: 10px;">盲盒</button>
    <button @click="showHelpModal = true" style="margin-left: 10px;">帮助文档</button>

    <div v-if="showForgeModal" class="modal">
      <div class="modal-content">
        <span class="close" @click="showForgeModal = false">&times;</span>
        <h2>打造项链</h2>
        <p>你需要花费: {{ totalCost }} 金币。</p>
        <p>你当前的金币: {{ player.gold }}</p>
        <div class="materials-section">
          <p>灵魂精粹 (增幅所有属性): {{ soulEssenceCount }}</p>
          <input type="range" min="0" :max="maxSoulEssence" v-model.number="materialsToUse.soulEssence" />
          <span>使用: {{ materialsToUse.soulEssence }}</span>
        </div>
        <div class="materials-section">
          <p>敏捷水晶 (增幅闪避和连击): {{ agilityCrystalCount }}</p>
          <input type="range" min="0" :max="maxAgilityCrystal" v-model.number="materialsToUse.agilityCrystal" />
          <span>使用: {{ materialsToUse.agilityCrystal }}</span>
        </div>
        <div class="materials-section">
          <p>狂怒之石 (增幅暴击和反击): {{ rageStoneCount }}</p>
          <input type="range" min="0" :max="maxRageStone" v-model.number="materialsToUse.rageStone" />
          <span>使用: {{ materialsToUse.rageStone }}</span>
        </div>
        <div class="materials-section">
          <p>穿透之眼 (增幅忽视防御和抗暴): {{ penetratingEyeCount }}</p>
          <input type="range" min="0" :max="maxPenetratingEye" v-model.number="materialsToUse.penetratingEye" />
          <span>使用: {{ materialsToUse.penetratingEye }}</span>
        </div>
        <div class="materials-section">
          <p>力量之源 (增幅力量): {{ strengthSourceCount }}</p>
          <input type="range" min="0" :max="maxStrengthSource" v-model.number="materialsToUse.strengthSource" />
          <span>使用: {{ materialsToUse.strengthSource }}</span>
        </div>
        <div class="materials-section">
          <p>敏捷之风 (增幅敏捷): {{ agilityWindCount }}</p>
          <input type="range" min="0" :max="maxAgilityWind" v-model.number="materialsToUse.agilityWind" />
          <span>使用: {{ materialsToUse.agilityWind }}</span>
        </div>
        <div class="materials-section">
          <p>体质之岩 (增幅体质): {{ constitutionRockCount }}</p>
          <input type="range" min="0" :max="maxConstitutionRock" v-model.number="materialsToUse.constitutionRock" />
          <span>使用: {{ materialsToUse.constitutionRock }}</span>
        </div>
        <div class="item-preview">
          <h4>属性预览</h4>
          <p>攻击力: +{{ (previewStats.percentAttack * 100).toFixed(2) }}%</p>
          <p>防御力: +{{ (previewStats.percentDefense * 100).toFixed(2) }}%</p>
          <p>生命值: +{{ (previewStats.percentHp * 100).toFixed(2) }}%</p>
          <p>力量: +{{ previewStats.strength }}</p>
          <p>敏捷: +{{ previewStats.agility }}</p>
          <p>体质: +{{ previewStats.constitution }}</p>
          <p>闪避率: +{{ (previewStats.evasion * 100).toFixed(2) }}%</p>
          <p>暴击率: +{{ (previewStats.critChance * 100).toFixed(2) }}%</p>
          <p>抗暴击率: +{{ (previewStats.critResist * 100).toFixed(2) }}%</p>
          <p>连击几率: +{{ (previewStats.comboChance * 100).toFixed(2) }}%</p>
          <p>反击几率: +{{ (previewStats.counterChance * 100).toFixed(2) }}%</p>
          <p>忽视防御力: +{{ (previewStats.ignoreDefense * 100).toFixed(2) }}%</p>
        </div>
        <button @click="forge">打造</button>
      </div>
    </div>

    <div v-if="showBlindBoxModal" class="modal">
      <div class="modal-content">
        <span class="close" @click="closeBlindBoxModal">&times;</span>
        <h2>神秘盲盒</h2>
        <div v-if="blindBoxResults.length === 0">
          <p>你当前的金币: {{ player.gold }}</p>
          <div class="blind-box-options">
            <button @click="openBlindBox(10000, 10)">10000金币抽10次</button>
            <button @click="openBlindBox(100000, 10)">100000金币抽10次</button>
          </div>
        </div>
        <div v-else>
          <h3>抽奖结果</h3>
          <ul>
            <li v-for="(item, index) in blindBoxResults" :key="index">
              {{ item.name }} <span v-if="item.quantity > 1">x{{ item.quantity }}</span>
            </li>
          </ul>
          <button @click="drawAgain">下一次更好</button>
          <button @click="closeBlindBoxModal" style="margin-left: 10px;">关闭</button>
        </div>
      </div>
    </div>

    <div v-if="showHelpModal" class="modal">
      <div class="modal-content">
        <span class="close" @click="showHelpModal = false">&times;</span>
        <h2>怪物掉落表</h2>
        <div class="monster-drops-list">
          <div v-for="monster in monsterDrops" :key="monster.name" class="monster-drop-item">
            <h4>{{ monster.name }}</h4>
            <ul>
              <li v-for="drop in monster.drops" :key="drop.name">
                {{ drop.name }} - 掉落几率: {{ (drop.chance * 100).toFixed(2) }}%
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import monstersData from '@/data/monsters.json'
import equipmentData from '@/data/equipment.json'
import skillsData from '@/data/skills.json'
import petsData from '@/data/pets.json'

export default {
  name: 'AppHeader',
  props: {
    player: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      showForgeModal: false,
      showBlindBoxModal: false,
      showHelpModal: false,
      monsters: monstersData,
      blindBoxResults: [],
      lastBlindBoxDraw: { cost: 0, times: 0 },
      materialsToUse: {
        soulEssence: 0,
        agilityCrystal: 0,
        rageStone: 0,
        penetratingEye: 0,
        strengthSource: 0,
        agilityWind: 0,
        constitutionRock: 0
      }
    }
  },
  computed: {
    monsterDrops () {
      return this.monsters.map(monster => {
        const drops = monster.drops.map(drop => {
          let name = '未知物品'
          if (drop.type === 'equipment') {
            const equipment = equipmentData.find(e => e.id === drop.itemId)
            if (equipment) {
              name = equipment.name
            }
          } else if (drop.type === 'skill') {
            const skill = skillsData.find(s => s.id === drop.skillId)
            if (skill) {
              name = skill.name
            }
          } else if (drop.type === 'pet') {
            const pet = petsData.find(p => p.id === drop.petId)
            if (pet) {
              name = pet.name
            }
          }
          return { ...drop, name }
        })
        return { ...monster, drops }
      })
    },
    soulEssenceCount () {
      const soulEssence = this.player.inventory.find(item => item.name === '灵魂精粹')
      return soulEssence ? soulEssence.quantity : 0
    },
    agilityCrystalCount () {
      const agilityCrystal = this.player.inventory.find(item => item.name === '敏捷水晶')
      return agilityCrystal ? agilityCrystal.quantity : 0
    },
    rageStoneCount () {
      const rageStone = this.player.inventory.find(item => item.name === '狂怒之石')
      return rageStone ? rageStone.quantity : 0
    },
    penetratingEyeCount () {
      const penetratingEye = this.player.inventory.find(item => item.name === '穿透之眼')
      return penetratingEye ? penetratingEye.quantity : 0
    },
    strengthSourceCount () {
      const item = this.player.inventory.find(item => item.name === '力量之源')
      return item ? item.quantity : 0
    },
    agilityWindCount () {
      const item = this.player.inventory.find(item => item.name === '敏捷之风')
      return item ? item.quantity : 0
    },
    constitutionRockCount () {
      const item = this.player.inventory.find(item => item.name === '体质之岩')
      return item ? item.quantity : 0
    },
    maxSoulEssence () {
      return Math.min(10, this.soulEssenceCount)
    },
    maxAgilityCrystal () {
      return Math.min(10, this.agilityCrystalCount)
    },
    maxRageStone () {
      return Math.min(10, this.rageStoneCount)
    },
    maxPenetratingEye () {
      return Math.min(10, this.penetratingEyeCount)
    },
    maxStrengthSource () {
      return Math.min(10, this.strengthSourceCount)
    },
    maxAgilityWind () {
      return Math.min(10, this.agilityWindCount)
    },
    maxConstitutionRock () {
      return Math.min(10, this.constitutionRockCount)
    },
    totalCost () {
      const baseCost = 100
      const materialCost = Object.values(this.materialsToUse).reduce((a, b) => Number(a) + Number(b), 0) * 500
      return baseCost + materialCost
    },
    previewStats () {
      const bonusPerMaterial = 0.005
      const totalBonus = 1 + (this.materialsToUse.soulEssence * bonusPerMaterial)
      return {
        percentAttack: 0.05 * totalBonus,
        percentDefense: 0.05 * totalBonus,
        percentHp: 0.05 * totalBonus,
        strength: this.materialsToUse.strengthSource * 5,
        agility: this.materialsToUse.agilityWind * 5,
        constitution: this.materialsToUse.constitutionRock * 5,
        evasion: 0.01 + this.materialsToUse.agilityCrystal * 0.001,
        critChance: 0.01 + this.materialsToUse.rageStone * 0.001,
        critResist: 0.01 + this.materialsToUse.penetratingEye * 0.001,
        comboChance: 0.01 + this.materialsToUse.agilityCrystal * 0.001,
        counterChance: 0.01 + this.materialsToUse.rageStone * 0.001,
        ignoreDefense: 0.01 + this.materialsToUse.penetratingEye * 0.001
      }
    }
  },
  methods: {
    forge () {
      this.$emit('forge-item', this.materialsToUse)
    },
    closeForgeModal () {
      this.showForgeModal = false
    },
    openBlindBox (cost, times) {
      this.lastBlindBoxDraw = { cost, times }
      this.$emit('open-blind-box', { cost, times }, (results) => {
        this.blindBoxResults = results
      })
    },
    drawAgain () {
      this.openBlindBox(this.lastBlindBoxDraw.cost, this.lastBlindBoxDraw.times)
    },
    closeBlindBoxModal () {
      this.showBlindBoxModal = false
      this.blindBoxResults = []
    },
    closeModalOnEscape (event) {
      if (event.key === 'Escape') {
        if (this.showForgeModal) {
          this.showForgeModal = false
        }
        if (this.showBlindBoxModal) {
          this.closeBlindBoxModal()
        }
        if (this.showHelpModal) {
          this.showHelpModal = false
        }
      }
    }
  },
  mounted () {
    window.addEventListener('keydown', this.closeModalOnEscape)
  },
  beforeDestroy () {
    window.removeEventListener('keydown', this.closeModalOnEscape)
  }
}
</script>

<style scoped>
.monster-drops-list {
  text-align: left;
  max-height: 400px;
  overflow-y: auto;
}
.monster-drop-item {
  margin-bottom: 15px;
}
.header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 60px;
  background: linear-gradient(to right, #4A5568, #2D3748);
  padding: 0 20px;
  color: white;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  z-index: 1000;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid #2D3748;
}

button {
  background-color: #4299E1; /* Tailwind's blue-500 */
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s ease, transform 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

button:hover {
  background-color: #3182CE; /* Tailwind's blue-600 */
  transform: translateY(-2px);
}

.modal {
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  z-index: 1001;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgba(0,0,0,0.6);
}

.modal-content {
  background-color: #2D3748; /* Dark background */
  color: #E2E8F0; /* Light text */
  margin: auto;
  padding: 30px;
  border: 1px solid #4A5568;
  width: 90%;
  max-width: 500px;
  border-radius: 12px;
  box-shadow: 0 8px 16px rgba(0,0,0,0.3);
  position: relative;
  text-align: center;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.close {
  color: #90A4AE;
  position: absolute;
  top: 15px;
  right: 20px;
  font-size: 32px;
  font-weight: bold;
  transition: color 0.2s ease;
}

.close:hover,
.close:focus {
  color: #E2E8F0;
  text-decoration: none;
  cursor: pointer;
}

h2 {
  color: #63B3ED; /* Light blue for titles */
  margin-bottom: 20px;
}

.materials-section {
  margin: 20px 0;
}

.item-preview {
  margin-top: 20px;
  text-align: left;
  background-color: #4A5568;
  padding: 15px;
  border-radius: 8px;
}

input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  width: 80%;
  height: 8px;
  background: #4A5568;
  border-radius: 5px;
  outline: none;
  margin: 0 10px;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  background: #4299E1;
  border-radius: 50%;
  cursor: pointer;
}

input[type="range"]::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: #4299E1;
  border-radius: 50%;
  cursor: pointer;
}

.blind-box-options {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
}
</style>
