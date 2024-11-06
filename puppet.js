let tg = window.Telegram.WebApp;

function getTelegramUser() {
    return tg.initDataUnsafe.user.username;
}

document.addEventListener('DOMContentLoaded', function() {
    const playerTextElement = document.getElementById('player-text');
    const telegramUser = getTelegramUser();
    playerTextElement.textContent = telegramUser;
});