<template>
  <div class="application-chat-room-lobby">
    <div :class="[
      'layout-left',
      {
        'layout-left-mobile-fadein': isMobile && isOnLeftSide,
        'layout-left-mobile-fadeout': isMobile && !isOnLeftSide
      }
    ]">
      <div class="layout-left-searchbar">
        <input
          type="text"
          v-model="searchKeyWord"
          :id="inputUniqIDSearch"
          @focus="searchBarFocused = true"
          @blur="searchBarFocused = false"
        >
        <label
          :for="inputUniqIDSearch"
          :class="[
            { 'label-focused': searchBarFocused },
            { 'label-inputed': !!searchKeyWord }
          ]"
        >
          Type Name or Title
        </label>
      </div>
      <div class="layout-left-roomlist" @click="goRoom">
        <p class="layout-no-item" v-show="!roomlist.length">No more Data</p>
        <Scroller>
          <div class="layout-left-room" v-for="{ name, title, host, hostID, icon, isLock, hasUnread } in roomlist" :key="name">
            <div
              :class="[
                'room-area',
                { 'room-actived': name === $store.state.currentRoom }
              ]"
              :data-v-name="name"
            >
              <div :class="[icon, 'room-area-icon']"></div>
              <div class="room-area-text">
                <p v-text="title" class="room-area-title"></p>
                <p v-text="host" class="room-area-host"></p>
              </div>
              <div class="room-area-unread" v-show="hasUnread"></div>
            </div>
          </div>
        </Scroller>
      </div>
      <div class="layout-left-userarea">
        <div class="userarea-container">
          <div :class="[$store.state.userAvatar, 'userarea-icon']"></div>
          <div>
            <p v-text="$store.state.userName" class="userarea-name"></p>
            <div class="layout-left-userarea-logout">
              <span class="sign-out" @click="signOut">Sign Out</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="layout-right" :style="lobbyArea">
      <div class="layout-right-lobby-container">
        <p class="layout-no-item" v-show="!lobby.length">No more Data</p>
        <Scroller>
          <div class="layout-right-lobby" @click="goRoom">
            <div v-for="{ name, title, host, hostID, icon, isLock } in lobby" :key="name" class="layout-right-room">
              <div class="room-area" :data-v-name="name">
                <div :class="[icon, 'room-area-icon']"></div>
                <div class="room-area-text">
                  <p class="room-area-title" v-text="title"></p>
                  <p class="room-area-host" v-text="host"></p>
                </div>
                <div :class="['room-area-lock', 'iconfont', { 'icon-lock': isLock }]"></div>
              </div>
            </div>
          </div>
        </Scroller>
      </div>
      <div class="layout-right-menubar">
        <div class="menubar-left-container">
          <span class="iconfont icon-menu menu-button" @click="fadeInSide"></span>
        </div>
          <span class="button-create-room" @click="isCreatingRoom = true" v-show="!isCreatingRoom">Create New Room</span>
          <span class="iconfont icon-reload button-create-room button-create-reload" @click="updateLobby"></span>
      </div>
    </div>
    <div class="layout-right layout-right-chat" :style="chatArea">
      <div class="layout-right-menubar layout-right-titlebar">
        <div class="menubar-left-container" style="padding: 0">
          <span class="iconfont icon-arrow-left menu-button" @click="backToLobby"></span>
          <span class="menu-button" @click="leaveRoom">LEAVE</span>
        </div>
        <p v-text="currentRoom.title" class="layout-right-title"></p>
      </div>
      <div class="layout-right-chat-container">
        <Scroller
          ref="chatRoom"
        >
          <div
            v-for="({ uid, name, avatar, date, type, msg, src }, index) in currentRoom.history"
            :key="uid + date + index"
            style="padding: .7rem 0;"
          >
            <p v-text="timeFormat(date)" v-if="isTimeChanged(index)" class="chat-area-text-date"></p>
            <div
              v-if="type === 'msg'" 
              :class="[
                'layout-right-chat-area',
                { 'is-client': uid === $store.state.userUniqID }
              ]"
            >
              <div :class="[avatar, 'chat-area-icon']"></div>
              <div class="chat-area-text">
                <p class="chat-area-text-name" v-text="name"></p>
                <pre class="chat-area-text-content" v-text="msg"></pre>
              </div>
            </div>
            <div 
              v-else-if="type === 'img'" 
              :class="[
                'layout-right-chat-area',
                { 'is-client': uid === $store.state.userUniqID }
              ]"
            >
              <div :class="[avatar, 'chat-area-icon']"></div>
              <div class="chat-area-text">
                <p class="chat-area-text-name" v-text="name"></p>
                <div class="chat-area-text-content" style="height: 200px; box-sizing: content-box">
                  <ViewerContainer
                    v-bind="{
                      src,
                      height: 200,
                      mutation: 'setViewer'
                    }"
                  ></ViewerContainer>
                </div>
              </div>
            </div>
            <template v-else-if="type === 'notice'">
              <p v-text="msg" class="chat-area-notice"></p>
            </template>
          </div>
        </Scroller>
      </div>
      <div class="layout-right-chat-textarea">
        <textarea class="chat-textarea" v-model="textArea" ref="textArea"></textarea>
      </div>
      <div class="layout-right-menubar">
        <div class="menubar-left-container">
          <span class="iconfont icon-menu menu-button menu" @click="fadeInSide"></span>
          <label class="iconfont icon-image menu-button" :for="inputUniqIDImage"></label>
        </div>
          <span class="button-send" @click="sendText">SEND</span>
      </div>
    </div>
    <div :class="['layout-mask', { 'layout-mask-on': isOnLeftSide }]" @click="fadeOutSide"></div>
    <div class="layout-create-room" v-show="isCreatingRoom">
      <div class="layout-mask-on" @click="isCreatingRoom = false"></div>
      <transition name="fade">
        <div
          :class="['create-room-container', { 'create-room-private': isPrivate }]"
          v-show="isCreatingRoom">
          <p class="create-room-title">Create New Room</p>
          <div class="create-room-content">
            <label :for="inputUniqIDTitle">Room Title</label>
            <input type="text" :id="inputUniqIDTitle" v-model="createRoomTitle">
            <label :for="inputUniqIDPass" v-show="isPrivate">Password</label>
            <input
              :type="isShowCreatePass ? 'text' : 'password'"
              :id="inputUniqIDPass"
              v-show="isPrivate"
              v-model="createRoomPass"
              @paste="$event.preventDefault()"
              @contextmenu="$event.preventDefault()"
            >
            <CheckBox
              v-model="isPrivate"
              :option="{
                checkbox: {
                  width: '1rem',
                  height: '1rem',
                  flexShrink: 0
                },
                text: {
                  fontSize: '1.3rem',
                  lineHeight: '1.3rem',
                  color: 'rgb(67, 71, 83)'
                }
              }"
              style="position: relative; left: 0; width: 100%"
            >
              Private
            </CheckBox>
            <CheckBox
              v-model="isShowCreatePass"
              v-show="isPrivate"
              :option="{
                checkbox: {
                  width: '1rem',
                  height: '1rem',
                  flexShrink: 0
                },
                text: {
                  fontSize: '1.3rem',
                  lineHeight: '1.3rem',
                  color: 'rgb(67, 71, 83)'
                }
              }"
              style="position: relative; left: 0; width: 100%"
            >
              Show Password
            </CheckBox>
          </div>
          <div class="create-room-footer">
            <span class="create-room-button cancel" @click="isCreatingRoom = false">Cancel</span>
            <span class="create-room-button create" @click="createRoom">Create</span>
          </div>
        </div>
      </transition>
    </div>
    <div class="layout-create-room" v-show="isJoinPrivateRoom">
      <div class="layout-mask-on" @click="isJoinPrivateRoom = false"></div>
      <transition name="fade">
        <div class="create-room-container join-room-container" v-show="isJoinPrivateRoom">
          <p class="create-room-title">Join Private Room</p>
          <div class="create-room-content">
            <label :for="inputUniqIDToken">Password</label>
            <input
              :type="isShowPass ? 'text' : 'password'"
              :id="inputUniqIDToken"
              v-model="joinRoomToken"
              @paste="$event.preventDefault()"
              @contextmenu="$event.preventDefault()"
            >
            <CheckBox
              v-model="isShowPass"
              :option="{
                checkbox: {
                  width: '1rem',
                  height: '1rem',
                  flexShrink: 0
                },
                text: {
                  fontSize: '1.3rem',
                  lineHeight: '1.3rem',
                  color: 'rgb(67, 71, 83)'
                }
              }"
              style="position: relative; left: 0; width: 100%"
            >
              Show Password
            </CheckBox>
          </div>
          <div class="create-room-footer">
            <span class="create-room-button cancel" @click="cancelJoinPrivateRoom">Cancel</span>
            <span class="create-room-button create" @click="joinPrivateRoom">Join</span>
          </div>
        </div>
      </transition>
    </div>
    <input type="file" :id="inputUniqIDImage" style="display: none" ref="fileLoader"  @change="sendImg">
    <Alert ref="alert"></Alert>
    <ViewerMain :mutation="'setViewer'"></ViewerMain>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from 'vue-property-decorator'
import Scroller from './Scroll.vue'
import CheckBox from './CheckBox.vue'
import Alert from './Alert.vue'
import ViewerContainer from './ViewerContainer.vue'
import ViewerMain from './ViewerMain.vue'
import { SHA256, lib, MD5 } from 'crypto-js'
import io from 'socket.io-client'

@Component({
  components: {
    Scroller,
    CheckBox,
    Alert,
    ViewerContainer,
    ViewerMain
  }
})
export default class Lobby extends Vue {

  searchKeyWord: string = ''
  searchBarFocused: boolean = false

  isMobile: boolean = false
  isOnLeftSide: boolean = false
  isMobileBrowser: boolean = navigator.userAgent.toLowerCase().includes('mobile')
  isCreatingRoom: boolean = false
  isPrivate: boolean = false
  isOnLobby: boolean = true
  isJoinPrivateRoom: boolean = false
  isShowCreatePass: boolean = false
  isShowPass: boolean = false

  inputUniqIDSearch: string = `input-${Math.floor(Date.now() * Math.random() * 1024).toString(32)}`
  inputUniqIDTitle: string = `input-${Math.floor(Date.now() * Math.random() * 1024).toString(32)}`
  inputUniqIDPass: string = `input-${Math.floor(Date.now() * Math.random() * 1024).toString(32)}`
  inputUniqIDImage: string = `input-${Math.floor(Date.now() * Math.random() * 1024).toString(32)}`
  inputUniqIDToken: string = `input-${Math.floor(Date.now() * Math.random() * 1024).toString(32)}`


  createRoomTitle: string = ''
  createRoomPass: string = ''

  textArea: string = ''

  joinRoomToken: string = ''

  socketOfLobby: SocketIOClient.Socket = io({ path: '/demo/chat-room/lobby' })
  socketOfChat: SocketIOClient.Socket = io({ path: '/demo/chat-room/chat' })
  
  alert: Function = () => {}

  signOut (): void {
    let { socketOfLobby, socketOfChat } = this
    let self = this
    this.$store.dispatch('signOut')
      .then(() => {
        socketOfLobby.close()
        socketOfChat.close()
        
        self.$emit('router', 'ChatHome')
      })
  }

  fadeInSide () {
    this.isMobile = true
    this.isOnLeftSide = true
  }

  fadeOutSide () {
    this.isOnLeftSide = false
  }

  resize () {
    if (!this.isMobileBrowser) {
      this.isMobile = false
      this.isOnLeftSide = false
    }
  }

  createRoom (): void {
    let maxLength: number = 50
    let { createRoomTitle, createRoomPass, $store, isPrivate, updateLobby } = this
    let self = this
    
    $store.dispatch('createRoom', {
      title: createRoomTitle.slice(0, maxLength) || 'A Chat Room',
      host: $store.state.userName,
      icon: $store.state.userAvatar,
      pass: isPrivate
        && !!createRoomPass.length
        && SHA256(createRoomPass + 'Hail Hydra!').toString()
    })
      .then(val => {
        this.createRoomTitle = ''
        this.createRoomPass = ''
        this.isCreatingRoom = false
        updateLobby()
      })
      .catch(e => self.alert(e))
  }

  goRoom (event: any): void {
    let
      el = event.target,
      name = '',
      { userUniqID, userName, lobby, roomlist, textArea } = this.$store.state,
      self = this,
      { chatRoom }: any = this.$refs

    while (el.getAttribute && !el.getAttribute('data-v-name')) {
      el = el.parentNode
    }

    if ((name = el.getAttribute && el.getAttribute('data-v-name'))) {
      let room = lobby[name]

      if (!room.isLock || roomlist.hasOwnProperty(name) || room.hostID === userUniqID) {
        this.$store.dispatch('joinRoom', { room , socket: this.socketOfChat})
          .then(val => {
            self.isOnLobby = false
            self.textArea = textArea.get(name)
    
            self.fadeOutSide()
            if (chatRoom) chatRoom.setScrollTop(0)
          })
      } else {
        this.isJoinPrivateRoom = true
        this.$store.commit('updatePrivateRoom', name)
      }
    }
  }

  joinPrivateRoom (): void {
    let
      token = SHA256(this.joinRoomToken + 'Hail Hydra!').toString(),
      { privateRoom, textArea, lobby } = this.$store.state,
      { chatRoom }: any = this.$refs,
      self = this

    this.$store.dispatch('joinPrivateRoom', { roomName: privateRoom, token })
      .then(val => {
        self.joinRoomToken = ''
        self.isJoinPrivateRoom = false
        self.$store.dispatch('joinRoom', {
          room: lobby[privateRoom],
          socket: self.socketOfChat
        })
          .then(val => {
            self.isOnLobby = false
            self.textArea = textArea.get(name)
    
            self.fadeOutSide()
            if (chatRoom) chatRoom.setScrollTop(0)
          })
      })
      .catch(e => self.alert(e))
  }

  cancelJoinPrivateRoom (): void {
    this.isJoinPrivateRoom = false
    this.joinRoomToken = ''
  }

  backToLobby (): void {
    this.isOnLobby = true
    this.$store.commit('goLobby')
    this.updateLobby()
  }

  leaveRoom (): void {
    let { socketOfChat, backToLobby, $store } = this
    let { userUniqID: uid, currentRoom: roomName, userName } = $store.state

    socketOfChat.emit('leave', { uid, roomName, userName })
    $store.commit('leave')
    backToLobby()
  }

  timeFormat (date: number = 0, pattern: string = 'MM DD hh : mm'): string {
    const DATE = new Date(date)
    let monthNames = [
      "January", "February", "March",
      "April", "May", "June", "July",
      "August", "September", "October",
      "November", "December"
    ]
    let
      hours = DATE.getHours().toString(),
      minutes = DATE.getMinutes().toString(),
      day = DATE.getDate().toString(),
      month = monthNames[DATE.getMonth()].slice(0, 3),
      year = DATE.getFullYear().toString()

    hours = hours.length < 2 ? `0${hours}` : hours
    minutes = minutes.length < 2 ? `0${minutes}` : minutes
    day = day.length < 2 ? `0${day}` : day
    
    interface Imap {
      [key: string]: string
    }

    let map: Imap = {
      hh: hours,
      mm: minutes,
      DD: day,
      MM: month,
      YYYY: year
    }

    return pattern.replace(/hh|mm|DD|MM|YYYY/g, (fragment: string): string => {
      return map[fragment]
    })
  }

  async sendText (): Promise<void> {
    let { chatRoom, textArea }: any = this.$refs
    let { userUniqID, userName, userAvatar, currentRoom } = this.$store.state
    let { socketOfChat } = this
    let self = this, msg

    if ((msg = this.textArea)) {
      let data = {
        uid: userUniqID,
        name: userName,
        avatar: userAvatar,
        msg,
        date: Date.now(),
        type: 'msg',
        roomName: currentRoom,
      }

      socketOfChat.emit('send', data)
      await this.$store.dispatch('sendText', data)
        .then(() => {
          chatRoom.setScrollTop(Infinity)
          
          self.textArea = ''
        })
        .catch(e => {
          self.alert(e)
        })
    }

    textArea.focus()
  }

  async sendImg (): Promise<void> {
    const IMG_MAX_SIZE = 1 * 1024 * 1024
    interface IfileBlob {
      val: Blob,
      MD5?: string
    }

    function readFileAsBlob (file: File): Promise<IfileBlob> {
      return new Promise((res, rej) => {
        let reader = new FileReader()
        reader.onload = () => {
          let result: ArrayBuffer = reader.result as ArrayBuffer
          let
            view = new DataView(result),
            fileHead8Byte = view.getBigUint64(0, false).toString(16).toUpperCase(),
            fileHead4Byte = fileHead8Byte.slice(0, 4 * 2),
            fileHead2Byte = fileHead8Byte.slice(0, 2 * 2),
            jpegFileHeadArr = [
              'FFD8FFE0',
              'FFD8FFE1',
              'FFD8FFE2',
              'FFD8FFE3',
              'FFD8FFE8',
            ],
            pngFileHead = '89504E470D0A1A0A',
            gifFileHead = '47494638',
            webpFileHead = '52494646',
            bmpFileHead = '424D',
            MIMEType = ''

          switch(true) {
            case fileHead8Byte === pngFileHead:
              MIMEType = 'image/png'
              break
            case jpegFileHeadArr.includes(fileHead4Byte):
              MIMEType = 'image/jpeg'
              break
            case fileHead4Byte === gifFileHead:
              MIMEType = 'image/gif'
              break
            case fileHead4Byte === webpFileHead:
              MIMEType = 'image/webp'
              break
            case fileHead2Byte === bmpFileHead:
              MIMEType = 'image/bmp'
          }

          if (MIMEType === '') {
            rej('incorrect file format')
            return
          }

          res({
            val: new Blob([result], { type: MIMEType }),
            MD5: MD5(lib.WordArray.create(reader.result)).toString(),
          })
        }
        
        reader.onerror = () => {
          reader.abort()
          rej('Problem parsing input file')
        }

        reader.readAsArrayBuffer(file)
      })
    }

    let
      { fileLoader, chatRoom }: any = this.$refs,
      file: any = fileLoader.files[0]

    if (file) {
      let self = this

      if (file.size > IMG_MAX_SIZE) {
        fileLoader.value = ''
        self.alert(`File size must be less than ${IMG_MAX_SIZE / 1024 / 1024}MB`)
        return
      }

      await readFileAsBlob(file)
        .then(({ val, MD5 }) => {
          let { userUniqID, userName, userAvatar, currentRoom } = self.$store.state
          let { socketOfChat } = self
          let data = {
            uid: userUniqID,
            name: userName,
            avatar: userAvatar,
            msg: 'image',
            date: Date.now(),
            type: 'img',
            src: val,
            MD5,
            roomName: currentRoom,
          }
          socketOfChat.emit('send', data)
          self.$store.dispatch('sendImg', data)
            .then(val => {
              chatRoom.setScrollTop(Infinity)
            })
            .catch(e => {
              self.alert(e)
            })
        })
        .catch(e => {
          self.alert(e)
        })
    }
    
    fileLoader.value = ''
  }

  isTimeChanged (index: number): boolean {
    let { currentRoom, timeFormat } = this
    let { history } = currentRoom

    return index === 0
      || timeFormat(history[index].date) !== timeFormat(history[index - 1].date)
  }

  updateLobby (): void {
    let { socketOfLobby, $store } = this
    socketOfLobby.emit('update')
  }

  get roomlist (): any[] {
    let keyWord = this.searchKeyWord.toLowerCase()
    let roomlist = Object.values(this.$store.state.roomlist)

    return roomlist.filter((i: any): boolean => 
      i.title.toLowerCase().includes(keyWord)
      || i.host.toLowerCase().includes(keyWord)
    )
  }

  get lobby (): any[] {
    let keyWord = this.searchKeyWord.toLowerCase()
    let lobby = Object.values(this.$store.state.lobby)

    return lobby.filter((i: any): boolean => 
      i.title.toLowerCase().includes(keyWord)
      || i.host.toLowerCase().includes(keyWord)
    )
  }

  get currentRoom (): any {
    let { currentRoom, roomlist } = this.$store.state

    return roomlist[currentRoom]
      ? roomlist[currentRoom]
      : { title: '', history: [] }
  }

  get chatArea (): string {
    return this.isOnLobby
      ? 'position: absolute; visibility: hidden;'
      : ''
  }

  get lobbyArea (): string {
    return !this.isOnLobby
      ? 'position: absolute; visibility: hidden;'
      : ''
  }

  @Watch('textArea')
  updateTextArea (newVal: string, oldVal: string): void {
    this.$store.commit('updateTextArea', newVal)
  }

  mounted (): void {
    let { socketOfLobby, socketOfChat, $store, updateLobby } = this
    let { chatRoom }: any = this.$refs
    let self = this

    window.addEventListener('resize', this.resize)

    this.alert = (this.$refs.alert as any).setNotice

    updateLobby()

    socketOfLobby.on('newLobby', (newLobby: any) => {
      $store.commit('updateLobby', newLobby)
    })

    socketOfChat.on('onMessage', (msg: any) => {
      $store.dispatch('sendText', msg)
        .then(val => {
          if (chatRoom) chatRoom.setScrollTop(Infinity)
        })
    })

    socketOfChat.on('disconnect', () => {
      $store.dispatch('signOut')
        .then(() => {
          socketOfLobby.close()
          socketOfChat.close()

          self.$emit('router', 'ChatHome')
        })
    })
  }
}
</script>

<style lang="scss" scoped>
$layout-left-size: 25%;
$layout-right-size: 100% - $layout-left-size;

$layout-left-main-theme: rgb(67, 71, 83);
$layout-left-sub-theme: rgb(105, 108, 117);
$layout-right-main-theme: rgb(241, 245, 248);

$public-notice-theme: rgb(140, 140, 140);
$public-font-family: (Arial, Helvetica, sans-serif, 'Source Han Sans', 'Noto Sans', 'Microsoft Yahei', '微软雅黑', STHeiti, '华文黑体');

// 容器start
.application-chat-room-lobby {
  display: flex;
  justify-content: center;
  align-items: center;
  
  position: absolute;

  width: 100%;
  height: 100%;
  overflow: hidden;

  font-size: 1.1rem;
  font-family: $public-font-family;
  color: $layout-right-main-theme;
}

.layout-left {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;

  flex: 0 0 $layout-left-size;

  height: 100%;

  background: $layout-left-main-theme;

  @media all and (orientation: portrait) {
    position: absolute;

    visibility: hidden;
    transform: translate(-100%);
    transition: transform .5s;
  }

    // 搜索栏start
  .layout-left-searchbar {
    display: flex;
    justify-content: center;
    align-items: center;

    flex: 0 0 5%;

    width: 100%;
    min-width: 15rem;
    
    input {
      width: 75%;
      height: 1rem;

      margin: 2rem 1rem;

      padding: 1rem;

      border: none;
      border-radius: .3rem;

      outline: none;

      font-size: inherit;
      font-family: inherit;
      color: inherit;

      background: $layout-left-sub-theme;
    }

    label {
      position: absolute;

      user-select: none;
      cursor: text;
    }

    .label-focused {
      visibility: hidden;
    }
    .label-inputed {
      visibility: hidden;
    }
  }
  // 搜索栏end
  // 房间列表start
  .layout-left-roomlist {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;

    flex: 0 1 80%;

    width: 100%;
    overflow: hidden;

    .layout-left-room {
      display: flex;
      justify-content: center;
      align-items: center;

      width: 100%;
      height: 110px;

      .room-area {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        flex-direction: row;
        position: relative;

        width: 90%;
        height: 70%;

        border-radius: 5px;

        background: $layout-left-main-theme;

        transition: background-color .3s;
        cursor: pointer;

        &:hover {
          background: $layout-left-sub-theme;

          & .room-area-text .room-area-host {
            color: $layout-right-main-theme;
          }
        }
        .room-area-icon {
          margin: 0 1rem;
        }

        .room-area-text {
          display: flex;
          justify-content: center;
          align-items: left;
          flex-direction: column;

          height: 100%;

          .room-area-title {
            width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;

            font-size: 2rem;

            @media all and (orientation: portrait) {
              width: 110px;
            }
          }
          .room-area-host {
            width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;

            font-size: .9rem;
            color: $layout-left-sub-theme;

            transition: color .3s;

            @media all and (orientation: portrait) {
              width: 110px;
            }
          }
        }

        .room-area-unread {
          position: absolute;
          right: .5rem;
          top: .5rem;

          width: .5rem;
          height: .5rem;

          border-radius: 50%;

          background: rgb(0, 255, 184);
        }
      }

      .room-actived {
        background: $layout-left-sub-theme;
        
        & .room-area-text .room-area-host {
          color: $layout-right-main-theme;
        }
      }
    }

  }
  // 房间列表end
  // 用户区域start
  .layout-left-userarea {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: row;

    flex: 0 0 15%;

    width: 100%;

    div {
      display: flex;
      justify-content: flex-start;
      align-items: left;
      flex-direction: column;
    }

    .userarea-name {
      width: 110px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      font-size: 1.5rem;
    }

    .layout-left-userarea-logout {
      flex-direction: row;
      
      margin: 0;

      font-size: 1rem;
      .sign-out {
        cursor: pointer;
        
        &:hover {
          text-decoration: underline;
        }
      }
    }

    .userarea-container {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        flex-direction: row;

        width: 90%;
        height: 70%;
    }

    .userarea-icon {
      margin: 0 1rem;
    }
  }
  // 用户区域end
}

.layout-left-mobile-fadein {
  @media all and (orientation: portrait) {
    visibility: visible;
    left: 0;
    z-index: 999;

    width: 65%;

    transform: translate(0);
  }
}

.layout-left-mobile-fadeout {
  @media all and (orientation: portrait) {
    visibility: visible;
    left: 0;
    z-index: 999;

    width: 65%;

    transform: translate(-100%);
  }
}

.layout-right {
  flex: 0 1 $layout-right-size;

  width: 100%;
  height: 100%;

  background: $layout-right-main-theme;

  @media all and (orientation: portrait) {
    flex: 0 0 100%;
  }

  .layout-right-lobby-container {
    position: relative;
    height: 100%;

    @media all and (orientation: portrait) {
      height: 92%;
    }
  }

  .layout-right-lobby {
    display: flex;
    justify-content: flex-start;
    align-items: flex-start;
    flex-direction: row;
    flex-wrap: wrap;
    flex: 0 1 100%;

    overflow: hidden;

    @media all and (orientation: portrait) {
        height: 92%;
      }

    .layout-right-room {
      display: flex;
      justify-content: center;
      align-items: center;

      width: 50%;
      height: 110px;
      min-width: 300px;

      @media all and (orientation: portrait) {
        width: 100%;
      }

      .room-area {
        display: flex;
        justify-content: flex-start;
        align-items: center;
        flex-direction: row;

        width: 90%;
        height: 70%;

        border-radius: 5px;

        background: $layout-right-main-theme;

        transition: background-color .3s;
        cursor: pointer;

        &:hover {
          background: $layout-left-sub-theme;

          & .room-area-text .room-area-host {
            color: $layout-right-main-theme;
          }
          & .room-area-text .room-area-title {
            color: $layout-right-main-theme;
          }
          .room-area-lock {
            color: $layout-right-main-theme;
          }
        }
        .room-area-icon {
          margin: 0 1rem;
        }

        .room-area-text {
          display: flex;
          justify-content: center;
          align-items: left;
          flex-direction: column;

          height: 100%;

          .room-area-title {
            width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;

            font-size: 2rem;
            color: $layout-left-sub-theme;
          }
          .room-area-host {
            width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;

            font-size: .9rem;
            color: $layout-left-sub-theme;

            transition: color .3s;
          }
        }
        .room-area-lock {
          height: 100%;

          margin: auto;

          font-size: 3rem;
          color: $layout-left-sub-theme;
        }
      }
    }
  }
  .layout-right-menubar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex: 0 0 100%;

    height: 8%;

    .menubar-left-container {
      display: flex;
      align-items: center;

      height: 100%;

      padding: 0 0 0 2rem;
      .menu-button {
        height: 50%;

        margin: 0 1rem 0 0;

        padding: .3rem;

        border-radius: 5px;

        font-size: 2rem;
        color: $layout-left-main-theme;
        cursor: pointer;

        &:active {
          background: rgba(105, 108, 117, .4);
        }
      }
      .menu {

        @media all and (orientation: landscape) {
          display: none;
        }
      }
    }
    .button-create-room {
      margin: 1rem;

      padding: .7rem;

      border: none;
      border-radius: 5px;

      font-family: $public-font-family;
      font-size: 1.1rem;
      font-weight: bold;
      color: $layout-left-main-theme;

      background: transparent;

      outline: none;
      cursor: pointer;
      

      @media all and (orientation: landscape) {
        position: absolute;
        right: 6rem;
        bottom: 3.5rem;

        color: $layout-right-main-theme;

        background: $layout-left-main-theme;
      }
      
      &:active {
        background: rgba(105, 108, 117, .4);
      }
    }

    .button-create-reload {
      margin: 1rem 2rem 1rem 1rem;
      font-size: 1.4rem;
      
      @media all and (orientation: landscape) {
        position: absolute;
        right: 2rem;
        bottom: 3.5rem;
        
        margin: 1rem;

        color: $layout-right-main-theme;

        background: $layout-left-main-theme;
      }
    }

    .button-send {
      margin: 1rem;

      padding: .7rem;

      border: none;
      border-radius: 5px;

      font-family: $public-font-family;
      font-size: 1.1rem;
      font-weight: bold;
      color: $layout-left-main-theme;

      background: transparent;

      outline: none;
      cursor: pointer;

      &:active {
        background: rgba(105, 108, 117, .4);
      }
    }
  }

}
.layout-right-chat {
  display: flex;
  flex-direction: column;
  .layout-right-titlebar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex: 0 0 10%;

    padding: .5rem;
        
    font-size: 1.3rem;

    box-sizing: border-box;

    .menubar-left-container {
      display: flex;
      align-items: center;
      justify-content: center;


      .menu-button {
        display: flex;
        align-items: center;
        justify-content: center;
        
        height: 100%;
        line-height: 2rem;
        
        font-size: 1.3rem;
      }
    }
    .layout-right-title {
      width: 700px;

      padding: 0 1rem 0 0;

      text-align: right;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      color: $layout-left-main-theme;

      box-sizing: border-box;
      
      @media all and (orientation: portrait) {
        width: 250px;
      }
    }
  }
  .layout-right-chat-container {
    display: flex;
    flex-direction: column;
    flex: 0 1 65%;

    width: 100%;
    height: 100%;
    overflow: hidden;

    box-sizing: border-box;

    .layout-right-chat-area {
      display: flex;
      flex-direction: row;
      align-items: flex-start;
      justify-content: center;
    }

    .chat-area-icon {
      margin: 10px 10px 10px 0;
    }
    
    .chat-area-text-date {
      text-align: center;
      font-family: $public-font-family;
      color: $public-notice-theme;

      padding: .5rem 0;
    }

    .chat-area-text {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      flex: 0 0 80%;

      margin: 0 .4rem;

      @media all and (orientation: portrait) {
        flex: 0 0 70%;
      }

      .chat-area-sub-container {
        display: flex;
        flex-direction: row;
        justify-content: space-between;

        width: 100%;
      }
      .chat-area-text-name {
        width: 500px;

        overflow: hidden;

        font-family: $public-font-family;
        font-size: 1rem;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: $layout-left-main-theme;

        @media all and (orientation: portrait) {
          width: 100px;
        }
      }
      .chat-area-text-content {
        max-width: 500px;
        overflow: hidden;

        margin: .5rem 0;
        padding: .7rem;

        border-radius: 5px;

        font-family: $public-font-family;
        color: $layout-left-main-theme;
        white-space: pre-wrap;
        word-break: break-all;

        background: rgb(255, 255, 255);

        box-sizing: border-box;

        @media all and (orientation: portrait) {
          max-width: 250px;
        }
      }
    }
    .is-client {
      flex-direction: row-reverse;
      .chat-area-text {
        align-items: flex-end;
        .chat-area-sub-container {
          flex-direction: row-reverse;
        }
      }
      .chat-area-icon {
        margin: 10px 0 10px 10px;
      }

      .chat-area-text-name {
        text-align: right;
      }
      .chat-area-text-content {
        background: rgb(145, 237, 97);
      }
      .chat-area-text-date {
        text-align: right;
      }
    }
    .chat-area-notice {
      width: 100%;

      padding: .5rem 0;

      font-family: $public-font-family;
      color: $public-notice-theme;
      white-space: pre-wrap;
      word-break: break-word;
      text-align: center;
    }
  }
  .layout-right-chat-textarea {
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 0 0 17%;
    
    .chat-textarea {
      width: 100%;
      height: 100%;
      overflow: hidden;

      padding: 1rem;

      border: none;

      font-family: $public-font-family;
      font-size: 1.2rem;
      color: $layout-left-main-theme;

      resize: none;
      outline: none;
      box-sizing: border-box;

      @media all and (orientation: portrait) {
        overflow: auto;
      }
    }
  }
  .layout-right-menubar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex: 0 0 10%;
    .menubar-left-container {
      padding: 0 0 0 1.3rem;
    }
  }
}

.layout-mask {
  visibility: hidden;
}
.layout-mask-on {
  visibility: visible;

  position: fixed;
  top: 0;
  left: 0;
  z-index: 998;

  width: 100%;
  height: 100%;

  background: rgba(0, 0, 0, .4);
}

.layout-no-item {
  font-size: 1.3rem;
}
.layout-right-lobby-container .layout-no-item {
  position: absolute;

  width: 100%;
  margin: 2rem 0;

  text-align: center;
  color: $layout-left-main-theme;
}
// 容器end

// 创建房间start
.layout-create-room {
  z-index: 999;
}
.create-room-container {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;

  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  z-index: 999;

  width: 50%;
  min-width: 500px;
  height: 35%;
  min-height: 250px;

  margin: auto;

  padding: 1rem;

  border-radius: 5px;

  background: $layout-right-main-theme;

  transition: all .3s ease;


  @media all and (orientation: portrait) {
    width: 80%;
    height: 30%;
    min-width: 300px;
    min-height: 250px;
  }

  .create-room-title {
    flex-shrink: 0;

    margin: .5rem;

    font-size: 1.3rem;
    font-weight: bold;
    color: $layout-left-main-theme;
  }

  .create-room-content {
    display: flex;
    flex-direction: column;
    flex: 0 1 90%;

    width: 100%;
    height: 100%;

    label {
      font-size: 1.2rem;
      font-weight: bold;
      color: $layout-left-main-theme;
    }

    input {
      margin: .5rem 0 1rem 0;

      padding: .7rem;

      border: 1px solid $layout-left-sub-theme;
      border-radius: .3rem;

      outline: none;

      font-size: inherit;
      font-family: inherit;
      color: $layout-left-sub-theme;

      background: $layout-right-main-theme;
    }
  }

  .create-room-footer {
    display: flex;
    justify-content: space-between;

    width: 100%;

    .create-room-button {
      margin: .5rem 0 0 0;

      padding: .5rem 1rem;

      border-radius: 5px;

      font-size: 1.3rem;
      font-weight: bold;
      color: $layout-left-main-theme;

      cursor: pointer;

      &:active {
        background: rgba(105, 108, 117, .4);
      }
    }
  }
}

.create-room-private {
  height: 60%;
  min-height: 380px;

  @media all and (orientation: portrait) {
    height: 50%;
    min-height: 350px;
  }
}
.join-room-container {
  height: 30%;
  min-height: 250px;
}
// 创建房间end

// 聊天记录start


// 聊天记录end

.fade {
  &-enter-active, &-leave-active {
    transition: transform .3s ease;
  }
  &-enter, &-leave-to {
    transform: scaleY(.5)
  }
}
</style>