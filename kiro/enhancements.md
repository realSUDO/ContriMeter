---

## 🔹 UI / UX ENHANCEMENT PROMPT — *ContriMeter*

Apply the following improvements to the **Team Workspace** and overall application while keeping the design **minimal, calm, and uncluttered**.

---

### 1. Task Filtering

* Extend task filters to include:

  * `All`
  * `Active`
  * `Completed`
  * `Inactive`
* Filters should be:

  * Subtle
  * Non-intrusive
  * Positioned near the task list header.

---

### 2. Timer Control Upgrade

* Replace the current **Start / Stop buttons** with a
  **toggle switch** using:

  > *Tailgrids — “React Slide Toggle Switch with Color-Shift”*

 ``` import React, { useState } from 'react'

const Switcher7 = () => {
  const [isChecked, setIsChecked] = useState(false)

  const handleCheckboxChange = () => {
    setIsChecked(!isChecked)
  }

  return (
    <>
      <label className='flex cursor-pointer select-none items-center'>
        <div className='relative'>
          <input
            type='checkbox'
            checked={isChecked}
            onChange={handleCheckboxChange}
            className='sr-only'
          />
          <div className='block h-8 w-14 rounded-full border border-[#BFCEFF] bg-[#EAEEFB]'></div>
          <div className='dot bg-primary absolute left-1 top-1 h-6 w-6 rounded-full transition'></div>
        </div>
      </label>
    </>
  )
}

export default Switcher7
``````
``` 
  ``````

* The switch should:

  * Toggle between *Running* and *Stopped*
  * Feel smooth and modern
  * Match the minimal aesthetic (no loud colors).

---

### 3. Team Workspace Layout Refinement

Reorganize the Team Workspace layout as follows:

#### Main Flow (center area)

1. **Tasks Section** – primary focus
2. **Contributions Dashboard** – placed *below tasks*

   * Clean layout
   * Member cards + circular progress bars
   * No clutter

#### Side Panel

* Add a **Team Chat Panel** on the **right side**.
* Must be:

  * Minimal
  * Toggleable (show / hide)
  * Calm in design — no notifications, no noise.
* Purpose:

  * Quick coordination, not a full messaging app.

---

### 4. Global Dark Mode Toggle

* Add a **Dark Mode toggle** in the **top-right corner** of the app.
* It should:

  * Switch between Light and Dark themes
  * Maintain the same:

    * Calm
    * Minimal
    * Professional aesthetic in both modes
* No flashy animations — smooth, subtle transitions only.

---

### 5. Top Navigation Bar

* Add a **top navigation bar** across the app.
* It should include only:

  * App name: **ContriMeter**
  * (Right side) Dark Mode toggle
* Keep the nav bar:

  * Slim
  * Clean
  * Non-distracting.

---

### 6. Design Integrity Rules

While adding all features:

* Preserve:

  * Whitespace
  * Soft shadows
  * Calm typography

* Avoid:

  * Overcrowding
  * Loud colors
  * Heavy animations
  * Feature overload

---

### 🎯 Final Objective

These changes should make ContriMeter feel:

> **More complete, more modern — but still calm and minimal.**
> Not louder. Not heavier. Just more refined.


