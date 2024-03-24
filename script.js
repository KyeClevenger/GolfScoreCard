document.addEventListener("DOMContentLoaded", () => {
    populateCourseSelect();
    document.getElementById("add-player-button").addEventListener("click", addPlayer);
});
document.getElementById("add-player").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        event.preventDefault(); 
        addPlayer(); 
    }
});

let numPlayers = 0;

function addPlayer() {
    if (numPlayers >= 4) {
        alert("You cannot add more than 4 players.");
        return;
    }
    
    const playerName = document.getElementById("add-player").value.trim();
    if (playerName === "") return; 

    numPlayers++; 
    const tableHeadRow = document.querySelector("#scorecard-table thead tr");
    const totalRow = document.querySelector("#total-row tr");

    const playerHeader = document.createElement("th");
    playerHeader.textContent = playerName;
    tableHeadRow.appendChild(playerHeader);

    const scorecardBody = document.getElementById("scorecard-body");
    const scorecardRows = scorecardBody.querySelectorAll("tr");
    scorecardRows.forEach(row => {
        const playerCell = document.createElement("td");
        const inputField = document.createElement("input");
        inputField.type = "number";
        inputField.classList.add("form-control", "score-input");
        inputField.dataset.player = numPlayers - 1;
        inputField.placeholder = "Score";
        playerCell.appendChild(inputField);
        row.appendChild(playerCell);
    });

    const totalCell = document.createElement("td");
    totalCell.id = `player${numPlayers}-total`;
    totalRow.appendChild(totalCell);
    document.getElementById("add-player").value = ""; 

    scorecardRows.forEach(row => {
        const inputField = row.querySelector(`input[data-player="${numPlayers - 1}"]`);
        inputField.addEventListener('input', () => {
            const playerIndex = parseInt(inputField.dataset.player);
            const score = parseInt(inputField.value) || 0;
            updatePlayerTotal(playerIndex, calculatePlayerTotal(playerIndex));
        });
    });
    calculateScores();
}


function calculateScores() {
    const playerTotals = Array(numPlayers).fill(0);
    const scoreInputs = document.querySelectorAll('.score-input');
    scoreInputs.forEach(input => {
        const playerIndex = parseInt(input.dataset.player);
        const score = parseInt(input.value) || 0;
        playerTotals[playerIndex] += score;
        updatePlayerTotal(playerIndex, playerTotals[playerIndex]);
    });

    updateTotalScore(playerTotals);
}

function populateScorecard(holes, teeBoxIndex) {
    const scorecardBody = document.getElementById("scorecard-body");
    scorecardBody.innerHTML = "";
    const playerTotals = Array(numPlayers).fill(0);

    holes.forEach((hole, index) => {
        const teeBox = hole.teeBoxes[teeBoxIndex];
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${teeBox.yards}</td>
            <td>${teeBox.hcp}</td>
            <td>${teeBox.par}</td>
        `;
        for (let i = 0; i < numPlayers; i++) {
            row.innerHTML += `<td><input type="number" class="form-control score-input" data-player="${i}" placeholder="Score"></td>`;
        }
        scorecardBody.appendChild(row);

        row.querySelectorAll('.score-input').forEach(input => {
            input.addEventListener('input', () => {
                const playerIndex = parseInt(input.dataset.player);
                const score = parseInt(input.value) || 0;
                playerTotals[playerIndex] = calculatePlayerTotal(playerIndex);
                updatePlayerTotal(playerIndex, playerTotals[playerIndex]);
            });
        });
    });

    const totalRow = document.querySelector("#total-row tr");
    if (!totalRow.querySelector("td").textContent.includes("Total")) {
        const totalCell = document.createElement("td");
        totalCell.textContent = "Total";
        totalRow.appendChild(totalCell);
    }
    if (numPlayers > playerTotals.length) {
        const newPlayers = numPlayers - playerTotals.length;
        for (let i = 0; i < newPlayers; i++) {
            playerTotals.push(0);
        }
        updateTotalScore(playerTotals);
    }
}

function calculatePlayerTotal(playerIndex) {
    const scoreInputs = document.querySelectorAll(`#scorecard-body tr td input[data-player="${playerIndex}"]`);
    let total = 0;
    scoreInputs.forEach(input => {
        total += parseInt(input.value) || 0;
    });
    return total;
}

function updateTotalScore() {
    const totalRow = document.querySelector("#total-row tr");
    const totalScoreCell = totalRow.querySelector("td");
    totalScoreCell.textContent = "Total";
}

function updatePlayerTotal(playerIndex, total) {
    const playerTotalCell = document.getElementById(`player${playerIndex + 1}-total`);
    playerTotalCell.textContent = total;
}

function populateCourseSelect() {
    getAvailableGolfCourses()
        .then(courses => {
            const courseSelect = document.getElementById("course-select");
            let courseOptionsHtml = "<option value='-1' selected disabled hidden>Select Course</option>";
            courses.forEach(course => {
                courseOptionsHtml += `<option value="${course.id}">${course.name}</option>`;
            });
            courseSelect.innerHTML = courseOptionsHtml;
            courseSelect.addEventListener("change", () => {
                const courseId = courseSelect.value;
                populateTeeBoxSelect(courseId);
            });
            courseSelect.dispatchEvent(new Event('change'));
        })
        .catch(error => {
            console.error("Error fetching golf course data:", error);
        });
}

function populateTeeBoxSelect(courseId) {
    getGolfCourseDetails(courseId)
        .then(courseDetails => {
            const teeBoxSelect = document.getElementById("tee-box-select");
            teeBoxSelect.innerHTML = "";
            courseDetails.holes[0].teeBoxes.forEach((teeBox, index) => {
                const option = document.createElement("option");
                option.value = index;
                option.textContent = `${teeBox.teeType.toUpperCase()}, ${teeBox.totalYards} yards`;
                teeBoxSelect.appendChild(option);
            });
            populateScorecard(courseDetails.holes, 0);
        })
        .catch(error => {
            console.error("Error fetching golf course details:", error);
        });
}

function getAvailableGolfCourses() {
    return fetch("https://exquisite-pastelito-9d4dd1.netlify.app/golfapi/courses.json")
        .then(response => response.json());
}

function getGolfCourseDetails(golfCourseId) {
    return fetch(`https://exquisite-pastelito-9d4dd1.netlify.app/golfapi/course${golfCourseId}.json`)
        .then(response => response.json());
}
