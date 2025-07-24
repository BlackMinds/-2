<template>
  <div class="profession-modal-overlay" v-if="isVisible" @click.self="close">
    <div class="profession-modal-content">
      <h2>职业系统</h2> 暂时没效果暂时没效果暂时没效果暂时没效果暂时没效果暂时没效果暂时没效果暂时没效果暂时没效果暂时没效果暂时没效果暂时没效果暂时没效果暂时没效果暂时没效果暂时没效果
      <p class="modal-description">选择你的职业，并在达到10级时获得技能点！</p>

      <div class="professions-grid">
        <div
          v-for="profession in professions"
          :key="profession.id"
          :class="['profession-card', { 'selected': player.profession === profession.id, 'disabled': player.level < 10 }]"
          @click="selectProfession(profession.id)"
        >
          <h3>{{ profession.name }}</h3>
          <p>{{ profession.description }}</p>
          <div v-if="player.level < 10" class="level-overlay">
            <p>等级不足 (需要10级)</p>
          </div>
          <button
            v-if="player.profession === profession.id && !player.branch"
            class="selected-indicator"
            disabled
          >
            已选择
          </button>
        </div>
      </div>

      <div class="branch-selection-section" v-if="player.profession && !player.branch">
        <h3>选择你的分支 (转职)</h3>
        <p class="modal-description">一旦选择，将无法更改！</p>
        <div class="branches-grid">
          <div
            v-for="branch in getProfessionBranches(player.profession)"
            :key="branch.id"
            :class="['branch-card', { 'disabled': player.level < 10 }]"
            @click="selectBranch(branch.id)"
          >
            <h4>{{ branch.name }}</h4>
            <p>{{ branch.description }}</p>
            <div v-if="player.level < 10" class="level-overlay">
              <p>等级不足 (需要10级)</p>
            </div>
          </div>
        </div>
      </div>

      <div class="skill-points-section" v-if="player.profession && player.branch">
        <h3>技能点 (可用: {{ player.skillPoints }})</h3>
        <div class="skills-grid">
          <div
            v-for="skill in getBranchSkills(player.profession, player.branch)"
            :key="skill.id"
            :class="['skill-card', { 'learned': player.learnedSkills.includes(skill.id), 'disabled': player.skillPoints === 0 || player.learnedSkills.includes(skill.id) || player.level < skill.levelRequired }]"
            @click="learnSkill(skill.id)"
          >
            <h4>{{ skill.name }}</h4>
            <p>{{ skill.description }}</p>
            <p v-if="player.level < skill.levelRequired" class="skill-level-req">需要等级: {{ skill.levelRequired }}</p>
            <button
              v-if="!player.learnedSkills.includes(skill.id)"
              :disabled="player.skillPoints === 0 || player.learnedSkills.includes(skill.id) || player.level < skill.levelRequired"
            >
              学习
            </button>
            <button v-else class="learned-indicator" disabled>已学习</button>
          </div>
        </div>
      </div>

      <button class="close-button" @click="close">关闭</button>
    </div>
  </div>
</template>

<script>
import professionsData from '../data/professions.json'
import skillsData from '../data/skills.json'

export default {
  name: 'ProfessionSystem',
  props: {
    isVisible: {
      type: Boolean,
      required: true
    },
    player: {
      type: Object,
      required: true
    }
  },
  data () {
    return {
      professions: professionsData,
      allSkills: skillsData
    }
  },
  methods: {
    close () {
      this.$emit('close')
    },
    selectProfession (professionId) {
      if (this.player.level < 10) {
        alert('等级不足，需要达到10级才能选择职业！')
        return
      }
      if (this.player.profession) {
        alert('你已经选择过职业了，不能再次选择！')
        return
      }
      this.$emit('select-profession', professionId)
    },
    getProfessionBranches (professionId) {
      const profession = this.professions.find(p => p.id === professionId)
      return profession ? profession.branches : []
    },
    selectBranch (branchId) {
      if (this.player.level < 10) {
        alert('等级不足，需要达到10级才能选择分支！')
        return
      }
      if (this.player.branch) {
        alert('你已经选择过分支了，不能再次选择！')
        return
      }
      this.$emit('select-branch', branchId)
    },
    getBranchSkills (professionId, branchId) {
      return this.allSkills.filter(skill => skill.profession === professionId && skill.branch === branchId)
    },
    learnSkill (skillId) {
      const skill = this.allSkills.find(s => s.id === skillId)
      if (!skill) return

      if (this.player.level < skill.levelRequired) {
        alert(`等级不足，学习此技能需要达到${skill.levelRequired}级！`)
        return
      }

      if (this.player.skillPoints <= 0) {
        alert('没有可用的技能点！')
        return
      }
      if (this.player.learnedSkills.includes(skillId)) {
        alert('你已经学习过这个技能了！')
        return
      }
      this.$emit('learn-skill', skillId)
    }
  }
}
</script>

<style scoped>
.profession-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.profession-modal-content {
  background: #2c3e50; /* Dark background */
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
  width: 80%;
  max-width: 900px;
  color: #ecf0f1; /* Light text */
  text-align: center;
  position: relative;
  border: 2px solid #3498db; /* Blue border */
}

.profession-modal-content h2 {
  color: #3498db; /* Blue heading */
  margin-bottom: 15px;
  font-size: 2em;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
}

.modal-description {
  margin-bottom: 25px;
  font-size: 1.1em;
  color: #bdc3c7;
}

.professions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.profession-card {
  background: #34495e; /* Slightly lighter dark background */
  padding: 20px;
  border-radius: 8px;
  border: 2px solid #4a627a;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.profession-card:hover:not(.selected):not(.disabled) {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
  border-color: #3498db;
}

.profession-card.selected {
  border-color: #2ecc71; /* Green for selected */
  box-shadow: 0 0 15px rgba(46, 204, 113, 0.6);
  cursor: default;
}

.profession-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #2c3e50;
  border-color: #555;
}

.profession-card h3 {
  color: #3498db;
  margin-bottom: 10px;
  font-size: 1.5em;
}

.profession-card p {
  color: #ecf0f1;
  font-size: 0.95em;
  line-height: 1.4;
}

.level-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  color: #e74c3c; /* Red for warning */
  font-size: 1.3em;
  font-weight: bold;
  text-shadow: 1px 1px 3px rgba(0,0,0,0.7);
}

.selected-indicator {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background-color: #2ecc71;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 5px;
  font-size: 0.9em;
  cursor: default;
}

.branch-selection-section {
  margin-top: 30px;
  border-top: 1px solid #4a627a;
  padding-top: 20px;
}

.branch-selection-section h3 {
  color: #3498db;
  margin-bottom: 20px;
  font-size: 1.8em;
}

.branches-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.branch-card {
  background: #34495e;
  padding: 20px;
  border-radius: 8px;
  border: 2px solid #4a627a;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.branch-card:hover:not(.disabled) {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
  border-color: #3498db;
}

.branch-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #2c3e50;
  border-color: #555;
}

.branch-card h4 {
  color: #3498db;
  margin-bottom: 10px;
  font-size: 1.5em;
}

.branch-card p {
  color: #ecf0f1;
  font-size: 0.95em;
  line-height: 1.4;
}

.skill-points-section {
  margin-top: 30px;
  border-top: 1px solid #4a627a;
  padding-top: 20px;
}

.skill-points-section h3 {
  color: #3498db;
  margin-bottom: 20px;
  font-size: 1.8em;
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.skill-card {
  background: #34495e;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #4a627a;
  text-align: left;
  position: relative;
  transition: all 0.2s ease;
}

.skill-card:not(.learned):not(.disabled):hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.3);
  border-color: #3498db;
  cursor: pointer;
}

.skill-card.learned {
  border-color: #2ecc71;
  background: #284050;
  cursor: default;
}

.skill-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #2c3e50;
  border-color: #555;
}

.skill-card h4 {
  color: #3498db;
  margin-bottom: 8px;
  font-size: 1.2em;
}

.skill-card p {
  color: #bdc3c7;
  font-size: 0.85em;
  margin-bottom: 10px;
}

.skill-level-req {
  color: #e74c3c;
  font-weight: bold;
  margin-top: 5px;
}

.skill-card button {
  background-color: #3498db;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  font-size: 0.9em;
}

.skill-card button:hover:not(:disabled) {
  background-color: #2980b9;
}

.skill-card button:disabled {
  background-color: #555;
  cursor: not-allowed;
}

.learned-indicator {
  background-color: #2ecc71 !important;
  cursor: default !important;
}

.close-button {
  background-color: #e74c3c;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  margin-top: 30px;
  font-size: 1.1em;
  transition: background-color 0.2s ease;
}

.close-button:hover {
  background-color: #c0392b;
}
</style>
