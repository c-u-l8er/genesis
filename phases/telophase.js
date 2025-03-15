// Variables to store Matter.js engine, world, and renderer
let telophaseEngine;
let telophaseWorld;
let telophaseRender;
let telophaseRunner;

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

  // Get cell centers for both daughter cells
  const cellRadius = Math.min(width, height) * 0.25;
  const leftCellCenter = { x: width * 0.35, y: height * 0.5 };
  const rightCellCenter = { x: width * 0.65, y: height * 0.5 };

  // Create two complete circular cell boundaries
  createCellBoundary(
    leftCellCenter.x,
    leftCellCenter.y,
    cellRadius,
    telophaseWorld,
  );

  createCellBoundary(
    rightCellCenter.x,
    rightCellCenter.y,
    cellRadius,
    telophaseWorld,
  );

  // Add nuclei for both daughter cells
  const nucleusRadius = cellRadius * 0.5;

  const leftNucleus = Matter.Bodies.circle(
    leftCellCenter.x,
    leftCellCenter.y,
    nucleusRadius,
    {
      isStatic: true,
      collisionFilter: {
        category: 0x0001,
        mask: 0x0001,
      },
      render: {
        fillStyle: "rgba(230, 230, 250, 0.5)",
        strokeStyle: "#666",
        lineWidth: 2,
      },
    },
  );

  const rightNucleus = Matter.Bodies.circle(
    rightCellCenter.x,
    rightCellCenter.y,
    nucleusRadius,
    {
      isStatic: true,
      collisionFilter: {
        category: 0x0001,
        mask: 0x0001,
      },
      render: {
        fillStyle: "rgba(230, 230, 250, 0.5)",
        strokeStyle: "#666",
        lineWidth: 2,
      },
    },
  );

  Matter.World.add(telophaseWorld, [leftNucleus, rightNucleus]);

  // Add centrosomes to each cell (similar to prophase)
  const leftCentrosome1 = Matter.Bodies.circle(
    leftCellCenter.x - cellRadius * 0.5,
    leftCellCenter.y - cellRadius * 0.3,
    8,
    {
      isStatic: true,
      render: {
        fillStyle: "#ffcc00",
        strokeStyle: "#e6b800",
        lineWidth: 2,
      },
    },
  );

  const leftCentrosome2 = Matter.Bodies.circle(
    leftCellCenter.x + cellRadius * 0.5,
    leftCellCenter.y - cellRadius * 0.3,
    8,
    {
      isStatic: true,
      render: {
        fillStyle: "#ffcc00",
        strokeStyle: "#e6b800",
        lineWidth: 2,
      },
    },
  );

  const rightCentrosome1 = Matter.Bodies.circle(
    rightCellCenter.x - cellRadius * 0.5,
    rightCellCenter.y - cellRadius * 0.3,
    8,
    {
      isStatic: true,
      render: {
        fillStyle: "#ffcc00",
        strokeStyle: "#e6b800",
        lineWidth: 2,
      },
    },
  );

  const rightCentrosome2 = Matter.Bodies.circle(
    rightCellCenter.x + cellRadius * 0.5,
    rightCellCenter.y - cellRadius * 0.3,
    8,
    {
      isStatic: true,
      render: {
        fillStyle: "#ffcc00",
        strokeStyle: "#e6b800",
        lineWidth: 2,
      },
    },
  );

  Matter.World.add(telophaseWorld, [
    leftCentrosome1,
    leftCentrosome2,
    rightCentrosome1,
    rightCentrosome2,
  ]);

  // Create chromosomes for left cell
  const leftChromosomes = [];
  for (let i = 0; i < 3; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * nucleusRadius * 0.7;

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

    // Add constraint to keep chromosome within nucleus
    const constraint = Matter.Constraint.create({
      pointA: { x: leftCellCenter.x, y: leftCellCenter.y },
      bodyB: chromosome,
      stiffness: 0.001,
      damping: 0.2,
      length: nucleusRadius * 0.7,
      render: {
        visible: false,
      },
    });

    leftChromosomes.push(chromosome);
    Matter.World.add(telophaseWorld, [chromosome, constraint]);
  }

  // Create chromosomes for right cell
  const rightChromosomes = [];
  for (let i = 0; i < 3; i++) {
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * nucleusRadius * 0.7;

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

    // Add constraint to keep chromosome within nucleus
    const constraint = Matter.Constraint.create({
      pointA: { x: rightCellCenter.x, y: rightCellCenter.y },
      bodyB: chromosome,
      stiffness: 0.001,
      damping: 0.2,
      length: nucleusRadius * 0.7,
      render: {
        visible: false,
      },
    });

    rightChromosomes.push(chromosome);
    Matter.World.add(telophaseWorld, [chromosome, constraint]);
  }

  // Start the renderer
  Matter.Render.run(telophaseRender);

  // Create runner
  telophaseRunner = Matter.Runner.create();
  Matter.Runner.run(telophaseRunner, telophaseEngine);

  // Add highlight points
  addHighlightPoint(
    "telophase-highlights",
    35,
    40,
    "Completed Nuclear Envelope",
    "Nuclear membrane has fully reformed around each set of chromosomes",
  );
  addHighlightPoint(
    "telophase-highlights",
    50,
    70,
    "Cell Division Complete",
    "Cytokinesis has finished, resulting in two identical daughter cells",
  );
  addHighlightPoint(
    "telophase-highlights",
    65,
    40,
    "Identical Daughter Cell",
    "The second of two genetically identical cells resulting from mitosis",
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
  }
}

// Initialize when tab becomes active
document.addEventListener("DOMContentLoaded", function () {
  if (document.querySelector(".phase-content.active").id === "telophase") {
    initTelophase();
  }
});
