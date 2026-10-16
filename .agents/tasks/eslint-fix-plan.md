# ESLint Issues Fix Plan

This plan addresses all ESLint errors and warnings identified in the givehand-et project, organized by category and file.

---

## 1. Unused Imports (Warnings)

Remove unused icon imports from the following files. These icons are imported but never referenced in JSX.

### File: `src/app/dashboard/commitments/_components/commitments-view.tsx`
- **Lines 16, 20, 21:** Remove unused imports `Building2`, `ShieldCheck`, `Sparkles`
- **Reason:** These icons are imported from lucide-react but never used in the component JSX
- **Verify:** Run tests for commitments view; visual inspection confirms removal does not break UI

### File: `src/app/dashboard/materials/_components/supporter-materials-view.tsx`
- **Lines 14, 15:** Remove unused imports `ShieldCheck`, `Eye`
- **Reason:** These icons are not used anywhere in the component
- **Verify:** Component still renders correctly; all used icons remain

### File: `src/app/dashboard/page.tsx`
- **Lines 7, 9, 13:** Remove unused imports `Award`, `Clock`, `ShieldCheck`
- **Reason:** These specific icons are imported but not rendered
- **Verify:** Dashboard page still renders all content correctly

### File: `src/app/dashboard/profile/_components/profile-form.tsx`
- **Line 63:** Remove unused parameter `userId` from function props
- **Reason:** `userId` is destructured in the `Props` interface but never used in the component logic
- **Verify:** Form functionality remains intact; save operations work correctly

### File: `src/app/onboarding/_components/onboarding-form.tsx`
- **Line 57:** Remove unused parameter `_email` (rename parameter to `_email` to acknowledge it's intentionally unused, then remove it)
- **Line 63:** Remove unused `interestInput` and `setInterestInput` state variables
- **Reason:** `_email` parameter is never used; interest input is managed through direct state updates on cause suggestion buttons
- **Verify:** Onboarding form still collects and saves interests correctly

---

## 2. setState Called Synchronously Inside useEffect (Errors)

These errors violate React's rule against calling setState directly in effect bodies, which can cause cascading renders.

### File: `src/app/dashboard/commitments/_components/commitments-view.tsx` (Line 53)
**Issue:** `setCommitments(initialCommitments)` called directly in useEffect body
```
useEffect(() => {
  setCommitments(initialCommitments);
}, [initialCommitments]);
```
**Fix:** This is a controlled state sync pattern. The issue is that `setCommitments` is called unconditionally on every `initialCommitments` change. Move this to the initialization:
- Set initial state using the default value parameter of `useState`, or
- Use a ref to skip the first effect, then sync on subsequent changes
- **Solution:** Initialize state directly: `const [commitments, setCommitments] = React.useState<SupporterCommitment[]>(initialCommitments)` (already done), then remove this effect entirely since initial sync happens on mount. If re-sync is needed when parent props change, restructure to pass key prop to component instead.
- **Files to modify:** `src/app/dashboard/commitments/_components/commitments-view.tsx`
- **Verify:** Commitments display correctly and update when parent component updates

### File: `src/components/layout/header.tsx` (Line 70)
**Issue:** State updates in useEffect related to locale cookie reading
```
useEffect(() => {
  // ... getUser() ...
  if (cookieLocale === "am" || cookieLocale === "en") setLocale(cookieLocale);
}, []);
```
**Fix:** This effect reads synchronously from cookies on mount and sets state. This is acceptable on mount but the linter may flag it due to missing dependency array inspection. Ensure the dependency array is explicit and empty `[]` for mount-only.
- **Solution:** Move cookie reading outside the effect into a separate initialization, or use a callback that updates state only once on mount
- **Files to modify:** `src/components/layout/header.tsx`
- **Verify:** Language locale persists correctly; no cascading renders occur

### File: `src/components/needs/need-filters.tsx` (Line 37)
**Issue:** `updateFilters` function defined inside useEffect but called before definition
```
useEffect(() => {
  const timer = setTimeout(() => {
    if (searchTerm !== currentQuery) {
      updateFilters({ query: searchTerm });  // ← Error: updateFilters not yet defined
    }
  }, 350);
  // ...
}, [searchTerm]);

const updateFilters = (newParams: ...) => { ... };  // ← Defined after effect
```
**Fix:** Move `updateFilters` function definition outside and above the useEffect, or restructure to define it inside the effect before using it.
- **Solution:** Extract `updateFilters` as a named function before the useEffect
- **Files to modify:** `src/components/needs/need-filters.tsx`
- **Verify:** Filter updates work correctly on search term change; debouncing applies as expected

---

## 3. Impure Function During Render (Error)

### File: `src/app/onboarding/_components/onboarding-form.tsx` (Line 158)
**Issue:** `Date.now()` called during component render when building the organization slug
```javascript
const slug = data.name
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

// In the Supabase insert (line ~179):
slug: `${slug}-${Date.now()}`,  // ← Date.now() called during render/submit
```
**Fix:** `Date.now()` should not be called during render. However, this code is inside `onOrgSubmit`, which is an async callback fired on form submission—not during render itself. Verify this is not being called during render. If there's another instance during render, wrap in `useMemo` or `useCallback`.
- **Solution:** Confirm that `Date.now()` only appears in event handlers (submit), not in render path. If ESLint still flags it, wrap the slug generation in a useMemo.
- **Files to modify:** `src/app/onboarding/_components/onboarding-form.tsx`
- **Verify:** Organization creation still generates unique slugs; no render-time side effects occur

---

## 4. Explicit 'any' Types (Errors)

Replace all instances of `any` type with proper TypeScript types.

### Files: Action files and components with untyped parameters
**Action:** Scan for `any` type usage throughout the codebase (especially in action functions in `src/lib/actions/`)
- **Search Pattern:** Look for `: any` or `as any` in TypeScript files
- **Solution:** Replace with specific types:
  - For function parameters: use specific types from `@/types/supabase` or define interfaces
  - For component props: define proper typed interfaces
  - For API responses: create typed return interfaces
- **Files to inspect:** All files in `src/lib/actions/` and components using actions
- **Verify:** TypeScript compilation succeeds with `npm run build`; no type errors remain

---

## 5. Unescaped HTML Entities (Error)

### File: `src/components/donations/donation-history-list.tsx` (Line 236)
**Issue:** Unescaped apostrophe in JSX text
```
"your payment within 24–48 hours."
```
If there's an unescaped apostrophe elsewhere, escape it using HTML entity or curly quote.
- **Solution:** Replace `'` with `&apos;` (HTML entity) or use a curly quote character
- **Files to modify:** `src/components/donations/donation-history-list.tsx`
- **Verify:** Page renders without warnings; text displays correctly

---

## 6. Missing useEffect Dependencies (React Hooks / Exhaustive Deps Warnings)

Review all useEffect hooks for missing dependency warnings. Each useEffect that references external variables should include them in the dependency array, or explicitly document why they are omitted.

### Files with potential issues:
- `src/components/layout/header.tsx`: Check all useEffect dependency arrays
- `src/components/needs/need-filters.tsx`: Check all useEffect dependency arrays
- `src/app/dashboard/commitments/_components/commitments-view.tsx`: Check all useEffect dependency arrays

**Solution Pattern:**
- For each useEffect, identify all external variables used inside it
- Add them to the dependency array, or
- Wrap functions in `useCallback` to stabilize identity, or
- Move the function inside the effect if it only exists for that effect

---

## 7. Variable Ordering / Access Before Declaration

### File: `src/components/needs/need-filters.tsx`
**Issue:** `updateFilters` function is called in useEffect (line 37) but defined later (line 41)
**Solution:** Move `updateFilters` function definition to appear before its first use
- Reorganize: Define `updateFilters` immediately after state declarations and before first useEffect
- **Files to modify:** `src/components/needs/need-filters.tsx`
- **Verify:** Linter passes; function logic remains unchanged

---

## Summary of Changes by File

| File | Issue Type | Lines | Action |
|------|-----------|-------|--------|
| `src/app/dashboard/commitments/_components/commitments-view.tsx` | Unused imports | 16, 20, 21 | Remove `Building2`, `ShieldCheck`, `Sparkles` |
| `src/app/dashboard/commitments/_components/commitments-view.tsx` | setState in useEffect | 53 | Remove effect or restructure state sync |
| `src/app/dashboard/materials/_components/supporter-materials-view.tsx` | Unused imports | 14, 15 | Remove `ShieldCheck`, `Eye` |
| `src/app/dashboard/page.tsx` | Unused imports | 7, 9, 13 | Remove `Award`, `Clock`, `ShieldCheck` |
| `src/app/dashboard/profile/_components/profile-form.tsx` | Unused parameter | 63 | Remove `userId` from props |
| `src/app/onboarding/_components/onboarding-form.tsx` | Unused imports/vars | 57, 63 | Remove `_email` param and `interestInput` state |
| `src/app/onboarding/_components/onboarding-form.tsx` | Impure render function | 158 | Verify `Date.now()` only in event handlers |
| `src/components/layout/header.tsx` | setState in useEffect | 70 | Restructure state initialization |
| `src/components/needs/need-filters.tsx` | Variable ordering | 37, 41 | Move `updateFilters` before useEffect |
| `src/components/needs/need-filters.tsx` | setState in useEffect | 37 | Fix by moving `updateFilters` earlier |
| `src/components/donations/donation-history-list.tsx` | Unescaped HTML | 236 | Escape apostrophes with `&apos;` or curly quotes |
| **Project-wide** | Explicit `any` types | Various | Replace with specific TypeScript types |
| **Project-wide** | Missing useEffect deps | Various | Audit and add missing dependencies |

---

## Verification Steps

1. **Run full lint check:** `npm run lint 2>&1` → Confirm all errors and warnings are resolved
2. **Build the project:** `npm run build` → Verify TypeScript compilation succeeds
3. **Run tests:** If test suite exists, run `npm test` to confirm no regressions
4. **Manual QA:**
   - Test commitments view loads and updates correctly
   - Test dashboard displays all icons and content
   - Test profile form saves and loads user data
   - Test onboarding form for both supporter and org modes
   - Test need filters search and filter logic works
   - Test header renders correctly in both light and dark modes
   - Test donations view displays all donation history

---

## Notes

- **Dependency array fixes:** These are often the most common; use the ESLint warning message to identify exactly which variables are missing
- **Type replacements:** Prioritize replacing `any` in action functions first, as they are typically core data pathways
- **Testing:** Each fix should be isolated and verified to avoid introducing new issues
