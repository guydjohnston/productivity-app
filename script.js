const focusMinutesEl = document.getElementById("focus-minutes");
const focusSecondsEl = document.getElementById("focus-seconds");
const breakMinutesEl = document.getElementById("break-minutes");
const breakSecondsEl = document.getElementById("break-seconds");
const focusBtn = document.getElementById("focus-btn");
const breakBtn = document.getElementById("break-btn");
const pauseBothBtn = document.getElementById("pause-both-btn");
const blockMarkers = document.querySelectorAll(".block-marker");

const msPerSecond = 1000;
const msPerMinute = 60 * msPerSecond;

const totalFocusBlocks = 4;
const focusBlockMinutes = 0.1;

// Set the length of each break block to always be 1/5 of the length of a focus block
const breakBlockMinutes = focusBlockMinutes / 5;

// Store the relevant variables for the focus timer in a state object
const focusTimerState = {
    name: "Focus",
    blocksCompleted: 0,
    isTimerRunning: false,
    msLeftInBlock: focusBlockMinutes * msPerMinute,
    blockEndTime: null,
    button: focusBtn,
    minutesElement: focusMinutesEl,
    secondsElement: focusSecondsEl
};

// Store the relevant variables for the break timer in a state object
const breakTimerState = {
    name: "Break",
    isTimerRunning: false,
    msLeftInBlock: breakBlockMinutes * msPerMinute,
    blockEndTime: null,
    button: breakBtn,
    minutesElement: breakMinutesEl,
    secondsElement: breakSecondsEl
};

const updateBlocksCompleted = (state) => {
    // Update the visual markers on the page to show the number of blocks completed
    blockMarkers.forEach((marker, index) => {
        if (index < state.blocksCompleted) {
            marker.classList.add("completed")
        } else {
            marker.classList.remove("completed")
        };
    });

    // Show when all the focus blocks are complete for the day and stop the timer
    if (state.blocksCompleted === totalFocusBlocks) {
        setTimeout(() => {
            alert("Focus time completed for today!");
            pauseTimer(state);
        }, 100);
        return;
    };
};

const updateTimer = (state) => {
    if (state.isTimerRunning) {
        const currentTime = Date.now();

        // If the timer has ended, reset the time to start the next block
        if (currentTime >= state.blockEndTime) {
            state.msLeftInBlock = focusBlockMinutes * msPerMinute;
            state.blockEndTime = currentTime + state.msLeftInBlock;

            // If the focus block has ended, update the display of completed blocks
            if (state.name === "Focus") {
                state.blocksCompleted++;
                updateBlocksCompleted(state);
            }
        }

        // Work out how many milliseconds are left in the current focus session
        const msLeft = state.blockEndTime - currentTime;

        const minutesDisplayed = Math.floor(msLeft / msPerMinute).toString().padStart(2, "0");
        const secondsDisplayed = Math.round((msLeft / msPerSecond) % 60).toString().padStart(2, "0");

        // Update the focus timer display on the page
        state.minutesElement.textContent = minutesDisplayed;
        state.secondsElement.textContent = secondsDisplayed;

        // Run this function again in one second
        setTimeout(() => updateTimer(state), 1000);
    }
};

const startTimer = (state) => {
    state.button.textContent = `Pause ${state.name} Timer`;
    state.isTimerRunning = true;

    // Set the end time in milliseconds for the current focus block
    state.blockEndTime = Date.now() + state.msLeftInBlock;

    updateTimer(state);
};

const pauseTimer = (state) => {
    state.button.textContent = `Start ${state.name} Timer`;
    state.isTimerRunning = false;

    // Save the number of milliseconds left in the current focus block, for when the focus timer is restarted
    state.msLeftInBlock = state.blockEndTime - Date.now();

    // Unset the end time for the current focus block until the focus timer is started again
    state.blockEndTime = null;
}

const startOrPauseTimer = (state) => {
    if (!state.isTimerRunning) {
        startTimer(state);
    } else {
        pauseTimer(state);
    };
};

focusBtn.addEventListener("click", () => startOrPauseTimer(focusTimerState));
breakBtn.addEventListener("click", () => startOrPauseTimer(breakTimerState));