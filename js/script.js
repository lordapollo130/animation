document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const circleSection = document.getElementById("circleAnimation");
  const textContent = document.querySelector(".text-content");
  const circleWrappers = document.querySelectorAll(".circle-wrapper");
  const circles = document.querySelectorAll(".circle");
  const rings = document.querySelectorAll(".ring");
  const dottedMasks = document.querySelectorAll(".dotted-mask");

  // Animation state
  let animationTriggered = false;
  let animationCompleted = false;
  let sectionLocked = false;
  let currentCircleIndex = 0;
  let scrollDirection = "down";
  let lastScrollY = 0;
  let sectionScrollProgress = 0;

  // Clockwise order: align (0), activate (1), execute (3), evolve (2)
  const clockwiseOrder = [0, 1, 3, 2];

  // Initial positions for circles
  const initialPositions = [
    { x: -150, y: -150 }, // align (top-left)
    { x: 150, y: -150 }, // activate (top-right)
    { x: -150, y: 150 }, // evolve (bottom-left)
    { x: 150, y: 150 }, // execute (bottom-right)
  ];

  // Get the section's position
  const getSectionPosition = () => {
    const rect = circleSection.getBoundingClientRect();
    return {
      top: rect.top,
      bottom: rect.bottom,
      height: rect.height,
    };
  };

  // Check scroll direction
  const updateScrollDirection = () => {
    const currentScrollY = window.scrollY;
    scrollDirection = currentScrollY > lastScrollY ? "down" : "up";
    lastScrollY = currentScrollY;
  };

  // Check if section is in view
  const isSectionInView = () => {
    const position = getSectionPosition();
    return position.top <= window.innerHeight && position.bottom >= 0;
  };

  // Check if we should lock scrolling
  const shouldLockScroll = () => {
    const position = getSectionPosition();
    return position.top <= 0 && !animationCompleted;
  };

  // Animate a single circle
  const animateCircle = (index, direction = "in") => {
    const wrapper = circleWrappers[index];
    const circle = wrapper.querySelector(".circle");
    const ring = wrapper.querySelector(".ring");
    const mask = wrapper.querySelector(".dotted-mask");
    const content = wrapper.querySelector(".circle-content");

    if (direction === "in") {
      wrapper.classList.add("visible");
      wrapper.classList.add("animate");

      // Apply spin animation with alternating directions for variety
      const spinDirection = index % 2 === 0 ? 1 : -1;

      // Add custom keyframes if not already added
      if (!document.getElementById("spin-keyframes")) {
        const style = document.createElement("style");
        style.id = "spin-keyframes";
        style.textContent = `
                  @keyframes spinIn {
                      from { transform: translate(-50%, -50%) rotate(0deg) scale(0); opacity: 0; }
                      to { transform: translate(-50%, -50%) rotate(360deg) scale(1); opacity: 1; }
                  }
                  @keyframes spinInReverse {
                      from { transform: translate(-50%, -50%) rotate(0deg) scale(0); opacity: 0; }
                      to { transform: translate(-50%, -50%) rotate(-360deg) scale(1); opacity: 1; }
                  }
                  @keyframes fadeInContent {
                      from { opacity: 0; transform: translateY(20px); }
                      to { opacity: 1; transform: translateY(0); }
                  }
              `;
        document.head.appendChild(style);
      }

      // Apply animations
      circle.style.animation = `spinIn${
        spinDirection < 0 ? "Reverse" : ""
      } 1s ease-out forwards`;
      ring.style.animation = `spinIn${
        spinDirection < 0 ? "Reverse" : ""
      } 1.2s ease-out forwards`;
      mask.style.animation = `spinIn${
        spinDirection < 0 ? "Reverse" : ""
      } 1.4s ease-out forwards`;

      // Animate content after circle animation
      setTimeout(() => {
        content.style.animation = "fadeInContent 0.8s ease-out forwards";
        content.classList.add("visible");
      }, 800);
    } else {
      // Fade out animation
      content.style.animation = "fadeInContent 0.5s ease-out reverse";
      content.classList.remove("visible");

      setTimeout(() => {
        circle.style.animation = "spinIn 0.8s ease-out reverse";
        ring.style.animation = "spinIn 0.8s ease-out reverse";
        mask.style.animation = "spinIn 0.8s ease-out reverse";

        setTimeout(() => {
          wrapper.classList.remove("visible");
          wrapper.classList.remove("animate");
          circle.style.animation = "";
          ring.style.animation = "";
          mask.style.animation = "";
          content.style.animation = "";
        }, 800);
      }, 300);
    }
  };

  // Handle scroll-controlled animation
  const handleScrollAnimation = () => {
    if (!isSectionInView()) return;

    updateScrollDirection();

    if (!animationTriggered) {
      animationTriggered = true;
      textContent.classList.add("visible");
    }

    const position = getSectionPosition();
    const viewportHeight = window.innerHeight;

    // Calculate scroll progress within the section
    let scrollProgress = 0;
    if (position.top <= 0) {
      scrollProgress = Math.min(
        1,
        Math.abs(position.top) / (position.height - viewportHeight)
      );
    }

    // Calculate which circles should be visible based on scroll progress
    const totalSteps = clockwiseOrder.length;
    const progressPerStep = 1 / (totalSteps + 1); // +1 for initial state
    const targetIndex = Math.floor(scrollProgress / progressPerStep);

    if (scrollDirection === "down") {
      // Show circles in clockwise order
      while (
        currentCircleIndex < targetIndex &&
        currentCircleIndex < totalSteps
      ) {
        const circleIndex = clockwiseOrder[currentCircleIndex];
        animateCircle(circleIndex, "in");
        currentCircleIndex++;
      }

      if (currentCircleIndex >= totalSteps) {
        animationCompleted = true;
      }
    } else {
      // Hide circles in reverse clockwise order
      while (currentCircleIndex > targetIndex && currentCircleIndex > 0) {
        currentCircleIndex--;
        const circleIndex = clockwiseOrder[currentCircleIndex];
        animateCircle(circleIndex, "out");
      }

      if (currentCircleIndex === 0) {
        animationCompleted = false;
      }
    }
  };

  // Handle scroll event
  const handleScroll = () => {
    if (shouldLockScroll() && !animationCompleted) {
      sectionLocked = true;
      handleScrollAnimation();
    } else if (sectionLocked && animationCompleted) {
      // Unlock scrolling after animation completes
      sectionLocked = false;
    }

    if (isSectionInView()) {
      handleScrollAnimation();
    }
  };

  // Initialize circle positions
  circleWrappers.forEach((wrapper, index) => {
    wrapper.style.transform = `translate(calc(-50% + ${initialPositions[index].x}px), calc(-50% + ${initialPositions[index].y}px))`;
  });

  // Add event listeners
  window.addEventListener("scroll", handleScroll);
  window.addEventListener("resize", handleScroll);

  // Check initial scroll position
  handleScroll();

  // Add hover effects for circles
  circles.forEach((circle, index) => {
    circle.addEventListener("mouseenter", () => {
      if (!animationCompleted && currentCircleIndex < clockwiseOrder.length)
        return;

      const wrapper = circleWrappers[index];
      const ring = rings[index];
      const mask = dottedMasks[index];

      // Scale up circle, ring, and mask
      circle.style.transform = "translate(-50%, -50%) scale(1.05)";
      ring.style.transform = "translate(-50%, -50%) scale(1.05)";
      mask.style.transform = "translate(-50%, -50%) scale(1.05)";
    });

    circle.addEventListener("mouseleave", () => {
      if (!animationCompleted && currentCircleIndex < clockwiseOrder.length)
        return;

      const wrapper = circleWrappers[index];
      const ring = rings[index];
      const mask = dottedMasks[index];

      // Reset circle, ring, and mask scale
      circle.style.transform = "translate(-50%, -50%)";
      ring.style.transform = "translate(-50%, -50%)";
      mask.style.transform = "translate(-50%, -50%)";
    });
  });
});
