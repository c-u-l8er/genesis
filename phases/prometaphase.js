// Variables to store Matter.js engine, world, and renderer
let prometaphaseEngine;
let prometaphaseWorld;
let prometaphaseRender;
let prometaphaseRunner;

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

// Function to initialize Prometaphase simulation
function initPrometaphase() {
  // Set up the Matter.js engine
  prometaphaseEngine = Matter.Engine.create({
    enableSleeping: false,
    constraintIterations: 5,
  });
  prometaphaseWorld = prometaphaseEngine.world;

  // Remove gravity for fluid-like movement
  prometaphaseWorld.gravity.y = 0;

  // Get the container dimensions
  const container = document.getElementById(
    "prometaphase-canvas",
  ).parentElement;
  const width = container.clientWidth;
  const height = container.clientHeight;

  // Create renderer
  prometaphaseRender = Matter.Render.create({
    element: container,
    engine: prometaphaseEngine,
    canvas: document.getElementById("prometaphase-canvas"),
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
    prometaphaseWorld,
  );

  // Add centrosomes
  const centrosome1 = Matter.Bodies.circle(
    cellCenter.x - cellRadius * 0.7,
    cellCenter.y - cellRadius * 0.5,
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
    cellCenter.x + cellRadius * 0.7,
    cellCenter.y - cellRadius * 0.5,
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

  Matter.World.add(prometaphaseWorld, [centrosome1, centrosome2]);

  // Create chromosomes that are initially distributed throughout the cell
  const chromosomes = [];
  const numChromosomes = 6;

  for (let i = 0; i < numChromosomes; i++) {
    // Distribute chromosomes in a wider area initially
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * cellRadius * 0.8;

    const chromosomeX = cellCenter.x + Math.cos(angle) * distance;
    const chromosomeY = cellCenter.y + Math.sin(angle) * distance;

    const chromosome = Matter.Bodies.rectangle(
      chromosomeX,
      chromosomeY,
      10,
      30,
      {
        collisionFilter: {
          category: 0x0002,
          mask: 0x0002, // Only collide with other chromosomes, not with nuclear envelope
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

    // Add a constraint to pull chromosome toward the center (mimicking microtubule action)
    const constraint = Matter.Constraint.create({
      pointA: { x: cellCenter.x, y: cellCenter.y },
      bodyB: chromosome,
      stiffness: 0.001, // Very low stiffness for gradual movement
      damping: 0.2,
      length: 0, // Target length is 0 to pull toward center
      render: {
        visible: false,
      },
    });

    chromosomes.push(chromosome);
    Matter.World.add(prometaphaseWorld, [chromosome, constraint]);
  }

  // Add central attractor to pull chromosomes toward center
  Matter.Events.on(prometaphaseEngine, "beforeUpdate", function () {
    const attractStrength = 0.00005; // Adjust this for stronger/weaker attraction

    chromosomes.forEach((chromosome) => {
      // Calculate direction vector toward cell center
      const forceX = cellCenter.x - chromosome.position.x;
      const forceY = cellCenter.y - chromosome.position.y;

      // Apply force toward center
      Matter.Body.applyForce(chromosome, chromosome.position, {
        x: forceX * attractStrength,
        y: forceY * attractStrength,
      });
    });
  });

  // Draw spindle fibers and nuclear envelope fragments (using Matter.js Render.afterRender)
  Matter.Events.on(prometaphaseRender, "afterRender", function () {
    const ctx = prometaphaseRender.context;

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

    // Draw fragments of nuclear envelope breaking down (purely visual)
    ctx.strokeStyle = "#666";
    ctx.lineWidth = 2;

    for (let i = 0; i < 12; i++) {
      const angle = ((Math.PI * 2) / 12) * i;
      const startAngle = angle - 0.2;
      const endAngle = angle + 0.2;

      ctx.beginPath();
      ctx.arc(
        cellCenter.x,
        cellCenter.y,
        cellRadius * 0.5,
        startAngle,
        endAngle,
      );
      ctx.stroke();
    }
  });

  // Start the renderer
  Matter.Render.run(prometaphaseRender);

  // Create runner
  prometaphaseRunner = Matter.Runner.create();
  Matter.Runner.run(prometaphaseRunner, prometaphaseEngine);

  // Add highlight points
  addHighlightPoint(
    "prometaphase-highlights",
    50,
    50,
    "Nuclear Envelope Breakdown",
    "The nuclear membrane dissolves, allowing spindle fibers to reach chromosomes",
  );

  addHighlightPoint(
    "prometaphase-highlights",
    30,
    50,
    "Kinetochores",
    "Protein structures where spindle fibers attach to chromosomes",
  );

  addHighlightPoint(
    "prometaphase-highlights",
    15,
    25,
    "Spindle Fibers",
    "Microtubules that guide chromosome movement during cell division",
  );
}

// Function to clean up Prometaphase simulation
function cleanupPrometaphase() {
  if (prometaphaseRender) {
    Matter.Render.stop(prometaphaseRender);
    if (prometaphaseRunner) Matter.Runner.stop(prometaphaseRunner);
    if (prometaphaseWorld) Matter.World.clear(prometaphaseWorld);
    if (prometaphaseEngine) Matter.Engine.clear(prometaphaseEngine);

    // Clear canvas
    const canvas = document.getElementById("prometaphase-canvas");
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    prometaphaseRender = null;
    prometaphaseWorld = null;
    prometaphaseEngine = null;
    prometaphaseRunner = null;
  }
}

// Initialize when tab becomes active
document.addEventListener("DOMContentLoaded", function () {
  if (document.querySelector(".phase-content.active").id === "prometaphase") {
    initPrometaphase();
  }
});
