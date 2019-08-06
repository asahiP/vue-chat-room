<template>
  <div class="selector-main">
    <button class="button-left iconfont icon-arrow-left" @click="moveBefore(-1)"></button>
    <div class="selector-container">
      <div class="selector-content" :style="transform">
        <div
          v-for="item in items"
          :key="item"
          :class="item"
        ></div>
      </div>
    </div>
    <button class="button-right iconfont icon-arrow-right" @click="moveBefore(1)"></button>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop, Watch } from 'vue-property-decorator'
import animate from '../assets/lib/animate'

function getMiddle<T> (arg: T[]): T {
  return arg[Math.floor(arg.length / 2)]
}

@Component
export default class Selector extends Vue {
  @Prop({ required: true }) initialItems!: []
  @Prop({ required: true }) method!: string

  items: any[] = this.initialItems
  translateX: number = 0
  isMoving: boolean = false
  clientWidth: number = 0
  clientHeight: number = 0

  moveBefore (count: number): void {
    let { isMoving } = this
    let self = this
    let isPrev = count > 0

    if (!isMoving) {
      this.isMoving = true

      animate({
        end: count * 85 * -1,
        time: 150,
        fps: 120,
        callback: (currentStep: number) => {
          self.translateX = currentStep
        }
      })
        .then(val => {
          self.translateX = 0
          self.isMoving = false

          if (isPrev) {
            self.items.push(self.items.shift())
          } else {
            self.items.unshift(self.items.pop())
          }
        })
    }
  }

  get isPortrait (): boolean {
    let { clientWidth, clientHeight } = this
    return clientHeight > clientWidth
  }

  get defalutTranslateX (): number {
    let { isPortrait } = this

    return isPortrait
      ? 85 * (35 - 3) / 2 * -1
      : 85 * (35 - 5) / 2 * -1
  }

  get transform (): any {
    let { translateX, defalutTranslateX } = this

    return { transform: `translateX(${defalutTranslateX + translateX}px)` }
  }
  
  @Watch('items')
  emitCurrentItem (): void {
    this.$emit(this.method, {
      current: getMiddle(this.items),
      items: this.items
    })
  }

  mounted (): void {
    let self = this
    function resize (): void {
      self.clientWidth = window.innerWidth
      self.clientHeight = window.innerHeight
    }

    this.$emit(this.method, {
      current: getMiddle(this.items),
      items: this.items
    })

    resize()

    window.addEventListener('resize', resize)
  }
}
</script>

<style lang="scss">
// 默认头像 start
$avatar-url: '../assets/avatar.jpg';
$avatar-url-mobile: '../assets/avatar-mobile.jpg';
$avatar-x-length: 5;
$avatar-y-length: 7;
$avatar-size: 85px;
$avatar-trim-size: 10px;
$avatar-url-size: ($avatar-size * $avatar-x-length, $avatar-size * $avatar-y-length);
$avatar-length: $avatar-x-length * $avatar-y-length; // 默认头像总个数
$container-length: 5; // 默认显示头像个数
$container-length-mobile: 3; // 移动端默认显示头像个数

@for $i from 1 through 7 {
  @for $j from 1 through 5 {
    .avatar-#{$i}-#{$j} {
      $position-x: (($j - 1) * $avatar-size * -1);
      $position-y: (($i - 1) * $avatar-size * -1);

      flex-shrink: 0;

      width: $avatar-size - ($avatar-trim-size * 2);
      height: $avatar-size - ($avatar-trim-size * 2);

      margin: $avatar-trim-size;

      border-radius: 50%;

      background: url($avatar-url);
      background-repeat: no-repeat;
      background-position: ($position-x - $avatar-trim-size) ($position-y - $avatar-trim-size);
      

      @media all and (orientation: portrait) {
        background: url($avatar-url-mobile);
        background-repeat: no-repeat;
        background-size: $avatar-url-size;
        background-position: ($position-x - $avatar-trim-size) ($position-y - $avatar-trim-size);
      }
    }
  }
}
// 默认头像 end

// 容器 start
.selector-main {
  display: flex;
  justify-content: center;
  align-items: center;

  font-size: 40px;
  .selector-container {
    position: relative;

    width: $avatar-size * $container-length;
    height: $avatar-size;
    overflow: hidden;

    @media all and (orientation: portrait) {
      width: $avatar-size * $container-length-mobile;
    }

    margin: 0 1rem;
  }

  .selector-content {
    display: flex;
    justify-content: center;
    align-items: center;
    
    width: $avatar-size * $avatar-length;
    height: $avatar-size;
  }
  // 容器 end

  // 按钮 start
  button {
    border: none;
    border-radius: .3rem;
    outline: none;

    background: transparent;

    cursor: pointer;
  }

  .button-left, & .button-right {
    width: $avatar-size * .5;
    height: $avatar-size;

    color: rgb(124, 124, 124);

    &:active {
    // box-shadow: 0 0 0 .3rem rgba(124, 124, 124, .4);
    background: rgba(124, 124, 124, .3);
    }
  }
  // 按钮 end

  // 选择器 start
  .selector-container::after {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;

    width: $avatar-size;
    height: $avatar-size;

    margin: auto;

    border: .3rem solid rgba(124, 124, 124, .4);
    box-sizing: border-box;
    
    content: '';
  }
  // 选择器 end
}
</style>
