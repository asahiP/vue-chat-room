<template>
  <div class="application-chat-room-home">
    <Selector :initialItems="items" :method="'avatarUpdate'" @avatarUpdate="avatarUpdate"></Selector>
    <input
      type="text"
      placeholder="Username"
      class="input-username"
      v-model="userName"
      @keypress.enter="submit"
    >
    <button class="button" @click="submit">SUBMIT</button>
    <CheckBox v-model="rememberMe" class="checkbox">Remember Me</CheckBox>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue } from 'vue-property-decorator'
import Selector from './Selector.vue'
import CheckBox from './CheckBox.vue'

function range(num: number, addend: number = 0): number[] {
  return [...Array(num).keys()].map(i => i + addend)
}

@Component({
  components: {
    Selector,
    CheckBox
  }
})
export default class Home extends Vue {
  rememberMe: boolean = false
  userName: string = ''
  userAvatar: string = ''
  items: string[] = []

  avatarUpdate ({ current, items }: any): void {
    this.userAvatar = current
    this.items = items
  }

  submit (): void {
    let maxLength: number = 50
    let { userAvatar, userName, rememberMe, items } = this

    if (userName.length === 0) {
      userName = 'No Name'
    }

    userName = userName.slice(0, maxLength)
    
    this.$store.commit('changeUserProfile', { userAvatar, userName, rememberMe })
    this.$emit('router', 'ChatLobby')

    if (rememberMe) {
      localStorage.setItem('profile', JSON.stringify({ userAvatar, userName, rememberMe, items }))
    } else {
      localStorage.removeItem('profile')
    }
  }

  created (): void {
    let profile = localStorage.getItem('profile')

    if (profile) {
      let { userName, userAvatar, items, rememberMe } = JSON.parse(profile)

      this.userName = userName === 'No Name' ? '' : userName
      this.userAvatar = userAvatar
      this.items = items
      this.rememberMe = rememberMe
    } else {
      let items = (function (x = 5, y = 7, className = 'avatar'): string[] {
        let result = []
        for (let i of range(y, 1)) {
          for (let j of range(x, 1)) {
            result.push(`${className}-${i}-${j}`)
          }
        }
    
        return result
      })()

      this.items = items
    }
  }

}
</script>

<style lang="scss" scoped>
$public-font-family: (Arial, Helvetica, sans-serif, 'Source Han Sans', 'Noto Sans', 'Microsoft Yahei', '微软雅黑', STHeiti, '华文黑体');
// 容器start
.application-chat-room-home {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;

  width: 100%;
  height: 100%;

  background: rgb(241, 245, 248);
}
// 容器end

// 文本框start
.input-username {
  width: 10rem;
  height: 1rem;

  margin: 2rem 0;

  padding: .5rem;

  border: 1px solid rgb(124, 124, 124);
  border-radius: .3rem;

  outline: none;

  font-family: $public-font-family;
  text-align: center;

  background: rgb(241, 245, 248);

  &:focus {
    box-shadow: 0 0 0 .3rem rgba(124, 124, 124, .3);
  }
}
// 文本框end

// 按钮start
button {
  border: none;
  border-radius: .3rem;
  outline: none;

  background: transparent;

  cursor: pointer;
}

.button {
  width: 7.2rem;
  height: 2rem;
  line-height: 1rem;

  padding: .5rem;

  font-size: 1rem;
  font-weight: bold;
  color: rgb(255, 255, 255);

  background: rgb(36, 185, 22);
  &:focus {
    box-shadow: 0 0 0 .3rem rgba(36, 185, 22, .3);
  }
}
// 按钮end

// checkbox start
.checkbox {
  border-color: rgb(177, 177, 177);

  color: rgb(177, 177, 177);
}
// checkbox end

</style>
