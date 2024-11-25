const focusMinutesEl = document.getElementById("focus-minutes");
const focusSecondsEl = document.getElementById("focus-seconds");
const breakMinutesEl = document.getElementById("break-minutes");
const breakSecondsEl = document.getElementById("break-seconds");
const focusBtn = document.getElementById("focus-btn");
const breakBtn = document.getElementById("break-btn");
const focusSessionMarkers = document.querySelectorAll(".focus-session-marker");
const breakSessionMarkers = document.querySelectorAll(".break-session-marker");

const msPerSecond = 1000;
const msPerMinute = 60 * msPerSecond;

const focusSessionMinutes = 0.1;
const totalFocusSessions = 4;

// Class for the focus and break timers
class TimerState {
    constructor(name, fullSessionMinutes, button, minutesElement, secondsElement, sessionMarkerClass) {
        this.name = name;
        this.sessionsCompleted = 0;
        this.isTimerRunning = false;
        this.fullSessionMinutes = fullSessionMinutes;
        this.msLeftInSession = fullSessionMinutes * msPerMinute;
        this.sessionEndTime = null;
        this.button = button;
        this.minutesElement = minutesElement;
        this.secondsElement = secondsElement;
        this.sessionMarkers = document.querySelectorAll(`.${sessionMarkerClass}`);
    }
}

// Create timer state object for the focus timer
const focusTimerState = new TimerState(
    "Focus",
    focusSessionMinutes,
    focusBtn,
    focusMinutesEl,
    focusSecondsEl,
    "focus-session-marker"
);

// Create timer state object for the break timer
const breakTimerState = new TimerState(
    "Break",
    focusSessionMinutes / 5, // Set the length of each break session to always be 1/5 the length of a focus session
    breakBtn,
    breakMinutesEl,
    breakSecondsEl,
    "break-session-marker"
);

const resetTimer = (state) => {
    state.msLeftInSession = state.fullSessionMinutes * msPerMinute;
    state.sessionsCompleted = 0;
    updateTimer(state);
    updateSessionsCompleted(state);
};

const updateSessionsCompleted = (state) => {
    // Update the visual markers on the page to show the number of focus or break sessions completed
    state.sessionMarkers.forEach((marker, index) => {
        if (index < state.sessionsCompleted) {
            marker.classList.add("completed");
        } else {
            marker.classList.remove("completed");
        };
    });

    // If a break session just finished and there isn't another break session still due
    if (state.name === "Break" && focusTimerState.sessionsCompleted <= state.sessionsCompleted) {
        console.log("break session finished. starting the next focus session");
        // Pause and reset the break timer and start or resume the next focus session
        pauseTimer(state);
        startTimer(focusTimerState);
        return;   
    } else console.log("another break session is still due. starting the next break session");

    // When all the focus sessions are complete for the day, alert the user and stop and reset both timers
    if (state.name === "Focus" && state.sessionsCompleted === totalFocusSessions) {
        setTimeout(() => {
            alert("Focus time completed for today!");
            pauseTimer(state);
            pauseTimer(breakTimerState);
            resetTimer(state);
            resetTimer(breakTimerState);
        }, 100);
    };
};

const updateTimer = (state) => {
    // Only continue running the timer if it's toggled to be running and there's a valid end time set
    if (state.isTimerRunning && state.sessionEndTime) {
        const currentTime = Date.now();

        // If the timer has ended, update the visual discplay then determine what to do next
        if (currentTime >= state.sessionEndTime) {
            // Reset the timer end time to add the legnth of a full session
            state.sessionEndTime = currentTime + state.fullSessionMinutes * msPerMinute;

            // Update the number of focus or break sessions completed
            state.sessionsCompleted++;
            updateSessionsCompleted(state);
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