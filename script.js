/* =========================================
   DRAW STUDIO
   Complete Drawing App
========================================= */

const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");

const colorPicker = document.getElementById("colorPicker");
const brushSize = document.getElementById("brushSize");
const sizeValue = document.getElementById("sizeValue");

const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const clearBtn = document.getElementById("clearBtn");
const saveBtn = document.getElementById("saveBtn");

const toolButtons =
    document.querySelectorAll(".tool-btn");

const shapeButtons =
    document.querySelectorAll(".shape-btn");


/* =========================================
   VARIABLES
========================================= */

let currentTool = "pencil";
let currentShape = null;

let drawing = false;

let startX = 0;
let startY = 0;

let lastX = 0;
let lastY = 0;

let history = [];
let historyIndex = -1;


/* =========================================
   CANVAS SIZE
========================================= */

function resizeCanvas() {

    const oldCanvas =
        document.createElement("canvas");

    oldCanvas.width = canvas.width;
    oldCanvas.height = canvas.height;

    const oldCtx =
        oldCanvas.getContext("2d");

    if (canvas.width > 0 && canvas.height > 0) {

        oldCtx.drawImage(canvas, 0, 0);
    }


    const rect =
        canvas.getBoundingClientRect();


    canvas.width = Math.max(
        300,
        Math.floor(rect.width)
    );

    canvas.height = Math.max(
        300,
        Math.floor(rect.height)
    );


    ctx.fillStyle = "#ffffff";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    if (
        oldCanvas.width > 0 &&
        oldCanvas.height > 0
    ) {

        ctx.drawImage(
            oldCanvas,
            0,
            0,
            oldCanvas.width,
            oldCanvas.height,
            0,
            0,
            canvas.width,
            canvas.height
        );
    }


    ctx.lineCap = "round";
    ctx.lineJoin = "round";
}


/* =========================================
   INITIAL CANVAS
========================================= */

function initializeCanvas() {

    const rect =
        canvas.getBoundingClientRect();


    canvas.width =
        Math.floor(rect.width);

    canvas.height =
        Math.floor(rect.height);


    ctx.fillStyle = "#ffffff";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.lineCap = "round";
    ctx.lineJoin = "round";


    saveState();
}


/* =========================================
   GET POSITION
========================================= */

function getPosition(event) {

    const rect =
        canvas.getBoundingClientRect();


    let clientX;
    let clientY;


    if (event.touches) {

        clientX =
            event.touches[0].clientX;

        clientY =
            event.touches[0].clientY;

    } else {

        clientX =
            event.clientX;

        clientY =
            event.clientY;
    }


    return {

        x:
            (clientX - rect.left) *
            (canvas.width / rect.width),

        y:
            (clientY - rect.top) *
            (canvas.height / rect.height)
    };
}


/* =========================================
   START DRAWING
========================================= */

function startDrawing(event) {

    event.preventDefault();

    const pos =
        getPosition(event);


    startX = pos.x;
    startY = pos.y;

    lastX = pos.x;
    lastY = pos.y;


    drawing = true;


    if (currentTool === "pencil") {

        ctx.beginPath();

        ctx.moveTo(
            lastX,
            lastY
        );

    } else if (currentTool === "eraser") {

        ctx.beginPath();

        ctx.moveTo(
            lastX,
            lastY
        );

    }
}


/* =========================================
   DRAW
========================================= */

function draw(event) {

    if (!drawing) {
        return;
    }


    event.preventDefault();


    const pos =
        getPosition(event);


    const x = pos.x;
    const y = pos.y;


    /* Pencil */

    if (currentTool === "pencil") {

        ctx.globalCompositeOperation =
            "source-over";

        ctx.strokeStyle =
            colorPicker.value;

        ctx.lineWidth =
            Number(brushSize.value);


        ctx.lineTo(x, y);

        ctx.stroke();


        lastX = x;
        lastY = y;

        return;
    }


    /* Eraser */

    if (currentTool === "eraser") {

        ctx.globalCompositeOperation =
            "destination-out";

        ctx.lineWidth =
            Number(brushSize.value) * 2;


        ctx.lineTo(x, y);

        ctx.stroke();


        lastX = x;
        lastY = y;

        return;
    }


    /* Shapes */

    if (currentShape) {

        redrawCurrentState();

        drawShape(
            startX,
            startY,
            x,
            y,
            currentShape
        );
    }
}


/* =========================================
   STOP DRAWING
========================================= */

function stopDrawing(event) {

    if (!drawing) {
        return;
    }


    event.preventDefault();


    const pos =
        getPosition(event);


    const x = pos.x;
    const y = pos.y;


    if (currentShape) {

        redrawCurrentState();

        drawShape(
            startX,
            startY,
            x,
            y,
            currentShape
        );
    }


    drawing = false;

    ctx.globalCompositeOperation =
        "source-over";


    saveState();
}


/* =========================================
   DRAW SHAPE
========================================= */

function drawShape(
    x1,
    y1,
    x2,
    y2,
    shape
) {

    const width = x2 - x1;
    const height = y2 - y1;

    const centerX =
        x1 + width / 2;

    const centerY =
        y1 + height / 2;


    ctx.save();


    ctx.globalCompositeOperation =
        "source-over";

    ctx.strokeStyle =
        colorPicker.value;

    ctx.lineWidth =
        Number(brushSize.value);

    ctx.fillStyle = "transparent";

    ctx.beginPath();


    /* =====================================
       LINE
    ===================================== */

    if (shape === "line") {

        ctx.moveTo(x1, y1);

        ctx.lineTo(x2, y2);

        ctx.stroke();
    }


    /* =====================================
       RECTANGLE
    ===================================== */

    else if (shape === "rectangle") {

        ctx.rect(
            x1,
            y1,
            width,
            height
        );

        ctx.stroke();
    }


    /* =====================================
       SQUARE
    ===================================== */

    else if (shape === "square") {

        const size =
            Math.min(
                Math.abs(width),
                Math.abs(height)
            );


        const sx =
            width < 0
                ? x1 - size
                : x1;


        const sy =
            height < 0
                ? y1 - size
                : y1;


        ctx.rect(
            sx,
            sy,
            size,
            size
        );

        ctx.stroke();
    }


    /* =====================================
       CIRCLE
    ===================================== */

    else if (shape === "circle") {

        const radius =
            Math.sqrt(
                width * width +
                height * height
            ) / 2;


        ctx.arc(
            centerX,
            centerY,
            radius,
            0,
            Math.PI * 2
        );

        ctx.stroke();
    }


    /* =====================================
       ELLIPSE
    ===================================== */

    else if (shape === "ellipse") {

        ctx.ellipse(
            centerX,
            centerY,
            Math.abs(width) / 2,
            Math.abs(height) / 2,
            0,
            0,
            Math.PI * 2
        );

        ctx.stroke();
    }


    /* =====================================
       TRIANGLE
    ===================================== */

    else if (shape === "triangle") {

        ctx.moveTo(
            centerX,
            y1
        );

        ctx.lineTo(
            x2,
            y2
        );

        ctx.lineTo(
            x1,
            y2
        );

        ctx.closePath();

        ctx.stroke();
    }


    /* =====================================
       INVERTED TRIANGLE
    ===================================== */

    else if (
        shape === "inverted-triangle"
    ) {

        ctx.moveTo(
            x1,
            y1
        );

        ctx.lineTo(
            x2,
            y1
        );

        ctx.lineTo(
            centerX,
            y2
        );

        ctx.closePath();

        ctx.stroke();
    }


    /* =====================================
       DIAMOND
    ===================================== */

    else if (shape === "diamond") {

        ctx.moveTo(
            centerX,
            y1
        );

        ctx.lineTo(
            x2,
            centerY
        );

        ctx.lineTo(
            centerX,
            y2
        );

        ctx.lineTo(
            x1,
            centerY
        );

        ctx.closePath();

        ctx.stroke();
    }


    /* =====================================
       PENTAGON
    ===================================== */

    else if (shape === "pentagon") {

        drawPolygon(
            centerX,
            centerY,
            Math.min(
                Math.abs(width),
                Math.abs(height)
            ) / 2,
            5
        );
    }


    /* =====================================
       HEXAGON
    ===================================== */

    else if (shape === "hexagon") {

        drawPolygon(
            centerX,
            centerY,
            Math.min(
                Math.abs(width),
                Math.abs(height)
            ) / 2,
            6
        );
    }


    /* =====================================
       STAR
    ===================================== */

    else if (shape === "star") {

        drawStar(
            centerX,
            centerY,
            Math.min(
                Math.abs(width),
                Math.abs(height)
            ) / 2
        );
    }


    /* =====================================
       HEART
    ===================================== */

    else if (shape === "heart") {

        const scale =
            Math.min(
                Math.abs(width),
                Math.abs(height)
            ) / 100;


        ctx.moveTo(
            centerX,
            y2
        );


        ctx.bezierCurveTo(
            x1 - 20 * scale,
            centerY,
            x1,
            y1 - 10 * scale,
            centerX,
            centerY
        );


        ctx.bezierCurveTo(
            x2,
            y1 - 10 * scale,
            x2 + 20 * scale,
            centerY,
            centerX,
            y2
        );


        ctx.stroke();
    }


    /* =====================================
       CLOUD
    ===================================== */

    else if (shape === "cloud") {

        ctx.arc(
            x1 + width * 0.25,
            centerY,
            Math.abs(width) * 0.18,
            0,
            Math.PI * 2
        );


        ctx.arc(
            x1 + width * 0.45,
            centerY - Math.abs(height) * 0.15,
            Math.abs(width) * 0.22,
            0,
            Math.PI * 2
        );


        ctx.arc(
            x1 + width * 0.7,
            centerY,
            Math.abs(width) * 0.2,
            0,
            Math.PI * 2
        );


        ctx.stroke();
    }


    /* =====================================
       LIGHTNING
    ===================================== */

    else if (shape === "lightning") {

        ctx.moveTo(
            centerX + width * 0.05,
            y1
        );

        ctx.lineTo(
            x1 + width * 0.35,
            centerY
        );

        ctx.lineTo(
            centerX,
            centerY
        );

        ctx.lineTo(
            x1 + width * 0.35,
            y2
        );

        ctx.lineTo(
            x2,
            y1 + height * 0.35
        );

        ctx.lineTo(
            centerX + width * 0.05,
            y1 + height * 0.4
        );

        ctx.closePath();

        ctx.stroke();
    }


    /* =====================================
       ARROW
    ===================================== */

    else if (shape === "arrow") {

        drawArrow(
            x1,
            y1,
            x2,
            y2
        );
    }


    /* =====================================
       DOUBLE ARROW
    ===================================== */

    else if (
        shape === "double-arrow"
    ) {

        drawArrow(
            x1,
            centerY,
            x2,
            centerY
        );

        drawArrow(
            x2,
            centerY,
            x1,
            centerY
        );
    }


    /* =====================================
       CRESCENT
    ===================================== */

    else if (shape === "crescent") {

        const radius =
            Math.min(
                Math.abs(width),
                Math.abs(height)
            ) / 2;


        ctx.arc(
            centerX,
            centerY,
            radius,
            0,
            Math.PI * 2
        );


        ctx.moveTo(
            centerX + radius * 0.35,
            centerY - radius
        );


        ctx.arc(
            centerX + radius * 0.35,
            centerY,
            radius,
            -Math.PI / 2,
            Math.PI / 2,
            true
        );


        ctx.stroke();
    }


    /* =====================================
       SUN
    ===================================== */

    else if (shape === "sun") {

        const radius =
            Math.min(
                Math.abs(width),
                Math.abs(height)
            ) / 4;


        ctx.arc(
            centerX,
            centerY,
            radius,
            0,
            Math.PI * 2
        );


        ctx.stroke();


        for (
            let i = 0;
            i < 12;
            i++
        ) {

            const angle =
                i *
                (Math.PI * 2 / 12);


            const innerRadius =
                radius + 8;


            const outerRadius =
                radius + 25;


            ctx.moveTo(
                centerX +
                Math.cos(angle) *
                innerRadius,

                centerY +
                Math.sin(angle) *
                innerRadius
            );


            ctx.lineTo(
                centerX +
                Math.cos(angle) *
                outerRadius,

                centerY +
                Math.sin(angle) *
                outerRadius
            );
        }


        ctx.stroke();
    }


    /* =====================================
       SPEECH BUBBLE
    ===================================== */

    else if (shape === "speech") {

        const radiusX =
            Math.abs(width) / 2;

        const radiusY =
            Math.abs(height) / 2;


        ctx.ellipse(
            centerX,
            centerY,
            radiusX,
            radiusY,
            0,
            0,
            Math.PI * 2
        );


        ctx.moveTo(
            x1 + width * 0.25,
            y2 - 5
        );


        ctx.lineTo(
            x1 + width * 0.15,
            y2 + 20
        );


        ctx.lineTo(
            x1 + width * 0.4,
            y2
        );


        ctx.stroke();
    }


    /* =====================================
       RING
    ===================================== */

    else if (shape === "ring") {

        const radius =
            Math.min(
                Math.abs(width),
                Math.abs(height)
            ) / 2;


        ctx.arc(
            centerX,
            centerY,
            radius,
            0,
            Math.PI * 2
        );


        ctx.stroke();


        ctx.beginPath();


        ctx.arc(
            centerX,
            centerY,
            radius * 0.55,
            0,
            Math.PI * 2
        );


        ctx.stroke();
    }


    ctx.restore();
}


/* =========================================
   POLYGON
========================================= */

function drawPolygon(
    centerX,
    centerY,
    radius,
    sides
) {

    ctx.beginPath();


    for (
        let i = 0;
        i < sides;
        i++
    ) {

        const angle =
            -Math.PI / 2 +
            i * (Math.PI * 2 / sides);


        const x =
            centerX +
            Math.cos(angle) *
            radius;


        const y =
            centerY +
            Math.sin(angle) *
            radius;


        if (i === 0) {

            ctx.moveTo(x, y);

        } else {

            ctx.lineTo(x, y);
        }
    }


    ctx.closePath();

    ctx.stroke();
}


/* =========================================
   STAR
========================================= */

function drawStar(
    centerX,
    centerY,
    radius
) {

    const spikes = 5;

    const innerRadius =
        radius * 0.45;


    ctx.beginPath();


    for (
        let i = 0;
        i < spikes * 2;
        i++
    ) {

        const angle =
            -Math.PI / 2 +
            i * Math.PI / spikes;


        const r =
            i % 2 === 0
                ? radius
                : innerRadius;


        const x =
            centerX +
            Math.cos(angle) * r;


        const y =
            centerY +
            Math.sin(angle) * r;


        if (i === 0) {

            ctx.moveTo(x, y);

        } else {

            ctx.lineTo(x, y);
        }
    }


    ctx.closePath();

    ctx.stroke();
}


/* =========================================
   ARROW
========================================= */

function drawArrow(
    x1,
    y1,
    x2,
    y2
) {

    const angle =
        Math.atan2(
            y2 - y1,
            x2 - x1
        );


    const headLength = 20;


    ctx.moveTo(x1, y1);

    ctx.lineTo(x2, y2);


    ctx.moveTo(
        x2,
        y2
    );


    ctx.lineTo(
        x2 -
        headLength *
        Math.cos(
            angle - Math.PI / 6
        ),

        y2 -
        headLength *
        Math.sin(
            angle - Math.PI / 6
        )
    );


    ctx.moveTo(
        x2,
        y2
    );


    ctx.lineTo(
        x2 -
        headLength *
        Math.cos(
            angle + Math.PI / 6
        ),

        y2 -
        headLength *
        Math.sin(
            angle + Math.PI / 6
        )
    );


    ctx.stroke();
}


/* =========================================
   REDRAW SAVED STATE
========================================= */

function redrawCurrentState() {

    if (
        historyIndex < 0 ||
        !history[historyIndex]
    ) {

        clearCanvasOnly();

        return;
    }


    const image =
        new Image();


    image.onload = function() {

        clearCanvasOnly();

        ctx.drawImage(
            image,
            0,
            0
        );
    };


    image.src =
        history[historyIndex];
}


/* =========================================
   CLEAR CANVAS
========================================= */

function clearCanvasOnly() {

    ctx.globalCompositeOperation =
        "source-over";

    ctx.fillStyle =
        "#ffffff";


    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );
}


/* =========================================
   SAVE STATE
========================================= */

function saveState() {

    /*
       Remove redo states
    */

    history =
        history.slice(
            0,
            historyIndex + 1
        );


    history.push(
        canvas.toDataURL()
    );


    historyIndex =
        history.length - 1;


    /*
       Limit history
       so browser memory
       doesn't grow forever.
    */

    if (history.length > 30) {

        history.shift();

        historyIndex--;
    }
}


/* =========================================
   UNDO
========================================= */

function undo() {

    if (historyIndex <= 0) {

        return;
    }


    historyIndex--;

    loadHistoryState();
}


/* =========================================
   REDO
========================================= */

function redo() {

    if (
        historyIndex >=
        history.length - 1
    ) {

        return;
    }


    historyIndex++;

    loadHistoryState();
}


/* =========================================
   LOAD HISTORY
========================================= */

function loadHistoryState() {

    const image =
        new Image();


    image.onload = function() {

        clearCanvasOnly();

        ctx.drawImage(
            image,
            0,
            0,
            canvas.width,
            canvas.height
        );
    };


    image.src =
        history[historyIndex];
}


/* =========================================
   CLEAR
========================================= */

function clearCanvas() {

    const answer =
        confirm(
            "Kya aap poori drawing clear karna chahte hain?"
        );


    if (!answer) {
        return;
    }


    clearCanvasOnly();

    saveState();
}


/* =========================================
   SAVE PNG
========================================= */

function saveDrawing() {

    const link =
        document.createElement("a");


    link.download =
        "my-drawing.png";


    link.href =
        canvas.toDataURL(
            "image/png"
        );


    link.click();
}


/* =========================================
   TOOL BUTTONS
========================================= */

toolButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            function() {

                toolButtons.forEach(
                    btn =>
                        btn.classList.remove(
                            "active"
                        )
                );


                shapeButtons.forEach(
                    btn =>
                        btn.classList.remove(
                            "active"
                        )
                );


                this.classList.add(
                    "active"
                );


                currentTool =
                    this.dataset.tool;


                currentShape = null;
            }
        );
    }
);


/* =========================================
   SHAPE BUTTONS
========================================= */

shapeButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            function() {

                toolButtons.forEach(
                    btn =>
                        btn.classList.remove(
                            "active"
                        )
                );


                shapeButtons.forEach(
                    btn =>
                        btn.classList.remove(
                            "active"
                        )
                );


                this.classList.add(
                    "active"
                );


                currentTool =
                    "shape";


                currentShape =
                    this.dataset.shape;
            }
        );
    }
);


/* =========================================
   BRUSH SIZE
========================================= */

brushSize.addEventListener(
    "input",
    function() {

        sizeValue.textContent =
            `${this.value} px`;
    }
);


/* =========================================
   MOUSE EVENTS
========================================= */

canvas.addEventListener(
    "mousedown",
    startDrawing
);


canvas.addEventListener(
    "mousemove",
    draw
);


canvas.addEventListener(
    "mouseup",
    stopDrawing
);


canvas.addEventListener(
    "mouseleave",
    stopDrawing
);


/* =========================================
   TOUCH EVENTS
========================================= */

canvas.addEventListener(
    "touchstart",
    startDrawing,
    { passive: false }
);


canvas.addEventListener(
    "touchmove",
    draw,
    { passive: false }
);


canvas.addEventListener(
    "touchend",
    stopDrawing,
    { passive: false }
);


/* =========================================
   BUTTON EVENTS
========================================= */

undoBtn.addEventListener(
    "click",
    undo
);


redoBtn.addEventListener(
    "click",
    redo
);


clearBtn.addEventListener(
    "click",
    clearCanvas
);


saveBtn.addEventListener(
    "click",
    saveDrawing
);


/* =========================================
   WINDOW RESIZE
========================================= */

window.addEventListener(
    "resize",
    function() {

        /*
           Canvas resize can affect
           drawing dimensions, so only
           resize when necessary.
        */

        const current =
            canvas.toDataURL();


        const image =
            new Image();


        image.onload = function() {

            const rect =
                canvas.getBoundingClientRect();


            canvas.width =
                Math.floor(rect.width);


            canvas.height =
                Math.floor(rect.height);


            ctx.fillStyle =
                "#ffffff";


            ctx.fillRect(
                0,
                0,
                canvas.width,
                canvas.height
            );


            ctx.drawImage(
                image,
                0,
                0,
                canvas.width,
                canvas.height
            );
        };


        image.src = current;
    }
);


/* =========================================
   START
========================================= */

initializeCanvas();
