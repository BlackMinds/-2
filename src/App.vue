<template>
  <div id="app">
    <TextGame />
  </div>
</template>

<script>
import TextGame from './components/Game.vue'

export default {
  name: 'App',
  components: {
    TextGame
  }
}
</script>

<style>
html, body, #app {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow: hidden; /* Prevent scrolling on the main page */
}
</style>
