# Team List Display

Team list display capability - extended for online member status.

## Overview

This capability extends the existing team list display to include real-time member status in the ChatArea Header.

## MODIFIED Requirements

### Requirement: Header Online Display

The ChatArea Header SHALL display real-time member status.

#### Scenario: Show Online Status Trigger
WHEN the user views a team chat
THEN the header SHALL display the team name
AND the header SHALL display an online members trigger below the team name
AND the trigger SHALL be clickable to expand the member panel
AND the trigger SHALL show busy/occupied/idle counts with colored dots

#### Scenario: No Online Members
WHEN there are no online members (all offline)
THEN the trigger SHALL display "0 在线"
AND the panel SHALL show all members in offline section

#### Scenario: Mixed Status Members
WHEN there are members with different statuses
THEN the trigger SHALL display busy/occupied/idle counts separated by dots
AND the panel SHALL show members grouped by status
