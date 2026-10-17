# Appendix 3 — UI Business Rules

## Module
Study Planning Calendar

## Date
March 19, 2026

## Purpose
This document defines the UI-level business rules for the Study Planning Calendar feature of the ITPM Project. It outlines access controls, validation logic, system behaviors, and security constraints across the four core modules of the application.

---

## 1) Calendar View — Business Rules

| Category | Rule ID | Business Rule Description | System Response |
| :--- | :--- | :--- | :--- |
| **Access Control** | CV-AC-01 | Only authenticated users can access the calendar dashboard. | Redirect non-logged-in users to the /login screen. |
| **Workflow** | CV-WF-01 | Selecting a date cell loads the task list for that specific day in the sidebar/modal. | Filter task array by selected date and update the UI display. |
| **Capacity** | CV-CP-01 | Each day must display a Daily Workload Bar reflecting total scheduled hours. | Calculate sum(estimatedHours) per date and render the workload indicator. |
| **Capacity** | CV-CP-02 | Workload bars must follow color coding: <4h Green, 4-7h Orange, 8h+ Red. | Dynamically apply CSS color classes based on calculated daily totals. |
| **Data Consistency**| CV-DC-01 | Dragging a task to a new slot must update the underlying task date and time. | Trigger PUT /api/calendar/:id immediately upon event drop. |
| **Notification** | CV-NT-01 | UI must show a loading spinner or status text during initial task fetch. | Display "Loading calendar..." while tasks state is null. |
| **Security** | CV-SC-01 | Calendar must only load tasks associated with the current user's unique ID. | Backend query must include { userId: req.user._id } filter. |

---

## 2) Add Task Form — Business Rules

| Category | Rule ID | Business Rule Description | System Response |
| :--- | :--- | :--- | :--- |
| **Validation** | AT-VA-01 | Task Title and Subject/Module are mandatory fields. | Block submission and display "Field is required" error messages. |
| **Validation** | AT-VA-02 | End Time must strictly be later than Start Time. | Reject submission and show "End time must be after start time" error. |
| **Validation** | AT-VA-03 | Estimated Hours must be a positive number greater than zero. | Validate numeric input range before allowing save. |
| **Workflow** | AT-WF-01 | Default Status for new tasks is always "Pending". | Initialize the status field to 'Pending' in the database record. |
| **Capacity** | AT-CP-01 | Backend must detect time slot conflicts if a new task overlaps an existing one. | Return a 400 Bad Request with "Time slot conflict detected" if overlaps occur. |
| **Capacity** | AT-CP-02 | Total daily hours cannot exceed 8 hours for any single user. | Validate daily totals against capacity limit and return workload violation error. |
| **Data Consistency**| AT-DC-01 | Duplicate prevention: Title + Date + StartTime must be unique for the user. | Prevent duplicate record creation and show "Duplicate task detected" alert. |
| **Notification** | AT-NT-01 | On successful creation, the form must close and the calendar must refresh. | Call onRefresh() and onClose() handlers immediately after success response. |

---

## 3) Edit / Reschedule Task — Business Rules

| Category | Rule ID | Business Rule Description | System Response |
| :--- | :--- | :--- | :--- |
| **Access Control** | ER-AC-01 | Users can only open the Edit form for tasks they originally created. | Verify task.userId matches current authenticated userId. |
| **Validation** | ER-VA-01 | All validation rules from the 'Add Task' form also apply to editing. | Mandatory fields, time logic, and hours range must still be satisfied. |
| **Workflow** | ER-WF-01 | Tasks can move through states: Pending → In Progress → Done. | Update status field in the PUT payload and reflect on the calendar. |
| **Capacity** | ER-CP-01 | Rescheduling (Drag/Edit) is subject to the same 8h daily limit check. | Recalculate daily total after move and reject if it exceeds threshold. |
| **Data Consistency**| ER-DC-01 | Deleting a task must remove it from the calendar view and database. | Trigger DELETE /api/calendar/:id and update in-memory task state. |
| **Notification** | ER-NT-01 | Deletion requires a final user confirmation prompt. | Trigger window.confirm() or custom alert before proceeding with removal. |
| **Security** | ER-SC-01 | Edit/Delete API endpoints must verify JWT ownership per request. | Backend middleware must validate JWT and verify record ownership before mutating. |

---

## 4) Progress Indicator & Workload Analytics — Business Rules

| Category | Rule ID | Business Rule Description | System Response |
| :--- | :--- | :--- | :--- |
| **Capacity** | PW-CP-01 | The progress bar represents a 100% scale capped at 8 functional hours. | Width percentage = (hours / 8) * 100, capped at 100% visually. |
| **Data Consistency**| PW-DC-01 | Workload bars must update in real-time as tasks are added/rescheduled. | Re-run useMemo calculation whenever the 'tasks' dependency array updates. |
| **Workflow** | PW-WF-01 | High-workload days (>7h) should be prioritized for rescheduling alerts. | Color indicator turns Red to alert user of near-capacity or over-capacity. |
| **Security** | PW-SC-01 | Workload statistics are never shared between different users. | Aggregate data only within the scope of the logged-in user's tasks. |
| **Notification** | PW-NT-01 | System must display specific error messages for capacity violations. | Forward backend validation messages (e.g., "Daily limit exceeded") to the UI. |

---

## Approval / Sign-off

- **Prepared by**: Lead Developer / ITPM Team
- **Module**: ITPM Project Progress 1
- **Revision**: v1.1
- **Last Updated**: March 19, 2026
