document.addEventListener("DOMContentLoaded", () => {
  // Minimal GSAP intro; delete this whole function + CDN if not needed
  const animateTextColumns = () => {
    const tl = gsap.timeline({ defaults: { duration: 0.8, ease: "power2.out" } });
    tl.to(".text-item", {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      stagger: { amount: 3, from: "start" }
    }).to(".rotated-item", { opacity: 1, filter: "blur(0px)", stagger: 0.2 }, "-=2");
  };
  setTimeout(animateTextColumns, 200);

  const container = document.querySelector(".hero-section");
  if (!container) return;

  const isMobile =
    /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth <= 768;

  const config = {
    imageLifespan: 600,
    removalDelay: 16,
    mouseThreshold: isMobile ? 20 : 40,
    scrollThreshold: 50,
    inDuration: 600,
    outDuration: 800,
    inEasing: "cubic-bezier(.07,.5,.5,1)",
    outEasing: "cubic-bezier(.87, 0, .13, 1)",
    touchImageInterval: 40,
    minMovementForImage: isMobile ? 3 : 5,
    minImageSize: isMobile ? 120 : 160,
    maxImageSize: isMobile ? 260 : 340,
    baseRotation: 30,
    maxRotationFactor: 3,
    speedSmoothingFactor: 0.25
  };

  const images = [
    "https://i.pinimg.com/1200x/39/31/86/39318692baf7faade13d1d5e2c9ba089.jpg",
    "https://i.pinimg.com/736x/da/32/6d/da326d2f72fc35c265c25c2163a1dcf2.jpg",
    "https://i.pinimg.com/1200x/12/93/7c/12937c3694a6636d1d388dfaa84f561b.jpg",
    "https://i.pinimg.com/1200x/58/d9/a0/58d9a03cf60c7e1744c52ddeadb18f8a.jpg",
    "https://i.pinimg.com/1200x/01/08/56/0108565dd27529deb10dea65297c8181.jpg",
    "https://i.pinimg.com/1200x/ad/15/1d/ad151dbf567edf463f4121fc4f148c0e.jpg",
    "https://i.pinimg.com/736x/40/70/a0/4070a07db795c651a520d75f7c0fc305.jpg",
    "https://i.pinimg.com/1200x/83/1f/ca/831fcac7ef517ee7bbea5df2f473fe58.jpg",
    "https://i.pinimg.com/736x/03/5a/85/035a85d798c508926277e8d7902f6cc5.jpg",
    "https://i.pinimg.com/1200x/19/ca/44/19ca44289bb23d1f38cd02d6d942dd43.jpg",
    "https://i.pinimg.com/1200x/b4/9b/56/b49b563f20d66cb2e45547d9a71312f4.jpg",
    "https://i.pinimg.com/736x/67/d6/b3/67d6b3b5e1315b09bdcff809248dc12d.jpg",
    "https://i.pinimg.com/736x/e9/01/0f/e9010f7ca2ed3cf4f49eeb81e29f4915.jpg",
    "https://i.pinimg.com/1200x/26/eb/ce/26ebceea248cc10af0f029bb044de955.jpg"
];

  const trail = [];
  let mouseX = 0, mouseY = 0, lastMouseX = 0, lastMouseY = 0, prevMouseX = 0, prevMouseY = 0;
  let isMoving = false, isCursorInContainer = false, isTouching = false, isScrolling = false;
  let lastRemovalTime = 0, lastTouchImageTime = 0, lastScrollTime = 0, lastMoveTime = Date.now();
  let smoothedSpeed = 0, maxSpeed = 0, imageIndex = 0;

  const rectOf = () => container.getBoundingClientRect();

  const isInContainer = (x, y) => {
    const r = rectOf();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  };

  document.addEventListener("mouseover", function initPos(e) {
    mouseX = lastMouseX = prevMouseX = e.clientX;
    mouseY = lastMouseY = prevMouseY = e.clientY;
    isCursorInContainer = isInContainer(mouseX, mouseY);
    document.removeEventListener("mouseover", initPos);
  });

  const movedBeyond = (th) => {
    const dx = mouseX - lastMouseX, dy = mouseY - lastMouseY;
    return Math.hypot(dx, dy) > th;
  };

  const movedAtAll = (min) => {
    const dx = mouseX - prevMouseX, dy = mouseY - prevMouseY;
    return Math.hypot(dx, dy) > min;
  };

  const calculateSpeed = () => {
    const now = Date.now();
    const dt = now - lastMoveTime;
    if (dt <= 0) return 0;
    const dist = Math.hypot(mouseX - prevMouseX, mouseY - prevMouseY);
    const raw = dist / dt;
    maxSpeed = Math.max(maxSpeed, raw || 0.5);
    const norm = Math.min(raw / (maxSpeed || 0.5), 1);
    smoothedSpeed = smoothedSpeed * (1 - config.speedSmoothingFactor) + norm * config.speedSmoothingFactor;
    lastMoveTime = now;
    return smoothedSpeed;
  };

  const createFlameImage = (speed) => {
    const imageSrc = images[imageIndex];
    imageIndex = (imageIndex + 1) % images.length;

    const size = config.minImageSize + (config.maxImageSize - config.minImageSize) * speed;
    const rotFactor = 1 + speed * (config.maxRotationFactor - 1);
    const rot = (Math.random() - 0.5) * config.baseRotation * rotFactor;

    const img = document.createElement("img");
    img.className = "trail-img";
    img.src = imageSrc;
    img.width = img.height = size;

    const r = rectOf();
    const x = mouseX - r.left, y = mouseY - r.top;

    img.style.left = `${x}px`;
    img.style.top = `${y}px`;
    img.style.transform = `translate(-50%, -50%) rotate(${rot}deg) scale(0)`;
    img.style.transition = `transform ${config.inDuration}ms ${config.inEasing}`;
    container.appendChild(img);

    requestAnimationFrame(() => {
      img.style.transform = `translate(-50%, -50%) rotate(${rot}deg) scale(1)`;
    });

    trail.push({
      element: img,
      rotation: rot,
      removeTime: Date.now() + config.imageLifespan
    });
  };

  const tryCreateTrail = () => {
    if (!isCursorInContainer) return;
    if ((isMoving || isTouching || isScrolling) && movedBeyond(config.mouseThreshold) && movedAtAll(config.minMovementForImage)) {
      lastMouseX = mouseX;
      lastMouseY = mouseY;
      const speed = calculateSpeed();
      createFlameImage(speed);
      prevMouseX = mouseX;
      prevMouseY = mouseY;
    }
  };

  const tryCreateTouchTrail = () => {
    if (!isCursorInContainer || !isTouching || !movedAtAll(config.minMovementForImage)) return;
    const now = Date.now();
    if (now - lastTouchImageTime < config.touchImageInterval) return;
    lastTouchImageTime = now;
    const speed = calculateSpeed();
    createFlameImage(speed);
    prevMouseX = mouseX;
    prevMouseY = mouseY;
  };

  const tryCreateScrollTrail = () => {
    if (!isCursorInContainer || !isScrolling) return;
    lastMouseX += (config.mouseThreshold + 10) * (Math.random() > 0.5 ? 1 : -1);
    lastMouseY += (config.mouseThreshold + 10) * (Math.random() > 0.5 ? 1 : -1);
    createFlameImage(0.5);
    lastMouseX = mouseX;
    lastMouseY = mouseY;
  };

  const removeOldImages = () => {
    const now = Date.now();
    if (now - lastRemovalTime < config.removalDelay || !trail.length) return;
    if (now >= trail[0].removeTime) {
      const imgObj = trail.shift();
      const el = imgObj.element;
      el.style.transition = `transform ${config.outDuration}ms ${config.outEasing}`;
      el.style.transform = `translate(-50%, -50%) rotate(${imgObj.rotation + 360}deg) scale(0)`;
      setTimeout(() => el.remove(), config.outDuration);
      lastRemovalTime = now;
    }
  };

  document.addEventListener("mousemove", (e) => {
    prevMouseX = mouseX;
    prevMouseY = mouseY;
    mouseX = e.clientX;
    mouseY = e.clientY;
    isCursorInContainer = isInContainer(mouseX, mouseY);
    if (isCursorInContainer && movedAtAll(config.minMovementForImage)) {
      isMoving = true;
      clearTimeout(window.moveTimeout);
      window.moveTimeout = setTimeout(() => (isMoving = false), 100);
    }
  }, { passive: true });

  container.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    prevMouseX = mouseX = t.clientX;
    prevMouseY = mouseY = t.clientY;
    lastMouseX = mouseX;
    lastMouseY = mouseY;
    isCursorInContainer = true;
    isTouching = true;
    lastMoveTime = Date.now();
  }, { passive: true });

  container.addEventListener("touchmove", (e) => {
    const t = e.touches[0];
    const dx = Math.abs(t.clientX - prevMouseX);
    const dy = Math.abs(t.clientY - prevMouseY);
    prevMouseX = mouseX;
    prevMouseY = mouseY;
    mouseX = t.clientX;
    mouseY = t.clientY;
    isCursorInContainer = true;
    if (dy > dx) return;
    tryCreateTouchTrail();
  }, { passive: true });

  container.addEventListener("touchend", () => { isTouching = false; }, { passive: true });

  document.addEventListener("touchstart", (e) => {
    const t = e.touches[0];
    if (!isInContainer(t.clientX, t.clientY)) {
      isCursorInContainer = false;
      isTouching = false;
    }
  }, { passive: true });

  window.addEventListener("scroll", () => {
    isCursorInContainer = isInContainer(mouseX, mouseY);
    if (!isCursorInContainer) return;

    const now = Date.now();
    if (now - lastScrollTime < config.scrollThreshold) return;
    lastScrollTime = now;

    isScrolling = true;
    clearTimeout(window.scrollTimeout);
    window.scrollTimeout = setTimeout(() => (isScrolling = false), 100);

    requestAnimationFrame(() => { if (isScrolling) tryCreateScrollTrail(); });
  }, { passive: true });

  (function loop() {
    if (isMoving || isTouching || isScrolling) tryCreateTrail();
    removeOldImages();
    requestAnimationFrame(loop);
  })();
});
