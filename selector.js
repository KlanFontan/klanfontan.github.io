if (!/Mobi|Android/i.test(navigator.userAgent)) {
    document.body.innerHTML = '<div class="not-supported">OUR GAME IS ONLY AVAILABLE ON MOBILE DEVICES.</div>';
}

document.querySelector('.back-button').addEventListener('click', function() {
    window.location.href = 'index.html';
}); 