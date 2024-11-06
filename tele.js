let tg = window.Telegram.WebApp;

tg.ready();

tg.expand();
tg.setHeaderColor("#000000");
tg.setBackgroundColor("#000000");


document.querySelector('.play-button').addEventListener('click', () => {
    tg.HapticFeedback.impactOccurred('medium'); 
});


window.addEventListener('resize', () => {
    tg.expand();
});

function expandable() {
    if (tg.isExpanded == false) {
        tg.expand();
    }
}

