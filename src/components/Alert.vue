<template>
  <div class="alert-container">
    <div
      v-for="{ key, msg, opacity } in notice"
      :key="key"
      v-text="msg"
      :style="`opacity: ${opacity}`"
      class="alert-content"
    ></div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'

@Component
export default class Alert extends Vue {
  notice: any[] = []

  setNotice (msg: string) {
    let key = msg + (Date.now() * Math.random() * 1024).toString(32)
    this.notice.push({
      key,
      msg,
      opacity: 1
    })

    setTimeout(this.fadeOut.bind(this, key), 2000)
  }

  fadeOut (key: string) {
    let item: any
    this.notice = this.notice.map(i => {
      if (i.key === key) {
        item = i
        return {
          ...item,
          opacity: item.opacity - 0.01
        }
      }
      return i
    })

    if (item.opacity > 0) {
      setTimeout(this.fadeOut.bind(this, key), 10)
    } else {
      this.notice = this.notice.filter(i => i.key != key)
    }
  }
}
</script>

<style lang="scss" scoped>
.alert-container {
  position: fixed;
  bottom: 15rem;
  z-index: 1000;

  margin: auto;
}
.alert-content {
  @keyframes slideUp {
    from { opacity: .5; transform: translateY(150%) }
    to { opacity: 1;transform: translateY(0) }
  }

  position: relative;

  min-width: 300px;
  max-width: 300px;

  margin: 1rem 0;
  padding: .5rem;

  border: 1px solid red;
  border-radius: 5px;

  font-family: Arial, Helvetica, sans-serif, 'Source Han Sans', 'Noto Sans', 'Microsoft Yahei', '微软雅黑', STHeiti, '华文黑体';
  color: rgb(255, 0, 0);
  text-align: center;
  white-space: pre-wrap;
  word-break: break-word;
  user-select: none;

  background: rgb(255, 200, 200);

  animation: slideUp .3s ease;
}
</style>

