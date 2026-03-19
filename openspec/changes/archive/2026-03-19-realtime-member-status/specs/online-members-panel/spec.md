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
AND the format SHALL be: `[busy-icon] N 执行中 · [occupied-icon] M 繁忙 · [idle-icon] K 空闲`
AND busy icon SHALL be red (#ef4444)
AND occupied icon SHALL be yellow (#eab308)
AND idle icon SHALL be green (#22c55e)
AND offline members SHALL NOT appear in the trigger count

#### Scenario: Trigger Interaction
WHEN the user clicks the trigger
THEN the panel SHALL expand with smooth animation
AND clicking outside the panel SHALL close it
AND the trigger SHALL show active state (blue background) when panel is open

### Requirement: Panel Content

The panel SHALL display ALL members grouped by status (including offline).

#### Scenario: Section Order
WHEN the panel is open
THEN sections SHALL appear in this order:
  1. Busy Members (执行中) - red section
  2. Occupied Members (繁忙) - yellow section
  3. Idle Members (空闲) - green section
  4. Offline Members (离线) - gray section (at bottom)

#### Scenario: Busy Members Section
WHEN the panel is open and there are busy members
THEN the panel SHALL show a "执行中" section with red icon
AND each busy member SHALL display:
  - Avatar with status dot (red)
  - Member name (bold)
  - Status badge (red, "执行中")
  - Status description ("正在处理任务")
  - Time since last activity

#### Scenario: Occupied Members Section
WHEN the panel is open and there are occupied members
THEN the panel SHALL show a "繁忙" section with yellow icon
AND each occupied member SHALL display:
  - Avatar with status dot (yellow)
  - Member name (bold)
  - Status badge (yellow, "繁忙")
  - Status description ("长时间工作中")
  - Time since last activity

#### Scenario: Idle Members Section
WHEN the panel is open and there are idle members
THEN the panel SHALL show a "空闲" section with green icon
AND each idle member SHALL display:
  - Avatar with status dot (green)
  - Member name (bold)
  - Status badge (green, "空闲")
  - Status description ("等待任务中")
  - Time since last activity

#### Scenario: Offline Members Section
WHEN the panel is open and there are offline members
THEN the panel SHALL show a "离线" section with gray icon
AND each offline member SHALL display:
  - Avatar (grayed out, no status dot)
  - Member name (normal)
  - No status badge
  - Status description ("已离线")
  - Time since last activity

#### Scenario: Online Count
WHEN the panel is open
THEN the header SHALL show "X 人在线" where X is the count of non-offline members

### Requirement: Real-time Updates

The panel SHALL update in real-time without refresh.

#### Scenario: Status Change Updates Panel
WHEN a `member_status` WebSocket event is received
THEN the panel SHALL immediately update the member's position and status
AND the trigger summary SHALL update the counts
AND no page refresh SHALL be required

### Requirement: Member Exclusion

The panel SHALL NOT display the current user.

#### Scenario: Exclude Current User
WHEN the panel is open
THEN the current user's own member entry SHALL NOT appear in the list
AND the online count SHALL exclude the current user
