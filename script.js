const focusMinutesEl = document.getElementById("focus-minutes");
const focusSecondsEl = document.getElementById("focus-seconds");
const focusBtn = document.getElementById("focus-btn");
const breakBtn = document.getElementById("break-btn");
const pauseBothBtn = document.getElementById("pause-both-btn");
const blockMarkers = document.querySelectorAll(".block-marker");

const msPerSecond = 1000;
const msPerMinute = 60 * msPerSecond;

const totalFocusBlocks = 4;
const focusBlockMinutes = 100;

// Store the relevant variables for the focus timer in a state object
const focusTimerState = {
    blocksCompleted: 0,
    isTimerRunning: false,
    msLeftInBlock: focusBlockMinutes * msPerMinute,
    blockEndTime: null
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
            pauseFocusTimer(state);
        }, 100);
        return;
    };
};

const updateFocusTimer = (state) => {
    if (state.isTimerRunning) {
        const currentTime = Date.now();

        // If the focus block has ended, update the display of completed blocks and reset the timer
        if (currentTime >= state.blockEndTime) {
            state.blocksCompleted++;
            updateBlocksCompleted(state);
            state.msLeftInBlock = focusBlockMinutes * msPerMinute;
            state.blockEndTime = currentTime + state.msLeftInBlock;
        }
        
        // Work out how many milliseconds are left in the current focus session
        const msLeft = state.blockEndTime - currentTime;

        const minutesDisplayed = Math.floor(msLeft / msPerMinute).toString().padStart(2, "0");
        const secondsDisplayed = Math.round((msLeft / msPerSecond) % 60).toString().padStart(2, "0");

        // Update the focus timer display on the page
        focusMinutesEl.textContent = minutesDisplayed;
        focusSecondsEl.textContent = secondsDisplayed;

        // Run this function again in one second
        setTimeout(() => updateFocusTimer(state), 1000);
    }
};

const startFocusTimer = (state) => {
    focusBtn.textContent = "Pause Focus Timer";
    state.isTimerRunning = true;
    
    // Set the end time in milliseconds for the current focus block
    state.blockEndTime = Date.now() + state.msLeftInBlock;

    updateFocusTimer(state);
};

const pauseFocusTimer = (state) => {
    focusBtn.textContent = "Start Focus Timer";
    state.isTimerRunning = false;

    // Save the number of milliseconds left in the current focus block, for when the focus timer is restarted
    state.msLeftInBlock = state.blockEndTime - Date.now();

    // Unset the end time for the current focus block until the focus timer is started again
    state.blockEndTime = null;
}

const startOrPauseFocusTimer = () => {
    if (!focusTimerState.isTimerRunning) {
        startFocusTimer(focusTimerState);
    } else {
        pauseFocusTimer(focusTimerState);
    };
};

focusBtn.addEventListener("click", startOrPauseFocusTimer);