
let isDragging = false;
let initialX = 0;
let initialY = 0;
let isTouching = true;

let deltaX = 0;
let deltaY = 0;

function onMouseDown(event) {
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

    initialX = event.clientX;
    initialY = event.clientY;

    // Normalize the movement
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

const onTouchStart = (event) => {
  isTouching = true;
  const touch = event.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
};

const onTouchMove = (event) => {
  if (!isTouching) return;
  const touch = event.touches[0];
  deltaX = (touch.clientX - touchStartX) * 0.005; // Scale factor for sensitivity
  deltaY = (touch.clientY - touchStartY) * 0.005;

  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
};

const onTouchEnd = () => {
  isTouching = false;
};

// Add event listeners
const canvas = document.getElementById("plotCanvas");
canvas.addEventListener("mousedown", onMouseDown);
canvas.addEventListener("mousemove", onMouseMove);
canvas.addEventListener("mouseup", onMouseUp);
canvas.addEventListener("touchstart", onTouchStart);
canvas.addEventListener("touchmove", onTouchMove);
canvas.addEventListener("touchend", onTouchEnd);

function get_inputs() {
  const func = mathField.latex();
  const sum = document.getElementById("sum").checked;
  const sumType = document.getElementById("sumoptions").value;
  const xrects = document.getElementById("xrects").value;
  const yrects = document.getElementById("yrects").value;
  const x1 = document.getElementById("x1").value;
  const x2 = document.getElementById("x2").value;
  const y1 = document.getElementById("y1").value;
  const y2 = document.getElementById("y2").value;
  const zoom = document.getElementById("zoom").value;

  return { x1, x2, y1, y2, func, sum, sumType, xrects, yrects, zoom };
}

function init_inputs() {
  document.getElementById("x1").value = -10;
  document.getElementById("x2").value = 10; 
  document.getElementById("y1").value = -10;
  document.getElementById("y2").value = 10;
  document.getElementById("sum").checked = true;
  document.getElementById("xrects").value = 10;
  document.getElementById("yrects").value = 10;
}

init_inputs();