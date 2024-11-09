if (!/Mobi|Android/i.test(navigator.userAgent)) {
    document.body.innerHTML = '<div class="not-supported">OUR GAME IS ONLY AVAILABLE ON MOBILE DEVICES.</div>';
}

document.querySelector('.play-button').addEventListener('click', function() {
    window.location.href = 'selector.html';
});

document.addEventListener('DOMContentLoaded', function() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        setTimeout(() => {
            preloader.style.opacity = '0';
            setTimeout(() => {
                preloader.style.display = 'none';
            }, 1000); // Убедитесь, что это время совпадает с временем перехода в CSS
        }, 2000); // Увеличено с 1000ms до 4000ms
    }
}); 