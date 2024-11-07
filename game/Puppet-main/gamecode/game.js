// game.js

let tele = window.Telegram.WebApp;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false }); // Отключаем прозрачность

tele.ready();

tele.expand();
tele.setHeaderColor("#000000");
tele.setBackgroundColor("#000000");

// Размеры холста
canvas.width = 850*1.5;
canvas.height = 300*1.5;

// Персонажи
const player1 = { 
    x: 85,
    y: canvas.height - 250,
    width: 156,
    height: 216,
    hp: 100,
    maxHp: 100 
};

const player2 = { 
    x: canvas.width - 250,
    y: canvas.height - 250,
    width: 156,
    height: 216,
    hp: 100,
    maxHp: 100 
};

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

// Создаем и загружаем изображение фона
const backgroundImage = new Image();
backgroundImage.src = 'background.png';

// Добавляем загрузку изображения для HP бара
const emptyHpBarImage = new Image();
emptyHpBarImage.src = 'emptyHpBar.png';

// Добавляем згрузку изображений персонажей
const player1Image = new Image();
player1Image.src = 'puppet.png';

const player2Image = new Image();
player2Image.src = 'gizmo.png';

// Добавляем изображение кнопки
const backButtonImage = new Image();
backButtonImage.src = 'backButton.png';

// Координаты и размеры кнопки
const backButton = {
    x: 50,
    y: 55, // Подняли кнопку выше, чтобы она не  с моделькой игрока
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
    if (userData) {
        const userObj = JSON.parse(userData);
        if (userObj.first_name) {
           var player1Name = userObj.first_name;
        }
    }
    console.warn("First name is unavailable in initData.");
    var player1Name = "Puppet";
} else {
    console.warn("User information is incomplete or unavailable.");
    var player1Name = "Puppet";
}

const player2Name = "Gizmo";

// Добавляем функцию отрисовки фона
function drawBackground() {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
}

// Функция рисования игрока
function drawPlayer(player) {
    ctx.imageSmoothingEnabled = false; // Отключаем сглаживание для четкости
    if (player === player1) {
        ctx.drawImage(player1Image, 
            player.x, 
            player.y, 
            player.width, 
            player.height
        );
    } else {
        ctx.drawImage(player2Image, 
            player.x, 
            player.y, 
            player.width, 
            player.height
        );
    }
}

// Функция отрисовки HP баров и никнеймов
function drawHealthBars() {
    // Размеры HP бара
    const barWidth = 450;  // Оставляем прежнюю длину
    const barHeight = 12;  // Уменьшаем высоту с 15 до 7.5
    const topOffset = 70;
    const radius = 6;      // Уменьшаем радиус закругления с 7 до 3.5
    
    // Отрисовка никнейма для player1
    ctx.fillStyle = "white";
    ctx.font = "28px Fortnite";
    ctx.textAlign = "right";
    ctx.shadowColor = "rgba(100, 13, 13, 1)";
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    ctx.fillText(player1Name, 460, topOffset - 25);
    ctx.shadowOffsetX = 0; // Сброс тени
    ctx.shadowOffsetY = 0; // Сброс тени

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

    // HP бар для player1 (слева)
    // Рисуем фоновый бар (пусто)
    ctx.fillStyle = "white";
    roundRect(
        50,
        topOffset,
        barWidth,
        barHeight,
        radius
    );
    
    // Заполненная часть HP бара для player1
    ctx.fillStyle = "red";
    if (player1.hp > 0) {
        roundRect(
            50 + 2,           // Уменьшает ступ с 3 до 2
            topOffset + 2,    // Уменьшаем отступ с 3 до 2
            (barWidth - 4) * (player1.hp / player1.maxHp), // Уменьшаем отступы с 6 до 4
            barHeight - 4,    // Уменьшаем отступ с 6 до 4
            radius - 2        // Уменьшаем радиус внутренней части
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

    // Отрисовка плашки для player2
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

    // HP бар для player2 (справа)
    // Рисуем фоновый бар (пустой)
    ctx.fillStyle = "white";
    roundRect(
        canvas.width - barWidth - 50,
        topOffset,
        barWidth,
        barHeight,
        radius
    );
    
    // Заполненная часть HP бара для player2
    ctx.fillStyle = "red";
    if (player2.hp > 0) {
        roundRect(
            canvas.width - barWidth - 50 + 2 + (barWidth - 4) * (1 - player2.hp / player2.maxHp),
            topOffset + 2,
            (barWidth - 4) * (player2.hp / player2.maxHp),
            barHeight - 4,
            radius - 2
        );
    }
}

// Добавляем вспомогательную функцию для рисования прямоугольника с закругленными краями
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

// Обновляем функцию рисования индикатора силы броска
function drawPowerMeter() {
    const outerRadius = 140; // Увеличенный внешний радиус дуги на 5%
    const innerRadius = 110; // Увеличнй внутренний радиус дуги на 5%

    // Определяем параметры для текущего игрока
    let centerX, centerY, startAngle, endAngle;

    if (currentPlayer === 1) {
        centerX = player1.x + player1.width / 1.55;
        centerY = player1.y + 30;
        startAngle = 5 * Math.PI / 4; // 225 градусов для левого игрока
    } else {
        centerX = player2.x + player2.width / 2.5;
        centerY = player2.y + 40;
        startAngle = (3 * Math.PI / 4) + (Math.PI / 6); // 135 + 30 градусов для правого игрока
    }

    // Фоновая дуга (всегда видна для текущего игрока)
    endAngle = startAngle + (Math.PI * 0.85); // Полная дуга
    ctx.beginPath();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)"; // Прозрачно-белый цвет
    ctx.lineWidth = outerRadius - innerRadius;
    ctx.arc(centerX, centerY, (outerRadius + innerRadius) / 2, startAngle, endAngle);
    ctx.stroke();

    // Белая полоска заполнения (видна только при зарядке)
    if (isCharging) {
        endAngle = startAngle + (Math.PI * 0.85 * (throwPower / maxPower)); // Конец дуги
        ctx.beginPath();
        ctx.strokeStyle = "white";
        ctx.lineWidth = outerRadius - innerRadius;
        ctx.arc(centerX, centerY, (outerRadius + innerRadius) / 2, startAngle, endAngle);
        ctx.stroke();
    }
}
// Функция рисования препятствия


// Функция смены игрока
function switchPlayer() {
    currentPlayer = currentPlayer === 1 ? 2 : 1;
    canThrow = true;
    if (currentPlayer === 2) {
        autoThrowForPlayer2();
    }
}

// Обновляем обработчик нажатия мыши для первого игрока
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

// Функция ля выполнения броска
function performThrow() {
    if (currentPlayer === 1) {
        stone = {
            x: player1.x, // Левая сторона игока
            y: player1.y + player1.height / 2, // Примерная высота руки
            speedX: (stoneSpeed + throwPower) * 0.8,
            speedY: -(stoneSpeed + throwPower) * 1.2,
        };
    } else {
        stone = {
            x: player2.x + player2.width, // Правая сторона игрока
            y: player2.y + player2.height / 2, // Примерная высота руки
            speedX: -(stoneSpeed + throwPower) * 0.8,
            speedY: -(stoneSpeed + throwPower) * 1.2,
        };
    }
    
    throwPower = 0;
    canThrow = false;
}

// Функция для автоматического броска второго игрока
function autoThrowForPlayer2() {
    if (currentPlayer === 2 && canThrow) {
        isCharging = true;
        const randomTime = Math.random() * 800 + 400; // Случайное время от 500 до 2500 мс
        setTimeout(() => {
            isCharging = false;
            performThrow();
        }, randomTime);
    }
}

// Функция обновления камня
function updateStone() {
    if (stone) {
        stone.x += stone.speedX;
        stone.y += stone.speedY;
        stone.speedY += gravity;

        // Проверяем выход за пределы экрана
        if (stone.x > canvas.width || stone.x < 0 || stone.y > canvas.height) {
            stone = null;
            switchPlayer(); // Меняем игрока после окончания броска
        }
    }
}

let gameOver = false; // Флаг для проверки авершения игры

// Функция обновления игры
function updateGame() {
    if (gameOver) {
        displayWinner(currentPlayer === 1 ? 'Gizmo' : 'Puppet');
        return; // Прекращаем обновление игры, если она завершена
    }

    if (!emptyHpBarImage.complete) {
        requestAnimationFrame(updateGame);
        return;
    }
    if (player1.hp > player1.maxHp) player1.hp = player1.maxHp;
    if (player2.hp > player2.maxHp) player2.hp = player2.maxHp;
    if (player1.maxHp > 100) player1.maxHp = 100;
    if (player2.maxHp > 100) player2.maxHp = 100;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    
    if (isCharging && throwPower < maxPower && canThrow) {
        throwPower += 0.08;
    }
    
    updateStone();
    checkCollision();

    drawPlayer(player1);
    drawPlayer(player2);
    drawHealthBars();
    drawStone();
    if (canThrow) drawPowerMeter();
    
    // Добавляем отрисовку изображения "versus"
    drawVersus();
    
    // Добавляем отрисовку аватаров
    drawAvatars();
    
    requestAnimationFrame(updateGame);
}
// Обновляем функцию повер столкновений
function checkCollision() {
    if (stone) {
        // Проверяем, находится ли камень внутри общей области баррикады
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
        
        // Проверяем расстояние от центра камня до игрока
        let stoneRadius = 10; // Радиус камня
        
        // Находим ближайшую точку прямоугольника игрока к центру камня
        let closestX = Math.max(targetPlayer.x, Math.min(stone.x, targetPlayer.x + targetPlayer.width));
        let closestY = Math.max(targetPlayer.y, Math.min(stone.y, targetPlayer.y + targetPlayer.height));
        
        // Вычисляем расстояние между центром камня и ближайшей точкой прямоуголника игрока
        let distance = Math.sqrt((stone.x - closestX) ** 2 + (stone.y - closestY) ** 2);
        
        if (distance <= stoneRadius) {
            targetPlayer.hp -= 15;
            if (targetPlayer.hp < 0) targetPlayer.hp = 0;
            stone = null;
            switchPlayer();

            // Проверка на отсутствие HP
            if (targetPlayer.hp === 0) {
                const winner = currentPlayer === 1 ? 'Gizmo' : 'Puppet';
                gameOver = true; // Устанавливаем флаг завершения игры
            }
        }
    }
}

function displayWinner(winner) {
    const backgroundColor = winner === 'Puppet' ? "#E82C40" : "#89DF6F";
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height); // Заполняем фон

    // Рисуем текст поверх
    ctx.fillStyle = "white"; // Цвет текста
    ctx.font = "48px Fortnite"; // Шрифт и размер текста
    ctx.textAlign = "center"; // Выравнивание текста
    ctx.textBaseline = "middle"; // Базовая линия текста
    ctx.fillText(`Game Over! ${winner} wins!`, canvas.width / 2, canvas.height / 2); // Текст

    // Рисуем кнопку
    ctx.drawImage(backButtonImage, backButton.x, backButton.y, backButton.width, backButton.height);
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
    updateGame(); // Немедленно перезапускаем игру
}

let countdown = 3; // Начальное значение отсчета

function showCountdown() {
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
        setTimeout(updateGame, 1000); // Начинаем игру через секунду после "1"
    }
}

// Ждем загрузки всех изображений перед началом игры
Promise.all([
    new Promise(resolve => backgroundImage.onload = resolve),
    new Promise(resolve => emptyHpBarImage.onload = resolve),
    new Promise(resolve => player1Image.onload = resolve),
    new Promise(resolve => player2Image.onload = resolve)
]).then(() => {
    showCountdown(); // Запускаем отсчет
});

// Обработчик нажатия на кнопку
canvas.addEventListener('click', (e) => {
    if (gameOver) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        if (mouseX >= backButton.x && mouseX <= backButton.x + backButton.width &&
            mouseY >= backButton.y && mouseY <= backButton.y + backButton.height) {
            // Действие при нажатии на кнопку
            resetGame();
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

    // Проверяем, что касание происходит в пределах кнопки "Назад"
    if (isTouchWithinBackButton(touchX, touchY)) {
        // Действие при нажатии на кнопку "Назад"
        window.location.href = '../../../index.html';
        return;
    }

    // Проверяем, что касание происходит в пределах игрового поля
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
    e.preventDefault(); // Предотвращаем действия по умолчанию
});

// Загружаем шрит с помощью FontFace API
const fortniteFont = new FontFace('Fortnite', 'url(frt.otf)');

fortniteFont.load().then(function(loadedFont) {
    // Добавляем шрифт в документ
    document.fonts.add(loadedFont);

    // Теперь шрифт загружен, можно использовать его в канвасе
    ctx.font = "48px Fortnite";
}).catch(function(error) {
    console.error('Ошибка загрузки шрифта:', error);
});

// Пер��менные для анимации пульсации
let versusScale = 1;
let scaleDirection = 1;
const scaleSpeed = 0.0005; // Скорость изменения масштаба
const maxScale = 1.05; // Максимальный масштаб
const minScale = 0.95; // Минимальный масштаб

// Обновляем функцию отрисовки изображения "versus" с анимацией
function drawVersus() {
    const versusWidth = 75 * versusScale; // Ширина изображения с учетом масштаба
    const versusHeight = 63 * versusScale; // Высота изображения с учетом масштаба
    const centerX = canvas.width / 2;
    const centerY = versusHeight / 2 - 35;
    
    // Изменяем координаты отрисовки, чтобы пульсация происходила от центра
    ctx.drawImage(versusImage, centerX - versusWidth / 2, centerY - versusHeight / 2 + 65, versusWidth, versusHeight);

    // Обновляем масштаб для анимации пульсации
    versusScale += scaleSpeed * scaleDirection;
    if (versusScale > maxScale || versusScale < minScale) {
        scaleDirection *= -1; // Меняем направление изменения масштаба
    }
}

// Функция для отрисовки аватаров
function drawAvatars() {
    const avatarSize = 100; // Размер аватара
    const gizmoX = canvas.width / 2 + avatarSize - 30; // Позиция для Gizmo
    const puppetX = canvas.width / 2 - avatarSize - 65; // Позиция для Puppet
    const avatarY = 10; // Общая позиция по Y

    ctx.drawImage(gizmoAvatarImage, gizmoX, avatarY, avatarSize, avatarSize);
    ctx.drawImage(puppetAvatarImage, puppetX, avatarY, avatarSize, avatarSize);
}

