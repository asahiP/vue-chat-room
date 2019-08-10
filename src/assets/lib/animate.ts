interface IPromiseLike extends Promise<void> {
  cancel: Function
}

/**
 * @param {number} start - Start number, defalut: 0
 * @param {number} end - End number, defalut: 100
 * @param {number} time - Animate finished time, defalut: 1000
 * @param {number} fps - Frames Per Second, default: 60
 * @param {number} step
 * @param {function} callback - Argument is a sum number
 * @returns {Promise} A Promise Object has cancel handle
 */
export default function ({
  start = 0,
  end = 100,
  time = 1000,
  fps = 60,
  step,
  callback,
}: any): IPromiseLike {
  let handle: number | undefined
  let finished: boolean = false
  let result: any = new Promise((res, rej) => {
    function animate (timeStamp: number, elapsed: number) {
      const frameTime = 1000 / fps

      // force reflash to fps
      if (elapsed > frameTime) {
        step = step || end / (time / frameTime)

        if (typeof callback === 'function') {
          start += step
          callback(start)
        } else {
          return rej('callback must be a function')
        }

        elapsed = 0
      }

      if (Math.abs(end) > Math.abs(start) && !finished) {
        handle && window.cancelAnimationFrame(handle)
        handle = window.requestAnimationFrame(
          _timeStamp => animate(_timeStamp, elapsed + _timeStamp - timeStamp)
        )
      } else {
        if (Math.abs(start) - Math.abs(end) > 1e-5) {
          callback(end)
        }
        finished = true
        res()
      }
    }

    handle = window.requestAnimationFrame(
      timeStamp => animate(timeStamp, 0)
    )
  })

  result.cancel = () => {
    finished = true
    handle && window.cancelAnimationFrame(handle)
    return Promise.resolve()
  }

  return result
}