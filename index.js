// make the checkbox div focusable
const captchaCheckbox = document.getElementById("captcha-checkbox")
const checkboxSpinner = document.getElementById("captcha-checkbox-spinner")
captchaCheckbox.addEventListener("mousedown",()=> {
    // console.log("focused")
    captchaCheckbox.classList.add("focused")
    captchaCheckbox.classList.remove("blurred")

})

captchaCheckbox.addEventListener("mouseup",()=> {
    // console.log("blurred")
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
    // console.log("clicked")
    document.getElementById("captcha-main-div").classList.add("error")
    document.getElementById("captcha-error-msg").style.display = "block"
})


// fill up the solve-image-container
const imageCount = 20

// RULES: user must click/select all valid images (targets) and then press verify.
// Once a valid image has been selected, it cannot reappear.
const requiredTargets = new Set([4,5,6,7,8,9])
const selectedTargets = new Set()

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

const pickFromPool = (pool) => pool[Math.floor(Math.random() * pool.length)]

const pickNewNumber = (currentNumber = null) => {
  // Targets that are still available to be found (not yet selected)
  const availableTargets = Array.from(requiredTargets).filter(n => !selectedTargets.has(n))

  // If targets remain, allow them to appear (randomly)
  // If no targets remain, only show non-targets.
  let pool
  if (availableTargets.length > 0) {
    pool = []
    for (let n = 1; n <= imageCount; n++) {
      // Do not allow already-selected targets to ever appear again
      if (selectedTargets.has(n)) continue
      pool.push(n)
    }
  } else {
    pool = []
    for (let n = 1; n <= imageCount; n++) {
      if (!requiredTargets.has(n)) pool.push(n)
    }
  }

  // Avoid immediate same-image repeat for the same tile when possible
  if (currentNumber !== null && pool.length > 1) {
    pool = pool.filter(n => n !== currentNumber)
  }

  return pickFromPool(pool)
}

const fadeAllIfNoTargetsVisible = () => {
  if (selectedTargets.size === requiredTargets.size) return // already solvable/solved state
  if (isAnyTargetVisible()) return

  const imgs = Array.from(document.querySelectorAll(".solve-image"))
  // Trigger the existing fade-out animation briefly
  imgs.forEach(img => img.classList.add("fade-out"))
  setTimeout(() => {
    imgs.forEach(img => img.classList.remove("fade-out"))
  }, 300)
}


const solveImageContainer = document.getElementById("solve-image-main-container")
for (let i=0; i<3; i++) {
    for (let j=0; j<3; j++) {
        const imageContainer = document.createElement("div")
        imageContainer.classList.add("solve-image-container")

        const image = document.createElement("img")
        image.setAttribute("src",`./images/img${((i*3)+j)+1}.jpg`)
        image.classList.add("solve-image")
        image.addEventListener("click",()=>{
            const n = getImgNumber(image)

            // If user clicked a valid image that is not yet selected, select it and refresh that tile
            if (isTargetNumber(n) && !selectedTargets.has(n)) {
              selectedTargets.add(n)
              refreshImage(image)
              return
            }

            // Otherwise behave as before (refresh)
            refreshImage(image)
        })
        imageContainer.appendChild(image)
        solveImageContainer.appendChild(imageContainer)
    }
}

// fade effect if there are no valid images visible
fadeAllIfNoTargetsVisible()


// image on click will refresh new image
const refreshImage = (image) => {
    const current = getImgNumber(image)
    image.classList.add("fade-out") //fade out animation
    image.style.pointerEvents = "none"; //make it unclickable
    setTimeout(()=>{
        image.setAttribute("src","")
        const n = pickNewNumber(current)
        image.setAttribute("src",`./images/img${n}.jpg`)
        fadeAllIfNoTargetsVisible()
        image.classList.remove("fade-out")
        image.style.pointerEvents = "auto"; //make it clickable again
    },1000)
}

// verify succeeds only if user has selected all targets
document.getElementById("verify").addEventListener("click",()=> {
  if (selectedTargets.size === requiredTargets.size) {
    document.getElementById("solve-image-error-msg").style.display = "none"
    document.getElementById("solve-box").style.display = "none"
  } else {
    document.getElementById("solve-image-error-msg").style.display = "block"
  }
})

// refresh everything when refresh is clicked
const refreshButton = document.getElementById("refresh")
refreshButton.addEventListener("click",()=>{
    refreshButton.style.pointerEvents = "none"
    solveImageContainer.classList.add("fade-out")
    document.getElementById("solve-image-error-msg").style.display = "none"
    setTimeout(()=> {
        solveImageContainer.classList.remove("fade-out")
        solveImageContainer.innerHTML = ""
        for (let i=0; i<3; i++) {
            for (let j=0; j<3; j++) {
                const imageContainer = document.createElement("div")
                imageContainer.classList.add("solve-image-container")
        
                const image = document.createElement("img")
                const n = pickNewNumber(null)
                image.setAttribute("src",`./images/img${n}.jpg`)
                image.classList.add("solve-image")
                image.addEventListener("click",()=>{
                    const nn = getImgNumber(image)

                    if (isTargetNumber(nn) && !selectedTargets.has(nn)) {
                      selectedTargets.add(nn)
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
