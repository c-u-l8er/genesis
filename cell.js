// Cell-related constants and functions

// Cell properties
const CHROMOSOME_SIZE = 20;
const CELL_RADIUS = 150;
const NUM_WALL_LINKS = 40; //Number of links in the chain

// Cell position
const CENTER_X = 400;
const CENTER_Y = 300;

// Animation speed control - higher is slower
const ANIMATION_SLOWDOWN = 2;

// Phase information
const phaseInfo = {
  interphase:
    "The cell is in its normal state before division begins. The DNA is replicated in preparation for division.",
  prophase:
    "Chromosomes are condensing and becoming visible. The nuclear membrane begins to break down and spindle fibers form.",
  metaphase:
    "Chromosomes are aligning at the center of the cell (the metaphase plate). Spindle fibers form.",
  anaphase:
    "Chromosomes are separating and moving to opposite poles of the cell. The sister chromatids are pulled apart.",
  telophase:
    "Two new nuclei are forming as the cell prepares to split. Nuclear membranes reform around the separated chromosomes.",
  cytokinesis:
    "The cell membrane is pinching in the middle (cleavage furrow) to create two separate cells.",
  complete:
    "Cell division is complete. Two daughter cells have formed, each with a complete set of chromosomes.",
};

// Create an X-shaped chromosome
function createChromosome(svg, x, y, size = CHROMOSOME_SIZE, id) {
  const group = svg
    .append("g")
    .attr("class", "chromosome")
    .attr("id", id)
    .attr("transform", `translate(${x},${y})`);

  // First line of the X
  group
    .append("line")
    .attr("x1", -size / 2)
    .attr("y1", -size / 2)
    .attr("x2", size / 2)
    .attr("y2", size / 2)
    .attr("stroke", "#2b5797")
    .attr("stroke-width", 3);

  // Second line of the X
  group
    .append("line")
    .attr("x1", size / 2)
    .attr("y1", -size / 2)
    .attr("x2", -size / 2)
    .attr("y2", size / 2)
    .attr("stroke", "#2b5797")
    .attr("stroke-width", 3);

  return group;
}

// Function to create a cell wall link
function createCellWallLink(svg, x, y, id) {
  const circle = svg
    .append("circle")
    .attr("cx", x)
    .attr("cy", y)
    .attr("r", 5)
    .attr("class", "cell-wall-link")
    .attr("id", id);
  return circle;
}
