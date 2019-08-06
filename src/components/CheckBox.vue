<template>
  <div class="checkbox-container">
    <input type="checkbox"
      :id="uniqID"
      :checked="checked"
      v-on="listeners"
    >
    <label :for="uniqID" class="checkbox-component" :style="option.checkbox"></label>
    <label :for="uniqID" class="checkbox-text" :style="option.text">
      <slot></slot>
    </label>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Prop } from 'vue-property-decorator'

@Component({
  inheritAttrs: false,
  model: {
    prop: 'checked',
    event: 'change'
  }
})
export default class CheckBox extends Vue {
  @Prop() checked!: boolean
  @Prop({ default() { return { checkbox: {}, text: {} } } }) option!: {}

  uniqID: string = `checkbox-${Math.floor(Date.now() * Math.random() * 1024).toString(32)}`

  get listeners (): any {
    let self = this

    return Object.assign({},
      this.$listeners,
      {
        change (event: any): void {
          self.$emit('change', event.target.checked)
        }
      }
    )
  }
}

</script>

<style lang="scss" scoped>
input[type="checkbox"] {
  display: none;
}

.checkbox-container {
  display: flex;
  justify-content: center;
  align-items: center;

  vertical-align: middle;

  margin: .7rem 0;
}

.checkbox-component {
  display: flex;
  justify-content: center;
  align-items: center;
  
  width: .7rem;
  height: .7rem;

  border: 1.5px solid rgb(177, 177, 177);

  transition: border-color .3s;

  cursor: pointer;

  &::after {
    width: 0;
    height: 0;

    transition: all .3s;

    content: '';
  }

  input:checked + & {
    border-color: rgb(36, 185, 22);
  }

  input:checked + &::after {
    width: 55%;
    height: 55%;

    background: rgb(36, 185, 22);

    content: '';
  }

}

.checkbox-text {
  margin: 0 0 0 .5rem;

  line-height: .8rem;
  
  font-family: Arial, Helvetica, sans-serif;
  font-size: .8rem;
  font-weight: bold;
  color: rgb(177, 177, 177);
  
  cursor: pointer;
}
</style>
