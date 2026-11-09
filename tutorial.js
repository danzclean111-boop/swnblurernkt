
const tutorialPopup = document.getElementById('tutorialPopup');
const tutorialBtn = document.getElementById('tutorialBtn');
const closeTutorialBtn = document.getElementById('closeTutorialBtn');
const tutorialVideo = document.getElementById('tutorialVideo');


tutorialBtn.addEventListener('click', () => {
    tutorialPopup.classList.add('show');

});


closeTutorialBtn.addEventListener('click', () => {
    tutorialPopup.classList.remove('show');
    tutorialVideo.pause();
});


tutorialPopup.addEventListener('click', (e) => {
    if (e.target === tutorialPopup) {
        tutorialPopup.classList.remove('show');
        tutorialVideo.pause();
    }
});
