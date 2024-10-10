// Start the loader counter when DOM is ready (doesn't wait for full content load)
document.addEventListener('DOMContentLoaded', function () {
    const loaderTime = 2000; // Loader duration (2 seconds)
    const counterElement = document.querySelector(".counter");

    // Start the loader counter immediately
    startLoader(loaderTime, counterElement);
});

// Wait until the page has fully loaded (including images and videos)
window.addEventListener('load', function () {
    const loaderElement = document.getElementById('loader');
    const contentElement = document.getElementById('content');
    const loaderTime = 2000; // Make sure the loader time is consistent

    // Set a minimum loader time
    setTimeout(function () {
        // Smooth fade-out for the loader (including the video)
        gsap.to(loaderElement, {
            duration: 1,  // 1 second fade-out
            opacity: 0,
            ease: "power2.out",
            onComplete: function () {
                loaderElement.style.display = 'none';  // Hide the loader after fade-out

                // Smooth fade-in for the content
                gsap.to(contentElement, {
                    duration: 1,  // 1 second fade-in
                    opacity: 1,
                    ease: "power2.inOut",
                    onComplete: initMarquee // Initialize marquee after content is fully visible
                });
            }
        });

    }, loaderTime); // Match this time to loaderTime
});

// Function to initialize the GSAP marquee animation
function initMarquee() {
    const wrapper = document.querySelector(".wrapper-marquee");
    const boxes = gsap.utils.toArray(".box-marquee");

    if (boxes.length > 0) {
        const loop = horizontalLoop(boxes, {
            paused: false,
            repeat: -1,
            speed: 1.25,
        });
    } else {
        console.error("Marquee boxes not found in the DOM.");
    }
}

// Define the startLoader function for updating the counter
function startLoader(loaderTime, counterElement) {
    let currentValue = 0;
    const totalSteps = 100;
    const incrementStep = 100 / (loaderTime / 100);

    function updateCounter() {
        if (currentValue < totalSteps) {
            currentValue += incrementStep;
            if (currentValue > totalSteps) {
                currentValue = totalSteps;
            }
            counterElement.textContent = Math.floor(currentValue);

            // Update the counter at a regular interval
            setTimeout(updateCounter, 100);
        }
    }

    // Start the counter update loop
    updateCounter();

    // Fade out the counter when the loader finishes
    gsap.to(counterElement, 0.25, {
        delay: loaderTime / 1000,
        opacity: 0,
    });
}

// Horizontal loop function for GSAP marquee
function horizontalLoop(items, config) {
    items = gsap.utils.toArray(items);
    config = config || {};
    let tl = gsap.timeline({ repeat: config.repeat, paused: config.paused, defaults: { ease: "none" }, onReverseComplete: () => tl.totalTime(tl.rawTime() + tl.duration() * 100) }),
        length = items.length,
        startX = items[0].offsetLeft,
        times = [],
        widths = [],
        xPercents = [],
        curIndex = 0,
        pixelsPerSecond = (config.speed || 1) * 100,
        snap = config.snap === false ? v => v : gsap.utils.snap(config.snap || 1),
        totalWidth, curX, distanceToStart, distanceToLoop, item, i;

    gsap.set(items, {
        xPercent: (i, el) => {
            let w = widths[i] = parseFloat(gsap.getProperty(el, "width", "px"));
            xPercents[i] = snap(parseFloat(gsap.getProperty(el, "x", "px")) / w * 100 + gsap.getProperty(el, "xPercent"));
            return xPercents[i];
        }
    });
    gsap.set(items, { x: 0 });
    totalWidth = items[length - 1].offsetLeft + xPercents[length - 1] / 100 * widths[length - 1] - startX + items[length - 1].offsetWidth * gsap.getProperty(items[length - 1], "scaleX") + (parseFloat(config.paddingRight) || 0);
    
    for (i = 0; i < length; i++) {
        item = items[i];
        curX = xPercents[i] / 100 * widths[i];
        distanceToStart = item.offsetLeft + curX - startX;
        distanceToLoop = distanceToStart + widths[i] * gsap.getProperty(item, "scaleX");

        tl.to(item, { xPercent: snap((curX - distanceToLoop) / widths[i] * 100), duration: distanceToLoop / pixelsPerSecond }, 0)
            .fromTo(item, { xPercent: snap((curX - distanceToLoop + totalWidth) / widths[i] * 100) }, { xPercent: xPercents[i], duration: (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond, immediateRender: false }, distanceToLoop / pixelsPerSecond)
            .add("label" + i, distanceToStart / pixelsPerSecond);

        times[i] = distanceToStart / pixelsPerSecond;
    }

    function toIndex(index, vars) {
        vars = vars || {};
        (Math.abs(index - curIndex) > length / 2) && (index += index > curIndex ? -length : length);
        let newIndex = gsap.utils.wrap(0, length, index),
            time = times[newIndex];

        if (time > tl.time() !== index > curIndex) {
            vars.modifiers = { time: gsap.utils.wrap(0, tl.duration()) };
            time += tl.duration() * (index > curIndex ? 1 : -1);
        }
        curIndex = newIndex;
        vars.overwrite = true;
        return tl.tweenTo(time, vars);
    }

    tl.next = vars => toIndex(curIndex + 1, vars);
    tl.previous = vars => toIndex(curIndex - 1, vars);
    tl.current = () => curIndex;
    tl.toIndex = (index, vars) => toIndex(index, vars);
    tl.times = times;
    tl.progress(1, true).progress(0, true);

    if (config.reversed) {
        tl.vars.onReverseComplete();
        tl.reverse();
    }

    return tl;
}
