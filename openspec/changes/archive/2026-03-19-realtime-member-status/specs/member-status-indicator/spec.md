# Member Status Indicator

Visual indicator for member status.

## Overview

This capability defines the visual representation of member status across the application. Status indicators use consistent colors and icons to communicate member availability.

## Definitions

- **Status Dot**: Small circular indicator showing status
- **Status Badge**: Label showing status text with background color

## Status Types

| Status | Color | Background | Label |
|--------|-------|------------|-------|
| `busy` | #ef4444 (红色) | #fee2e2 | 执行中 |
| `idle` | #22c55e (绿色) | #dcfce7 | 空闲 |
| `occupied` | #eab308 (黄色) | #fef9c3 | 繁忙 |
| `offline` | #9ca3af (灰色) | #f3f4f6 | 离线 |

## ADDED Requirements

### Requirement: Status Colors

Status indicators SHALL use consistent colors.

#### Scenario: Color Assignment
WHEN displaying member status
THEN the following colors SHALL be used:
  - `busy`: Red (#ef4444) with light red background (#fee2e2)
  - `idle`: Green (#22c55e) with light green background (#dcfce7)
  - `occupied`: Yellow (#eab308) with light yellow background (#fef9c3)
  - `offline`: Gray (#9ca3af) with light gray background (#f3f4f6)

### Requirement: Status Icons

Status indicators SHALL use lucide icons.

#### Scenario: Icon Usage
WHEN displaying status icons
THEN the system SHALL use lucide `circle` icon
AND the icon SHALL be filled with the status color
AND the icon size SHALL be 8px in trigger, 14px in panel

### Requirement: Avatar Status Dot

Member avatars SHALL show status indicator.

#### Scenario: Avatar with Status
WHEN displaying a member avatar in the panel
THEN a status dot SHALL appear at the bottom-right of the avatar
AND the dot SHALL be 12px diameter with 2px white border
AND the dot color SHALL match the member's status
AND the dot SHALL NOT appear for offline members (they appear grayed out)

### Requirement: Status Badge

Panel SHALL display status badges for non-offline members.

#### Scenario: Badge Display
WHEN displaying a member item in the panel
THEN a status badge SHALL appear next to the member name
AND the badge SHALL show the status label in Chinese
AND the badge SHALL NOT appear for offline members
