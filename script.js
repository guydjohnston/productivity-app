const focusMinutesEl = document.getElementById("focus-minutes");
const focusSecondsEl = document.getElementById("focus-seconds");
const breakMinutesEl = document.getElementById("break-minutes");
const breakSecondsEl = document.getElementById("break-seconds");
const focusBtn = document.getElementById("focus-btn");
const breakBtn = document.getElementById("break-btn");
const sessionMarkers = document.querySelectorAll(".session-marker");

const msPerSecond = 1000;
const msPerMinute = 60 * msPerSecond;

const focusSessionMinutes = 0.1;
const totalFocusSessions = 4;

// Class for the focus and break timers
class TimerState {
    constructor(name, fullSessionMinutes, button, minutesElement, secondsElement) {
        this.name = name;
        this.sessionsCompleted = 0;
        this.isTimerRunning = false;
        this.fullSessionMinutes = fullSessionMinutes;
        this.msLeftInSession = fullSessionMinutes * msPerMinute;
        this.sessionEndTime = null;
        this.button = button;
        this.minutesElement = minutesElement;
        this.secondsElement = secondsElement;
    }
}

// Create timer state object for the focus timer
const focusTimerState = new TimerState(
    "Focus",
    focusSessionMinutes,
    focusBtn,
    focusMinutesEl,
    focusSecondsEl
);

// Create timer state object for the break timer
const breakTimerState = new TimerState(
    "Break",
    focusSessionMinutes / 5, // Set the length of each break session to always be 1/5 the length of a focus session
    breakBtn,
    breakMinutesEl,
    breakSecondsEl
);

const updateSessionsCompleted = (state) => {
    // Update the visual markers on the page to show the number of sessions completed
    sessionMarkers.forEach((marker, index) => {
        if (index < state.sessionsCompleted) {
            marker.classList.add("completed")
        } else {
            marker.classList.remove("completed")
        };
    });

    // Show when all the focus sessions are complete for the day, stop the focus timer and reset number of sessions completed
    if (state.sessionsCompleted === totalFocusSessions) {
        setTimeout(() => {
            alert("Focus time completed for today!");
            pauseTimer(state);
            state.sessionsCompleted = 0;
            updateSessionsCompleted(state);
        }, 100);
    };
};

const updateTimer = (state) => {
    // Only continue running the timer if it's toggled to be running
    if (state.isTimerRunning) {
        const currentTime = Date.now();

        // If the timer has ended, reset the time to start the next session
        if (currentTime >= state.sessionEndTime) {
            state.sessionEndTime = currentTime + state.fullSessionMinutes * msPerMinute;

            // If a focus session has ended (except the final session), alert the user and update the display of completed sessions
            if (state.name === "Focus") {
                state.sessionsCompleted++;
                if (state.sessionsCompleted < totalFocusSessions) {
                    alert("Current focus session has finished. Time for a break!");
                }
                updateSessionsCompleted(state);
            }
            /* // If a break session has ended, alert the user and begin or resume the next focus session
            else if (state.name === "Break") {

            } */
        }

        // Work out how many milliseconds are left in the current focus session
        const msLeft = state.sessionEndTime - currentTime;

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

    // Set the end time in milliseconds for the current focus session
    state.sessionEndTime = Date.now() + state.msLeftInSession;

    // Start updating the timer recursively
    updateTimer(state);
};

const pauseTimer = (state) => {
    state.button.textContent = `Start ${state.name} Timer`;
    state.isTimerRunning = false;

    // Save the number of milliseconds left in the current focus sessions, for when the focus timer is restarted
    state.msLeftInSession = state.sessionEndTime - Date.now();

    // Unset the end time for the current focus session until the focus timer is started again
    state.sessionEndTime = null;
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