const focusMinutesEl = document.getElementById("focus-minutes");
const focusSecondsEl = document.getElementById("focus-seconds");
const focusBtn = document.getElementById("focus-btn");
const breakBtn = document.getElementById("break-btn");
const pauseBothBtn = document.getElementById("pause-both-btn");

const totalFocusBlocks = 4;
const focusBlockLength = 100;
let focusBlocksCompleted = 0;
let focusTimerIsRunning = false;

const breakBlockLength = 20;
let breakTimerIsRunning = false;

let focusSecondsLeft = focusBlockLength * 60;

const updateCompletedBlocks = () => {
    const blockMarkers = document.querySelectorAll(".block-marker");
    
    // Update the visual markers on the page to show the number of blocks completed
    blockMarkers.forEach((marker, index) => {
        if (index < focusBlocksCompleted) marker.classList.add("completed");
        else marker.classList.remove("completed");
    });

    // Show when all the focus blocks are complete for the day and stop the timer
    if (focusBlocksCompleted === totalFocusBlocks) {
        alert("Focus time completed for today!");
        pauseFocusTimer();
    };
};

const updateFocusTimer = () => {
    focusSecondsLeft--;

    // When the focus block ends, update the number of completed blocks and reset the timer
    if (focusSecondsLeft === 0) {
        focusBlocksCompleted++;
        updateCompletedBlocks();
        focusSecondsLeft = focusBlockLength * 60;
    }

    // Update the remaining minutes and seconds displayed
    const minutesLeft = Math.floor(focusSecondsLeft / 60).toString().padStart(2, "0");
    const secondsLeft = (focusSecondsLeft % 60).toString().padStart(2, "0");
    focusMinutesEl.textContent = minutesLeft;
    focusSecondsEl.textContent = secondsLeft;
};

const startFocusTimer = () => {
    focusTimerIsRunning = true;
    focusBtn.textContent = "Pause Focus Timer";
    runFocusTimer = setInterval(updateFocusTimer, 1000);
};

const pauseFocusTimer = () => {
    focusTimerIsRunning = false;
    focusBtn.textContent = "Start Focus Timer";
    clearInterval(runFocusTimer);
};

const startOrPauseFocusTimer = () => {
    if (!focusTimerIsRunning) startFocusTimer();
    else pauseFocusTimer();
};

const startOrPauseBreakTimer = () => {
    console.log("starting or pausing break timer");
};

focusBtn.addEventListener("click", startOrPauseFocusTimer);
breakBtn.addEventListener("click", startOrPauseBreakTimer);