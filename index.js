// make the checkbox div focusable
const captchaCheckbox = document.getElementById("captcha-checkbox")
const checkboxSpinner = document.getElementById("captcha-checkbox-spinner")
captchaCheckbox.addEventListener("mousedown",()=> {
    captchaCheckbox.classList.add("focused")
    captchaCheckbox.classList.remove("blurred")
})

captchaCheckbox.addEventListener("mouseup",()=> {
    captchaCheckbox.classList.add("blurred")
    captchaCheckbox.classList.remove("focused")
})

captchaCheckbox.addEventListener("click",()=> {
    checkboxSpinner.style.display = "block"
    captchaCheckbox.style.display = "none"
    captchaCheckbox.style.visibility = "false"
    setTimeout(()=>{
        captchaCheckbox.style.display = "block"
        checkboxSpinner.style.display = "none"

        // show the solve box
        const solveBox = document.getElementById("solve-box")
        if (solveBox.style.display == "block") {
            solveBox.style.display = "none"
        }
        else {
            solveBox.style.display = "block"
        }
    },Math.floor(Math.random()*1000)+200)
})

// show error if submit button is click without checking the checkbox
document.getElementById("submit").addEventListener("click",()=>{
    document.getElementById("captcha-main-div").classList.add("error")
    document.getElementById("captcha-error-msg").style.display = "block"
})


// fill up the solve-image-container
const imageCount = 20

// Valid targets: user must click/select all, then press Verify
const requiredTargets = new Set([4,5,6,7,8,9])
const selectedTargets = new Set()

// Global no-reuse and no-duplicate-on-screen
const usedNumbers = new Set()
const currentOnScreen = new Set()

const getImgNumber = (imgEl) => {
  const src = imgEl.getAttribute("src") || ""
  const m = src.match(/img(\d+)\.(?:jpg|png)$/)
  return m ? Number(m[1]) : null
}

const isTargetNumber = (n) => n !== null && requiredTargets.has(n)

const isAnyTargetVisible = () => {
  const imgs = Array.from(document.querySelectorAll(".solve-image"))
  return imgs.some(img => isTargetNumber(getImgNumber(img)))
}

// Shuffle once (not random on every pick)
const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

// Build a deck once
let deck = shuffle(Array.from({ length: imageCount }, (_, i) => i + 1))

// Draw next number from deck that is:
// - not used globally
// - not currently on screen
// - not an already-selected target (never reappear)
const drawNextNumber = () => {
  while (deck.length > 0) {
    const n = deck.shift()

    if (usedNumbers.has(n)) continue
    if (currentOnScreen.has(n)) continue
    if (selectedTargets.has(n)) continue

    return n
  }
  return null
}

const setImageNumber = (imgEl, n) => {
  // Remove the previous number from "currentOnScreen"
  const prev = getImgNumber(imgEl)
  if (prev !== null) currentOnScreen.delete(prev)

  if (n === null) {
    imgEl.setAttribute("src", "")
    imgEl.style.pointerEvents = "none"
    return
  }

  // Uses .jpg; ensure your files are ./images/img1.jpg ... ./images/img20.jpg
  imgEl.setAttribute("src", `./images/img${n}.jpg`)
  imgEl.style.pointerEvents = "auto"

  usedNumbers.add(n)
  currentOnScreen.add(n)
}

const fadeAllIfNoTargetsVisible = () => {
  if (selectedTargets.size === requiredTargets.size) return
  if (isAnyTargetVisible()) return

  const imgs = Array.from(document.querySelectorAll(".solve-image"))
  imgs.forEach(img => img.classList.add("fade-out"))
  setTimeout(() => {
    imgs.forEach(img => img.classList.remove("fade-out"))
  }, 300)
}

// Do not allow an unselected target to disappear (otherwise it may become impossible)
const refreshImage = (image) => {
  const current = getImgNumber(image)
  if (isTargetNumber(current) && !selectedTargets.has(current)) {
    return
  }

  image.classList.add("fade-out")
  image.style.pointerEvents = "none"

  setTimeout(() => {
    const n = drawNextNumber()
    setImageNumber(image, n)
    fadeAllIfNoTargetsVisible()
    image.classList.remove("fade-out")
    image.style.pointerEvents = "auto"
  }, 1000)
}

// Build 3×3 grid
const solveImageContainer = document.getElementById("solve-image-main-container")
for (let i = 0; i < 3; i++) {
  for (let j = 0; j < 3; j++) {
    const imageContainer = document.createElement("div")
    imageContainer.classList.add("solve-image-container")

    const image = document.createElement("img")
    image.classList.add("solve-image")

    setImageNumber(image, drawNextNumber())

    image.addEventListener("click", () => {
      const num = getImgNumber(image)

      // Clicking a valid image selects it; then it is replaced and will never appear again
      if (isTargetNumber(num) && !selectedTargets.has(num)) {
        selectedTargets.add(num)
        refreshImage(image)
        return
      }

      refreshImage(image)
    })

    imageContainer.appendChild(image)
    solveImageContainer.appendChild(imageContainer)
  }
}

fadeAllIfNoTargetsVisible()

// Verify succeeds only if user has selected all targets
document.getElementById("verify").addEventListener("click", () => {
  if (selectedTargets.size === requiredTargets.size) {
    document.getElementById("solve-image-error-msg").style.display = "none"
    document.getElementById("solve-box").style.display = "none"
  } else {
    document.getElementById("solve-image-error-msg").style.display = "block"
  }
})

// Refresh button: refresh all non-target tiles; keep any unselected targets in place
const refreshButton = document.getElementById("refresh")
refreshButton.addEventListener("click", () => {
  refreshButton.style.pointerEvents = "none"
  solveImageContainer.classList.add("fade-out")
  document.getElementById("solve-image-error-msg").style.display = "none"

  setTimeout(() => {
    solveImageContainer.classList.remove("fade-out")

    const imgs = Array.from(document.querySelectorAll(".solve-image"))
    imgs.forEach(img => {
      const num = getImgNumber(img)
      if (isTargetNumber(num) && !selectedTargets.has(num)) return
      setImageNumber(img, drawNextNumber())
    })

    fadeAllIfNoTargetsVisible()
    refreshButton.style.pointerEvents = "auto"
  }, 1000)
})


// toggle information
document.getElementById("information").addEventListener("click",() =>{
    const information = document.getElementById("information-text")
    if (information.style.display == "block") {
        information.style.display = "none"
    }
    else {
        information.style.display = "block"
    }
})

// show audio div 
document.getElementById("audio").addEventListener("click",()=> {
    document.getElementById("solve-image-div").style.display = "none"
    document.getElementById("solve-audio-div").style.display = "block"
})
