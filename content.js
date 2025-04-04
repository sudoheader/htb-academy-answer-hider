/**
 * HTB Answer Hider (Inline Style Mode)
 * Content script to hide/show answers on HTB Academy & Enterprise pages.
 * Uses inline style `filter: blur()` for hiding.
 * Version: 1.3
 */

console.log("HTB Answer Hider (Inline Style Mode) script running.");

// --- Configuration ---
// ##########################################################################
// # IMPORTANT: Verify and update these selectors for BOTH platforms!       #
// # Use browser developer tools (Inspect Element) on the answer fields.    #
// ##########################################################################

// --- Selector for academy.hackthebox.com ---
// Example assumes a disabled input with class 'form-control' and potentially name='answer'
// Replace with your verified selector for Academy pages.
const ACADEMY_SELECTOR = 'input.form-control[disabled]';

// --- Selector for enterprise.hackthebox.com ---
// Based on the provided HTML snippet (Vuetify structure).
// Targets disabled input fields with class 'v-field__input'.
// Replace with your verified selector for Enterprise pages if needed.
const ENTERPRISE_SELECTOR = 'input.v-field__input[disabled]';

// --- Combined Selector ---
// Uses CSS comma separator to target elements matching EITHER selector.
const ANSWER_INPUT_SELECTOR = `${ACADEMY_SELECTOR}, ${ENTERPRISE_SELECTOR}`;

// --- Constants for Styling/Placeholders ---
const PLACEHOLDER_VALUE = '[ANSWER HIDDEN]'; // Text to display when value is hidden
const BLUR_STYLE = 'blur(4px)'; // The CSS filter value for blurring

// --- State ---
// Tracks whether answers are currently visible or hidden.
let areAnswersVisible = false; // Initial state: hidden

// --- Functions ---

/**
 * Finds all relevant answer input elements on the current page.
 * Uses the combined ANSWER_INPUT_SELECTOR.
 * @returns {NodeListOf<Element>} A list of found answer input elements. Returns empty list on error.
 */
function findAnswerInputs() {
    try {
        // Query the DOM for elements matching either Academy or Enterprise selector
        return document.querySelectorAll(ANSWER_INPUT_SELECTOR);
    } catch (e) {
        // Log an error if the CSS selector is invalid
        console.error(`HTB Answer Hider: Invalid CSS selector combination "${ANSWER_INPUT_SELECTOR}". Please fix it in content.js.`, e);
        return []; // Return an empty NodeList to prevent further errors
    }
}

/**
 * Hides the value of all identified answer inputs.
 * - Stores the original value in a 'data-original-value' attribute.
 * - Replaces the input's 'value' with a placeholder.
 * - Applies an inline style 'filter: blur(4px)'.
 */
function hideAnswerValues() {
    const inputs = findAnswerInputs();
    // Proceed only if inputs are found AND the desired state is 'hidden'
    if (inputs.length > 0 && !areAnswersVisible) {
        // Optional: Log which platform structure was likely detected (for debugging)
        const platform = inputs[0].classList.contains('v-field__input') ? 'Enterprise (Vuetify)' : 'Academy (Bootstrap/Custom)';
        console.log(`HTB Hider: Found ${inputs.length} input(s) on ${platform}. Hiding values & applying inline blur.`);

        inputs.forEach(input => {
            // Store the original value ONCE using a data attribute.
            // Checks if the attribute doesn't already exist.
            if (input.dataset.originalValue === undefined) {
                // Store the current value, defaulting to empty string if null/undefined
                input.dataset.originalValue = input.value || '';
            }
             // Replace the visible value with the placeholder, only if it's not already the placeholder.
             if (input.value !== PLACEHOLDER_VALUE) {
                input.value = PLACEHOLDER_VALUE;
             }
            // Apply the blur effect directly to the element's style attribute.
            input.style.filter = BLUR_STYLE;
        });
    } else if (inputs.length === 0 && document.readyState === 'complete') {
         // Log only if the page is fully loaded and no elements were found.
         console.log(`HTB Hider: No input elements found matching "${ANSWER_INPUT_SELECTOR}". Check selectors.`);
    }
    // Ensure the body class (used for button styling) is removed when answers are hidden.
    document.body.classList.remove('htb-answers-shown');
}

/**
 * Shows the original value of all identified answer inputs.
 * - Restores the original 'value' from the 'data-original-value' attribute.
 * - Removes the inline 'filter' style.
 */
function showAnswerValues() {
    const inputs = findAnswerInputs();
    // Proceed only if inputs are found AND the desired state is 'visible'
    if (inputs.length > 0 && areAnswersVisible) {
         const platform = inputs[0].classList.contains('v-field__input') ? 'Enterprise (Vuetify)' : 'Academy (Bootstrap/Custom)';
         console.log(`HTB Hider: Found ${inputs.length} input(s) on ${platform}. Restoring values & removing inline blur.`);

        inputs.forEach(input => {
            // Restore the original value only if it was previously stored.
            if (input.dataset.originalValue !== undefined) {
                // Update the value only if it's different from the stored original.
                if (input.value !== input.dataset.originalValue) {
                   input.value = input.dataset.originalValue;
                }
            } else {
                // Log a warning if the original value wasn't found (shouldn't normally happen).
                console.warn("HTB Hider: Original value (dataset.originalValue) not found for input during show:", input);
            }
            // Remove the inline filter style by setting it to an empty string.
            input.style.filter = '';
        });
    }
    // Ensure the body class (used for button styling) is added when answers are visible.
     document.body.classList.add('htb-answers-shown');
}

/**
 * Toggles the visibility state (hidden/visible) when the button is clicked.
 * Updates the button's text and appearance.
 */
function toggleAnswerVisibility() {
    // Flip the state boolean
    areAnswersVisible = !areAnswersVisible;

    const button = document.getElementById('htb-toggle-answers-btn');

    if (areAnswersVisible) {
        // If state is now visible:
        console.log("HTB Hider: Showing answer values...");
        showAnswerValues(); // Call function to show values/remove blur
        // Update button appearance (if button exists)
        if (button) {
            button.textContent = 'Hide Answers';
            button.classList.add('answers-visible'); // Add class for red styling
        }
         document.body.classList.add('htb-answers-shown'); // Add body class
    } else {
        // If state is now hidden:
        console.log("HTB Hider: Hiding answer values...");
        hideAnswerValues(); // Call function to hide values/add blur
        // Update button appearance (if button exists)
        if (button) {
            button.textContent = 'Show Answers';
            button.classList.remove('answers-visible'); // Remove class for red styling
        }
        document.body.classList.remove('htb-answers-shown'); // Remove body class
    }
     console.log("HTB Hider: Answer visibility toggled. Currently visible:", areAnswersVisible);
}

/**
 * Creates the 'Show/Hide Answers' button and injects it into the page body.
 * Avoids creating duplicate buttons.
 */
function createToggleButton() {
    // Check if the button already exists to prevent duplicates
    if (document.getElementById('htb-toggle-answers-btn')) {
        return;
    }

    // Create the button element
    const button = document.createElement('button');
    button.id = 'htb-toggle-answers-btn'; // Set ID for styling and reference
    button.textContent = 'Show Answers'; // Initial text assumes answers are hidden
    button.onclick = toggleAnswerVisibility; // Assign the toggle function to the click event

    // Append the button to the end of the document body
    document.body.appendChild(button);
    console.log("HTB Hider: Toggle button added to page.");
}

// --- Main Execution & Dynamic Content Handling ---

/**
 * Central function to apply the current visibility state and ensure the button exists.
 * Called on initial load and by the MutationObserver.
 */
function applyCurrentStateAndButton() {
     // Apply the correct state (hide or show) based on the flag
     if (!areAnswersVisible) {
        hideAnswerValues();
     } else {
        showAnswerValues();
     }
     // Ensure the toggle button is present on the page
     createToggleButton();
}

// --- MutationObserver ---
// Watches for changes in the DOM (like content loading dynamically)
// and re-applies the hiding/showing logic if new answer fields appear.
const observer = new MutationObserver((mutationsList, observer) => {
    let potentialNewInputsFound = false;
    // Iterate over all mutations that occurred
    for (const mutation of mutationsList) {
        // Check specifically if nodes were added to the DOM
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Check each added node
            mutation.addedNodes.forEach(node => {
                 // Only process element nodes (ignore text nodes, etc.)
                 if (node.nodeType === Node.ELEMENT_NODE) {
                    try {
                        // Check if the added node itself OR any of its descendants
                        // match the combined ANSWER_INPUT_SELECTOR.
                        if (node.matches(ANSWER_INPUT_SELECTOR) || node.querySelector(ANSWER_INPUT_SELECTOR)) {
                            potentialNewInputsFound = true;
                        }
                    } catch (e) {
                         // Log errors if the selector fails during observation
                         console.error(`HTB Hider: Error matching selector during mutation observation: "${ANSWER_INPUT_SELECTOR}".`, e);
                    }
                 }
            });
        }
    }

    // If any mutation might have introduced new answer fields...
    if (potentialNewInputsFound) {
        console.log("HTB Hider: DOM changed, potentially new answer inputs added. Re-applying visibility state.");
        // Re-run the function that applies the current state and ensures the button exists.
        applyCurrentStateAndButton();
    }
});

// --- Start Observing ---
// Tell the observer to watch the entire document body and its descendants
// for nodes being added or removed.
observer.observe(document.body, {
     childList: true, // Watch for direct children changes
     subtree: true    // Watch for changes in all descendants
 });

// --- Initial Run ---
// Apply the initial state (hide answers) and create the button when the script first loads.
applyCurrentStateAndButton();

console.log("HTB Answer Hider (Inline Style Mode) setup complete. Initial state: hidden.");
