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

const focusBlockMinutes = 100;
const totalFocusBlocks = 4;

// Class for the focus and break timers
class TimerState {
    constructor(name, fullBlockMinutes, button, minutesElement, secondsElement) {
        this.name = name;
        this.blocksCompleted = 0;
        this.isTimerRunning = false;
        this.fullBlockMinutes = fullBlockMinutes;
        this.msLeftInBlock = fullBlockMinutes * msPerMinute;
        this.blockEndTime = null;
        this.button = button;
        this.minutesElement = minutesElement;
        this.secondsElement = secondsElement;
    }
}

// Create timer state object for the focus timer
const focusTimerState = new TimerState(
    "Focus",
    focusBlockMinutes,
    focusBtn,
    focusMinutesEl,
    focusSecondsEl
);

// Create timer state object for the break timer
const breakTimerState = new TimerState(
    "Break",
    focusBlockMinutes / 5, // Set the length of each break block to always be 1/5 the length of a focus block
    breakBtn,
    breakMinutesEl,
    breakSecondsEl
);

const updateBlocksCompleted = (state) => {
    // Update the visual markers on the page to show the number of blocks completed
    blockMarkers.forEach((marker, index) => {
        if (index < state.blocksCompleted) {
            marker.classList.add("completed")
        } else {
            marker.classList.remove("completed")
        };
    });

    // Show when all the focus blocks are complete for the day, stop the focus timer and reset number of blocks completed
    if (state.blocksCompleted === totalFocusBlocks) {
        setTimeout(() => {
            alert("Focus time completed for today!");
            pauseTimer(state);
            state.blocksCompleted = 0;
            updateBlocksCompleted(state);
        }, 100);
    };
};

const updateTimer = (state) => {
    if (state.isTimerRunning) {
        const currentTime = Date.now();

        // If the timer has ended, reset the time to start the next block
        if (currentTime >= state.blockEndTime) {
            state.blockEndTime = currentTime + state.fullBlockMinutes * msPerMinute;

            // If a focus block has ended (except the final block), alert the user and update the display of completed blocks
            if (state.name === "Focus") {
                state.blocksCompleted++;
                if (state.blocksCompleted < totalFocusBlocks) {
                    alert("Current focus session has finished. Time for a break!");
                }
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
    // Pause the break timer when starting the focus timer, and vice-verse
    if (state.name === "Focus" && breakTimerState.isTimerRunning === true) {
        pauseTimer(breakTimerState);
    } else if (state.name === "Break" && focusTimerState.isTimerRunning === true) {
        pauseTimer(focusTimerState);
    }

    state.button.textContent = `Pause ${state.name} Timer`;
    state.isTimerRunning = true;

    // Set the end time in milliseconds for the current focus block
    state.blockEndTime = Date.now() + state.msLeftInBlock;

    // Start updating the timer recursively
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