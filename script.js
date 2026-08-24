const canvas = document.getElementById("drawingCanvas");
const ctx = canvas.getContext("2d");

let tool = "select";
let currentShape = null;

let drawing = false;
let startX = 0;
let startY = 0;

let color1 = "#000000";
let color2 = "#ffffff";
let brushWidth = 5;

let objects = [];
let selectedObject = null;

let undoStack = [];
let redoStack = [];

let clipboard = null;

let zoom = 1;


/* =====================================================
   BASIC SETTINGS
===================================================== */

canvas.width = 1400;
canvas.height = 800;

ctx.fillStyle = "#ffffff";
ctx.fillRect(0, 0, canvas.width, canvas.height);

saveHistory();
updateStatus();


/* =====================================================
   TOOL BUTTONS
===================================================== */

document.querySelectorAll(".ribbon-tool").forEach(button => {

    button.addEventListener("click", () => {

        document.querySelectorAll(".ribbon-tool")
            .forEach(b => b.classList.remove("active"));

        document.querySelectorAll(".shape-tool")
            .forEach(b => b.classList.remove("active"));

        button.classList.add("active");

        tool = button.dataset.tool;
        currentShape = null;

        updateStatus();
    });

});


/* =====================================================
   SHAPE BUTTONS
===================================================== */

document.querySelectorAll(".shape-tool").forEach(button => {

    button.addEventListener("click", () => {

        document.querySelectorAll(".shape-tool")
            .forEach(b => b.classList.remove("active"));

        document.querySelectorAll(".ribbon-tool")
            .forEach(b => b.classList.remove("active"));

        button.classList.add("active");

        tool = "shape";
        currentShape = button.dataset.shape;

        updateStatus();
    });

});


/* =====================================================
   COLORS
===================================================== */

const colorPicker =
    document.getElementById("colorPicker");

const fillColor =
    document.getElementById("fillColor");


colorPicker.addEventListener("input", () => {

    color1 = colorPicker.value;

});


fillColor.addEventListener("input", () => {

    color2 = fillColor.value;

});


/* =====================================================
   COLOR PALETTE
===================================================== */

document.querySelectorAll(".palette-color")
.forEach(button => {

    button.addEventListener("click", () => {

        color1 = button.dataset.color;

        colorPicker.value = color1;

    });

});


/* =====================================================
   BRUSH SIZE
===================================================== */

document
    .getElementById("brushSize")
    .addEventListener("change", e => {

        brushWidth = Number(e.target.value);

    });


/* =====================================================
   MOUSE POSITION
===================================================== */

function mousePosition(e) {

    const rect = canvas.getBoundingClientRect();

    return {

        x:
            (e.clientX - rect.left)
            * canvas.width /
            rect.width,

        y:
            (e.clientY - rect.top)
            * canvas.height /
            rect.height

    };
}


/* =====================================================
   POINTER DOWN
===================================================== */

canvas.addEventListener("pointerdown", e => {

    e.preventDefault();

    const pos = mousePosition(e);

    startX = pos.x;
    startY = pos.y;

    drawing = true;

    canvas.setPointerCapture(e.pointerId);


    /* SELECT */

    if (tool === "select") {

        selectedObject =
            findObject(pos.x, pos.y);

        draw();

        return;
    }


    /* PENCIL / BRUSH / ERASER */

    if (
        tool === "pencil" ||
        tool === "brush" ||
        tool === "eraser"
    ) {

        const object = {

            type: tool,

            points: [
                {
                    x: pos.x,
                    y: pos.y
                }
            ],

            color:
                tool === "eraser"
                    ? "#ffffff"
                    : color1,

            width:
                tool === "brush"
                    ? brushWidth * 3
                    : brushWidth

        };

        objects.push(object);

        selectedObject = object;

        draw();

        return;
    }


    /* SHAPE */

    if (tool === "shape") {

        selectedObject = {

            type: currentShape,

            x: startX,
            y: startY,

            width: 0,
            height: 0,

            stroke: color1,
            fill: color2,

            lineWidth: brushWidth

        };

        draw();

        return;
    }


    /* TEXT */

    if (tool === "text") {

        createText(
            pos.x,
            pos.y
        );

        drawing = false;

        return;
    }


    /* FILL */

    if (tool === "fill") {

        const obj =
            findObject(
                pos.x,
                pos.y
            );

        if (obj) {

            obj.fill = color1;

            saveHistory();

            draw();

        }

        drawing = false;

        return;
    }


    /* COLOR PICKER */

    if (tool === "picker") {

        const obj =
            findObject(
                pos.x,
                pos.y
            );

        if (obj && obj.stroke) {

            color1 = obj.stroke;

            colorPicker.value =
                color1;

        }

        drawing = false;

        return;
    }

});


/* =====================================================
   POINTER MOVE
===================================================== */

canvas.addEventListener("pointermove", e => {

    const pos = mousePosition(e);

    document.getElementById("coordinates")
        .textContent =
        `X: ${Math.round(pos.x)}
         Y: ${Math.round(pos.y)}`;


    if (!drawing) return;


    /* SELECT */

    if (
        tool === "select" &&
        selectedObject
    ) {

        const dx =
            pos.x - startX;

        const dy =
            pos.y - startY;

        moveObject(
            selectedObject,
            dx,
            dy
        );

        startX = pos.x;
        startY = pos.y;

        draw();

        return;
    }


    /* FREE DRAWING */

    if (
        tool === "pencil" ||
        tool === "brush" ||
        tool === "eraser"
    ) {

        selectedObject.points.push({
            x: pos.x,
            y: pos.y
        });

        draw();

        return;
    }


    /* SHAPE */

    if (
        tool === "shape" &&
        selectedObject
    ) {

        selectedObject.width =
            pos.x - selectedObject.x;

        selectedObject.height =
            pos.y - selectedObject.y;

        draw();
    }

});


/* =====================================================
   POINTER UP
===================================================== */

canvas.addEventListener("pointerup", e => {

    if (!drawing) return;

    drawing = false;

    saveHistory();

    draw();

});


/* =====================================================
   DRAW EVERYTHING
===================================================== */

function draw() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.fillStyle = "#ffffff";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    objects.forEach(obj => {

        drawObject(obj);

    });


    if (
        selectedObject &&
        !objects.includes(selectedObject)
    ) {

        drawObject(
            selectedObject
        );

    }


    if (selectedObject) {

        drawSelection(
            selectedObject
        );

    }


    document.getElementById("objectStatus")
        .textContent =
        "Objects: " + objects.length;
}


/* =====================================================
   DRAW OBJECT
===================================================== */

function drawObject(obj) {

    ctx.save();

    ctx.lineWidth =
        obj.lineWidth ||
        obj.width ||
        brushWidth;

    ctx.strokeStyle =
        obj.stroke ||
        obj.color ||
        color1;

    ctx.fillStyle =
        obj.fill ||
        "transparent";


    /* FREE DRAW */

    if (
        obj.type === "pencil" ||
        obj.type === "brush" ||
        obj.type === "eraser"
    ) {

        drawFreehand(obj);

        ctx.restore();

        return;
    }


    /* TEXT */

    if (obj.type === "text") {

        ctx.font =
            `${obj.fontSize}px ${obj.font}`;

        ctx.fillStyle =
            obj.color;

        ctx.fillText(
            obj.text,
            obj.x,
            obj.y
        );

        ctx.restore();

        return;
    }


    /* SHAPE */

    drawShape(obj);

    ctx.restore();
}


/* =====================================================
   FREEHAND
===================================================== */

function drawFreehand(obj) {

    if (!obj.points.length)
        return;

    ctx.beginPath();

    ctx.moveTo(
        obj.points[0].x,
        obj.points[0].y
    );

    for (
        let i = 1;
        i < obj.points.length;
        i++
    ) {

        ctx.lineTo(
            obj.points[i].x,
            obj.points[i].y
        );

    }

    ctx.stroke();
}


/* =====================================================
   SHAPES
===================================================== */

function drawShape(obj) {

    const x = obj.x;
    const y = obj.y;
    const w = obj.width;
    const h = obj.height;


    ctx.beginPath();


    /* LINE */

    if (obj.type === "line") {

        ctx.moveTo(x, y);

        ctx.lineTo(
            x + w,
            y + h
        );

        ctx.stroke();

        return;
    }


    /* RECTANGLE */

    if (
        obj.type === "rectangle" ||
        obj.type === "rounded-rectangle"
    ) {

        if (
            obj.type === "rounded-rectangle"
        ) {

            roundRect(
                x,
                y,
                w,
                h,
                15
            );

        } else {

            ctx.rect(
                x,
                y,
                w,
                h
            );

        }

        fillStroke();

        return;
    }


    /* ELLIPSE */

    if (
        obj.type === "ellipse" ||
        obj.type === "circle"
    ) {

        ctx.ellipse(
            x + w / 2,
            y + h / 2,
            Math.abs(w) / 2,
            Math.abs(h) / 2,
            0,
            0,
            Math.PI * 2
        );

        fillStroke();

        return;
    }


    /* TRIANGLE */

    if (obj.type === "triangle") {

        ctx.moveTo(
            x + w / 2,
            y
        );

        ctx.lineTo(
            x + w,
            y + h
        );

        ctx.lineTo(
            x,
            y + h
        );

        ctx.closePath();

        fillStroke();

        return;
    }


    /* DIAMOND */

    if (obj.type === "diamond") {

        ctx.moveTo(
            x + w / 2,
            y
        );

        ctx.lineTo(
            x + w,
            y + h / 2
        );

        ctx.lineTo(
            x + w / 2,
            y + h
        );

        ctx.lineTo(
            x,
            y + h / 2
        );

        ctx.closePath();

        fillStroke();

        return;
    }


    /* PENTAGON */

    if (obj.type === "pentagon") {

        polygon(
            x + w / 2,
            y + h / 2,
            Math.min(
                Math.abs(w),
                Math.abs(h)
            ) / 2,
            5
        );

        fillStroke();

        return;
    }


    /* HEXAGON */

    if (obj.type === "hexagon") {

        polygon(
            x + w / 2,
            y + h / 2,
            Math.min(
                Math.abs(w),
                Math.abs(h)
            ) / 2,
            6
        );

        fillStroke();

        return;
    }


    /* STAR */

    if (obj.type === "star") {

        star(
            x + w / 2,
            y + h / 2,
            Math.min(
                Math.abs(w),
                Math.abs(h)
            ) / 2
        );

        fillStroke();

        return;
    }


    /* HEART */

    if (obj.type === "heart") {

        ctx.moveTo(
            x + w / 2,
            y + h
        );

        ctx.bezierCurveTo(
            x - w * .1,
            y + h * .55,
            x,
            y,
            x + w / 2,
            y + h * .25
        );

        ctx.bezierCurveTo(
            x + w,
            y,
            x + w * 1.1,
            y + h * .55,
            x + w / 2,
            y + h
        );

        ctx.closePath();

        fillStroke();

        return;
    }


    /* CLOUD */

    if (obj.type === "cloud") {

        ctx.arc(
            x + w * .3,
            y + h * .6,
            h * .25,
            0,
            Math.PI * 2
        );

        ctx.arc(
            x + w * .5,
            y + h * .4,
            h * .32,
            0,
            Math.PI * 2
        );

        ctx.arc(
            x + w * .7,
            y + h * .6,
            h * .25,
            0,
            Math.PI * 2
        );

        ctx.closePath();

        fillStroke();

        return;
    }


    /* LIGHTNING */

    if (obj.type === "lightning") {

        ctx.moveTo(
            x + w * .55,
            y
        );

        ctx.lineTo(
            x + w * .25,
            y + h * .55
        );

        ctx.lineTo(
            x + w * .48,
            y + h * .55
        );

        ctx.lineTo(
            x + w * .3,
            y + h
        );

        ctx.lineTo(
            x + w * .8,
            y + h * .3
        );

        ctx.lineTo(
            x + w * .55,
            y + h * .3
        );

        ctx.closePath();

        fillStroke();

        return;
    }


    /* SUN */

    if (obj.type === "sun") {

        const cx =
            x + w / 2;

        const cy =
            y + h / 2;

        const r =
            Math.min(
                Math.abs(w),
                Math.abs(h)
            ) * .25;

        ctx.arc(
            cx,
            cy,
            r,
            0,
            Math.PI * 2
        );

        for (
            let i = 0;
            i < 12;
            i++
        ) {

            const a =
                i * Math.PI * 2 / 12;

            ctx.moveTo(
                cx + Math.cos(a) * r * 1.3,
                cy + Math.sin(a) * r * 1.3
            );

            ctx.lineTo(
                cx + Math.cos(a) * r * 2,
                cy + Math.sin(a) * r * 2
            );
        }

        fillStroke();

        return;
    }


    /* ARROWS */

    if (
        obj.type === "arrow-right" ||
        obj.type === "arrow-left" ||
        obj.type === "arrow-up" ||
        obj.type === "arrow-down"
    ) {

        let x1 = x;
        let y1 = y;
        let x2 = x + w;
        let y2 = y + h;

        if (obj.type === "arrow-left") {
            [x1, x2] = [x2, x1];
        }

        if (obj.type === "arrow-up") {
            [y1, y2] = [y2, y1];
        }

        arrow(
            x1,
            y1,
            x2,
            y2
        );

        return;
    }


    /* SPEECH */

    if (obj.type === "speech") {

        roundRect(
            x,
            y,
            w,
            h * .75,
            15
        );

        ctx.moveTo(
            x + w * .25,
            y + h * .75
        );

        ctx.lineTo(
            x + w * .15,
            y + h
        );

        ctx.lineTo(
            x + w * .4,
            y + h * .75
        );

        fillStroke();
    }

}


/* =====================================================
   FILL + STROKE
===================================================== */

function fillStroke() {

    if (color2 !== "transparent") {
        ctx.fill();
    }

    ctx.stroke();
}


/* =====================================================
   ROUNDED RECTANGLE
===================================================== */

function roundRect(
    x,
    y,
    w,
    h,
    r
) {

    ctx.beginPath();

    ctx.moveTo(
        x + r,
        y
    );

    ctx.lineTo(
        x + w - r,
        y
    );

    ctx.quadraticCurveTo(
        x + w,
        y,
        x + w,
        y + r
    );

    ctx.lineTo(
        x + w,
        y + h - r
    );

    ctx.quadraticCurveTo(
        x + w,
        y + h,
        x + w - r,
        y + h
    );

    ctx.lineTo(
        x + r,
        y + h
    );

    ctx.quadraticCurveTo(
        x,
        y + h,
        x,
        y + h - r
    );

    ctx.lineTo(
        x,
        y + r
    );

    ctx.quadraticCurveTo(
        x,
        y,
        x + r,
        y
    );

    ctx.closePath();
}


/* =====================================================
   POLYGON
===================================================== */

function polygon(
    cx,
    cy,
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
            i * Math.PI * 2 / sides;

        const px =
            cx + Math.cos(angle) * radius;

        const py =
            cy + Math.sin(angle) * radius;

        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }

    ctx.closePath();
}


/* =====================================================
   STAR
===================================================== */

function star(
    cx,
    cy,
    radius
) {

    const inner =
        radius * .45;

    ctx.beginPath();

    for (
        let i = 0;
        i < 10;
        i++
    ) {

        const angle =
            -Math.PI / 2 +
            i * Math.PI / 5;

        const r =
            i % 2 === 0
                ? radius
                : inner;

        const px =
            cx + Math.cos(angle) * r;

        const py =
            cy + Math.sin(angle) * r;

        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }

    ctx.closePath();
}


/* =====================================================
   ARROW
===================================================== */

function arrow(
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

    const size = 18;

    ctx.beginPath();

    ctx.moveTo(x1, y1);

    ctx.lineTo(x2, y2);

    ctx.moveTo(x2, y2);

    ctx.lineTo(
        x2 - size * Math.cos(angle - Math.PI / 6),
        y2 - size * Math.sin(angle - Math.PI / 6)
    );

    ctx.moveTo(x2, y2);

    ctx.lineTo(
        x2 - size * Math.cos(angle + Math.PI / 6),
        y2 - size * Math.sin(angle + Math.PI / 6)
    );

    ctx.stroke();
}


/* =====================================================
   FIND OBJECT
===================================================== */

function findObject(x, y) {

    for (
        let i = objects.length - 1;
        i >= 0;
        i--
    ) {

        const obj = objects[i];

        if (
            obj.x !== undefined &&
            obj.y !== undefined &&
            obj.width !== undefined &&
            obj.height !== undefined
        ) {

            if (
                x >= Math.min(
                    obj.x,
                    obj.x + obj.width
                ) &&
                x <= Math.max(
                    obj.x,
                    obj.x + obj.width
                ) &&
                y >= Math.min(
                    obj.y,
                    obj.y + obj.height
                ) &&
                y <= Math.max(
                    obj.y,
                    obj.y + obj.height
                )
            ) {
                return obj;
            }
        }
    }

    return null;
}


/* =====================================================
   MOVE OBJECT
===================================================== */

function moveObject(
    obj,
    dx,
    dy
) {

    if (
        obj.x !== undefined
    ) {

        obj.x += dx;
        obj.y += dy;

    }


    if (obj.points) {

        obj.points.forEach(point => {

            point.x += dx;
            point.y += dy;

        });

    }

}


/* =====================================================
   SELECTION
===================================================== */

function drawSelection(obj) {

    if (!obj) return;

    if (
        obj.x === undefined ||
        obj.width === undefined
    ) {
        return;
    }

    ctx.save();

    ctx.strokeStyle = "#1677ff";
    ctx.lineWidth = 1.5;

    ctx.setLineDash([
        6,
        4
    ]);

    ctx.strokeRect(
        obj.x - 5,
        obj.y - 5,
        obj.width + 10,
        obj.height + 10
    );

    ctx.setLineDash([]);

    const handles = [
        [obj.x, obj.y],
        [obj.x + obj.width, obj.y],
        [obj.x, obj.y + obj.height],
        [
            obj.x + obj.width,
            obj.y + obj.height
        ]
    ];

    handles.forEach(([x, y]) => {

        ctx.fillStyle = "white";

        ctx.fillRect(
            x - 5,
            y - 5,
            10,
            10
        );

        ctx.strokeStyle = "#1677ff";

        ctx.strokeRect(
            x - 5,
            y - 5,
            10,
            10
        );

    });

    ctx.restore();
}


/* =====================================================
   TEXT
===================================================== */

function createText(x, y) {

    const text =
        prompt("Text likhein:");

    if (!text) return;

    const obj = {

        type: "text",

        x: x,
        y: y,

        text: text,

        font: "Segoe UI",

        fontSize: 28,

        color: color1,

        stroke: color1,

        width: 150,
        height: 35
    };

    objects.push(obj);

    selectedObject = obj;

    saveHistory();

    draw();
}


/* =====================================================
   UNDO
===================================================== */

document
    .getElementById("undoBtn")
    .addEventListener("click", undo);

function undo() {

    if (undoStack.length <= 1)
        return;

    redoStack.push(
        JSON.parse(
            JSON.stringify(objects)
        )
    );

    undoStack.pop();

    objects =
        JSON.parse(
            JSON.stringify(
                undoStack[
                    undoStack.length - 1
                ]
            )
        );

    selectedObject = null;

    draw();
}


/* =====================================================
   REDO
===================================================== */

document
    .getElementById("redoBtn")
    .addEventListener("click", redo);

function redo() {

    if (!redoStack.length)
        return;

    const state =
        redoStack.pop();

    undoStack.push(
        JSON.parse(
            JSON.stringify(state)
        )
    );

    objects =
        JSON.parse(
            JSON.stringify(state)
        );

    draw();
}


/* =====================================================
   HISTORY
===================================================== */

function saveHistory() {

    undoStack.push(
        JSON.parse(
            JSON.stringify(objects)
        )
    );

    if (undoStack.length > 50) {
        undoStack.shift();
    }

    redoStack = [];
}


/* =====================================================
   COPY
===================================================== */

document
    .getElementById("copyBtn")
    .addEventListener("click", () => {

        if (!selectedObject)
            return;

        clipboard =
            JSON.parse(
                JSON.stringify(
                    selectedObject
                )
            );

    });


/* =====================================================
   PASTE
===================================================== */

document
    .getElementById("pasteBtn")
    .addEventListener("click", () => {

        if (!clipboard)
            return;

        const copy =
            JSON.parse(
                JSON.stringify(
                    clipboard
                )
            );

        if (copy.x !== undefined) {
            copy.x += 25;
            copy.y += 25;
        }

        objects.push(copy);

        selectedObject = copy;

        saveHistory();

        draw();

    });


/* =====================================================
   CUT
===================================================== */

document
    .getElementById("cutBtn")
    .addEventListener("click", () => {

        if (!selectedObject)
            return;

        clipboard =
            JSON.parse(
                JSON.stringify(
                    selectedObject
                )
            );

        const index =
            objects.indexOf(
                selectedObject
            );

        if (index !== -1) {

            objects.splice(
                index,
                1
            );

        }

        selectedObject = null;

        saveHistory();

        draw();

    });


/* =====================================================
   DELETE
===================================================== */

document.addEventListener(
    "keydown",
    e => {

        if (
            e.key === "Delete" &&
            selectedObject
        ) {

            const index =
                objects.indexOf(
                    selectedObject
                );

            if (index !== -1) {

                objects.splice(
                    index,
                    1
                );

            }

            selectedObject = null;

            saveHistory();

            draw();
        }

    }
);


/* =====================================================
   NEW
===================================================== */

document
    .getElementById("newBtn")
    .addEventListener("click", () => {

        objects = [];

        selectedObject = null;

        undoStack = [];

        redoStack = [];

        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        ctx.fillStyle = "white";

        ctx.fillRect(
            0,
            0,
            canvas.width,
            canvas.height
        );

        saveHistory();

        draw();

    });


/* =====================================================
   SAVE
===================================================== */

document
    .getElementById("saveBtn")
    .addEventListener("click", () => {

        const link =
            document.createElement("a");

        link.download =
            "paint-drawing.png";

        link.href =
            canvas.toDataURL(
                "image/png"
            );

        link.click();

    });


/* =====================================================
   OPEN IMAGE
===================================================== */

const imageInput =
    document.createElement("input");

imageInput.type = "file";
imageInput.accept = "image/*";
imageInput.hidden = true;

document.body.appendChild(
    imageInput
);


document
    .getElementById("openBtn")
    .addEventListener(
        "click",
        () => imageInput.click()
    );


imageInput.addEventListener(
    "change",
    e => {

        const file =
            e.target.files[0];

        if (!file)
            return;

        const reader =
            new FileReader();

        reader.onload = event => {

            const img =
                new Image();

            img.onload = () => {

                ctx.clearRect(
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );

                ctx.drawImage(
                    img,
                    0,
                    0,
                    canvas.width,
                    canvas.height
                );

            };

            img.src =
                event.target.result;
        };

        reader.readAsDataURL(file);

    }
);


/* =====================================================
   ZOOM
===================================================== */

document
    .getElementById("zoomIn")
    .addEventListener("click", () => {

        zoom += 0.1;

        if (zoom > 3)
            zoom = 3;

        applyZoom();

    });


document
    .getElementById("zoomOut")
    .addEventListener("click", () => {

        zoom -= 0.1;

        if (zoom < 0.3)
            zoom = 0.3;

        applyZoom();

    });


function applyZoom() {

    canvas.style.transform =
        `scale(${zoom})`;

    document
        .getElementById("zoomValue")
        .textContent =
        Math.round(zoom * 100) + "%";
}


/* =====================================================
   STATUS
===================================================== */

function updateStatus() {

    document
        .getElementById("toolStatus")
        .textContent =
        tool === "shape"
            ? currentShape
            : tool;

}


/* =====================================================
   INITIAL DRAW
===================================================== */

function draw() {

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.fillStyle = "#ffffff";

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    objects.forEach(
        drawObject
    );

    if (selectedObject) {
        drawSelection(
            selectedObject
        );
    }

    document
        .getElementById("objectStatus")
        .textContent =
        "Objects: " +
        objects.length;

    updateStatus();
}


draw();
