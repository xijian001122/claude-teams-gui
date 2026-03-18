# Online Members Panel

Interactive dropdown panel for viewing team member status.

## Overview

This capability provides a dropdown panel component that displays the list of team members grouped by their current status. The panel is triggered from the ChatArea Header and provides real-time status updates.

## Definitions

- **Trigger**: The clickable element in the header that shows status summary
- **Panel**: The dropdown container that displays member list
- **Status Group**: A section of the panel containing members with the same status

## ADDED Requirements

### Requirement: Trigger Display

The online members trigger SHALL display in the ChatArea Header.

#### Scenario: Show Status Summary
WHEN the user views the ChatArea Header
THEN the trigger SHALL display status summary with icons and counts
AND the format SHALL be: `[busy-icon] N 执行中 · [idle-icon] M 空闲`
AND busy icon SHALL be red (#ef4444)
AND idle icon SHALL be green (#22c55e)

#### Scenario: Trigger Interaction
WHEN the user clicks the trigger
THEN the panel SHALL expand with smooth animation
AND clicking outside the panel SHALL close it
AND the trigger SHALL show active state when panel is open

### Requirement: Panel Content

The panel SHALL display members grouped by status.

#### Scenario: Busy Members Section
WHEN the panel is open and there are busy members
THEN the panel SHALL show a "执行中" section with red icon
AND each busy member SHALL display:
  - Avatar with status dot
  - Member name (bold)
  - Status badge (red, "执行中")
  - Task description (if available)
  - Time since last activity

#### Scenario: Idle Members Section
WHEN the panel is open and there are idle members
THEN the panel SHALL show an "空闲" section with green icon
AND each idle member SHALL display:
  - Avatar with status dot
  - Member name (bold)
  - Last activity time

### Requirement: Real-time Updates

The panel SHALL update in real-time without refresh.

#### Scenario: Status Change Updates Panel
WHEN a `member_status` WebSocket event is received
THEN the panel SHALL immediately update the member's position and status
AND the trigger summary SHALL update the counts
AND no page refresh SHALL be required
