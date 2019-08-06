import Vue from "vue";
import Vuex from "vuex";
import { enc, SHA1 } from 'crypto-js'
import axios from 'axios'

Vue.use(Vuex)

/**
 * @param {string} name - Room uniqID
 * @param {string} title - Room Title
 * @param {string} host - Room Host name
 * @param {string} hostID - Host uniqID
 * @param {string} icon - Host Avatar
 * @param {string} isLock - is Private Room
 */
interface Iroom {
  name: string,
  title: string,
  host: string,
  hostID: string,
  icon: string,
  isLock: boolean,
}

/**
 * 
 * @param {boolean} hasUnread - has unread msg
 * @param {array} history - chat history
 */
interface Iroomlist extends Iroom {
  hasUnread: boolean,
  history: Ihistory[]
}

/**
 * @param {string} uid - user uniqID
 * @param {string} name - user name
 * @param {string} avatar - user avatar
 * @param {string} msg - message
 * @param {number} date - send time
 * @param {string} type - message type { msg | notice | img }
 * @param {string} src - img blob url
 * @param {string} MD5 - img MD5
 * @param {string} roomName - room uniqID
 */
interface Ihistory {
  uid: string,
  name: string,
  avatar: string,
  msg: string,
  date: number,
  type: string,
  src?: Blob,
  MD5?: string,
  roomName: string,
}

function uniqueID (...arg: string[]): string {
  return SHA1([...arg.map(str => enc.Base64.stringify(enc.Utf8.parse(str)))].join('.')).toString()
}

export default new Vuex.Store({
  state: {
    userAvatar: '',
    userName: '',
    userUniqID: '',
    rememberMe: false,

    currentRoom: '',
    privateRoom: '',

    roomlist: {},

    lobby: {},

    textArea: new Map(),

    images: new Map(),

    viewer: {
      src: '',
      active: false 
    },
  },
  mutations: {
    changeUserProfile (state: any, profile: any): void {
      let { userAvatar, userName, rememberMe } = profile
      state.userAvatar = userAvatar
      state.userName = userName
      state.userUniqID = uniqueID(userName, userAvatar, Date.now().toString(32))
      state.rememberMe = rememberMe
    },

    leave (state: any, roomName: string = state.currentRoom): void {
      let { roomlist, images, textArea } = state
      let room: Iroomlist = roomlist[roomName]
      let { history } = room
      Vue.delete(state.roomlist, roomName)

      history.forEach(({ MD5, type }: Ihistory) => {
        if (type === 'img') {
          window.URL.revokeObjectURL(images.get(MD5))

          images.delete(MD5)
        }
      })

      Vue.set(room, 'history', [])
      textArea.delete(name)
    },

    updatePrivateRoom (state: any, roomName: string): void {
      state.privateRoom = roomName
    },

    updateLobby (state: any, newLobby: Iroomlist[]): void {
      let oldKey = Object.keys(state.lobby)
      let newKey: any = []

      newLobby.forEach((room: Iroomlist) => {
        Vue.set(state.lobby, room.name, room)
        newKey.push(room.name)
      })

      oldKey.filter((name: string) => !newKey.includes(name))
        .forEach((name: string) => Vue.delete(state.lobby, name))
    },

    goLobby (state: any): void {
      state.currentRoom = ''
    },

    updateTextArea (state: any, newText: string): void {
      state.textArea.set(state.currentRoom, newText || '')
    },

    updateImages (state: any, { key, val }: any) {
      state.images.set(key, val)
    },

    updateHistory (state: any, { roomName, ...history }): void {
      state.roomlist[roomName].history.push(history)
      Vue.set(state.roomlist[roomName], 'hasUnread', roomName !== state.currentRoom)
    },

    resetStore (state: any): void {
      for (let i of Object.keys(state)) {
        if (i === 'viewer') {
          Vue.set(state, i, {
            src: '',
            active: false 
          })
        } else {
          Vue.set(state, i, (new (state[i].constructor)).valueOf())
        }
      }
    },


    setViewer (state: any, newViewer: any): void {
      Vue.set(state, 'viewer', Object.assign({}, state.viewer, newViewer))
    },
  },
  actions: {
    async createRoom ({ state }, profile: any): Promise<void> {
      return new Promise((res, rej) => {
        let { title, host, icon, pass } = profile

        axios.post('createRoom', {
          name: uniqueID(title, host, icon, pass, Date.now().toString(32)),
          hostID: state.userUniqID,
          title, host, icon, pass,
          isLock: !!pass,
          history: [],
          hasUnread: false,
        })
          .then(val => res())
          .catch(e => rej(e))
      })
    },

    async joinRoom ({ commit, state }, { room, socket }): Promise<void> {
      return new Promise((res, rej) => {
        let { currentRoom, userUniqID, userName, roomlist } = state
        let { name } = room

        if (name !== currentRoom) {
          if (!roomlist.hasOwnProperty(name)) {
            socket.emit('join', {
              uid: userUniqID,
              roomName: name,
              userName
            })
            Vue.set(state.roomlist, name, room)
          }

          state.currentRoom = name
        }

        if (roomlist.hasOwnProperty(name)) {
          Vue.set(roomlist[name], 'hasUnread', false)
        }

        res()
      })
    },

    async joinPrivateRoom ({ commit, state }, { token, roomName }): Promise<void> {
      return new Promise((res, rej) => {
        axios.post('joinPrivateRoom', { token, roomName })
          .then(AxiosResponse => {
            if (AxiosResponse.data === 'correct') {
              res()
            } else {
              rej('incorrect Password')
            }
          })
          .catch(e => rej(e))
      })
    },

    async sendText ({ commit, state }, msg: Ihistory): Promise<void> {
      return new Promise((res, rej) => {
        commit('updateHistory', msg)
        res()
      })
    },

    async sendImg ({ commit, state }, msg: Ihistory): Promise<void> {
      return new Promise((res, rej) => {
        let { src: img, MD5 } = msg
        let { images } = state
      
        if (!images.has(MD5)) {
          commit('updateImages', { key: MD5, val: window.URL.createObjectURL(img) })
        }
  
        commit('updateHistory', Object.assign(msg, { src: images.get(MD5) }))
        res()
      })
    },

    signOut ({ commit, state }): void {
      Object.keys(state.roomlist).forEach((roomName: string) => {
        commit('leave', roomName)
      })
      commit('resetStore')
    },
  }
})