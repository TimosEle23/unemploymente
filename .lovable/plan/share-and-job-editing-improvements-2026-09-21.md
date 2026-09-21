# Share and job editing improvements

## Changes
- Hide the “Edit with Lovable” badge on the published site.
- Add an “Invite friends” control to the main header using the supplied person icon on a transparent background.
- Use the phone’s native share sheet when available; otherwise copy the current JOBHUNT link and confirm success.
- Let users rename a tracked job directly from its application detail page, with save and cancel controls.
- Replace clipped analytics labels with wrapped text and adjust chart spacing so full skill and category names remain readable on desktop and mobile.

## Technical details
- Store the supplied icon as a project-served asset and give the share control an accessible label.
- Persist job-name changes through the existing authenticated application update flow and refresh affected lists.
- Keep the existing retro visual language and semantic color tokens.

## Verification
- Check desktop and mobile layouts, job-name saving, native-share fallback behavior, and full analytics label visibility.
