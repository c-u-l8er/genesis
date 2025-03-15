// Variables to store Matter.js engine, world, and renderer
let metaphaseEngine;
let metaphaseWorld;
let metaphaseRender;
let metaphaseRunner;

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

// Function to initialize Metaphase simulation
function initMetaphase() {
  // Set up the Matter.js engine
  metaphaseEngine = Matter.Engine.create({
    enableSleeping: false,
    constraintIterations: 5,
  });
  metaphaseWorld = metaphaseEngine.world;

  // Remove gravity for fluid-like movement
  metaphaseWorld.gravity.y = 0;

  // Get the container dimensions
  const container = document.getElementById("metaphase-canvas").parentElement;
  const width = container.clientWidth;
  const height = container.clientHeight;

  // Create renderer
  metaphaseRender = Matter.Render.create({
    element: container,
    engine: metaphaseEngine,
    canvas: document.getElementById("metaphase-canvas"),
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
    metaphaseWorld,
  );

  // Add metaphase plate (invisible line for reference)
  const metaphasePlate = Matter.Bodies.rectangle(
    cellCenter.x,
    cellCenter.y,
    5,
    cellRadius * 1.5,
    {
      isStatic: true,
      collisionFilter: {
        category: 0x0004,
        mask: 0,
      },
      render: {
        fillStyle: "rgba(255, 99, 71, 0.3)",
        strokeStyle: "rgba(255, 99, 71, 0.5)",
        lineWidth: 1,
      },
    },
  );
  Matter.World.add(metaphaseWorld, metaphasePlate);

  // Add centrosomes
  // Update centrosome positioning in metaphase.js
  const centrosome1 = Matter.Bodies.circle(
    cellCenter.x - cellRadius * 0.8,
    cellCenter.y,
    10,
    {
      isStatic: true,
      render: {
        fillStyle: "#ffcc00",
        strokeStyle: "#e6b800",
        lineWidth: 2,
      },
    },
  );

  const centrosome2 = Matter.Bodies.circle(
    cellCenter.x + cellRadius * 0.8,
    cellCenter.y,
    10,
    {
      isStatic: true,
      render: {
        fillStyle: "#ffcc00",
        strokeStyle: "#e6b800",
        lineWidth: 2,
      },
    },
  );

  Matter.World.add(metaphaseWorld, [centrosome1, centrosome2]);

  // Also update the afterRender function to include radiating microtubules
  Matter.Events.on(metaphaseRender, "afterRender", function () {
    const ctx = metaphaseRender.context;

    // Draw metaphase plate reference line (vertical)
    ctx.strokeStyle = "rgba(255, 99, 71, 0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cellCenter.x, cellCenter.y - cellRadius * 0.7);
    ctx.lineTo(cellCenter.x, cellCenter.y + cellRadius * 0.7);
    ctx.stroke();

    // Draw spindle fibers from centrosomes to chromosomes
    ctx.strokeStyle = "#ffcc00";
    ctx.lineWidth = 1;

    for (let i = 0; i < chromosomes.length; i++) {
      const chromosome = chromosomes[i];

      // Draw from centrosome1 to chromosome
      ctx.beginPath();
      ctx.moveTo(centrosome1.position.x, centrosome1.position.y);
      ctx.lineTo(chromosome.position.x, chromosome.position.y);
      ctx.stroke();

      // Draw from centrosome2 to chromosome
      ctx.beginPath();
      ctx.moveTo(centrosome2.position.x, centrosome2.position.y);
      ctx.lineTo(chromosome.position.x, chromosome.position.y);
      ctx.stroke();
    }

    // Draw radiating microtubules from centrosomes
    ctx.strokeStyle = "rgba(255, 204, 0, 0.4)";
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

  // Create chromosomes aligned vertically at metaphase plate
  const chromosomes = [];
  const spacing = (cellRadius * 1.2) / 7;

  for (let i = 0; i < 6; i++) {
    const chromosomeX = cellCenter.x;
    const chromosomeY = cellCenter.y - cellRadius * 0.5 + i * spacing;

    const chromosome = Matter.Bodies.rectangle(
      chromosomeX,
      chromosomeY,
      10,
      30,
      {
        collisionFilter: {
          category: 0x0002,
          mask: 0x0002,
        },
        render: {
          fillStyle: "#4a86e8",
        },
        friction: 0.5,
        frictionAir: 0.1,
        restitution: 0.2,
      },
    );

    // Add constraint to keep chromosome at the metaphase plate
    const constraint = Matter.Constraint.create({
      pointA: { x: chromosomeX, y: chromosomeY },
      bodyB: chromosome,
      stiffness: 0.05,
      damping: 0.5,
      length: 0,
      render: {
        visible: false,
      },
    });

    chromosomes.push(chromosome);
    Matter.World.add(metaphaseWorld, [chromosome, constraint]);
  }

  // Draw spindle fibers (using Matter.js Render.afterRender)
  Matter.Events.on(metaphaseRender, "afterRender", function () {
    const ctx = metaphaseRender.context;

    // Draw metaphase plate reference line (vertical)
    ctx.strokeStyle = "rgba(255, 99, 71, 0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cellCenter.x, cellCenter.y - cellRadius * 0.7);
    ctx.lineTo(cellCenter.x, cellCenter.y + cellRadius * 0.7);
    ctx.stroke();

    // Draw spindle fibers from centrosomes to chromosomes
    ctx.strokeStyle = "#ffcc00";
    ctx.lineWidth = 1;

    for (let i = 0; i < chromosomes.length; i++) {
      const chromosome = chromosomes[i];

      // Draw from centrosome1 to chromosome
      ctx.beginPath();
      ctx.moveTo(centrosome1.position.x, centrosome1.position.y);
      ctx.lineTo(chromosome.position.x, chromosome.position.y);
      ctx.stroke();

      // Draw from centrosome2 to chromosome
      ctx.beginPath();
      ctx.moveTo(centrosome2.position.x, centrosome2.position.y);
      ctx.lineTo(chromosome.position.x, chromosome.position.y);
      ctx.stroke();
    }
  });

  // Start the renderer
  Matter.Render.run(metaphaseRender);

  // Create runner
  metaphaseRunner = Matter.Runner.create();
  Matter.Runner.run(metaphaseRunner, metaphaseEngine);

  // Add highlight points
  addHighlightPoint(
    "metaphase-highlights",
    50,
    50,
    "Metaphase Plate",
    "The equatorial plane where chromosomes align during metaphase",
  );
  addHighlightPoint(
    "metaphase-highlights",
    50,
    35,
    "Aligned Chromosomes",
    "Chromosomes lined up at the cell's equator with spindle fibers attached to kinetochores",
  );
}

// Function to clean up Metaphase simulation
function cleanupMetaphase() {
  if (metaphaseRender) {
    Matter.Render.stop(metaphaseRender);
    if (metaphaseRunner) Matter.Runner.stop(metaphaseRunner);
    if (metaphaseWorld) Matter.World.clear(metaphaseWorld);
    if (metaphaseEngine) Matter.Engine.clear(metaphaseEngine);

    // Clear canvas
    const canvas = document.getElementById("metaphase-canvas");
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    metaphaseRender = null;
    metaphaseWorld = null;
    metaphaseEngine = null;
    metaphaseRunner = null;
  }
}

// Initialize when tab becomes active
document.addEventListener("DOMContentLoaded", function () {
  if (document.querySelector(".phase-content.active").id === "metaphase") {
    initMetaphase();
  }
});
