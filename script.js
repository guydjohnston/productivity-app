const focusMinutesEl = document.getElementById("focus-minutes");
const focusSecondsEl = document.getElementById("focus-seconds");
const focusBtn = document.getElementById("focus-btn");
const breakBtn = document.getElementById("break-btn");
const pauseBothBtn = document.getElementById("pause-both-btn");
const blockMarkers = document.querySelectorAll(".block-marker");

const totalFocusBlocks = 4;
const focusBlockMinutes = 0.2;

const msPerSecond = 1000;
const msPerMinute = 60 * msPerSecond;

let focusBlocksCompleted = 0;
let focusTimerIsRunning = false;

// Set the initial number of milliseconds left in the current focus session
let focusMsLeft = focusBlockMinutes * msPerMinute;

// The end time of the current focus session in millilseconds
let focusEndTime;

const completeFocusBlock = () => {
    // Update the visual markers on the page to show the number of blocks completed
    blockMarkers.forEach((marker, index) => {
        if (index < focusBlocksCompleted) marker.classList.add("completed");
        else marker.classList.remove("completed");
    });
    
    // Show when all the focus blocks are complete for the day and stop the timer
    if (focusBlocksCompleted === totalFocusBlocks) {
        alert("Focus time completed for today!");
        pauseFocusTimer();
        return;
    };

    focusMsLeft = focusBlockMinutes * msPerMinute;
    startFocusTimer();
};

const updateFocusTimer = () => {
    if (focusTimerIsRunning) {

        // Work out how many milliseconds are left in the current focus session
        const msLeft = focusEndTime - Date.now();

        if (msLeft <= 0) {
            focusBlocksCompleted++;
            completeFocusBlock();
            return;
        }

        const minutesDisplayed = Math.floor(msLeft / msPerMinute);
        const secondsDisplayed = (msLeft / msPerSecond) % 60;

        // Update the focus timer display on the page
        focusMinutesEl.textContent = minutesDisplayed;
        focusSecondsEl.textContent = secondsDisplayed.toFixed(0);

        // Run this function again in one second
        setTimeout(updateFocusTimer, 1000);
    }
};

const startFocusTimer = () => {
    console.log("starting focus timer");
    focusTimerIsRunning = true;
    focusBtn.textContent = "Pause Focus Timer";

    // Set the end time in milliseconds for the current focus block
    console.log("focus time left in milliseconds is", focusMsLeft);
    focusEndTime = Date.now() + focusMsLeft;
    console.log("focus end time is", focusEndTime)

    updateFocusTimer();
};

const pauseFocusTimer = () => {
    console.log("pausing focus timer");
    focusTimerIsRunning = false;
    focusBtn.textContent = "Start Focus Timer";

    // Save the number of milliseconds left in the current focus block, for when the focus timer is restarted
    focusMsLeft = focusEndTime - Date.now();
    console.log("focus time left in milliseconds is", focusMsLeft);
}

const startOrPauseFocusTimer = () => {
    if (!focusTimerIsRunning) {
        startFocusTimer();
    } else {
        pauseFocusTimer()
    };
};

focusBtn.addEventListener("click", startOrPauseFocusTimer);