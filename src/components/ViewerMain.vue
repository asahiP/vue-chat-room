<template>
  <div
    class="viewer-container"
    v-show="$store.state.viewer.active"
    @dragstart="$event.preventDefault()"
    @mousedown.left="startMove"
    @touchstart="startMove"
  >
    <div class="viewer-mask"></div>
    <img
      width="100%"
      :src="$store.state.viewer.src"
      :class="['viewer-img', { 'viewer-moving': isMoving }]"
      :style="scaleStyle"
      ref="img"
      @load="bestFit"
    >
    <span
      class="iconfont icon-close viewer-close"
      @click="close"
    ></span>
    <div class="viewer-menubar">
      <span class="iconfont icon-zoomout viewer-button" @click="setCurrentScale(-10)"></span>
      <span v-text="currentScaleString" class="viewer-text"></span>
      <span class="iconfont icon-zoomin viewer-button" @click="setCurrentScale(10)"></span>
      <span class="iconfont icon-zoom viewer-button" @click="bestFit"></span>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

function PythagoreanTheorem (a: number, b: number): number {
  return Math.sqrt((a ** 2) + (b ** 2))
}

@Component
export default class ViewerMain extends Vue {
  @Prop({ required: true }) mutation!: string

  readonly maxScale: number = 200
  readonly minScale: number = 5
  defaultScale: number = 100
  currentScale: number = this.defaultScale
  fixScale: number = 1

  viewWidth: number = 0
  viewHeight: number = 0

  currentTop: number = 0
  currentLeft: number = 0

  isMoving: boolean = false

  setCurrentScale (addend: number): void {
    let { maxScale, minScale, currentScale } = this
    let sum = currentScale + addend

    switch (true) {
      case sum > maxScale:
        this.currentScale = maxScale
        break
      case sum < minScale:
        this.currentScale = minScale
        break
      default:
        this.currentScale = sum
    }
  }

  close (): void {
    this.$store.commit(this.mutation, { active: false })
    this.currentScale = this.defaultScale
    this.currentTop = 0
    this.currentLeft = 0
  }

  updateViewSize (): void {
    let { offsetWidth, offsetHeight } = document.body
    this.viewWidth = offsetWidth
    this.viewHeight = offsetHeight
  }

  startMove (event: any): void {
    let startMouseX: number | number[], startMouseY: number | number[], startDiagonal: number
    let self = this
    let { currentScale, maxScale, minScale, currentLeft, currentTop } = this

    if (event.touches) {
      let len = event.touches.length
      if (len > 2) return
      switch(len) {
        case 1:
          startMouseX = event.touches[0].clientX
          startMouseY = event.touches[0].clientY
          break
        case 2:
          startMouseX = [...event.touches].map((finger: any) => finger.clientX)
          startMouseY = [...event.touches].map((finger: any) => finger.clientY)
          startDiagonal = PythagoreanTheorem(
            Math.abs((startMouseX as number[])[0] - (startMouseX as number[])[1]),
            Math.abs((startMouseY as number[])[0] - (startMouseY as number[])[1])
          )
      }
    } else {
      startMouseX = event.clientX
      startMouseY = event.clientY
    }

    let
      getMoving = (event: any): void => {
        let endMouseX: number | number[], endMouseY: number | number[], endDiagonal: number
        let sum: number
        if (event.touches) {
          let len = event.touches.length
          if (len > 2) return
          switch(len) {
            case 2:
              endMouseX = [...event.touches].map((finger: any) => finger.clientX)
              endMouseY = [...event.touches].map((finger: any) => finger.clientY)
              endDiagonal = PythagoreanTheorem(
                Math.abs((endMouseX as number[])[0] - (endMouseX as number[])[1]),
                Math.abs((endMouseY as number[])[0] - (endMouseY as number[])[1])
              )

              sum = currentScale + Math.floor((endDiagonal - startDiagonal) / 7)

              switch (true) {
                case sum > maxScale:
                  this.currentScale = maxScale
                  break
                case sum < minScale:
                  this.currentScale = minScale
                  break
                default:
                  this.currentScale = sum
              }

              return
            case 1:
              endMouseX = event.touches[0].clientX
              endMouseY = event.touches[0].clientY
          }
        } else {
          endMouseX = event.clientX
          endMouseY = event.clientY
        }

        self.isMoving = true
        self.currentLeft = currentLeft + ((endMouseX! as number) - (startMouseX! as number))
        self.currentTop = currentTop + ((endMouseY! as number) - (startMouseY! as number))
    },
    stopMove = (): void => {
      self.isMoving = false

      window.removeEventListener('touchmove', getMoving)
      window.removeEventListener('mousemove', getMoving)
      window.removeEventListener('touchend', stopMove)
      window.removeEventListener('mouseup', stopMove)
    }

    window.addEventListener('touchmove', getMoving)
    window.addEventListener('mousemove', getMoving)
    window.addEventListener('touchend', stopMove)
    window.addEventListener('mouseup', stopMove)
  }

  async bestFit (): Promise<void> {
    if (!this.$store.state.viewer.src) return
    let { width, height } = await this.getOrignSize(this.$store.state.viewer.src)
    let { viewWidth, viewHeight } = this

    this.fixScale = width / viewWidth
    this.currentTop = 0
    this.currentLeft = 0

    if (width > viewWidth) {
      let scale = viewWidth / width
      if (scale * height <= viewHeight) {
        scale *= 100
        this.defaultScale = scale
        this.currentScale = scale
        return
      }
    }

    if (height > viewHeight) {
      let scale = viewHeight / height
      if (scale * width <= viewWidth) {
        scale *= 100
        this.defaultScale = scale
        this.currentScale = scale
        return
      }
    }

    this.defaultScale = 100
    this.currentScale = 100
  }

  async getOrignSize (src: string): Promise<any> {
    return new Promise((res, rej) => {
      let img = new Image()

      img.onload = () => {
        let { width, height } = img
        res({ width, height })
      }

      img.onerror = e => rej(e)

      img.src = src
    })
  }

  get currentScaleString (): string {
    return Math.floor(this.currentScale) + '%'
  }

  get scaleStyle (): string {
    let { currentScale, fixScale, currentLeft, currentTop } = this

    currentScale = currentScale / 100 * fixScale

    return `transform: scale(${currentScale})`
      + ` translateX(${currentLeft / currentScale}px)`
      + ` translateY(${currentTop / currentScale}px)`
  }

  mounted (): void {
    let { updateViewSize, bestFit } = this

    window.addEventListener('resize', updateViewSize)
    window.addEventListener('resize', bestFit)
    updateViewSize()
    bestFit()
  }
}
</script>

<style lang="scss" scoped>
.viewer-container {
  position: fixed;

  width: 100%;
  height: 100%;
  z-index: 999;
  overflow: hidden;
}

.viewer-mask {
  position: fixed;

  width: 100%;
  height: 100%;
  z-index: 997;

  background: rgba(0, 0, 0, .4);
}

.viewer-img {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;

  z-index: 998;

  margin: auto;

  transition: transform .5s;

  user-select: none;
}

.viewer-close {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;

  z-index: 999;

  padding: .5rem;

  border-radius: 5px;

  font-size: 2rem;
  color: rgb(220, 220, 220);

  cursor: pointer;

  &:active {
    background: rgba(0, 0, 0, .4);
  }
}

.viewer-menubar {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;

  width: 240px;
  height: 40px;
  z-index: 999;

  margin: 0 auto;

  padding: .5rem;

  border-top-left-radius: 5px;
  border-top-right-radius: 5px;

  background: rgba(0, 0, 0, .4);

  font-size: 2rem;
  color: rgb(255, 255, 255);
}

.viewer-text {
  width: 35px;

  padding: 0 1rem;

  font-size: 1.2rem;
  text-align: center;

  user-select: none;
}

.viewer-button {
  padding: .3rem;

  border-radius: 5px;
  
  &:active {
    background: rgba(0, 0, 0, .4);
  }
}
.viewer-moving {
  transition: none;
}
</style>