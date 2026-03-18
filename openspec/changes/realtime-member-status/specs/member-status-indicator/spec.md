# Member Status Indicator

Visual indicator for member status.

## Overview

This capability defines the visual representation of member status across the application. Status indicators use consistent colors and icons to communicate member availability.

## Definitions

- **Status Dot**: Small circular indicator showing status
- **Status Badge**: Label showing status text with background color

## ADDED Requirements

### Requirement: Status Colors

Status indicators SHALL use consistent colors.

#### Scenario: Color Assignment
WHEN displaying member status
THEN the following colors SHALL be used:
  - `busy`: Red (#ef4444) with light red background (#fee2e2)
  - `idle`: Green (#22c55e) with light green background (#dcfce7)
  - `offline`: Light gray (#d1d5db) - not displayed in panel

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
