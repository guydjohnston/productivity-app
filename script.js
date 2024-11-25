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

const focusSessionMinutes = 0.2;
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

const fullyResetTimer = (state) => {
    state.msLeftInSession = state.fullSessionMinutes * msPerMinute;
    state.sessionsCompleted = 0;
    updateSessionsDisplay(state);
};

const updateSessionsDisplay = (state) => {
    // Update the visual markers on the page to show the number of focus or break sessions completed
    state.sessionMarkers.forEach((marker, index) => {
        if (index < state.sessionsCompleted) {
            marker.classList.add("completed");
        } else {
            marker.classList.remove("completed");
        };
    });
};

const resetTimerEndTime = (state) => {
    const currentTime = Date.now();
    state.sessionEndTime = currentTime + state.fullSessionMinutes * msPerMinute;
};

const endTimerSession = (state) => {
    // Reset the time left for the next session
    resetTimerEndTime(state);
    
    // Update the number of sessions completed and the visual display
    state.sessionsCompleted++;
    updateSessionsDisplay(state);
    
    if (state.name === "Break") {
        // If there's still another break session due, start the next break session
        if (breakTimerState.sessionsCompleted < focusTimerState.sessionsCompleted) {
            console.log("another break session is still due. starting the next break session");
            
            // Continue updating the break timer recursively
            updateTimer(breakTimerState);
            return;
        }
        // Otherwise pause the break timer and start the next focus session
        else {
            console.log("break session finished (and no more are due). starting the next focus session");
            pauseTimer(breakTimerState);
            startTimer(focusTimerState);
            return;
        }
    }

    if (state.name === "Focus") {
        // When all the focus sessions are complete for the day, alert the user and stop and reset both timers
        if (focusTimerState.sessionsCompleted === totalFocusSessions) {
            setTimeout(() => {
                alert("Focus time completed for today!");
                pauseTimer(focusTimerState);
                pauseTimer(breakTimerState);
                fullyResetTimer(focusTimerState);
                fullyResetTimer(breakTimerState);
            }, 100);
            return;
        }
        // Otherwise start the next focus session
        else {
            console.log("focus session finished and it's not the last one. starting the next focus session")
            
            // Continue updating the focus timer recursively
            updateTimer(focusTimerState);
        }
    };
};

const updateTimer = (state) => {
    // Only continue running the timer if it's toggled to be running
    if (state.isTimerRunning) {
        const currentTime = Date.now();

        // If the timer has ended, run the logic to determine what to do nex and don't update the timer display
        if (currentTime >= state.sessionEndTime) {
            console.log(`ending current ${state.name} session`)
            endTimerSession(state);
            return;
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
        return;
    }
};

const startTimer = (state) => {
    console.log(`starting ${state.name} timer`)

    // Set the end time in milliseconds for the current focus session
    state.sessionEndTime = Date.now() + state.msLeftInSession;
    console.log(`setting end time from time left in session - ${state.sessionEndTime}`)

    // Pause the break timer when starting the focus timer, and vice-verse
    if (state.name === "Focus" && breakTimerState.isTimerRunning === true) {
        pauseTimer(breakTimerState);
    } else if (state.name === "Break" && focusTimerState.isTimerRunning === true) {
        pauseTimer(focusTimerState);
    }

    state.button.textContent = `Pause ${state.name} Timer`;
    state.isTimerRunning = true;

    // Start updating the timer recursively
    updateTimer(state);
};

const pauseTimer = (state) => {
    console.log(`pausing ${state.name} timer`);

    // Save the number of milliseconds left in the current focus sessions, for when the focus timer is restarted
    state.msLeftInSession = state.sessionEndTime - Date.now();
    console.log(`saving time left in session for later`)

    // Unset the end time for the current focus session until the focus timer is started again
    state.sessionEndTime = null;
    console.log(`resetting session end time`);
    
    state.button.textContent = `Start ${state.name} Timer`;
    state.isTimerRunning = false;
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