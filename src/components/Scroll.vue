<template>
  <div
    ref="container"
    @mouseenter="isMouseOver = !isMobile"
    @touchstart="isMouseOver = true"
    @mouseleave="isMouseOver = false"
    @touchend="isMouseOver = false"
  >
    <div
      :style="contentStyle"
      @scroll="syncSliderPosition"
      ref="content"
      class="hide-webkit-scroll"
      :scroller="isMobile ? 'hidden' : ''"
    >
      <slot/>
    </div>
    <div
      :style="barStyleX"
      ref="barX"
      @mousedown.left.stop="barMousedownEvent($event, 'x')"
      @mouseup.left.stop="barMousedownHandle"
      @mouseleave="barMousedownHandle"
    >
      <div
        :style="sliderStyleX"
        @mousedown.left.stop="sliderMousedownEvent($event, 'x')"
      ></div>
    </div>
    <div
      :style="barStyleY"
      ref="barY"
      @mousedown.left.stop="barMousedownEvent($event, 'y')"
      @mouseup.left.stop="barMousedownHandle"
      @mouseleave="barMousedownHandle"
    >
      <div
        :style="sliderStyleY"
        @mousedown.left.stop="sliderMousedownEvent($event, 'y')"
      ></div>
    </div>
  </div>
</template>

<script>
function limit (start, end, value) {
  return Math.min(
    Math.max(
      start,
      value
    ),
    end
  )
}

export default {
  name: 'oScroll',

  props: {
    hook: {
      type: Function,
      require: false,
    }
  },

  data () {
    return {
      defaultScrollerSize: 0,

      containerWidth: 0,
      containerHeight: 0,
      contentWidth: 0,
      contentHeight: 0,

      sliderLeft: 0,
      sliderTop: 0,

      sliderWidth: 0,
      sliderHeight: 0,

      scrollLeft: 0,
      scrollTop: 0,

      mouseDownX: 0,
      mouseDownY: 0,
      mouseEventTarget: '',
      mouseDownSliderLeft: 0,
      mouseDownSliderTop: 0,

      isMouseEventActive: false,
      isMouseOver: false,
      isMobile: navigator.userAgent.toLowerCase().includes('mobile'),
      isScrolling: false,
      scrollingTimer: 0,

      ratio: 0,

      barMousedownHandle: () => {},
      
      options: {
        minSize: 50,
        enableScroll: 'both',
        autoHidden: true,
      },

      defaultBarStyle: {
        position: 'absolute',
        bottom: 0,
        zIndex: 999,

        width: '8px',
        height: '8px',
        overflow: 'hidden',
      },
      defaultSliderStyle: {
        position: 'absolute',

        width: '100%',
        height: '100%',

        background: 'rgb(200, 200, 200)'
      },
    }
  },
  methods: {
    getSliderSize () {
      let container = document.createElement('div')
      let content = document.createElement('div')

      container.style = 'width: 100px; height: 100px; overflow: scroll'
      content.style = 'width: 100%; height: 100%'

      container.appendChild(content)
      document.body.appendChild(container)

      this.defaultScrollerSize = 100 - content.offsetWidth

      document.body.removeChild(container)
    },
    syncClientRects () {
      let { $refs, options, ratio,
        containerWidth, containerHeight,
        syncSliderLeft, syncSliderTop,
        getSliderSize } = this
      let { content, container } = $refs

      if (!content || !container) return
      
      let { offsetWidth, offsetHeight } = container
      let { scrollWidth, scrollHeight } = content

      this.containerWidth = offsetWidth
      this.containerHeight = offsetHeight
      this.contentWidth = scrollWidth
      this.contentHeight = scrollHeight

      let { minSize } = options
      this.sliderWidth = limit(
        minSize || 0,
        offsetWidth || 0,
        Math.pow(offsetWidth, 2) / scrollWidth || 0
      )
      this.sliderHeight = limit(
        minSize || 0,
        offsetHeight || 0,
        Math.pow(offsetHeight, 2) / scrollHeight || 0
      )

      if (containerWidth !== offsetWidth) {
        syncSliderLeft()
      }
      if (containerHeight !== offsetHeight) {
        syncSliderTop()
      }

      let { devicePixelRatio } = window
      
      if (ratio !== devicePixelRatio) {
        this.ratio = devicePixelRatio
        getSliderSize()
      }

      // xxx: 解决position被意外去除后导致的死循环
      let defaultContainerStyle = 'position: relative; width: 100%; height: 100%; overflow: hidden;'
      let containerCSSText = container.style.cssText
      if (defaultContainerStyle !== containerCSSText) {
        container.style = defaultContainerStyle
      }
    },
    syncSliderPosition () {
      let { isMouseEventActive, syncSliderLeft, syncSliderTop,
        hook, $refs, scrollLeft: oldScrollLeft, scrollTop: oldScrollTop, scrollingTimer } = this
      
      clearTimeout(scrollingTimer)

      this.isScrolling = true

      let { content } = $refs
      let { scrollLeft, scrollTop } = content
      
      this.scrollLeft = scrollLeft
      this.scrollTop = scrollTop

      if (!isMouseEventActive) {
        oldScrollLeft !== scrollLeft && syncSliderLeft()
        oldScrollTop !== scrollTop && syncSliderTop()
      }

      typeof hook === 'function' && hook(scrollLeft, scrollTop)

      this.scrollingTimer = setTimeout(() => this.isScrolling = false, 300)
    },
    syncSliderLeft () {
      let { containerWidth, contentWidth, scrollLeft, maxScrollLeft, setSliderLeft } = this

      setSliderLeft(
        scrollLeft / (contentWidth - containerWidth) * maxScrollLeft || 0
      )
    },
    syncSliderTop () {
      let { containerHeight, contentHeight, scrollTop, maxScrollTop, setSliderTop } = this

      setSliderTop(
        scrollTop / (contentHeight - containerHeight) * maxScrollTop || 0
      )
    },
    syncScrollLeft () {
      let { containerWidth, contentWidth, maxScrollLeft, sliderLeft, setScrollLeft } = this

      setScrollLeft(sliderLeft / maxScrollLeft * (contentWidth - containerWidth))
    },
    syncScrollTop () {
      let { containerHeight, contentHeight, maxScrollTop, sliderTop, setScrollTop } = this

      setScrollTop(sliderTop / maxScrollTop * (contentHeight - containerHeight))
    },
    setSliderLeft (newVal) {
      let { maxScrollLeft, syncScrollLeft } = this

      this.sliderLeft = limit(
        0,
        maxScrollLeft,
        newVal
      )
      syncScrollLeft()
    },
    setSliderTop (newVal) {
      let { maxScrollTop, syncScrollTop } = this

      this.sliderTop = limit(
        0,
        maxScrollTop,
        newVal
      )
      syncScrollTop()
    },
    setScrollLeft (newVal, sync = false) {
      let { containerWidth, contentWidth, syncSliderLeft, $refs } = this
      let { content } = $refs

      this.scrollLeft = content.scrollLeft = limit(
        0,
        contentWidth - containerWidth || 0,
        newVal,
      )
      sync && syncSliderLeft()
    },
    setScrollTop (newVal, sync = false) {
      let { containerHeight, contentHeight, syncSliderTop, $refs } = this
      let { content } = $refs

      this.scrollTop = content.scrollTop = limit(
        0,
        contentHeight - containerHeight || 0,
        newVal,
      )
      sync && syncSliderTop()
    },
    sliderMousedownEvent (e, target) {
      let { pageX, pageY } = e
      let { sliderLeft, sliderTop } = this

      this.isMouseEventActive = true
      this.mouseDownX = pageX
      this.mouseDownY = pageY
      this.mouseEventTarget = target
      this.mouseDownSliderLeft = sliderLeft
      this.mouseDownSliderTop = sliderTop
    },
    sliderMousemoveEvent (e) {
      let { pageX, pageY } = e
      let { mouseDownX, mouseDownY,
        mouseEventTarget, isMouseEventActive,
        mouseDownSliderLeft, mouseDownSliderTop,
        setSliderLeft, setSliderTop } = this
      
      if (isMouseEventActive) {
        let distanceX = pageX - mouseDownX
        let distanceY = pageY - mouseDownY
        
        switch (mouseEventTarget) {
          case 'x':
            setSliderLeft(mouseDownSliderLeft + distanceX)
            break
          case 'y':
            setSliderTop(mouseDownSliderTop + distanceY)
        }
      }
    },
    sliderMouseupEvent () {
      this.isMouseEventActive = false
      this.mouseEventTarget = ''
    },
    barMousedownEvent (e, target) {
      let { pageX, pageY } = e
      let { sliderWidth, sliderHeight,
        sliderLeft, sliderTop,
        setSliderLeft, setSliderTop, $refs } = this
      let { barX, barY } = $refs
      let { left: barXLeft } = barX.getClientRects()[0]
      let { top: barYTop } = barY.getClientRects()[0]
      let mousedownPositionX = pageX - barXLeft
      let mousedownPositionY = pageY - barYTop
      let distanceX = mousedownPositionX < sliderLeft
        ? mousedownPositionX - sliderLeft
        : mousedownPositionX - sliderLeft - sliderWidth
      let distanceY = mousedownPositionY < sliderTop
        ? mousedownPositionY - sliderTop
        : mousedownPositionY - sliderTop - sliderHeight

      let animate = (distance, callback, step = distance > 0 ? 10 : -10) => {
        let isEnd = false
        let id = 0
        let current = 0

        let fn = () => {
          window.cancelAnimationFrame(id)
          current += step

          if (!isEnd && Math.abs(distance) > Math.abs(current)) {
            callback(current)
            id = window.requestAnimationFrame(fn)
          } else if (!isEnd && Math.abs(distance) <= Math.abs(current)) {
            isEnd = true
            callback(distance)
          }
        }

        id = window.requestAnimationFrame(fn)

        return function cancel () {
          isEnd = true
          window.cancelAnimationFrame(id)
        }
      }

      switch (target) {
        case 'x':
          this.barMousedownHandle = animate(distanceX, (current) => {
            setSliderLeft(sliderLeft + current)
          })
          break
        case 'y':
          this.barMousedownHandle = animate(distanceY, (current) => {
            setSliderTop(sliderTop + current)
          })
      }
    }
  },
  computed: {
    isOverflowX () {
      let { containerWidth, contentWidth, defaultScrollerSize } = this

      return contentWidth - defaultScrollerSize > containerWidth
    },
    isOverflowY () {
      let { containerHeight, contentHeight, defaultScrollerSize } = this

      return contentHeight - defaultScrollerSize > containerHeight
    },
    maxScrollLeft () {
      let { containerWidth, sliderWidth } = this

      return containerWidth - sliderWidth
    },
    maxScrollTop () {
      let { containerHeight, sliderHeight } = this

      return containerHeight - sliderHeight
    },
    contentStyle () {
      let { isOverflowX, isOverflowY, defaultScrollerSize } = this

      return {
        zIndex: 998,
        width: isOverflowY
          ? `calc(100% + ${defaultScrollerSize}px)`
          : '100%',
        height: isOverflowX
          ? `calc(100% + ${defaultScrollerSize}px)`
          : '100%',

        overflow: 'auto',
      }
    },
    barStyleX () {
      let { options, defaultBarStyle, isOverflowX, isMouseOver, isMouseEventActive, isScrolling } = this
      let { barStyle, autoHidden, enableScroll } = options

      return Object.assign({}, defaultBarStyle, barStyle, {
        visibility: isOverflowX && ['x', 'both'].includes(enableScroll) ? '' : 'hidden',

        left: 0,

        width: '100%',

        opacity: autoHidden && !isMouseOver && !isMouseEventActive && !isScrolling ? 0 : 1,

        transition: 'opacity .3s ease-in',
      })
    },
    barStyleY () {
      let { options, defaultBarStyle, isOverflowY, isMouseOver, isMouseEventActive, isScrolling } = this
      let { barStyle, autoHidden, enableScroll } = options

      return Object.assign({}, defaultBarStyle, barStyle, {
        visibility: isOverflowY && ['y', 'both'].includes(enableScroll) ? '' : 'hidden',

        right: 0,

        height: '100%',

        opacity: autoHidden && !isMouseOver && !isMouseEventActive && !isScrolling ? 0 : 1,

        transition: 'opacity .3s ease-in',
      })
    },
    sliderStyleX () {
      let { options, defaultSliderStyle, sliderLeft, sliderWidth } = this
      let { sliderStyle } = options

      return Object.assign({}, defaultSliderStyle, sliderStyle, {
        width: `${Math.floor(sliderWidth)}px`,

        transform: `translate3d(${Math.floor(sliderLeft)}px, 0, 0)`
      })
    },
    sliderStyleY () {
      let { options, defaultSliderStyle, sliderTop, sliderHeight } = this
      let { sliderStyle } = options

      return Object.assign({}, defaultSliderStyle, sliderStyle, {
        height: `${Math.floor(sliderHeight)}px`,

        transform: `translate3d(0, ${Math.floor(sliderTop)}px, 0)`
      })
    }
  },
  watch: {
    isMouseEventActive (newVal) {
      if (newVal) {
        this.$Opal.setUserSelect('none')
      } else {
        this.$Opal.setUserSelect()
      }
    }
  },
  mounted () {
    let { syncClientRects, $refs, options, $nextTick,
      sliderMousemoveEvent, sliderMouseupEvent } = this
    
    this.options = Object.assign(
      {},
      options,
    )

    let config = {
      attributes: true,
      attributeOldValue: false,
      characterData: true,
      characterDataOldValue: false,
      childList: true,
      subtree: true,
    }

    let { container } = $refs
    ;(new MutationObserver(syncClientRects))
      .observe(container, config);
    
    window.addEventListener('resize', syncClientRects)
    window.addEventListener('mousemove', sliderMousemoveEvent)
    window.addEventListener('mouseup', sliderMouseupEvent, true)

    $nextTick(() => {
      syncClientRects()
    })
  }
}
</script>