document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("current-year").textContent =
    new Date().getFullYear();
});

document.addEventListener("DOMContentLoaded", function () {
  // Phase navigation
  const phaseTabs = document.querySelectorAll(".phase-tab");
  const phaseContents = document.querySelectorAll(".phase-content");
  const nextButtons = document.querySelectorAll("#next-btn");
  const prevButtons = document.querySelectorAll("#prev-btn");
  const tooltip = document.getElementById("tooltip");

  const phases = [
    "prophase",
    "prometaphase",
    "metaphase",
    "anaphase",
    "telophase",
  ];
  let currentPhaseIndex = 0;
  let activeEngines = {};

  // Set up tab navigation
  phaseTabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      const phase = this.getAttribute("data-phase");
      setActivePhase(phase);
    });
  });

  // Set up next/prev buttons
  nextButtons.forEach((button) => {
    button.addEventListener("click", function () {
      if (currentPhaseIndex < phases.length - 1) {
        currentPhaseIndex++;
        setActivePhase(phases[currentPhaseIndex]);
      }
    });
  });

  prevButtons.forEach((button) => {
    button.addEventListener("click", function () {
      if (currentPhaseIndex > 0) {
        currentPhaseIndex--;
        setActivePhase(phases[currentPhaseIndex]);
      }
    });
  });

  function setActivePhase(phaseName) {
    // First clean up any active simulations
    cleanupAllSimulations();

    // Update tabs
    phaseTabs.forEach((tab) => {
      if (tab.getAttribute("data-phase") === phaseName) {
        tab.classList.add("active");
      } else {
        tab.classList.remove("active");
      }
    });

    // Update content
    phaseContents.forEach((content) => {
      if (content.id === phaseName) {
        content.classList.add("active");
        // Initialize the Matter.js simulation for this phase
        const initFunctionName = `init${capitalizeFirstLetter(phaseName)}`;
        if (window[initFunctionName]) {
          window[initFunctionName]();
        }
      } else {
        content.classList.remove("active");
      }
    });

    // Update current phase index
    currentPhaseIndex = phases.indexOf(phaseName);

    // Update next/prev buttons
    updateNavButtons();
  }

  function cleanupAllSimulations() {
    // Clean up all phase simulations
    phases.forEach((phase) => {
      const cleanupFunctionName = `cleanup${capitalizeFirstLetter(phase)}`;
      if (window[cleanupFunctionName]) {
        window[cleanupFunctionName]();
      }
    });
  }

  function updateNavButtons() {
    // Update all prev buttons
    prevButtons.forEach((button) => {
      if (currentPhaseIndex === 0) {
        button.disabled = true;
      } else {
        button.disabled = false;
        button.textContent = `Previous: ${capitalizeFirstLetter(phases[currentPhaseIndex - 1])}`;
      }
    });

    // Update all next buttons
    nextButtons.forEach((button) => {
      if (currentPhaseIndex === phases.length - 1) {
        button.disabled = true;
        button.textContent = "Process Complete";
      } else {
        button.disabled = false;
        button.textContent = `Next: ${capitalizeFirstLetter(phases[currentPhaseIndex + 1])}`;
      }
    });
  }

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  // Common utility function to add highlight points
  window.addHighlightPoint = function (
    containerId,
    left,
    top,
    title,
    description,
  ) {
    const container = document.getElementById(containerId);

    // Clean existing points first
    const existingPoints = container.querySelectorAll(".highlight-point");
    existingPoints.forEach((point) => point.remove());

    const point = document.createElement("div");
    point.classList.add("highlight-point");
    point.style.left = left + "%";
    point.style.top = top + "%";
    point.setAttribute("data-title", title);
    point.setAttribute("data-description", description);

    // Add mouse events for tooltip
    point.addEventListener("mouseenter", function (e) {
      tooltip.innerHTML = `<strong>${title}</strong><br>${description}`;
      tooltip.style.opacity = "1";

      // Position the tooltip
      const rect = this.getBoundingClientRect();
      tooltip.style.left = rect.left + rect.width + "px";
      tooltip.style.top = rect.top + "px";
    });

    point.addEventListener("mouseleave", function () {
      tooltip.style.opacity = "0";
    });

    container.appendChild(point);
    return point;
  };

  // Initialize the first active phase
  const activePhase = document.querySelector(".phase-content.active").id;
  setActivePhase(activePhase);
});
