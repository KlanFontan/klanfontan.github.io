// game.js

let tele = window.Telegram.WebApp;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false }); // Отключаем прозрачность

tele.ready();

tele.expand();
tele.setHeaderColor("#000000");
tele.setBackgroundColor("#000000");

// Размеры холста
canvas.width = 1280*1;
canvas.height = 522*1;

// Персонажи
const player1 = { 
    x: 15,
    y: canvas.height - 350,
    width: 256,
    height: 316,
    hitboxHeight: 316 / 6, // Добавляем отдельную высоту для хитбокса
    hp: 100,
    maxHp: 100 
};

const player2 = { 
    x: canvas.width - 290,
    y: canvas.height - 350,
    width: 256,
    height: 316,
    hitboxHeight: 316 / 6, // Добавляем отдельную высоту для хитбокса
    hp: 100,
    maxHp: 100 
};

let lastUpdateTime = performance.now();
let winnerDetermined = false; 
// Добавляем параметры для управления ходами
let currentPlayer = 1; // Текущий игрок (1 или 2)
let canThrow = true;  // Можно ли сейчас бросать

// Изменяем параметры камня
let stone = null;
let stoneSpeed = 3.20; // Уменьшили базовую скорость
let gravity = 0.17; // Немного увеличили гавитацию с 0.12 до 0.15
let isMousePressed = false;

// Параметры силы броска
let throwPower = 0;
const maxPower = 8; // Настроили макимальную силу

// Добавляем объект препятствия
const obstacle = {
    x: 362*1.5, // Центр по X (850/2 - 25)
    y: 210*1.5, // Позиция по Y, уменьшена на 10 пикселей
    width: 125*1.5,
    height: 120*1.5,
    color: "#666666" // Серый цвет
};

const player1DeathFrames = ['/assets/puppet_frames_death/frame_00.png', '/assets/puppet_frames_death/frame_01.png', '/assets/puppet_frames_death/frame_02.png', '/assets/puppet_frames_death/frame_03.png', '/assets/puppet_frames_death/frame_04.png', '/assets/puppet_frames_death/frame_05.png', '/assets/puppet_frames_death/frame_06.png', '/assets/puppet_frames_death/frame_07.png', '/assets/puppet_frames_death/frame_08.png', '/assets/puppet_frames_death/frame_09.png', '/assets/puppet_frames_death/frame_10.png', '/assets/puppet_frames_death/frame_11.png', '/assets/puppet_frames_death/frame_12.png', '/assets/puppet_frames_death/frame_13.png', '/assets/puppet_frames_death/frame_14.png', '/assets/puppet_frames_death/frame_15.png']; // Добавьте все кадры
const player2DeathFrames = ['/assets/gizmo_frames_death/frame_00.png', '/assets/gizmo_frames_death/frame_01.png', '/assets/gizmo_frames_death/frame_02.png', '/assets/gizmo_frames_death/frame_03.png', '/assets/gizmo_frames_death/frame_04.png', '/assets/gizmo_frames_death/frame_05.png', '/assets/gizmo_frames_death/frame_06.png', '/assets/gizmo_frames_death/frame_07.png', '/assets/gizmo_frames_death/frame_08.png', '/assets/gizmo_frames_death/frame_09.png', '/assets/gizmo_frames_death/frame_10.png', '/assets/gizmo_frames_death/frame_11.png', '/assets/gizmo_frames_death/frame_12.png', '/assets/gizmo_frames_death/frame_13.png', '/assets/gizmo_frames_death/frame_14.png', '/assets/gizmo_frames_death/frame_15.png']; // Добавьте все кадры


// В начале файла добавляем массивы для хранения предзагруженных изображений
const loadedPlayer1DeathFrames = [];
const loadedPlayer2DeathFrames = [];

// Функция для предзагрузки кадров смерти
function preloadDeathFrames() {
    let loadedCount = 0;
    const totalFrames = player1DeathFrames.length + player2DeathFrames.length;
    
    function onFrameLoad() {
        loadedCount++;
        console.log(`Loaded ${loadedCount}/${totalFrames} death frames`); // Отладка
    }

    player1DeathFrames.forEach(src => {
        const img = new Image();
        img.onload = onFrameLoad;
        img.src = src;
        loadedPlayer1DeathFrames.push(img);
    });
    
    player2DeathFrames.forEach(src => {
        const img = new Image();
        img.onload = onFrameLoad;
        img.src = src;
        loadedPlayer2DeathFrames.push(img);
    });
}

// Создаем и загружаем изображение фона
const backgroundImage = new Image();
backgroundImage.src = 'background.png';

// Добавляем загрузку изображения для HP бара
const emptyHpBarImage = new Image();
emptyHpBarImage.src = 'emptyHpBar.png';

// Добавляем згрузку изображений персонажей
const player1Image = new Image();
player1Image.src = '/assets/puppet_frames/frame_00.png';

const player2Image = new Image();
player2Image.src = '/assets/gizmo_frames/frame_00.png';

// Добавляем изображение кнопки
const backButtonImage = new Image();
backButtonImage.src = 'backButton.png';

// Координаты и размеры кнопки
const backButton = {
    x: 50,
    y: 55, // Подняли кнопк выше, чтобы он не  с моделькой игрк
    width: 125, // Предполагаемая ширина кнопки
    height: 45 // Предполагаемая высота кнопки
};

// Добавляем загрузку изображения для "versus"
const versusImage = new Image();
versusImage.src = '../../../img/versus.svg';

// Добавляем загрузку изображений аватаров
const gizmoAvatarImage = new Image();
gizmoAvatarImage.src = '../../../img/square_gizmo.png';

const puppetAvatarImage = new Image();
puppetAvatarImage.src = '../../../img/square_puppet.png';

if (tele.initData) {
    const params = new URLSearchParams(tele.initData);
    const userData = params.get('user');
    console.log(tele.initData);
    console.log(userData);
    if (userData) {
        const userObj = JSON.parse(userData);
        if (userObj.first_name) {
           var player1Name = userObj.first_name;
        } else {
            console.warn("First name is unavailable in initData.");
            var player1Name = "Puppet";
        }
    } else {
        console.warn("User information is incomplete or unavailable.");
        var player1Name = "Puppet";
    }
} else {
    console.warn("User information is incomplete or unavailable.");
    var player1Name = "Puppet";
}

const player2Name = "Gizmo";

// Добавляем переменные для анимации HP
let displayedHp1 = player1.hp;
let displayedHp2 = player2.hp;

// Добавляем переменные для анимации мигания
let player1Hit = false;
let player2Hit = false;
let hitAnimationDuration = 500; // Длительность анимации в миллисекундах
let hitAnimationStartTime = 0;

// Переменная для силы ветра
let windStrength = 0;

// Функция для обновления силы ветра
function updateWind() {
    windStrength = Math.random() * 12 - 6; // Случайное значение от -3 до 3
}

// Функция для отрисовки бара силы ветра
function drawWindBar() {
    const barWidth = 200;
    const barHeight = 40;
    const barX = (canvas.width - barWidth) / 2;
    const barY = 125;

    // Добавляем тень только для фона бара и стрелок
    ctx.shadowColor = "#03043E"; // Цвет тени
    ctx.shadowOffsetX = 0; // Смещение тени по X
    ctx.shadowOffsetY = 4; // Смещение тени по Y
    ctx.shadowBlur = 0; // Размытие тени

    // Фо�� бара
    ctx.fillStyle = "#B3B4FE";
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Сбрсываем тень перед отрисовкой заполненной части и текста
    ctx.shadowColor = "transparent";
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.shadowBlur = 0;

    // Ограничиваем значение ветра в диапазоне от -6 до 6
    const clampedWindStrength = Math.max(-6, Math.min(6, windStrength));
    const normalizedWindStrength = clampedWindStrength / 6; // Нормализуем значение ветра от -1 до 1
    const fillWidth = (barWidth / 2) * normalizedWindStrength; // Полная ширина заполнения
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(barX + barWidth / 2, barY, fillWidth, barHeight); // Заполнение от середины фона

    // Отрисовка значения ветра для отладки
    ctx.fillStyle = "#0003FA";
    ctx.font = "28px Fortnite";
    ctx.textAlign = "center";
    ctx.fillText(`Wind`, canvas.width / 2, barY + 21);

    const arrowSize = 20; // Размер стрелок
    ctx.fillStyle = clampedWindStrength < 0 ? "#FFFFFF" : "#B3B4FE"; // Цвет левой стрелки
    drawArrow(barX - arrowSize - 35, barY + barHeight / 2, arrowSize + 20, 0, arrowSize ); // Левая стрелка

    ctx.fillStyle = clampedWindStrength > 0 ? "#FFFFFF" : "#B3B4FE"; // Цвет правой стрелки
    drawArrow(barX + barWidth + arrowSize + 35, barY + barHeight / 2, -arrowSize - 20, 0, arrowSize); // Правая стрелка
}

// Вспомогательная функция для рисования стрелки
function drawArrow(x, y, dx, dy, arrowSize) {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx, y - arrowSize / 2);
    ctx.lineTo(x + dx, y + arrowSize / 2);
    ctx.closePath();
    ctx.fill();

    // Убираем обводку для залитой стрелки
    if (ctx.fillStyle !== "#FFFFFF") { // Проверяем, что стрелка не залита белым
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#FFFFFF";
        ctx.stroke();
    }
}

// Кэшируем фон и статические элементы
let backgroundCanvas = document.createElement('canvas');
let backgroundCtx = backgroundCanvas.getContext('2d');
backgroundCanvas.width = canvas.width;
backgroundCanvas.height = canvas.height;

function cacheStaticElements(ctx) {
    // Отрисовываем фон
    backgroundCtx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    // Отрисовываем статические элементы, такие как аватар и "versus"
    drawAvatars(ctx);
    drawVersus(ctx);
}

// Обновляем функцию отрисовки фона
function drawBackground() {
    ctx.drawImage(backgroundCanvas, 0, 0);
}

// Добавляем переменные для отслеживания состояния звёзд
let player1StarsOpacity = 0;
let player2StarsOpacity = 0;
const starsAnimationDuration = 1000; // 1 секунда
let player1StarsAnimationStart = 0;
let player2StarsAnimationStart = 0;

// Обновляем функцию рисования игрока
function drawPlayer(player) {
    // Проверяем, нужно ли мигание и не закончилась ли игра
    let isHit = !gameOver && ((player === player1 && player1Hit) || (player === player2 && player2Hit));
    let elapsedTime = Date.now() - hitAnimationStartTime;

    if (isHit && elapsedTime < hitAnimationDuration) {
        // Меняем прозрачность только если игра не окончена
        ctx.globalAlpha = (Math.floor(elapsedTime / 100) % 2 === 0) ? 0.5 : 1.0;
    } else {
        // Сбрасываем флаг мигания и прозрачность
        if (player === player1) player1Hit = false;
        if (player === player2) player2Hit = false;
        ctx.globalAlpha = 1.0;
    }

    // Отрисовываем изображение игрока
    if (player === player1) {
        ctx.drawImage(player1Image, player.x, player.y, player.width, player.height);
    } else {
        ctx.drawImage(player2Image, player.x, player.y, player.width, player.height);
    }

    // Обновляем кадр анимации звёзд
    const currentTime = performance.now();
    if (currentTime - lastStarsFrameTime > 50) {
        currentStarsFrame = (currentStarsFrame + 1) % loadedStarsFrames.length;
        lastStarsFrameTime = currentTime;
    }

    // Обновляем прозрачность звёзд
    if (player === player1) {
        if (player1StarsAnimationStart > 0) {
            const elapsed = currentTime - player1StarsAnimationStart;
            if (elapsed < starsAnimationDuration) {
                player1StarsOpacity = 1 - (elapsed / starsAnimationDuration);
            } else {
                player1StarsOpacity = 0;
                player1StarsAnimationStart = 0;
            }
        }
        ctx.globalAlpha = player1StarsOpacity;
    } else {
        if (player2StarsAnimationStart > 0) {
            const elapsed = currentTime - player2StarsAnimationStart;
            if (elapsed < starsAnimationDuration) {
                player2StarsOpacity = 1 - (elapsed / starsAnimationDuration);
            } else {
                player2StarsOpacity = 0;
                player2StarsAnimationStart = 0;
            }
        }
        ctx.globalAlpha = player2StarsOpacity;
    }

    // Отрисовываем звёзды над персонажем
    const starsWidth = 125; // Немного уже, чем персонаж
    const starsHeight = 125; // Примерная высота звёзд
    const starsX = player.x + (player.width - starsWidth) / 2;
    const starsY = player.y - starsHeight / 4 + 60;

    ctx.drawImage(loadedStarsFrames[currentStarsFrame], starsX, starsY, starsWidth, starsHeight);
    
    // Восстанавливаем прозрачность
    ctx.globalAlpha = 1.0;
}

// Функция отрисовки HP баров и никнеймов
function drawHealthBars() {
    // Размеры HP бара
    const barWidth = 350;  // Оставляем прежнюю длину
    const barHeight = 12;  // Уменьшаем выоту с 15 до 7.5
    const topOffset = 70;
    const radius = 6;      // Уменьшаем радиус закругления с 7 до 3.5

    const leftBarX = 150; // Было 50
    const rightBarX = canvas.width - barWidth - 150; // Было canvas.width - barWidth - 50
    
    // Отрисовка никнейма для player1
    ctx.fillStyle = "white";
    ctx.font = "28px Fortnite";
    ctx.textAlign = "right";
    ctx.shadowColor = "rgba(100, 13, 13, 1)";
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    ctx.fillText(player1Name, 460, topOffset - 25);
    ctx.shadowOffsetX = 0; // Сброс тени
    ctx.shadowOffsetY = 0; // Сброс тен

    // Отрисовка плашки для player1
    ctx.fillStyle = "rgba(232, 44, 64, 1)";
    const player1BoxWidth = 70;
    const player1BoxX = canvas.width / 2 - ctx.measureText(player1Name).width - 260;
    roundRect(player1BoxX, topOffset - 41, player1BoxWidth, 30, 5); // Позиция и размер плашки с закруглением 5 пикселей
    ctx.fillStyle = "white";
    ctx.font = "18px Fortnite";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 3;
    ctx.fillText("PUPPET", player1BoxX + player1BoxWidth / 2, topOffset - 24); // Текст в плашке
    ctx.shadowOffsetX = 0; // Сброс тени
    ctx.shadowOffsetY = 0; // Сброс тени

    // Анимируем HP для player1
    if (displayedHp1 > player1.hp) {
        displayedHp1 -= 0.5; // Скорость уменьшения HP
        if (displayedHp1 < player1.hp) displayedHp1 = player1.hp;
    }

    // HP бар для player1 (слева)
    // Рисуем фоновый бар (пусто)
    ctx.fillStyle = "white";
    roundRect(
        leftBarX,
        topOffset,
        barWidth,
        barHeight,
        radius
    );
    
    // Заполненная часть HP бара для player1
    ctx.fillStyle = "red";
    if (displayedHp1 > 0) {
        roundRect(
            leftBarX + 2,
            topOffset + 2,
            (barWidth - 4) * (displayedHp1 / player1.maxHp),
            barHeight - 4,
            radius - 2
        );
    }
    
    // Отрисовка никнейма для player2
    ctx.fillStyle = "white";
    ctx.font = "28px Fortnite";
    ctx.textAlign = "left";
    ctx.shadowColor = "rgba(100, 13, 13, 1)";
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    ctx.fillText(player2Name, canvas.width - 460, topOffset - 25);
    ctx.shadowOffsetX = 0; // Сброс тени
    ctx.shadowOffsetY = 0; // Сброс тени

    // Отрисовка плашк для player2
    ctx.fillStyle = "rgba(137, 223, 111, 1)";
    const player2NameWidth = ctx.measureText(player2Name).width;
    const player2BoxX = canvas.width / 2 + player2NameWidth + 190;
    const player2BoxWidth = 70;
    roundRect(player2BoxX, topOffset - 41, player2BoxWidth, 30, 5); // Позиция и размер плашки с закруглением 5 пикселей
    ctx.fillStyle = "white";
    ctx.font = "18px Fortnite";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0, 0, 0, 0.1)";
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 3;
    ctx.fillText("GIZMO", player2BoxX + player2BoxWidth / 2, topOffset - 24); // Текст в плашке
    ctx.shadowOffsetX = 0; // Сброс тени
    ctx.shadowOffsetY = 0; // Сброс тени

    // Анимируем HP для player2
    if (displayedHp2 > player2.hp) {
        displayedHp2 -= 0.5; // Скорость уменьшения HP
        if (displayedHp2 < player2.hp) displayedHp2 = player2.hp;
    }

    // HP бар для player2 (справа)
    // Рисуем фоновый бар (пустой)
    ctx.fillStyle = "white";
    roundRect(
        rightBarX,
        topOffset,
        barWidth,
        barHeight,
        radius
    );
    
    // Заполненная часть HP баа для player2
    ctx.fillStyle = "red";
    if (displayedHp2 > 0) {
        roundRect(
            rightBarX + 2 + (barWidth - 4) * (1 - displayedHp2 / player2.maxHp),
            topOffset + 2,
            (barWidth - 4) * (displayedHp2 / player2.maxHp),
            barHeight - 4,
            radius - 2
        );
    }
}

// Добавляем вспомогательную функцию для рисования прямоугольника с акругленными краями
function roundRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
}

// Функция для рисования камня
function drawStone() {
    if (stone) {
        ctx.fillStyle = "gray";
        ctx.beginPath();
        ctx.arc(stone.x, stone.y, 10, 0, Math.PI * 2);
        ctx.fill();
    }
}

// бновляем функцию рисования индикатора силы броска
function drawPowerMeter() {
    const outerRadius = 140; // Увеличенный внешний радиус дуги на 5%
    const innerRadius = 110; // Увеличнй внутренний радиус дуги на 5%

    // Определяем параметры для текущего игрока
    let centerX, centerY, startAngle, endAngle, arcLength;

    if (currentPlayer === 1) {
        centerX = player1.x + player1.width / 1.55;
        centerY = player1.y + 150;
        startAngle = 5 * Math.PI / 4 + Math.PI - Math.PI / 6; // Повернули на 180 градусов
        arcLength = Math.PI * 0.85; // Уменьшили длину дуги
        endAngle = startAngle - (arcLength * (throwPower / maxPower)); // Заполнение против часовой трелки
    } else {
        centerX = player2.x + player2.width / 2.5;
        centerY = player2.y + 150;
        startAngle = (3 * Math.PI / 4) + (Math.PI / 6); // 135 + 30 градусов для правого игрока
        arcLength = Math.PI * 0.85; // Длина дуги для правого игрока
        endAngle = startAngle + (arcLength * (throwPower / maxPower)); // Заполнение по часовой стрелке
    }

    // Фоновая дуга (всегда видна для текущего игрока)
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"; // Прорачно-белый цвет
    ctx.lineWidth = outerRadius - innerRadius;
    ctx.arc(centerX, centerY, (outerRadius + innerRadius) / 2, startAngle, startAngle + (currentPlayer === 1 ? -arcLength : arcLength), currentPlayer === 1);
    ctx.stroke();

    // Белая полоска заполнения (видна только при зарядке)
    if (isCharging) {
        ctx.beginPath();
        ctx.strokeStyle = "white";
        ctx.lineWidth = outerRadius - innerRadius;
        ctx.arc(centerX, centerY, (outerRadius + innerRadius) / 2, startAngle, endAngle, currentPlayer === 1);
        ctx.stroke();
    }
}

// Функция рисования препятствия


// Функция смены игрока
function switchPlayer() {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    canThrow = true;
    updateWind(); // Обновляем силу ветра в начале каждого хода
    if (currentPlayer === 2) {
        autoThrowForPlayer2();
    }
}

// Обновляем обработчик нажатия мыши дл первого игрока
canvas.addEventListener('mousedown', (e) => {
    if (!canThrow || stone || currentPlayer !== 1) return; // Добавляем проверку на текущего игрока
    isMousePressed = true;
    isCharging = true;
});

// Обновляем обработчик броска для первого игрока
canvas.addEventListener('mouseup', (e) => {
    if (!isMousePressed || !canThrow || currentPlayer !== 1) return; // Добавляем проверку на текущего игрока
    isMousePressed = false;
    isCharging = false;
    performThrow();
});

// Массивы для хранения кадров анимации
const player1Frames = ['/assets/puppet_frames/frame_00.png', '/assets/puppet_frames/frame_01.png', '/assets/puppet_frames/frame_02.png', '/assets/puppet_frames/frame_03.png', '/assets/puppet_frames/frame_04.png', '/assets/puppet_frames/frame_05.png', '/assets/puppet_frames/frame_06.png', '/assets/puppet_frames/frame_07.png', '/assets/puppet_frames/frame_08.png', '/assets/puppet_frames/frame_09.png', '/assets/puppet_frames/frame_10.png', '/assets/puppet_frames/frame_11.png']; // Добавьте все кадры
const player2Frames = ['/assets/gizmo_frames/frame_00.png', '/assets/gizmo_frames/frame_01.png', '/assets/gizmo_frames/frame_02.png', '/assets/gizmo_frames/frame_03.png', '/assets/gizmo_frames/frame_04.png', '/assets/gizmo_frames/frame_05.png', '/assets/gizmo_frames/frame_06.png', '/assets/gizmo_frames/frame_07.png', '/assets/gizmo_frames/frame_08.png', '/assets/gizmo_frames/frame_09.png', '/assets/gizmo_frames/frame_10.png', '/assets/gizmo_frames/frame_11.png']; // Добавьте все кадры

let currentFrame = 0;
let animationInterval;

// Функция для загрузки всех кадров
function preloadFrames(frames) {
    return Promise.all(frames.map(src => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = resolve;
            img.onerror = reject;
        });
    }));
}

// Функция для выполнения броска
function performThrow() {
    const windEffect = windStrength * 0.5; // Влияние ветра на скорость
    let stopAnimation;

    // Нормализуем силу броска для обоих игроков
    const normalizedPower = stoneSpeed + throwPower;
    
    if (currentPlayer === 1) {
        stopAnimation = animatePlayer(player1Frames, player1Image, '/assets/puppet_frames/frame_00.png');
        stone = {
            x: player1.x + player1.width - 210,
            y: player1.y + player1.height / 2 + 20,
            speedX: normalizedPower + windEffect,
            speedY: -normalizedPower * 1.5,
        };
    } else {
        stopAnimation = animatePlayer(player2Frames, player2Image, '/assets/gizmo_frames/frame_00.png');
        stone = {
            x: player2.x + 210,
            y: player2.y + player2.height / 2 + 20,
            speedX: -(normalizedPower) + windEffect, // Убрал множитель 0.8, который ослаблял бросок
            speedY: -normalizedPower * 1.5,
        };
    }
    
    throwPower = 0;
    canThrow = false;

    setTimeout(() => {
        stopAnimation();
    }, 350);
}

// Функция для анимации игрока
function animatePlayer(frames, playerImage, staticImage) {
    currentFrame = 0;
    let lastFrameTime = performance.now();
    let animationActive = true; // Флаг для отслеживания состояния анимации

    function step(currentTime) {
        if (!animationActive) return; // Прекращаем анимацию, если она не активн

        const deltaTime = currentTime - lastFrameTime;

        if (deltaTime >= 25) { // Уменьшенный интервал до 30 мс для еще большего ускорения анимации
            playerImage.src = frames[currentFrame];
            currentFrame = (currentFrame + 1) % frames.length;
            lastFrameTime = currentTime;
        }

        requestAnimationFrame(step);
    }

    requestAnimationFrame(step);

    // Функция для остановки анимации и возврата к статическому изображению
    function stopAnimation() {
        animationActive = false;
        playerImage.src = staticImage;
    }

    return stopAnimation;
}
// Предзагрузка кадров перед началом игры
Promise.all([
    preloadFrames(player1Frames),
    preloadFrames(player2Frames)
]).then(() => {
    // Все кадры загружены, можно начинать игру
    updateGame();
}).catch(error => {
    console.error('Ошибка загрузки кадров:', error);
});

// Функция для автоматического броска второго игрока
function autoThrowForPlayer2() {
    if (currentPlayer === 2 && canThrow) {
        if (player2.hp < player2.maxHp / 2 && !potions[1].used) {
            setTimeout(() => {
                usePotion(1);
                setTimeout(() => {
                    isCharging = false;
                    performThrow();
                }, 500);
            }, 500);
        } else {
            isCharging = true;
            const randomTime = Math.random() * 800 + 400;
            setTimeout(() => {
                isCharging = false;
                performThrow();
            }, randomTime);
        }
    }
}

// Функция обновления камня
function updateStone(deltaTime) {
    if (stone) {
        stone.x += stone.speedX * deltaTime * 100; // Увеличиваем скорость движения
        stone.y += stone.speedY * deltaTime * 100;
        stone.speedY += gravity * deltaTime * 100;

        if (stone.x > canvas.width || stone.x < 0 || stone.y > canvas.height) {
            stone = null;
            switchPlayer();
        }
    }
}

let gameOver = false; // Флаг для проверки авершения игры

let potionUseTimeout = null; // Переменная для хранения таймера

let countdownActive = true; // Флаг для отслеживания активности отсчета

function showCountdown() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Очищаем холст перед отрисовкой
    ctx.fillStyle = "rgba(232, 44, 64, 1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Заливаем фон красным

    ctx.fillStyle = "white";
    ctx.font = "100px Fortnite"; // Устанавливаем шрифт и размер
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(countdown, canvas.width / 2, canvas.height / 2); // Рисуем цифру

    if (countdown > 1) {
        countdown--;
        setTimeout(showCountdown, 1000); // Уменьшаем отсчет каждую секунду
    } else {
        setTimeout(() => {
            countdown = 3; // Сбрасываем отсчет для следующей игры
            countdownActive = false; // Отсче завершен
            updateGame(); // Начинаем игру через секунду после "1"
        }, 1000);
    }
}

// Функция обновления игры
function updateGame() {
    if (countdownActive) return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - lastUpdateTime) / 1000;
    lastUpdateTime = currentTime;

    // Очищаем холст и рисуем фон
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();

    // Обновляем игровую логику
    if (isCharging && throwPower < maxPower && canThrow) {
        throwPower += 6 * deltaTime;
    }

    updateStone(deltaTime);
    checkCollision();

    // Отрисовываем игроков всегда с полной прозрачностью
    ctx.globalAlpha = 1.0;
    drawPlayer(player1);
    drawPlayer(player2);

    // Рисуем камень, если он есть
    if (stone) {
        drawStone();
    }

    // Если игра окончена, уменьшаем прозрачность интерфейса
    if (gameOver || winnerDetermined) {
        interfaceAlpha = Math.max(0, interfaceAlpha - 0.05);
    }

    // Отрисовываем интерфейс с текущей прозрачностью
    ctx.globalAlpha = interfaceAlpha;
    drawHealthBars();
    drawPotions();
    drawWindBar();
    drawAvatars(ctx);
    if (!gameOver) drawVersus(ctx);
    if (canThrow) drawPowerMeter();

    // Восстанавливаем прозрачность
    ctx.globalAlpha = 1.0;

    // Продолжаем анимацию, если игра не окончена или камень все еще летит
    if (!gameOver || stone !== null) {
        requestAnimationFrame(updateGame);
    }
}

// Функция для анимации смерти игрока
function playDeathAnimation(playerNumber, callback) {
    console.log('Starting death animation for player', playerNumber);
    let currentFrame = 0;
    let animationCount = 0; // Счетчик проигрываний анимации
    const maxAnimations = 6; // Количество повторений анимации
    const frames = playerNumber === 1 ? loadedPlayer1DeathFrames : loadedPlayer2DeathFrames;
    const frameInterval = 25;
    
    function animate() {
        if (currentFrame >= frames.length) {
            animationCount++; // Увеличиваем счетчик после завершения одного цикла
            
            if (animationCount < maxAnimations) {
                // Если проиграли меньше 3 раз, начинаем сначала
                currentFrame = 0;
                requestAnimationFrame(() => setTimeout(animate, frameInterval));
                return;
            } else {
                // После 3 проигрываний вызываем callback
                console.log('Animation complete after', maxAnimations, 'plays');
                if (callback) callback();
                return;
            }
        }

        const targetPlayer = playerNumber === 1 ? player1Image : player2Image;
        targetPlayer.src = frames[currentFrame].src;
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawBackground();
        drawPlayer(player1);
        drawPlayer(player2);
        drawHealthBars();
        
        currentFrame++;
        requestAnimationFrame(() => setTimeout(animate, frameInterval));
    }

    // Проверяем, загружены ли кадры
    if (frames.length === 0) {
        console.error('No death animation frames loaded!');
        if (callback) callback();
        return;
    }

    animate();
}

// Обновляем функцию проверки столкновений
function checkCollision() {
    if (stone) {
        // Проверяем, находится ли камень внутри общей области арикады
        if ((stone.x >= obstacle.x && 
             stone.x <= obstacle.x + obstacle.width &&
             stone.y >= obstacle.y && 
             stone.y <= obstacle.y + obstacle.height) || 
            isPointInTriangle(
                stone.x, stone.y,
                obstacle.x, obstacle.y,
                obstacle.x + obstacle.width / 2, obstacle.y - 80,
                obstacle.x + obstacle.width, obstacle.y
            )) {
            stone = null;
            switchPlayer();
            return;
        }
        
        // Проверка столкновения с игроками
        let targetPlayer = currentPlayer === 1 ? player2 : player1;
        
        let stoneRadius = 10;
        
        // Используем hitboxHeight вместо height для проверки столкновений
        let hitboxY = targetPlayer.y + (targetPlayer.height - targetPlayer.hitboxHeight) / 2; // Центрируем хитбокс по вертикали
        
        // Находим ближайшую точку прямоугольника хитбокса к центру камня
        let closestX = Math.max(targetPlayer.x, Math.min(stone.x, targetPlayer.x + targetPlayer.width));
        let closestY = Math.max(hitboxY, Math.min(stone.y, hitboxY + targetPlayer.hitboxHeight));
        
        let distance = Math.sqrt((stone.x - closestX) ** 2 + (stone.y - closestY) ** 2);
        
        if (distance <= stoneRadius) {
            targetPlayer.hp -= 15;
            if (targetPlayer.hp <= 0) {
                targetPlayer.hp = 0;
                targetPlayer.height = targetPlayer.height / 1.5;
                targetPlayer.y = canvas.height - targetPlayer.height - 34;
            }
            stone = null;

            // Активируем анимацию звёзд при попадании
            if (targetPlayer === player2) {
                player2Hit = true;
                player2StarsAnimationStart = performance.now();
            } else {
                player1Hit = true;
                player1StarsAnimationStart = performance.now();
            }
            hitAnimationStartTime = Date.now();

            if (targetPlayer.hp === 0 && !winnerDetermined) {
                gameOver = true;
                winnerDetermined = true; // Устанавливаем флаг
                const winner = currentPlayer === 1 ? 'Puppet' : 'Gizmo';
                const dyingPlayerNumber = currentPlayer === 1 ? 2 : 1;
                
                player1Hit = false;
                player2Hit = false;
                ctx.globalAlpha = 1.0;
                
                // Останавливаем обовление игры
                cancelAnimationFrame(updateGame);
                
                // Сначала проигрываем анимацию смерти
                playDeathAnimation(dyingPlayerNumber, () => {
                    // После завершения анимации смерти ждем 2 секунды
                    setTimeout(() => {
                        displayWinner(winner);
                    }, 0);
                });
            } else {
                switchPlayer();
            }
        }
    }
}

let isBackButtonVisible = false; // Флаг видимости кнопки "Назад"

function displayWinner(winner) {
    // Останавливаем обновление игры
    gameOver = true;
    
    const backgroundColor = winner === 'Puppet' ? "#E82C40" : "#89DF6F";
    let alpha = 0;
    let fontSize = 10;
    const duration = 2000;
    const startTime = Date.now();

    function animateWinScreen() {
        const currentTime = Date.now();
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        const easedProgress = easeInOutQuad(progress);

        alpha = easedProgress;
        fontSize = 10 + (38 * easedProgress);

        // Очищаем холст и рисуем фон с текущей прозрачностью
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Рисуем цветной фон победителя
        ctx.fillStyle = `rgba(${parseInt(backgroundColor.slice(1, 3), 16)}, ${parseInt(backgroundColor.slice(3, 5), 16)}, ${parseInt(backgroundColor.slice(5, 7), 16)}, ${alpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Рисуем текст победителя
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.font = `${fontSize}px Fortnite`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`Game Over! ${winner} wins!`, canvas.width / 2, canvas.height / 2);

        // Рисуем кнопку "Назад" если нужно
        if (isBackButtonVisible) {
            ctx.globalAlpha = alpha;
            ctx.drawImage(backButtonImage, backButton.x, backButton.y, backButton.width, backButton.height);
            ctx.globalAlpha = 1.0;
        }

        // Продолжаем анимацию, пока она не завершится
        if (progress < 1) {
            requestAnimationFrame(animateWinScreen);
        }
    }

    // Запускаем анимацию экрана победителя
    isBackButtonVisible = true;
    animateWinScreen();
}

// Вспомогательная функция для роверки попадания точки в треугольник
function isPointInTriangle(px, py, x1, y1, x2, y2, x3, y3) {
    let area = Math.abs((x2-x1)*(y3-y1) - (x3-x1)*(y2-y1))/2;
    let a = Math.abs((x1-px)*(y2-py) - (x2-px)*(y1-py))/2;
    let b = Math.abs((x2-px)*(y3-py) - (x3-px)*(y2-py))/2;
    let c = Math.abs((x3-px)*(y1-py) - (x1-px)*(y3-py))/2;
    return Math.abs(area - (a + b + c)) < 0.1;
}

// Функция для сброса игры
function resetGame() {
    player1.hp = player1.maxHp;
    player2.hp = player2.maxHp;
    currentPlayer = 1;
    canThrow = true;
    stone = null;
    throwPower = 0;
    gameOver = false; // Сбрасываем флаг завершения игры
    winnerDetermined = false; // Сбрасываем флаг
    updateGame(); // Немедленно перезапускаем игру
}

let countdown = 3; // Начальное значение отсчета

// Добавляем массивы для кадров анимации звёзд
const gizmoStarsFrames = [
    '/assets/gizmo_stars/frame_00.png',
    '/assets/gizmo_stars/frame_01.png',
    '/assets/gizmo_stars/frame_02.png',
    '/assets/gizmo_stars/frame_03.png',
    '/assets/gizmo_stars/frame_04.png',
    '/assets/gizmo_stars/frame_05.png',
    '/assets/gizmo_stars/frame_06.png',
    '/assets/gizmo_stars/frame_07.png',
    '/assets/gizmo_stars/frame_08.png',
    '/assets/gizmo_stars/frame_09.png',
    '/assets/gizmo_stars/frame_10.png'
];

// Массив для хранения загруженных изображений
const loadedStarsFrames = [];
let currentStarsFrame = 0;
let lastStarsFrameTime = 0;

// Добавляем функцию предзагрузки кадров звёзд
function preloadStarsFrames() {
    gizmoStarsFrames.forEach(src => {
        const img = new Image();
        img.src = src;
        loadedStarsFrames.push(img);
    });
}

// Обновляем Promise.all при загрузке игры
Promise.all([
    new Promise(resolve => backgroundImage.onload = resolve),
    new Promise(resolve => emptyHpBarImage.onload = resolve),
    new Promise(resolve => player1Image.onload = resolve),
    new Promise(resolve => player2Image.onload = resolve)
]).then(() => {
    preloadDeathFrames();
    preloadStarsFrames(); // Добавляем предзагрузку кадров звёзд
    cacheStaticElements(backgroundCtx);
    updateWind();
    showCountdown();
});

// Обработчик нажатия на кнопку
canvas.addEventListener('click', (e) => {
    if (isBackButtonVisible) { // Проверяем видимость кнопки
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (mouseX >= backButton.x && mouseX <= backButton.x + backButton.width &&
            mouseY >= backButton.y && mouseY <= backButton.y + backButton.height) {
            // Действие при нажатии на кнопку
            resetGame();
            isBackButtonVisible = false; // Сбрасываем флаг видимости псле нажатия
        }
    }
});

let chargeLevel = 0; // Уровень зарядки броска
const maxCharge = 100; // Максимальный уровень зарядки
let isCharging = false; // Флаг зарядки

// Функция для начала зарядки
function startCharging() {
    if (!canThrow || stone || currentPlayer !== 1) return;
    isCharging = true;
    chargeLevel = 0; // Сбрасываем уровень зарядки
}

// Функция для завершения зарядки и выполнения броска
function endCharging() {
    if (isCharging) {
        isCharging = false;
        performThrow(); // Выполняем бросок
        chargeLevel = 0; // Сбрасываем уровень зарядки после броска
    }
}

// Обработчики для сенсорных устройств
canvas.addEventListener('touchstart', (e) => {
    const touch = e.changedTouches[0];
    const touchX = touch.clientX;
    const touchY = touch.clientY;

    // Проверяем, что касание происходит в пределах кнопки "Назад" и кнопка видна
    if (isBackButtonVisible && isTouchWithinBackButton(touchX, touchY)) {
        window.location.href = '../../../index.html';
        return;
    }

    // Проверяем, что касание происходит в пределах зелий
    let potionTouched = false;
    potions.forEach((potion, index) => {
        if (!potion.used && touchX >= potion.x && touchX <= potion.x + potion.width &&
            touchY >= potion.y && touchY <= potion.y + potion.height) {
            usePotion(index);
            potionTouched = true;
            return;
        }
    });

    // Если касание произошло в пределах зелья, не начинаем зарядк
    if (potionTouched) return;

    // Проверяем, что касание проиходит в пределах игрового поля
    if (isTouchWithinGameArea(touchX, touchY)) {
        e.preventDefault();
        if (currentPlayer !== 1) return;
        startCharging();
    }
});

canvas.addEventListener('touchend', (e) => {
    const touch = e.changedTouches[0];
    const touchX = touch.clientX;
    const touchY = touch.clientY;

    // Проверяем, что касание происходит в пределах игрового поля
    if (isTouchWithinGameArea(touchX, touchY)) {
        e.preventDefault();
        if (currentPlayer !== 1) return;
        endCharging();
    }
});

function isTouchWithinBackButton(x, y) {
    const rect = canvas.getBoundingClientRect();
    return x >= backButton.x && x <= backButton.x + backButton.width &&
           y >= backButton.y && y <= backButton.y + backButton.height;
}

function isTouchWithinGameArea(x, y) {
    const rect = canvas.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

canvas.addEventListener('touchmove', (e) => {
    e.preventDefault(); // Предотвращаем дейтвия по умолчнию
});

// Загружаем шрит с помощью FontFace API
const fortniteFont = new FontFace('Fortnite', 'url(frt.otf)');

fortniteFont.load().then(function(loadedFont) {
    // Добавляем шрифт в документ
    document.fonts.add(loadedFont);

    // Теперь шрифт загружен, можно использовать ео в канвасе
    ctx.font = "48px Fortnite";
}).catch(function(error) {
    console.error('Ошибка загрузки шрифта:', error);
});

// Функция для отрисовки изображения "versus" без анимации
function drawVersus(ctx) {
    const versusWidth = 75; // Фиксированная ширина
    const versusHeight = 63; // Фиксированная высота
    const centerX = canvas.width / 2;
    const centerY = versusHeight / 2 - 35;
    
    ctx.drawImage(versusImage, centerX - versusWidth / 2, centerY - versusHeight / 2 + 65, versusWidth, versusHeight);
}

// Функция для отрисовки аватаров
function drawAvatars(ctx) { // Принимаем контекст в качестве параметра
    const avatarSize = 100; // Размер аватара
    const gizmoX = canvas.width / 2 + avatarSize - 30; // Позиция для Gizmo
    const puppetX = canvas.width / 2 - avatarSize - 65; // Позиция для Puppet
    const avatarY = 10; // Общая позиция по Y

    ctx.drawImage(gizmoAvatarImage, gizmoX, avatarY, avatarSize, avatarSize);
    ctx.drawImage(puppetAvatarImage, puppetX, avatarY, avatarSize, avatarSize);
}

// Добавляем изображение зелья
const potionImage = new Image();
potionImage.src = 'potion.png';

// Позиции и размеры зелья для обоих игроков
const potions = [
    {
        x: 65, // Позиция по X для первого игрока
        y: 35, // Позиция по Y
        width: 50, // Ширина зелья
        height: 70, // Высота зелья
        used: false // Флаг использования
    },
    {
        x: canvas.width - 115, // Позиция по X для второго игрока
        y: 35, // Позиция по Y
        width: 50, // Ширина зелья
        height: 70, // Флаг использования
        used: false // Флаг использования
    }
];

// Функция для отрисовки зелий
function drawPotions() {
    potions.forEach((potion, index) => {
        if (!potion.used) {
            if (index === 1) {
                // Сохраняем текущее состояние контекста
                ctx.save();
                // Перемещаем контекст к позиции зелья
                ctx.translate(potion.x + potion.width / 2, potion.y + potion.height / 2);
                // Оражаем по горизонтали
                ctx.scale(-1, 1);
                // Отрисовываем изображение, смещая его обратно
                ctx.drawImage(potionImage, -potion.width / 2, -potion.height / 2, potion.width, potion.height);
                // Восстанавливаем состояние контекста
                ctx.restore();
            } else {
                ctx.drawImage(potionImage, potion.x, potion.y, potion.width, potion.height);
            }
        }
    });
}

// Обработчик нажатия на зелье
canvas.addEventListener('click', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    potions.forEach((potion, index) => {
        if (!potion.used && mouseX >= potion.x && mouseX <= potion.x + potion.width &&
            mouseY >= potion.y && mouseY <= potion.y + potion.height) {
            usePotion(index);
        }
    });
});

// Функция использования зелья
function usePotion(index) {
    const player = index === 0 ? player1 : player2;
    let displayedHp = index === 0 ? displayedHp1 : displayedHp2;

    if (player.hp < player.maxHp) {
        player.hp = Math.min(player.hp + 20, player.maxHp); // Восстанавливаем 20 HP
        displayedHp = player.hp; // Обновляем отображаемое здоровье
        potions[index].used = true; // Зелье использовано

        // Обновляем переменные для анимации HP
        if (index === 0) {
            displayedHp1 = displayedHp;
        } else {
            displayedHp2 = displayedHp;
        }
    }
}

// Функция для плавной анимации
function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

let interfaceAlpha = 1.0; // Добавляем переменную для прозрачности интерфейса

