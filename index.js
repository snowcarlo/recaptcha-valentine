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

// RULES:
// - Valid targets are img4..img9 (jpg or png).
// - User must click/select all valid targets, then press Verify.
// - Any image (valid or invalid) must never appear again once it has appeared anywhere in the puzzle.
// - No image may appear more than once at the same time (enforced via reservations).
// - Targets should not disappear unless the user selects them (to avoid making the puzzle impossible).
const requiredTargets = new Set([4,5,6,7,8,9])
const selectedTargets = new Set()
const usedNumbers = new Set()
const reservedNumbers = new Set()

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

const markUsed = (n) => {
  if (n !== null) usedNumbers.add(n)
}

const pickFromPool = (pool) => pool[Math.floor(Math.random() * pool.length)]

const pickNewNumber = (currentNumber = null) => {
  // Never reuse any image that has already appeared OR is currently reserved for another tile refresh.
  const unused = []
  for (let n = 1; n <= imageCount; n++) {
    if (!usedNumbers.has(n) && !reservedNumbers.has(n)) unused.push(n)
  }
  if (unused.length === 0) return null

  // Prefer remaining (unselected) targets, but only if they are unused and not reserved
  const remainingTargets = Array.from(requiredTargets).filter(
    n => !selectedTargets.has(n) && !usedNumbers.has(n) && !reservedNumbers.has(n)
  )
  if (remainingTargets.length > 0) return pickFromPool(remainingTargets)

  // Otherwise pick any unused non-target
  let pool = unused.filter(n => !requiredTargets.has(n))

  // If only targets remain unused (edge case), allow them
  if (pool.length === 0) pool = unused

  // Avoid immediate same-tile repeat when possible
  if (currentNumber !== null && pool.length > 1) {
    const filtered = pool.filter(n => n !== currentNumber)
    if (filtered.length > 0) pool = filtered
  }

  return pickFromPool(pool)
}

const setImageNumber = (imgEl, n) => {
  if (n === null) {
    imgEl.setAttribute("src", "")
    imgEl.style.pointerEvents = "none"
    return
  }
  // Use .jpg by default
  imgEl.setAttribute("src", `./images/img${n}.jpg`)
  imgEl.style.pointerEvents = "auto"
  markUsed(n)
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


// image on click will refresh new image (but do not allow unselected targets to disappear)
const refreshImage = (image) => {
    const current = getImgNumber(image)

    // Prevent losing a valid target before selection
    if (isTargetNumber(current) && !selectedTargets.has(current)) {
        return
    }

    // Pick + reserve immediately to prevent duplicates during async refresh
    const next = pickNewNumber(current)
    if (next !== null) reservedNumbers.add(next)

    image.classList.add("fade-out")
    image.style.pointerEvents = "none"
    setTimeout(()=>{
        image.setAttribute("src","")
        setImageNumber(image, next)
        if (next !== null) reservedNumbers.delete(next)
        fadeAllIfNoTargetsVisible()
        image.classList.remove("fade-out")
        image.style.pointerEvents = "auto"
    },1000)
}


// build the 3×3 grid
const solveImageContainer = document.getElementById("solve-image-main-container")
for (let i=0; i<3; i++) {
    for (let j=0; j<3; j++) {
        const imageContainer = document.createElement("div")
        imageContainer.classList.add("solve-image-container")

        const image = document.createElement("img")
        image.classList.add("solve-image")

        // initial fill using the no-reuse logic (reserve while assigning to avoid duplicates)
        const n = pickNewNumber(null)
        if (n !== null) reservedNumbers.add(n)
        setImageNumber(image, n)
        if (n !== null) reservedNumbers.delete(n)

        image.addEventListener("click",()=>{
            const num = getImgNumber(image)

            // Clicking a valid image selects it; then it is replaced and will never reappear
            if (isTargetNumber(num) && !selectedTargets.has(num)) {
                selectedTargets.add(num)
                refreshImage(image)
                return
            }

            // Clicking any other image refreshes it (no repeats globally)
            refreshImage(image)
        })

        imageContainer.appendChild(image)
        solveImageContainer.appendChild(imageContainer)
    }
}

fadeAllIfNoTargetsVisible()


// verify succeeds only if user has selected all targets
document.getElementById("verify").addEventListener("click",()=> {
  if (selectedTargets.size === requiredTargets.size) {
    document.getElementById("solve-image-error-msg").style.display = "none"
    document.getElementById("solve-box").style.display = "none"
  } else {
    document.getElementById("solve-image-error-msg").style.display = "block"
  }
})


// refresh button: refresh all non-target tiles; keep any unselected targets in place
const refreshButton = document.getElementById("refresh")
refreshButton.addEventListener("click",()=>{
    refreshButton.style.pointerEvents = "none"
    solveImageContainer.classList.add("fade-out")
    document.getElementById("solve-image-error-msg").style.display = "none"

    setTimeout(()=> {
        solveImageContainer.classList.remove("fade-out")

        reservedNumbers.clear()

        const imgs = Array.from(document.querySelectorAll(".solve-image"))
        imgs.forEach(img => {
          const num = getImgNumber(img)
          if (isTargetNumber(num) && !selectedTargets.has(num)) {
            return // keep unselected valid targets visible
          }

          const n = pickNewNumber(num)
          if (n !== null) reservedNumbers.add(n)
          setImageNumber(img, n)
          if (n !== null) reservedNumbers.delete(n)
        })

        fadeAllIfNoTargetsVisible()
        refreshButton.style.pointerEvents = "auto"
    },1000)
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
