// Variables to store Matter.js engine, world, and renderer
let telophaseEngine;
let telophaseWorld;
let telophaseRender;
let telophaseRunner;
let telophaseAnimationStarted = false;
let leftCellBodies = [];
let rightCellBodies = [];
let telophaseAnimationStep = 0;
let initialBoundaryConstraints = [];
let initialBoundarySegments = [];

// Function to create a circular boundary using a chain of small bodies
function createCellBoundary(x, y, radius, world) {
  const segments = 30; // Number of segments in the circle
  const bodies = [];
  const constraints = [];

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

    constraints.push(constraint);
    Matter.World.add(world, constraint);
  }

  Matter.World.add(world, bodies);
  return { segments: bodies, constraints: constraints };
}

// Function to initialize Telophase simulation
function initTelophase() {
  // Set up the Matter.js engine
  telophaseEngine = Matter.Engine.create({
    enableSleeping: false,
    constraintIterations: 5,
  });
  telophaseWorld = telophaseEngine.world;

  // Remove gravity for fluid-like movement
  telophaseWorld.gravity.y = 0;

  // Get the container dimensions
  const container = document.getElementById("telophase-canvas").parentElement;
  const width = container.clientWidth;
  const height = container.clientHeight;

  // Create renderer
  telophaseRender = Matter.Render.create({
    element: container,
    engine: telophaseEngine,
    canvas: document.getElementById("telophase-canvas"),
    options: {
      width: width,
      height: height,
      wireframes: false,
      background: "#f8f9fa",
    },
  });

  // Initialize central coordinates
  const centerX = width / 2;
  const centerY = height / 2;
  const cellRadius = Math.min(width, height) * 0.25;

  // Non-overlapping initial positions for the two cells
  const initialOffset = cellRadius * 0.95; // Adjust to ensure no overlap
  const leftCellCenter = { x: centerX - initialOffset, y: centerY };
  const rightCellCenter = { x: centerX + initialOffset, y: centerY };

  // Create target positions for when cells fully separate
  const finalOffset = cellRadius * 1.5; // Final separation distance
  const leftFinalPos = { x: centerX - finalOffset, y: centerY };
  const rightFinalPos = { x: centerX + finalOffset, y: centerY };

  // Create the initial single cell boundary that surrounds both cells
  // Make it a bit oval-shaped to encompass both cell groups
  const largeRadius = cellRadius * 2.2;
  const initialBoundary = createCellBoundary(
    centerX,
    centerY,
    largeRadius,
    telophaseWorld,
  );

  initialBoundarySegments = initialBoundary.segments;
  initialBoundaryConstraints = initialBoundary.constraints;

  // Create chromosomes clusters at left and right sides
  const leftChromosomes = [];
  for (let i = 0; i < 5; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * cellRadius * 0.5;

    const chromosomeX = leftCellCenter.x + Math.cos(angle) * distance;
    const chromosomeY = leftCellCenter.y + Math.sin(angle) * distance;

    const chromosome = Matter.Bodies.rectangle(
      chromosomeX,
      chromosomeY,
      8,
      20,
      {
        collisionFilter: {
          category: 0x0002,
          mask: 0x0002,
        },
        render: {
          fillStyle: "#4a86e8",
        },
        angle: Math.random() * Math.PI,
        friction: 0.1,
        frictionAir: 0.05,
      },
    );

    leftChromosomes.push(chromosome);
    Matter.World.add(telophaseWorld, chromosome);
  }

  const rightChromosomes = [];
  for (let i = 0; i < 5; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * cellRadius * 0.5;

    const chromosomeX = rightCellCenter.x + Math.cos(angle) * distance;
    const chromosomeY = rightCellCenter.y + Math.sin(angle) * distance;

    const chromosome = Matter.Bodies.rectangle(
      chromosomeX,
      chromosomeY,
      8,
      20,
      {
        collisionFilter: {
          category: 0x0002,
          mask: 0x0002,
        },
        render: {
          fillStyle: "#4a86e8",
        },
        angle: Math.random() * Math.PI,
        friction: 0.1,
        frictionAir: 0.05,
      },
    );

    rightChromosomes.push(chromosome);
    Matter.World.add(telophaseWorld, chromosome);
  }

  // Add centrosomes to each side
  const leftCentrosome1 = Matter.Bodies.circle(
    leftCellCenter.x - cellRadius * 0.4,
    leftCellCenter.y - cellRadius * 0.3,
    8,
    {
      isStatic: false,
      render: {
        fillStyle: "#ffcc00",
        strokeStyle: "#e6b800",
        lineWidth: 2,
      },
      frictionAir: 0.2,
    },
  );

  const leftCentrosome2 = Matter.Bodies.circle(
    leftCellCenter.x,
    leftCellCenter.y - cellRadius * 0.3,
    8,
    {
      isStatic: false,
      render: {
        fillStyle: "#ffcc00",
        strokeStyle: "#e6b800",
        lineWidth: 2,
      },
      frictionAir: 0.2,
    },
  );

  const rightCentrosome1 = Matter.Bodies.circle(
    rightCellCenter.x,
    rightCellCenter.y - cellRadius * 0.3,
    8,
    {
      isStatic: false,
      render: {
        fillStyle: "#ffcc00",
        strokeStyle: "#e6b800",
        lineWidth: 2,
      },
      frictionAir: 0.2,
    },
  );

  const rightCentrosome2 = Matter.Bodies.circle(
    rightCellCenter.x + cellRadius * 0.4,
    rightCellCenter.y - cellRadius * 0.3,
    8,
    {
      isStatic: false,
      render: {
        fillStyle: "#ffcc00",
        strokeStyle: "#e6b800",
        lineWidth: 2,
      },
      frictionAir: 0.2,
    },
  );

  Matter.World.add(telophaseWorld, [
    leftCentrosome1,
    leftCentrosome2,
    rightCentrosome1,
    rightCentrosome2,
  ]);

  // Store all bodies by cell
  leftCellBodies = [...leftChromosomes, leftCentrosome1, leftCentrosome2];
  rightCellBodies = [...rightChromosomes, rightCentrosome1, rightCentrosome2];

  // Setup the animation sequence
  let nucleiFormed = false;
  let leftNucleus, rightNucleus;
  let leftCellBoundary, rightCellBoundary;

  Matter.Events.on(telophaseEngine, "beforeUpdate", function () {
    // Animation timing
    if (
      telophaseAnimationStep === 0 &&
      telophaseEngine.timing.timestamp > 2000
    ) {
      // Step 1: Form nuclear envelopes
      telophaseAnimationStep = 1;

      // Create nuclear envelopes
      const nucleusRadius = cellRadius * 0.6;

      leftNucleus = Matter.Bodies.circle(
        leftCellCenter.x,
        leftCellCenter.y,
        nucleusRadius,
        {
          isStatic: true,
          collisionFilter: {
            category: 0x0001,
            mask: 0x0000, // Don't collide with anything
          },
          render: {
            fillStyle: "rgba(230, 230, 250, 0.5)",
            strokeStyle: "#666",
            lineWidth: 2,
          },
        },
      );

      rightNucleus = Matter.Bodies.circle(
        rightCellCenter.x,
        rightCellCenter.y,
        nucleusRadius,
        {
          isStatic: true,
          collisionFilter: {
            category: 0x0001,
            mask: 0x0000, // Don't collide with anything
          },
          render: {
            fillStyle: "rgba(230, 230, 250, 0.5)",
            strokeStyle: "#666",
            lineWidth: 2,
          },
        },
      );

      Matter.World.add(telophaseWorld, [leftNucleus, rightNucleus]);
      nucleiFormed = true;
    } else if (
      telophaseAnimationStep === 1 &&
      telophaseEngine.timing.timestamp > 4000
    ) {
      // Step 2: Begin cytokinesis - create individual cell boundaries and remove the initial one
      telophaseAnimationStep = 2;

      // Create two new cell boundaries first
      const boundaryLeft = createCellBoundary(
        leftCellCenter.x,
        leftCellCenter.y,
        cellRadius,
        telophaseWorld,
      );

      const boundaryRight = createCellBoundary(
        rightCellCenter.x,
        rightCellCenter.y,
        cellRadius,
        telophaseWorld,
      );

      leftCellBoundary = boundaryLeft.segments;
      rightCellBoundary = boundaryRight.segments;

      // Now properly remove the initial large boundary
      initialBoundaryConstraints.forEach((constraint) => {
        Matter.World.remove(telophaseWorld, constraint);
      });

      initialBoundarySegments.forEach((segment) => {
        Matter.World.remove(telophaseWorld, segment);
      });
    } else if (
      telophaseAnimationStep === 2 &&
      telophaseEngine.timing.timestamp > 6000
    ) {
      // Step 3: Separate the cells further
      telophaseAnimationStep = 3;

      // Now we'll gradually move cells to their final positions
      const moveStep = cellRadius * 0.01; // Small movement per frame

      // Keep moving cells until they reach final positions
      Matter.Events.on(telophaseEngine, "beforeUpdate", function () {
        if (Math.abs(leftCellCenter.x - leftFinalPos.x) > moveStep) {
          // Move left cell parts
          leftCellCenter.x -= moveStep;
          leftNucleus.position.x -= moveStep;
          leftCellBodies.forEach((body) => {
            Matter.Body.setPosition(body, {
              x: body.position.x - moveStep,
              y: body.position.y,
            });
          });

          // Update left cell boundary
          leftCellBoundary.forEach((segment) => {
            Matter.Body.setPosition(segment, {
              x: segment.position.x - moveStep,
              y: segment.position.y,
            });
          });

          // Move right cell parts
          rightCellCenter.x += moveStep;
          rightNucleus.position.x += moveStep;
          rightCellBodies.forEach((body) => {
            Matter.Body.setPosition(body, {
              x: body.position.x + moveStep,
              y: body.position.y,
            });
          });

          // Update right cell boundary
          rightCellBoundary.forEach((segment) => {
            Matter.Body.setPosition(segment, {
              x: segment.position.x + moveStep,
              y: segment.position.y,
            });
          });
        }
      });
    }
  });

  // Custom rendering
  Matter.Events.on(telophaseRender, "afterRender", function () {
    const ctx = telophaseRender.context;

    // Draw midbody ring during early stages
    if (telophaseAnimationStep < 3) {
      ctx.strokeStyle = "#ffcc00";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
      ctx.stroke();

      // Also draw a cleavage furrow indication if we still have the original boundary
      if (telophaseAnimationStep < 2) {
        ctx.strokeStyle = "#666";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - largeRadius);
        ctx.lineTo(centerX, centerY + largeRadius);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Draw some additional microtubules from centrosomes
    ctx.strokeStyle = "rgba(255, 204, 0, 0.4)";
    ctx.lineWidth = 1;

    [
      leftCentrosome1,
      leftCentrosome2,
      rightCentrosome1,
      rightCentrosome2,
    ].forEach((centrosome) => {
      // Draw radiating microtubules from centrosomes
      const numRays = 12;
      const rayLength = cellRadius * 0.2;

      for (let i = 0; i < numRays; i++) {
        const angle = ((Math.PI * 2) / numRays) * i;
        ctx.beginPath();
        ctx.moveTo(centrosome.position.x, centrosome.position.y);
        ctx.lineTo(
          centrosome.position.x + Math.cos(angle) * rayLength,
          centrosome.position.y + Math.sin(angle) * rayLength,
        );
        ctx.stroke();
      }
    });
  });

  // Start the renderer
  Matter.Render.run(telophaseRender);

  // Create runner
  telophaseRunner = Matter.Runner.create();
  Matter.Runner.run(telophaseRunner, telophaseEngine);

  // Add highlight points
  addHighlightPoint(
    "telophase-highlights",
    50,
    50,
    "Midbody Ring",
    "Structure that forms during cytokinesis to aid in final separation of the two daughter cells",
  );

  addHighlightPoint(
    "telophase-highlights",
    30,
    40,
    "Nuclear Envelope",
    "The nuclear membrane reforms around each set of chromosomes",
  );

  addHighlightPoint(
    "telophase-highlights",
    70,
    40,
    "Daughter Cell",
    "One of two genetically identical cells resulting from mitosis",
  );
}

// Function to clean up Telophase simulation
function cleanupTelophase() {
  if (telophaseRender) {
    Matter.Render.stop(telophaseRender);
    if (telophaseRunner) Matter.Runner.stop(telophaseRunner);
    if (telophaseWorld) Matter.World.clear(telophaseWorld);
    if (telophaseEngine) Matter.Engine.clear(telophaseEngine);

    // Clear canvas
    const canvas = document.getElementById("telophase-canvas");
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    telophaseRender = null;
    telophaseWorld = null;
    telophaseEngine = null;
    telophaseRunner = null;
    leftCellBodies = [];
    rightCellBodies = [];
    telophaseAnimationStep = 0;
    initialBoundaryConstraints = [];
    initialBoundarySegments = [];
  }
}

// Initialize when tab becomes active
document.addEventListener("DOMContentLoaded", function () {
  if (document.querySelector(".phase-content.active").id === "telophase") {
    initTelophase();
  }
});
