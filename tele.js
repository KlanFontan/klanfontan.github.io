let tg = window.Telegram.WebApp;

tg.ready();

tg.expand();
tg.setHeaderColor("#000000");
tg.setBackgroundColor("#000000");

const playButton = document.querySelector('.play-button');
if (playButton) {
    playButton.addEventListener('click', () => {
        tg.HapticFeedback.impactOccurred('medium');
    });
}

window.addEventListener('resize', () => {
    tg.expand();
});

function expandable() {
    if (tg.isExpanded == false) {
        tg.expand();
    }
}

function getTelegramUser() {
    if (tg.initData) {
        const params = new URLSearchParams(tg.initData);
        const userData = params.get('user');
        if (userData) {
            const userObj = JSON.parse(userData);
            if (userObj.first_name) {
                return userObj.first_name;
            }
        }
        console.warn("First name is unavailable in initData.");
        return "Unknown User";
    } else {
        console.warn("User information is incomplete or unavailable.");
        return "Unknown User";
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const playerTextElement = document.getElementById('player-text');
    if (playerTextElement) {
        const telegramUser = getTelegramUser();
        playerTextElement.textContent = telegramUser;
    } else {
        console.warn("Element with ID 'player-text' not found.");
    }
});

