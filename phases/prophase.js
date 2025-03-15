// Variables to store Matter.js engine, world, and renderer
let prophaseEngine;
let prophaseWorld;
let prophaseRender;
let prophaseRunner;
let centrosomes = [];

// Function to create a circular boundary using a chain of small bodies
function createCellBoundary(x, y, radius, world) {
  const segments = 30; // Number of segments in the circle
  const bodies = [];

  for (let i = 0; i < segments; i++) {
    const angle = ((Math.PI * 2) / segments) * i;
    const x1 = x + radius * Math.cos(angle);
    const y1 = y + radius * Math.sin(angle);

    const segment = Matter.Bodies.circle(x1, y1, 3, {
      isStatic: true,
      render: {
        fillStyle: "#333",
        strokeStyle: "#333",
        lineWidth: 1,
      },
    });

    bodies.push(segment);
  }

  // Create a chain constraint connecting all segments
  for (let i = 0; i < bodies.length; i++) {
    const current = bodies[i];
    const next = bodies[(i + 1) % bodies.length];

    const constraint = Matter.Constraint.create({
      bodyA: current,
      bodyB: next,
      stiffness: 1,
      render: {
        strokeStyle: "#333",
        lineWidth: 2,
      },
    });

    Matter.World.add(world, constraint);
  }

  Matter.World.add(world, bodies);
  return bodies;
}

// Function to initialize Prophase simulation
function initProphase() {
  try {
    // Check if the canvas exists before proceeding
    const canvas = document.getElementById("prophase-canvas");
    if (!canvas) {
      console.warn("Prophase canvas not found, deferring initialization");
      return;
    }

    // Get the container dimensions
    const container = canvas.parentElement;
    if (!container) {
      console.warn("Prophase canvas container not found");
      return;
    }

    // Set up the Matter.js engine
    prophaseEngine = Matter.Engine.create({
      enableSleeping: false,
      constraintIterations: 5,
    });
    prophaseWorld = prophaseEngine.world;

    // Remove gravity for fluid-like movement
    prophaseWorld.gravity.y = 0;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Create renderer
    prophaseRender = Matter.Render.create({
      element: container,
      engine: prophaseEngine,
      canvas: canvas,
      options: {
        width: width,
        height: height,
        wireframes: false,
        background: "#f8f9fa",
      },
    });

    // Create a cell boundary
    const cellCenter = { x: width / 2, y: height / 2 };
    const cellRadius = Math.min(width, height) * 0.4;

    const cellBoundary = createCellBoundary(
      cellCenter.x,
      cellCenter.y,
      cellRadius,
      prophaseWorld,
    );

    // Add nucleus (circle inside)
    const nucleusRadius = cellRadius * 0.5;
    const nucleus = Matter.Bodies.circle(
      cellCenter.x,
      cellCenter.y,
      nucleusRadius,
      {
        isStatic: true,
        collisionFilter: {
          category: 0x0001,
          mask: 0x0001, // Only collide with its own category
        },
        render: {
          fillStyle: "rgba(230, 230, 250, 0.5)",
          strokeStyle: "#666",
          lineWidth: 2,
        },
      },
    );
    Matter.World.add(prophaseWorld, nucleus);

    // Create randomly positioned centrosomes that will move to opposite ends
    // Random positions within the cell but away from the very edge
    const safetyMargin = cellRadius * 0.2;
    const randomRadius1 =
      Math.random() * (cellRadius - safetyMargin - nucleusRadius) +
      nucleusRadius;
    const randomAngle1 = Math.random() * Math.PI * 2;
    const x1 = cellCenter.x + randomRadius1 * Math.cos(randomAngle1);
    const y1 = cellCenter.y + randomRadius1 * Math.sin(randomAngle1);

    // Second centrosome in a different part of the cell
    let randomRadius2, randomAngle2, x2, y2;
    do {
      randomRadius2 =
        Math.random() * (cellRadius - safetyMargin - nucleusRadius) +
        nucleusRadius;
      randomAngle2 = Math.random() * Math.PI * 2;
      x2 = cellCenter.x + randomRadius2 * Math.cos(randomAngle2);
      y2 = cellCenter.y + randomRadius2 * Math.sin(randomAngle2);
      // Ensure they're not too close to each other
    } while (
      Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)) <
      cellRadius * 0.3
    );

    const centrosome1 = Matter.Bodies.circle(x1, y1, 10, {
      isStatic: false, // Make it dynamic so we can move it
      render: {
        fillStyle: "#ffcc00",
        strokeStyle: "#e6b800",
        lineWidth: 2,
      },
      frictionAir: 0.1, // Add some air friction for smoother movement
    });

    const centrosome2 = Matter.Bodies.circle(x2, y2, 10, {
      isStatic: false, // Make it dynamic so we can move it
      render: {
        fillStyle: "#ffcc00",
        strokeStyle: "#e6b800",
        lineWidth: 2,
      },
      frictionAir: 0.1, // Add some air friction for smoother movement
    });

    centrosomes = [centrosome1, centrosome2];
    Matter.World.add(prophaseWorld, [centrosome1, centrosome2]);

    // Define target positions at opposite poles
    const targetPos1 = {
      x: cellCenter.x - cellRadius * 0.8,
      y: cellCenter.y,
    };

    const targetPos2 = {
      x: cellCenter.x + cellRadius * 0.8,
      y: cellCenter.y,
    };

    // Create chromosomes inside nucleus
    const chromosomes = [];
    for (let i = 0; i < 6; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * nucleusRadius * 0.7;

      const chromosomeX = cellCenter.x + Math.cos(angle) * distance;
      const chromosomeY = cellCenter.y + Math.sin(angle) * distance;

      const chromosome = Matter.Bodies.rectangle(
        chromosomeX,
        chromosomeY,
        10,
        30,
        {
          collisionFilter: {
            category: 0x0002, // Different category than nucleus
            mask: 0x0002, // Only collide with other chromosomes
          },
          render: {
            fillStyle: "#4a86e8",
          },
          angle: Math.random() * Math.PI,
          friction: 0.5,
          frictionAir: 0.05,
          restitution: 0.3,
        },
      );

      // Add a constraint to keep chromosome within nucleus
      const constraint = Matter.Constraint.create({
        pointA: { x: cellCenter.x, y: cellCenter.y },
        bodyB: chromosome,
        stiffness: 0.001,
        damping: 0.1,
        length: nucleusRadius * 0.7,
        render: {
          visible: false,
        },
      });

      chromosomes.push(chromosome);
      Matter.World.add(prophaseWorld, [chromosome, constraint]);
    }

    // Add an event to gradually move centrosomes to opposite poles
    Matter.Events.on(prophaseEngine, "beforeUpdate", function () {
      // Apply force to first centrosome to move toward left pole
      const force1X = targetPos1.x - centrosome1.position.x;
      const force1Y = targetPos1.y - centrosome1.position.y;
      const mag1 = Math.sqrt(force1X * force1X + force1Y * force1Y);

      if (mag1 > 1) {
        // Only apply force if not very close to target
        const normalizedForce1X = force1X / mag1;
        const normalizedForce1Y = force1Y / mag1;
        Matter.Body.applyForce(centrosome1, centrosome1.position, {
          x: normalizedForce1X * 0.00005,
          y: normalizedForce1Y * 0.00005,
        });
      }

      // Apply force to second centrosome to move toward right pole
      const force2X = targetPos2.x - centrosome2.position.x;
      const force2Y = targetPos2.y - centrosome2.position.y;
      const mag2 = Math.sqrt(force2X * force2X + force2Y * force2Y);

      if (mag2 > 1) {
        // Only apply force if not very close to target
        const normalizedForce2X = force2X / mag2;
        const normalizedForce2Y = force2Y / mag2;
        Matter.Body.applyForce(centrosome2, centrosome2.position, {
          x: normalizedForce2X * 0.00005,
          y: normalizedForce2Y * 0.00005,
        });
      }
    });

    // Draw microtubules from centrosomes (using Matter.js Render.afterRender)
    Matter.Events.on(prophaseRender, "afterRender", function () {
      const ctx = prophaseRender.context;
      if (!ctx) return;

      // Draw microtubules from centrosomes
      ctx.strokeStyle = "rgba(255, 204, 0, 0.4)";
      ctx.lineWidth = 1;

      // Draw radiating microtubules from centrosomes
      const numRays = 16;
      const rayLength = cellRadius * 0.3;

      // Draw microtubules from first centrosome
      for (let i = 0; i < numRays; i++) {
        const angle = ((Math.PI * 2) / numRays) * i;
        ctx.beginPath();
        ctx.moveTo(centrosome1.position.x, centrosome1.position.y);
        ctx.lineTo(
          centrosome1.position.x + Math.cos(angle) * rayLength,
          centrosome1.position.y + Math.sin(angle) * rayLength,
        );
        ctx.stroke();
      }

      // Draw microtubules from second centrosome
      for (let i = 0; i < numRays; i++) {
        const angle = ((Math.PI * 2) / numRays) * i;
        ctx.beginPath();
        ctx.moveTo(centrosome2.position.x, centrosome2.position.y);
        ctx.lineTo(
          centrosome2.position.x + Math.cos(angle) * rayLength,
          centrosome2.position.y + Math.sin(angle) * rayLength,
        );
        ctx.stroke();
      }
    });

    // Start the renderer
    Matter.Render.run(prophaseRender);

    // Create runner
    prophaseRunner = Matter.Runner.create();
    Matter.Runner.run(prophaseRunner, prophaseEngine);

    // Add highlight points
    const highlightContainer = document.getElementById("prophase-highlights");
    if (highlightContainer) {
      addHighlightPoint(
        "prophase-highlights",
        25,
        30,
        "Centrosomes",
        "Yellow organelles that serve as microtubule organizing centers and migrate to opposite poles during prophase",
      );
      addHighlightPoint(
        "prophase-highlights",
        50,
        50,
        "Condensing Chromosomes",
        "DNA strands that have condensed and become visible",
      );
    }
  } catch (error) {
    console.error("Error initializing prophase simulation:", error);
  }
}

// Function to clean up Prophase simulation
function cleanupProphase() {
  try {
    if (prophaseRender) {
      Matter.Render.stop(prophaseRender);
      if (prophaseRunner) Matter.Runner.stop(prophaseRunner);
      if (prophaseWorld) Matter.World.clear(prophaseWorld);
      if (prophaseEngine) Matter.Engine.clear(prophaseEngine);

      // Clear canvas
      const canvas = document.getElementById("prophase-canvas");
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      prophaseRender = null;
      prophaseWorld = null;
      prophaseEngine = null;
      prophaseRunner = null;
      centrosomes = [];
    }
  } catch (error) {
    console.error("Error cleaning up prophase simulation:", error);
  }
}

// Initialize when document loads
document.addEventListener("DOMContentLoaded", function () {
  // Add a slight delay to ensure all elements are properly rendered
  setTimeout(function () {
    if (document.querySelector(".phase-content.active")?.id === "prophase") {
      initProphase();
    }
  }, 100);
});
