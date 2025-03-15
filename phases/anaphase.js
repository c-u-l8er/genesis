// Variables to store Matter.js engine, world, and renderer
let anaphaseEngine;
let anaphaseWorld;
let anaphaseRender;
let anaphaseRunner;
let anaphaseAnimationStarted = false;
let anaphaseChromosomes = [];

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

// Function to initialize Anaphase simulation
function initAnaphase() {
  // Set up the Matter.js engine
  anaphaseEngine = Matter.Engine.create({
    enableSleeping: false,
    constraintIterations: 5,
  });
  anaphaseWorld = anaphaseEngine.world;

  // Remove gravity for fluid-like movement
  anaphaseWorld.gravity.y = 0;

  // Get the container dimensions
  const container = document.getElementById("anaphase-canvas").parentElement;
  const width = container.clientWidth;
  const height = container.clientHeight;

  // Create renderer
  anaphaseRender = Matter.Render.create({
    element: container,
    engine: anaphaseEngine,
    canvas: document.getElementById("anaphase-canvas"),
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
    anaphaseWorld,
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
  Matter.World.add(anaphaseWorld, metaphasePlate);

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

  Matter.World.add(anaphaseWorld, [centrosome1, centrosome2]);

  // Create chromosomes aligned vertically at metaphase plate (just like in metaphase)
  const chromosomes = [];
  const spacing = (cellRadius * 1.2) / 7;

  for (let i = 0; i < 6; i++) {
    const chromosomeY = cellCenter.y - cellRadius * 0.5 + i * spacing;

    // Create chromosome pair
    const leftChromosome = Matter.Bodies.rectangle(
      cellCenter.x - 5,
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

    const rightChromosome = Matter.Bodies.rectangle(
      cellCenter.x + 5,
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

    // Add constraint to initially keep chromosomes at the metaphase plate
    const leftConstraint = Matter.Constraint.create({
      pointA: { x: cellCenter.x, y: chromosomeY },
      bodyB: leftChromosome,
      stiffness: 0.01,
      damping: 0.5,
      length: 5,
      render: {
        visible: false,
      },
    });

    const rightConstraint = Matter.Constraint.create({
      pointA: { x: cellCenter.x, y: chromosomeY },
      bodyB: rightChromosome,
      stiffness: 0.01,
      damping: 0.5,
      length: 5,
      render: {
        visible: false,
      },
    });

    // Add springs to slowly pull chromosomes toward opposite poles
    const leftSpring = Matter.Constraint.create({
      pointA: { x: cellCenter.x - cellRadius * 0.6, y: chromosomeY },
      bodyB: leftChromosome,
      stiffness: 0.001, // Very low stiffness for slow movement
      damping: 0.1,
      length: cellRadius * 0.3,
      render: {
        visible: false,
      },
    });

    const rightSpring = Matter.Constraint.create({
      pointA: { x: cellCenter.x + cellRadius * 0.6, y: chromosomeY },
      bodyB: rightChromosome,
      stiffness: 0.001, // Very low stiffness for slow movement
      damping: 0.1,
      length: cellRadius * 0.3,
      render: {
        visible: false,
      },
    });

    chromosomes.push({
      left: leftChromosome,
      right: rightChromosome,
      leftConstraint: leftConstraint,
      rightConstraint: rightConstraint,
      leftSpring: leftSpring,
      rightSpring: rightSpring,
    });

    Matter.World.add(anaphaseWorld, [
      leftChromosome,
      rightChromosome,
      leftConstraint,
      rightConstraint,
      leftSpring,
      rightSpring,
    ]);
  }

  // Schedule removal of center constraints after a few seconds to allow springs to take over
  setTimeout(() => {
    chromosomes.forEach((pair) => {
      Matter.World.remove(anaphaseWorld, pair.leftConstraint);
      Matter.World.remove(anaphaseWorld, pair.rightConstraint);

      // Make springs a bit stronger after initial constraints are removed
      pair.leftSpring.stiffness = 0.002;
      pair.rightSpring.stiffness = 0.002;
    });
  }, 3000);

  // Draw spindle fibers and other visual elements
  Matter.Events.on(anaphaseRender, "afterRender", function () {
    const ctx = anaphaseRender.context;

    // Draw metaphase plate reference line (vertical)
    ctx.strokeStyle = "rgba(255, 99, 71, 0.5)";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(cellCenter.x, cellCenter.y - cellRadius * 0.7);
    ctx.lineTo(cellCenter.x, cellCenter.y + cellRadius * 0.7);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw spindle fibers from centrosomes to chromosomes
    ctx.strokeStyle = "#ffcc00";
    ctx.lineWidth = 1;

    chromosomes.forEach((pair) => {
      // Draw from centrosome1 to left chromosome
      ctx.beginPath();
      ctx.moveTo(centrosome1.position.x, centrosome1.position.y);
      ctx.lineTo(pair.left.position.x, pair.left.position.y);
      ctx.stroke();

      // Draw from centrosome2 to right chromosome
      ctx.beginPath();
      ctx.moveTo(centrosome2.position.x, centrosome2.position.y);
      ctx.lineTo(pair.right.position.x, pair.right.position.y);
      ctx.stroke();
    });

    // Draw just one main spindle fiber from pole to pole
    ctx.beginPath();
    ctx.moveTo(centrosome1.position.x, centrosome1.position.y);
    ctx.lineTo(centrosome2.position.x, centrosome2.position.y);
    ctx.stroke();

    // Draw the beginning of a cleavage furrow
    ctx.strokeStyle = "rgba(51, 51, 51, 0.4)";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    ctx.beginPath();
    ctx.moveTo(cellCenter.x, cellCenter.y + cellRadius);
    ctx.lineTo(cellCenter.x, cellCenter.y - cellRadius);
    ctx.stroke();

    ctx.setLineDash([]);
  });

  // Start the renderer
  Matter.Render.run(anaphaseRender);

  // Create runner
  anaphaseRunner = Matter.Runner.create();
  Matter.Runner.run(anaphaseRunner, anaphaseEngine);

  // Add highlight points
  addHighlightPoint(
    "anaphase-highlights",
    30,
    35,
    "Separating Sister Chromatids",
    "Identical halves of the chromosome separating and moving to opposite poles",
  );
  addHighlightPoint(
    "anaphase-highlights",
    50,
    70,
    "Contractile Ring",
    "A ring of actin filaments that begins to form during anaphase, preparing for cytokinesis",
  );
  addHighlightPoint(
    "anaphase-highlights",
    50,
    20,
    "Mitotic Spindle",
    "Structure of microtubules that pulls chromatids to opposite poles of the cell",
  );
}

// Function to clean up Anaphase simulation
function cleanupAnaphase() {
  if (anaphaseRender) {
    Matter.Render.stop(anaphaseRender);
    if (anaphaseRunner) Matter.Runner.stop(anaphaseRunner);
    if (anaphaseWorld) Matter.World.clear(anaphaseWorld);
    if (anaphaseEngine) Matter.Engine.clear(anaphaseEngine);

    // Clear canvas
    const canvas = document.getElementById("anaphase-canvas");
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    anaphaseRender = null;
    anaphaseWorld = null;
    anaphaseEngine = null;
    anaphaseRunner = null;
  }
}

// Initialize when tab becomes active
document.addEventListener("DOMContentLoaded", function () {
  if (document.querySelector(".phase-content.active").id === "anaphase") {
    initAnaphase();
  }
});
