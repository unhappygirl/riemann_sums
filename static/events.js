// Variables to track the initial position
let isDragging = false;
let initialX = 0;
let initialY = 0;

// Variables to track movement
let deltaX = 0;
let deltaY = 0;

// Function to handle mouse down event (start dragging)
function onMouseDown(event) {
  // Start tracking the mouse position
  isDragging = true;

  initialX = event.clientX;
  initialY = event.clientY;
}

// Function to handle mouse move event (while dragging)
function onMouseMove(event) {
  if (isDragging) {
    // Calculate how much the mouse has moved
    deltaX = event.clientX - initialX;
    deltaY = event.clientY - initialY;

    // Update the initial position for next move
    initialX = event.clientX;
    initialY = event.clientY;

    // Do something with the movement (for example, log it or move an object)
    deltaX = deltaX / 360;
    deltaY = deltaY / 360;
    //console.log("Delta X: " + deltaX + ", Delta Y: " + deltaY);
  } else {
    deltaX = 0;
    deltaY = 0;
  }
}

// Function to handle mouse up event (stop dragging)
function onMouseUp() {
  isDragging = false;
  console.log(
    "Mouse drag ended. Total movement: Delta X: " +
      deltaX +
      ", Delta Y: " +
      deltaY
  );
}

// Add event listeners
const canvas = document.getElementById("plotCanvas");
canvas.addEventListener("mousedown", onMouseDown);
canvas.addEventListener("mousemove", onMouseMove);
canvas.addEventListener("mouseup", onMouseUp);

function get_inputs() {
  const func = document.getElementById("funcinput").value;
  const sum = document.getElementById("sum").checked;
  const sumType = document.getElementById("sumoptions").value;
  const xrects = document.getElementById("xrects").value;
  const yrects = document.getElementById("yrects").value;

  return { func, sum, sumType, xrects, yrects };
}
