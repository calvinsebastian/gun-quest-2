window.onload = () => {
  registerEventListeners();
};

function registerEventListeners() {
  const gunQuestButton = document.getElementById("goToGQ");
  const gunQuest2Button = document.getElementById("goToGQ2");

  gunQuestButton.addEventListener("click", function (e) {
    window.location.assign("/gun-quest.html");
  });

  gunQuest2Button.addEventListener("click", function (e) {
    window.location.assign("/gun-quest-2.html");
  });
}
