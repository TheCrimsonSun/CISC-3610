const canvas = document.getElementById("myCanvas");
const ctx = canvas.getContext("2d");

canvas.width = 1000;
canvas.height = 500;
canvas.style.border = "3px solid black";

//background
ctx.fillStyle = "lightblue";
ctx.fillRect(0, 0, 1000, 500);

//sun
ctx.beginPath();
ctx.lineWidth = 5;
ctx.fillStyle = "yellow";
ctx.arc(0, 0, 100, 0, Math.PI * 2);
ctx.closePath();
ctx.stroke();
ctx.fill();

//ground
ctx.fillStyle = "green";
ctx.fillRect(0, 400, 1000, 500);

//house base
ctx.fillStyle = "brown";
ctx.fillRect(400, 200, 400, 200);
ctx.strokeStyle = "black";
ctx.stroke();
ctx.strokeRect(400, 200, 400, 200);

//roof
ctx.beginPath();
ctx.moveTo(400, 150);
ctx.lineTo(350, 250);
ctx.lineTo(850, 250);
ctx.lineTo(800, 150);
ctx.closePath();
ctx.strokeStyle = "black";
ctx.stroke();
ctx.fillStyle = "yellow";
ctx.fill();

//door
ctx.fillStyle = "blue";
ctx.fillRect(450, 300, 50, 100);
ctx.strokeStyle = "black";
ctx.stroke();
ctx.strokeRect(450, 300, 50, 100);

//door knob
ctx.beginPath();
ctx.lineWidth = 5;
ctx.fillStyle = "pink";
ctx.arc(490, 350, 5, 0, Math.PI * 2);
ctx.closePath();
ctx.stroke();
ctx.fill();

//window
ctx.fillStyle = "lightblue";
ctx.fillRect(550, 300, 50, 50);
ctx.strokeStyle = "black";
ctx.stroke();
ctx.strokeRect(550, 300, 50, 50);
//downline pane
ctx.beginPath();
ctx.strokeStyle = "black";
ctx.moveTo(575, 300);
ctx.lineTo(575, 350);
ctx.closePath();
ctx.stroke();
//acrossline pane
ctx.beginPath();
ctx.strokeStyle = "black";
ctx.moveTo(550, 325);
ctx.lineTo(600, 325);
ctx.closePath();
ctx.stroke();

//window 2
ctx.fillStyle = "lightblue";
ctx.fillRect(650, 300, 50, 50);
ctx.strokeStyle = "black";
ctx.stroke();
ctx.strokeRect(650, 300, 50, 50);
//downline pane
ctx.beginPath();
ctx.strokeStyle = "black";
ctx.moveTo(675, 300);
ctx.lineTo(675, 350);
ctx.closePath();
ctx.stroke();
//acrossline pane
ctx.beginPath();
ctx.strokeStyle = "black";
ctx.moveTo(650, 325);
ctx.lineTo(700, 325);
ctx.closePath();
ctx.stroke();

//caption
ctx.fillStyle = "black"
ctx.font = "20pt 'Comic Sans MS'";
ctx.fillText("When the house be caption", 100, 100)

//grass
let x = 0;
let y = 0;
ctx.translate(x, 410);
for (let j = 0; j < 5; j++) {
  ctx.translate(x, y);
  console.log(y);
  for (let i = 0; i < 60; i++) {
    ctx.beginPath();
    ctx.moveTo(x+10,0);
    ctx.lineTo(x, 5);
    ctx.lineTo(x+20, 5);
    ctx.closePath();
    ctx.strokeStyle = "lightgreen";
    ctx.stroke();
    x += 20;
  }
  x = 0;
  y = 20;
}