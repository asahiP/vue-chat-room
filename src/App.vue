<template>
  <div id="app">
    <component :is="currentComponent" @router="router"></component>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator'

import ChatHome from './components/Home.vue'
import ChatLobby from './components/Lobby.vue'

@Component({
  components: {
    ChatHome,
    ChatLobby
  }
})
export default class App extends Vue {
  currentComponent: string = 'ChatHome'

  router (componentName: string) {
    this.currentComponent = componentName
  }

}
</script>

<style>
* {
  margin: 0;

  padding: 0;

  -webkit-tap-highlight-color: transparent;
}

html, body {
  height: 100%;
}
</style>

<style lang="scss" scoped>
#app {
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>
