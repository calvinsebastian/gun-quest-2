import { dead } from "../GunQuest.js";

const highscoreDataUrl = "https://tilequest.ca/highscore.json";
// const highscoreDataUrl = "http://localhost:3000/highscore.json";

export async function loadHighscores() {
  try {
    const response = await fetch(highscoreDataUrl, {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "not-your-corn-bro",
      },
    });
    if (!response.ok) throw new Error("Network response was not ok.");
    const highscores = await response.json();
    return highscores;
  } catch (error) {
    console.error("Failed to load highscores:", error);
    return [];
  }
}

async function saveHighscores(newHighScore) {
  try {
    const response = await fetch(highscoreDataUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": "not-your-corn-bro",
      },
      body: JSON.stringify(newHighScore),
    });
    if (!response.ok) throw new Error("Network response was not ok.");
    const result = await response.json();
    console.log(result);
    if (result.success) {
      const submitButton = document.getElementById("highscore-submit-button");
      submitButton.innerHTML = "Main Menu";
      displayHighscores(result.highscores);
    }
  } catch (error) {
    console.error("Failed to save highscores:", error);
  }
}

function displayHighscores(highscores, newEntry = null) {
  const highscoreList = document.getElementById("highscore-list");
  highscoreList.innerHTML = `
    <div class="highscore-header">
      <div>Position</div>
      <div>Name</div>
      <div>Round</div>
      <div>Kills</div>
      <div>Highscore</div>
    </div>
  `;

  // Add highscores
  highscores.forEach((entry) => {
    if (entry.position === newEntry?.position) {
      highscoreList.innerHTML += `
        <div class="highscore-entry ${
          entry.position === newEntry?.position ? "new-entry" : ""
        }">
          <div>${entry.position}</div>
         <div class="highscore-name-input-container">
          <input
            autofocus
            class="highscore-name-input"
            type="text"
            id="highscore-first-letter-input"
            placeholder="A"
            maxlength="1"
          />
          <input
            class="highscore-name-input"
            type="text"
            id="highscore-second-letter-input"
            placeholder="N"
            maxlength="1"
          />
          <input
            class="highscore-name-input"
            type="text"
            id="highscore-third-letter-input"
            placeholder="O"
            maxlength="1"
          />
          <input
            class="highscore-name-input"
            type="text"
            id="highscore-fourth-letter-input"
            placeholder="N"
            maxlength="1"
          />
        </div>
          <div>${entry.round}</div>
          <div>${entry.kills}</div>
          <div>${entry.score}</div>
        </div>
      `;
    } else {
      highscoreList.innerHTML += `
        <div class="highscore-entry ${
          entry.position === newEntry?.position ? "new-entry" : ""
        }">
            <div>${entry.position}</div>
            <div>${entry.name}</div>
            <div>${entry.round || "???"}</div>
            <div>${entry.kills}</div>
            <div>${entry.score}</div>
            </div>
            `;
    }
  });

  const inputs = document.querySelectorAll(".highscore-name-input");
  const submitButton = document.getElementById("highscore-submit-button");

  inputs.forEach((input, index) => {
    input.addEventListener("focus", () => {
      input.select();
    });
    input.addEventListener("input", () => {
      // Move focus to the next input field
      if (input.value.length >= input.maxLength) {
        const nextInput = inputs[index + 1];
        if (nextInput) {
          nextInput.focus();
        } else {
          // If this is the last input field, focus the submit button
          submitButton.focus();
        }
      }

      // Check if all fields are filled
      //   const allFilled = Array.from(inputs).every(
      //     (input) => input.value.length >= input.maxLength
      //   );
      //   if (allFilled) {
      //     submitButton.focus();
      //   }
    });
  });

  // Fill in the remaining slots if necessary
  if (highscores.length < 10) {
    for (let i = highscores.length; i < 10; i++) {
      highscoreList.innerHTML += `
        <div class="highscore-entry">
          <div>${i + 1}</div>
          <div>----</div>
          <div>----</div>
          <div>----</div>
          <div>----</div>
        </div>
      `;
    }
  }
}

async function updateHighscores(highscores, newEntry, playerName) {
  highscores.find((entry) => entry.position === newEntry.position).name =
    playerName;

  // Helper function to get a unique key based on object properties
  const getUniqueKey = (obj) => `${obj.position}-${obj.name}`;

  // Remove duplicates based on object properties
  const uniqueHighscores = Array.from(
    new Map(highscores.map((item) => [getUniqueKey(item), item])).values()
  );

  // Sort entries by score in descending order
  const sortedHighscores = uniqueHighscores.sort(
    (a, b) => a.position - b.position
  );

  // Keep only the top 10 entries
  const topTenHighscores = sortedHighscores.slice(0, 10);

  // Save and display
  const newHighScore = topTenHighscores.find(
    (entry) => entry.position === newEntry.position
  );
  console.log("newHighScore", newHighScore);
  await saveHighscores(newHighScore);
}

async function showHighscoreForm(score, round, kills) {
  const highscores = await loadHighscores();
  const highscoreContainer = document.getElementById("highscore-container");
  highscoreContainer.style.display = "flex";

  // Determine the position for the new score
  let newPosition;
  const newEntry = {
    position: null,
    name: "",
    round: round,
    kills: kills,
    score: score,
  };

  for (let i = 0; i < highscores.length; i++) {
    if (
      score > highscores[i].score ||
      (score === highscores[i].score && kills > highscores[i].kills)
    ) {
      newPosition = i + 1;

      // Increment the position of scores that will be bumped down
      for (let j = i; j < highscores.length; j++) {
        highscores[j].position += 1;
        // Remove the entry if its position is greater than 10
        if (highscores[j].position > 10) {
          highscores.splice(j, 1);
          j--; // Adjust index to account for removed entry
        }
      }
      break;
    }
  }

  if (newPosition)
    highscores.splice(newPosition, 0, {
      ...newEntry,
      position: newPosition,
    });
  newEntry.position = newPosition;
  highscores.sort((a, b) => a.position - b.position);

  // Display the highscores including the new entry's position
  displayHighscores(highscores, newEntry);

  const submitButton = document.getElementById("highscore-submit-button");
  if (newPosition === undefined && dead) {
    submitButton.innerHTML = "Main Menu";
  } else if (newPosition === undefined && !dead) {
    submitButton.innerHTML = "Return";
  } else {
    submitButton.innerHTML = "Submit";
  }
  submitButton.onclick = async () => {
    if (submitButton.innerHTML === "Main Menu") {
      highscoreContainer.style.display = "none";
      return window.location.reload();
    }
    if (submitButton.innerHTML === "Return") {
      highscoreContainer.style.display = "none";
    }
    // Collect the name from individual inputs
    const firstLetter = document
      .getElementById("highscore-first-letter-input")
      .value.toUpperCase();
    const secondLetter = document
      .getElementById("highscore-second-letter-input")
      .value.toUpperCase();
    const thirdLetter = document
      .getElementById("highscore-third-letter-input")
      .value.toUpperCase();
    const fourthLetter = document
      .getElementById("highscore-fourth-letter-input")
      .value.toUpperCase();

    // Combine letters into a single player name
    const playerName =
      `${firstLetter}${secondLetter}${thirdLetter}${fourthLetter}`.trim();

    if (playerName.length < 1) return;

    await updateHighscores(highscores, newEntry, playerName);
  };
}

export { showHighscoreForm };
