<template>
  <div @click="openViewer" style="overflow: hidden;">
    <img
      :src="src"
      :alt="alt"
      v-show="state === 'ready'"
      :width="width"
      :height="height"
      @load="state = 'ready'"
      @error="state = 'error'"
      style="cursor: pointer;"
    >
    <div
      :class="[
        'iconfont',
        state === 'unready'
          ? 'viewer-container-unready'
          : state === 'ready'
            ? 'viewer-container-ready'
            : 'viewer-container-error'
      ]"
      :style="style"
    ></div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class ViewerContainer extends Vue {
  @Prop({ required: true }) src!: string
  @Prop({ required: false }) width!: number
  @Prop({ required: false }) height!: number
  @Prop({ required: false }) alt!: string
  @Prop({ required: false }) mutation!: string

  state: string = 'unready'

  openViewer (): void {
    let { state, mutation } = this

    if (state === 'ready' && mutation) {
      let { src } = this
      this.$store.commit(mutation, { src, active: true })
    }
  }

  get style (): string {
    let
      width = this.width || this.height || 200,
      height = this.height || this.width || 200

    return `width: ${width}px; height: ${height}px`
  }
}
</script>

<style lang="scss" scoped>
@keyframes rotate {
  from { transform: rotate(0) }
  to { transform: rotate(360deg) }
}

.viewer-container-unready {
  position: relative;

  color: rgb(170, 170, 170);
  font-size: 4rem;
  
  background: rgb(240, 240, 240);

  &:before {
  animation: rotate 1s linear infinite;

  content: "\e600";
  }
}

.viewer-container-ready {
  display: none;
}

.viewer-container-error {
  position: relative;

  color: rgb(170, 170, 170);
  font-size: 4rem;
  
  background: rgb(240, 240, 240);
  
  &:before {
    content: "\ec0d";
  }
}
</style>

