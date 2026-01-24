I will upgrade the **Organization** experience to a Premium UI/UX level, matching the "Glowing Glass Cards" aesthetic from your reference image and ensuring robust functionality with `better-auth`.

### 1. New "Premium Card" Component
I will implement the "Glowing Card" style shown in your image (Dark Glass + Gradient Top Border) and apply it to:
- The **Organization List** in `/organization`.
- The **Create Organization** form container.

### 2. Refactor Organization Dashboard (`/organization`)
- **Remove Inline Form**: Delete the basic inline "Create" form to clean up the UI.
- **Link to Dedicated Page**: The "New Organization" button will now navigate to the dedicated Premium page (`/organization/create`).
- **Upgrade List UI**: Transform the list of existing organizations into **Premium Cards** with:
    - Glassmorphism background (`backdrop-blur`).
    - **Glowing Gradient Top Border** (Cyan/Purple/Blue).
    - Hover effects that intensify the glow.
    - Clean typography and layout.

### 3. Enhance Create Page (`/organization/create`)
- **Visual Polish**: Update the existing create page to strictly match the "Reference Image" style.
    - Add the signature **Top Gradient Glow** to the main form card.
    - Ensure inputs and buttons match the dark/glass theme.
- **UX Improvements**:
    - Auto-slug generation (already present, will verify).
    - Loading states and error handling with `sonner` toasts.
    - Smooth transitions.

### 4. Implementation Steps
1.  **Update `organization-dashboard.tsx`**:
    - Replace standard `<Card>` with custom "Premium Card" styling for the list.
    - Remove `showCreateForm` state and logic.
    - Point "Create" actions to `/organization/create`.
2.  **Update `create/page.tsx`**:
    - Add the "Glowing Top Border" effect to the main container.
3.  **Verify & Test**:
    - Check mobile responsiveness.
    - Verify `better-auth` integration (creation flow).
