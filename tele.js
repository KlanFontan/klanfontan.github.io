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
    if (tg.user) {
        return tg.user.first_name;
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

