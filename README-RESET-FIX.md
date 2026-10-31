# MTM Enterprises – Upload form reset fix

Fixes `Cannot read properties of null (reading 'reset')` after gallery image uploads or 3D quote submissions.

## Why it happened
The previous implementation accessed `e.currentTarget` after awaiting a network request. React clears `currentTarget` when an event handler returns control, so the value becomes null after async operations.

## Fix
The two form handlers now capture the form element synchronously (`const formElement = e.currentTarget;`) and use `formElement?.reset()` after successful submission. All 100 MB limits remain as they were.

## Apply
Extract these two files into your existing repository, preserving paths. Review changes, then run `cd client && npm run build`. Push through your usual GitHub Actions / Argo CD workflow after testing.

This patch does not change Nginx or API upload limits.
