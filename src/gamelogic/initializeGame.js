import { onEnemieCollision, onScoreCollision } from "/src/gamelogic/collision";
import facebookEnemyImgSrc from "/src/assets/images/sprites/enemies/enemy-facebook.png";
import robloxEnemyImgSrc from "/src/assets/images/sprites/enemies/enemy-roblox.png";
import tiktokEnemyImgSrc from "/src/assets/images/sprites/enemies/enemy-tiktok.png";
import fivemEnemyImgSrc from "/src/assets/images/sprites/enemies/enemy-fivem.png";
import instagramImgSrc from "/src/assets/images/sprites/enemies/enemy-instagram.png";
import shotgunImgSrc from "/src/assets/images/sprites/skills/skill-shotgun.png";
import mugenImgSrc from "/src/assets/images/sprites/skills/skill-mugen.png";
import shotgunSound1 from '/src/assets/sounds/shotgun1.mp4';
import shotgunSound2 from '/src/assets/sounds/shotgun2.mp4';
import shotgunSound3 from '/src/assets/sounds/shotgun3.mp4';
import mugenSound from "/src/assets/sounds/mugen.mp4";

export const initializeGame = (canvas, gameData) => {
  // Canvas Setup
  const context = canvas.value.getContext("2d");
  const boardW = 1000;
  const boardH = 450;

  canvas.value.width = boardW;
  canvas.value.height = boardH;

  // Player Model Setup
  // Skin Img
  const defaultPlayerImg = new Image();
  const shotgun = new Image();
  const mugen = new Image();
  defaultPlayerImg.src = gameData.skin.equipped.img;
  shotgun.src = shotgunImgSrc;
  mugen.src = mugenImgSrc;

  // Default Width, Height & y position
  const defaultWidth = 62;
  const defaultHeight = 76;
  const defaultY = boardH - 76;

  // Skill Sfx
  // Shotgun
  const shotgunSfx1 = new Audio(shotgunSound1);
  const shotgunSfx2 = new Audio(shotgunSound2);
  const shotgunSfx3 = new Audio(shotgunSound3);

  // Mugen
  const mugenSfx = new Audio(mugenSound);

  const player = {
    w: defaultWidth,
    h: defaultHeight,
    x: 50,
    y: defaultY, // start at the ground
    baseY: defaultY, // ground postion of player (board height - player height)
    img: defaultPlayerImg
  };

  // Enemy Model Setup
  // Skin Img
  const tiktokEnemyImg = new Image();
  const facebookEnemyImg = new Image();
  const fivemEnemyImg = new Image();
  const robloxEnemyImg = new Image();
  const instagramImg = new Image();
  tiktokEnemyImg.src = tiktokEnemyImgSrc;
  facebookEnemyImg.src = facebookEnemyImgSrc;
  fivemEnemyImg.src = fivemEnemyImgSrc;
  robloxEnemyImg.src = robloxEnemyImgSrc;
  instagramImg.src = instagramImgSrc;

  const enemySkins = [
    tiktokEnemyImg, 
    facebookEnemyImg,
    fivemEnemyImg, 
    robloxEnemyImg,
    instagramImg
  ];

  const enemyModel = {
    w: 70,
    h: 105,
    x: 920,
    y: boardH - 105,
    img: tiktokEnemyImg,
    speed: -3 // speed to the left side of canvas
  };

  const enemyArray = []; // contain all the enemy in the map  

  // Physics Setup
  const physics = {
    velocityY: 0, // ความแรงในการกระโดด
    gravity: 0.23
  };


  let score = 0;

  // เพื่อ Clean up หลังการ reset game หรือ component unmounted
  let gameover = false;
  let animationFrameId; // Track animation frame
  let enemyInterval;
  let speedInterval;

  // Animation Handler
  const updateAnimation = () => {
    if (gameover) return;
    animationFrameId = requestAnimationFrame(updateAnimation); // recursive for infinite animation
    context.clearRect(0, 0, boardW, boardH);

    // Handle Score
    context.font = "normal bold 20px Arial";
    if (gameData.playerSkills.extraScore) {
      context.fillStyle = "red";
      context.fillText("x2", boardW / 2 - 90, 30);
      context.fillStyle = "white";
      context.fillText("Score : " + score, boardW / 2 - 60, 30);
      context.fillText("Score : " + score, boardW / 2 - 60, 30);
    } else {
      context.fillText("Score : " + score, boardW / 2 - 50, 30);
      context.strokeStyle = "orange";
      context.strokeText("Score : " + score, boardW / 2 - 50, 30);
    }

    // Handle Player Movement
    physics.velocityY += physics.gravity; // Gravity Simulation -> ในแต่ละ frame velocity จะถูกหักกับ gravity จนค่าเป็น 0 และ player ถูกดึงลงพื้นในที่สุด
    player.y = Math.min(player.y + physics.velocityY, player.baseY); // playerY จะถูกอัปเดตโดยอิงจาก ตน.ปัจจุบัน + velocity (และ player ตกลงสู่พื้นเท่านั้น ไม่มุดลงดิน)
    context.drawImage(player.img, player.x, player.y, player.w, player.h); // draw updated player to the canvas

    // Handle Enemy Movement
    for (let i = 0; i < enemyArray.length; i++) {
      const tree = enemyArray[i];
      tree.x += tree.speed;
      context.drawImage(tree.img, tree.x, tree.y, tree.w, tree.h);

      // Collision checking
      if (
        onEnemieCollision(player, tree) &&
        gameData.playerSkills.mugen.active <= 0
      ) {
        gameover = true;
        context.font = "normal bold 20px Arial";
        context.fillStyle = "black";
        context.textAlign = "center";

        // convert score to money
        const money = Math.round(score / 100) * 10;
        gameData.money += money;

        context.fillText("Game Over!", boardW / 2, boardH / 2);
        context.fillText(`Money: ${money}`, boardW / 2, boardH / 2 + 30);
        cancelAnimationFrame(animationFrameId);

        // Set new Highscore
        if (gameData.highScore < score) {
          context.fillStyle = "red";
          context.fillText(
            "You Achive New High Score!",
            boardW / 2,
            boardH / 2 - 30
          );
          gameData.highScore = score;
        }
      } else if (onScoreCollision(player, tree)) {
        if (gameData.playerSkills.extraScore) {
          score += 2;
        } else {
          score++;
        }
      }
    }
  };

  // สร้าง Enemy ทุกๆ 1.5 วิ
  enemyInterval = setInterval(() => {
    if (gameover) return;
    
    // Use index to select enemy by theme
    const treeEnemy = Object.create(enemyModel);
    treeEnemy.img = enemySkins[Math.floor(Math.random() * enemyArray.length)];
    // Random fly enemy
    const randomProp = Math.floor(Math.random() * 5)
    if (randomProp === 0) {
      treeEnemy.y = boardH - 210
    }
    enemyArray.push(treeEnemy);

    if (enemyArray.length > 5) {
      // clear enemy
      enemyArray.shift();
    }
  }, 1200);

  // เพิ่มความเร็วของ Enemy ขึ้น 0.5 ทุกๆ 1 วิ
  speedInterval = setInterval(() => {
    if (!gameover && enemyModel.speed >= -20) {
      enemyModel.speed -= 0.5;
    }
  }, 1000);

  const handleKeydown = (e) => {
    if (gameover) {
      return;
    } else if (e.code === "KeyW" && player.y === player.baseY) {
      physics.velocityY = -10;
    } else if (e.code === "KeyS" && player.y < player.baseY) {
      physics.velocityY = 30;
    } else if (
      e.code === "KeyQ" &&
      gameData.playerSkills.shotgunSkill > 0 &&
      gameData.playerSkills.mugen.active <= 0
    ) {
      enemyArray.splice(0, enemyArray.length);
      gameData.playerSkills.shotgunSkill -= 1;
      score += 100;

      // change player img skin
      player.img = shotgun;
      player.w = 107;
      setTimeout(() => {
        player.img = defaultPlayerImg;
        player.w = defaultWidth;
      }, 500);

      // Play Shotgun sfx
      const shotgunSfx = [
        shotgunSfx1,
        shotgunSfx2,
        shotgunSfx3
      ];
      shotgunSfx[Math.floor(Math.random() * 3)].play();

    } else if (
      e.code === "KeyE" &&
      gameData.playerSkills.mugen.active <= 0 &&
      gameData.playerSkills.mugen.cooldown <= 0
    ) {
      player.img = mugen;
      player.w = 108;
      player.h = 107;
      player.baseY = defaultY - 31;

      // Play Mugen sfx
      mugenSfx.play();

      // Show countdown for active skill
      gameData.playerSkills.mugen.active = 5;
      const clearInt1 = setInterval(() => {
        --gameData.playerSkills.mugen.active;
        if (gameData.playerSkills.mugen.active <= 0) {
          clearInterval(clearInt1);
          player.img = defaultPlayerImg;
          player.w = defaultWidth;
          player.h = defaultHeight;
          player.baseY = defaultY;
        }
      }, 1000);

      // Set Cooldown after deactive skill
      setTimeout(() => {
        gameData.playerSkills.mugen.active = 0;
        gameData.playerSkills.mugen.cooldown = 15;
        const clearInt2 = setInterval(() => {
          --gameData.playerSkills.mugen.cooldown;
          if (gameData.playerSkills.mugen.cooldown <= 0) {
            clearInterval(clearInt2);
          }
        }, 1000);
      }, 5000);
    } else if (e.code === "F2") {
      // Cheat Money (Debug) 
      gameData.money += 1000;
    } else if (e.code === "F4") {
      // Reset Money
      gameData.money = 0;
    }
  };

  // เมื่อรูป player โหลดเสร็จแล้ว
  player.img.onload = () => {
    animationFrameId = requestAnimationFrame(updateAnimation);
    document.addEventListener("keydown", handleKeydown);
  };

  // Return cleanup function
  return () => {
    gameData.playerSkills.mugen.active = 0;
    gameData.playerSkills.mugen.cooldown = 0;
    cancelAnimationFrame(animationFrameId);
    clearInterval(enemyInterval);
    clearInterval(speedInterval);
    document.removeEventListener("keydown", handleKeydown);
    gameData.playerSkills.extraScore = false;
  };
};
