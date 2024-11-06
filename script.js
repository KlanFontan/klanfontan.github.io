document.querySelector('.start-button').addEventListener('click', function() {
    document.querySelector('.game-intro').style.display = 'none';
    document.querySelector('.game-screen').style.display = 'block';
});

const backButton = document.querySelector('.back-button');
backButton.addEventListener('click', () => {
    document.querySelector('.game-screen').style.display = 'none';
    document.querySelector('.game-intro').style.display = 'block';
});