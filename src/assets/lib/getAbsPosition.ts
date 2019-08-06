/**
 * @param {element} el
 * @returns {number[]} param's abs position arr, [x, y]
 */
function getAbsPosition (el: any): number[] {
  let elTransform = getTransform(el)
  let x = el.offsetLeft + elTransform[0]
  let y = el.offsetTop + elTransform[1]

  while (el.offsetParent) {
    el = el.offsetParent
    elTransform = getTransform(el)
    x += el.offsetLeft + elTransform[0]
    y += el.offsetTop + elTransform[1]
  }

  return [x, y]
}

/**
 * @param {element} el
 * @returns {number[]} param's translate arr, [x, y]
 */
function getTransform (el: any): number[] {
  let translateX: number = 0
  let translateY: number = 0
  let transform: string = window.getComputedStyle(el)['transform'] || ''
  let martix: number[] = []

  switch (true) {
    case transform.includes('matrix3d'):
      martix = transform
        .slice(9, -1)
        .split(/,\s+/)
        .map(val => parseInt(val))

      translateX = martix[12]
      translateY = martix[13]
      break
    case transform.includes('matrix'):
      martix = transform
        .slice(7, -1)
        .split(/,\s+/)
        .map(val => parseInt(val))
      
      translateX = martix[4]
      translateY = martix[5]
  }

  return [translateX, translateY]
}

export { getAbsPosition, getTransform }