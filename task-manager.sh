#!/bin/bash

# Safee Analytics Task Manager
# Version 1.0
# Usage: ./task-manager.sh [command] [arguments]

set -e  # Exit on any error

# Configuration
TASK_FILE="TASKS.md"
SESSION_FILE="SESSIONS.md" 
DASHBOARD_FILE="DASHBOARD.md"
TIME_TRACKING_FILE="TIME_TRACKING.md"
TASK_MANAGER_FILE="TASK_MANAGER.md"
CONFIG_FILE=".task-config"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_header() {
    echo -e "${PURPLE}🚀 $1${NC}"
}

# Get current timestamp
get_timestamp() {
    date "+%Y-%m-%d %H:%M:%S"
}

# Get current date
get_date() {
    date "+%Y-%m-%d"
}

# Generate task ID
generate_task_id() {
    if [ -f "$CONFIG_FILE" ]; then
        LAST_ID=$(grep "last_task_id=" "$CONFIG_FILE" | cut -d'=' -f2)
        NEXT_ID=$((LAST_ID + 1))
    else
        NEXT_ID=1
    fi
    
    # Update config
    if [ -f "$CONFIG_FILE" ]; then
        sed -i.bak "s/last_task_id=.*/last_task_id=$NEXT_ID/" "$CONFIG_FILE"
    else
        echo "last_task_id=$NEXT_ID" > "$CONFIG_FILE"
        echo "current_session_id=" >> "$CONFIG_FILE"
        echo "session_start_time=" >> "$CONFIG_FILE"
    fi
    
    printf "%03d" $NEXT_ID
}

# Start session command
start_session() {
    local sprint_name="$1"
    local focus_area="$2"
    
    # Check if session is already active
    current_status=$(grep "Session Status" "$TASK_MANAGER_FILE" | cut -d':' -f2 | xargs)
    if [ "$current_status" != "IDLE" ]; then
        log_warning "Session already active. Stop current session first."
        return 1
    fi
    
    log_header "Starting Development Session"
    
    local session_id="SES_$(date +%Y%m%d_%H%M%S)"
    local start_time=$(get_timestamp)
    
    # Update configuration
    sed -i.bak "s/current_session_id=.*/current_session_id=$session_id/" "$CONFIG_FILE"
    sed -i.bak "s/session_start_time=.*/session_start_time=$start_time/" "$CONFIG_FILE"
    
    # Update TASK_MANAGER.md
    sed -i.bak "s/Session Status.*IDLE/Session Status**: ACTIVE/" "$TASK_MANAGER_FILE"
    sed -i.bak "s/Current Sprint.*Not Set/Current Sprint**: $sprint_name/" "$TASK_MANAGER_FILE"
    sed -i.bak "s/Session Start Time.*-/Session Start Time**: $start_time/" "$TASK_MANAGER_FILE"
    
    # Update SESSIONS.md
    sed -i.bak "s/Status.*IDLE/Status**: ACTIVE/" "$SESSION_FILE"
    sed -i.bak "s/Session ID.*-/Session ID**: $session_id/" "$SESSION_FILE"
    sed -i.bak "s/Sprint.*-/Sprint**: $sprint_name/" "$SESSION_FILE"
    sed -i.bak "s/Start Time.*-/Start Time**: $start_time/" "$SESSION_FILE"
    
    log_success "Session started successfully!"
    log_info "Session ID: $session_id"
    log_info "Sprint: $sprint_name"
    [ -n "$focus_area" ] && log_info "Focus: $focus_area"
    log_info "Start Time: $start_time"
    echo
    log_info "Use 'session-status' to check current session"
    log_info "Use 'stop-session' to end session"
}

# Stop session command
stop_session() {
    local notes="$1"
    
    # Check if session is active
    current_status=$(grep "Session Status" "$TASK_MANAGER_FILE" | cut -d':' -f2 | xargs)
    if [ "$current_status" = "IDLE" ]; then
        log_warning "No active session to stop."
        return 1
    fi
    
    log_header "Ending Development Session"
    
    local end_time=$(get_timestamp)
    local session_id=$(grep "current_session_id=" "$CONFIG_FILE" | cut -d'=' -f2)
    local start_time=$(grep "session_start_time=" "$CONFIG_FILE" | cut -d'=' -f2)
    
    # Calculate duration (simplified - you might want to use date arithmetic)
    log_info "End Time: $end_time"
    
    # Reset session status
    sed -i.bak "s/Session Status.*ACTIVE/Session Status**: IDLE/" "$TASK_MANAGER_FILE"
    sed -i.bak "s/Current Sprint.*$/Current Sprint**: Not Set/" "$TASK_MANAGER_FILE"
    sed -i.bak "s/Session Start Time.*$/Session Start Time**: -/" "$TASK_MANAGER_FILE"
    sed -i.bak "s/Total Session Time.*$/Total Session Time**: 00:00:00/" "$TASK_MANAGER_FILE"
    
    # Update SESSIONS.md
    sed -i.bak "s/Status.*ACTIVE/Status**: IDLE/" "$SESSION_FILE"
    sed -i.bak "s/End Time.*-/End Time**: $end_time/" "$SESSION_FILE"
    
    # Clear session config
    sed -i.bak "s/current_session_id=.*/current_session_id=/" "$CONFIG_FILE"
    sed -i.bak "s/session_start_time=.*/session_start_time=/" "$CONFIG_FILE"
    
    log_success "Session ended successfully!"
    [ -n "$notes" ] && log_info "Notes: $notes"
    log_info "Session summary has been saved to history"
}

# Session status command
session_status() {
    log_header "Current Session Status"
    
    # Read current session info from files
    local session_status=$(grep "Session Status" "$TASK_MANAGER_FILE" | cut -d':' -f2 | xargs)
    local current_sprint=$(grep "Current Sprint" "$TASK_MANAGER_FILE" | cut -d':' -f2 | xargs)
    local start_time=$(grep "Session Start Time" "$TASK_MANAGER_FILE" | cut -d':' -f2 | xargs)
    local active_tasks=$(grep "Active Tasks" "$TASK_MANAGER_FILE" | cut -d':' -f2 | xargs)
    
    echo "Status: $session_status"
    echo "Sprint: $current_sprint"
    echo "Start Time: $start_time"
    echo "Active Tasks: $active_tasks"
    
    if [ "$session_status" = "ACTIVE" ]; then
        log_info "Session is currently running"
    else
        log_info "No active session"
    fi
}

# Add task command
add_task() {
    local description="$1"
    local priority="${2:-P2}"
    local module="${3:-Infrastructure}"
    
    if [ -z "$description" ]; then
        log_error "Task description is required"
        echo "Usage: add-task \"Task description\" [priority] [module]"
        return 1
    fi
    
    local task_id=$(generate_task_id)
    local timestamp=$(get_timestamp)
    
    log_info "Adding new task..."
    
    # Create task entry
    cat << EOF >> "$TASK_FILE"

### Task #$task_id - $description
**Status**: TODO  
**Priority**: $priority  
**Module**: $module  
**Assignee**: -  
**Sprint**: Phase 1 - Foundation  
**Created**: $timestamp  
**Started**: -  
**Completed**: -  
**Time Spent**: 00:00  

**Description**: $description

**Acceptance Criteria**:
- [ ] Define acceptance criteria

**Dependencies**: None

**Notes**: Task created via task manager

**Related Files**: 

---
EOF

    # Update statistics in TASKS.md
    update_task_statistics
    
    log_success "Task #$task_id created successfully!"
    log_info "Description: $description"
    log_info "Priority: $priority"
    log_info "Module: $module"
}

# List tasks command
list_tasks() {
    local filter="$1"
    local value="$2"
    
    log_header "Task List"
    
    case "$filter" in
        --status)
            log_info "Filtering by status: $value"
            grep -A 10 "Task #" "$TASK_FILE" | grep -B 10 -A 10 "Status.*$value"
            ;;
        --priority)
            log_info "Filtering by priority: $value"
            grep -A 10 "Task #" "$TASK_FILE" | grep -B 10 -A 10 "Priority.*$value"
            ;;
        --module)
            log_info "Filtering by module: $value"
            grep -A 10 "Task #" "$TASK_FILE" | grep -B 10 -A 10 "Module.*$value"
            ;;
        *)
            log_info "Showing all tasks"
            grep "### Task #" "$TASK_FILE"
            ;;
    esac
}

# Complete task command
complete_task() {
    local task_id="$1"
    
    if [ -z "$task_id" ]; then
        log_error "Task ID is required"
        echo "Usage: complete-task [task-id]"
        return 1
    fi
    
    # Format task ID with leading zeros
    task_id=$(printf "%03d" "$task_id")
    
    # Check if task exists
    if ! grep -q "Task #$task_id" "$TASK_FILE"; then
        log_error "Task #$task_id not found"
        return 1
    fi
    
    local timestamp=$(get_timestamp)
    
    log_info "Marking task #$task_id as completed..."
    
    # Update task status
    sed -i.bak "/Task #$task_id/,/^---$/ s/Status.*TODO/Status**: DONE/" "$TASK_FILE"
    sed -i.bak "/Task #$task_id/,/^---$/ s/Completed.*-/Completed**: $timestamp/" "$TASK_FILE"
    
    update_task_statistics
    
    log_success "Task #$task_id marked as completed!"
}

# Update task statistics
update_task_statistics() {
    local total_tasks=$(grep -c "### Task #" "$TASK_FILE")
    local todo_tasks=$(grep -c "Status.*TODO" "$TASK_FILE")
    local done_tasks=$(grep -c "Status.*DONE" "$TASK_FILE")
    local in_progress_tasks=$(grep -c "Status.*IN_PROGRESS" "$TASK_FILE")
    
    # Update TASKS.md statistics
    sed -i.bak "s/Total Tasks.*[0-9]*/Total Tasks**: $total_tasks/" "$TASK_FILE"
    sed -i.bak "s/Todo.*[0-9]*/Todo**: $todo_tasks/" "$TASK_FILE"
    sed -i.bak "s/Completed.*[0-9]*/Completed**: $done_tasks/" "$TASK_FILE"
    sed -i.bak "s/In Progress.*[0-9]*/In Progress**: $in_progress_tasks/" "$TASK_FILE"
}

# Show help
show_help() {
    cat << EOF
${PURPLE}Safee Analytics Task Manager${NC}
${BLUE}Version 1.0${NC}

${YELLOW}Session Management:${NC}
  start-session [sprint-name] [focus]  Start a new development session
  stop-session [notes]                 End current session  
  session-status                       Show current session status

${YELLOW}Task Management:${NC}
  add-task "description" [P0-P4] [module]    Add new task
  list-tasks [--filter] [value]              List tasks
  complete-task [task-id]                     Mark task as completed
  start-task [task-id]                        Start working on task
  update-task [task-id] [field] [value]       Update task

${YELLOW}Filters:${NC}
  --status [TODO|IN_PROGRESS|DONE|BLOCKED]
  --priority [P0|P1|P2|P3|P4]
  --module [Infrastructure|Hisabiq|Kanz|Nisbah|Frontend|Testing]

${YELLOW}Reports:${NC}
  dashboard                            Show project dashboard
  time-report [daily|weekly|monthly]   Show time reports

${YELLOW}Examples:${NC}
  ${GREEN}./task-manager.sh start-session "Phase 1 Sprint 1" "Backend Setup"${NC}
  ${GREEN}./task-manager.sh add-task "Setup NestJS backend" P0 Infrastructure${NC}
  ${GREEN}./task-manager.sh list-tasks --status TODO${NC}
  ${GREEN}./task-manager.sh complete-task 1${NC}
  ${GREEN}./task-manager.sh stop-session "Completed authentication module"${NC}

EOF
}

# Main command dispatcher
main() {
    case "$1" in
        start-session)
            start_session "$2" "$3"
            ;;
        stop-session)
            stop_session "$2"
            ;;
        session-status)
            session_status
            ;;
        add-task)
            add_task "$2" "$3" "$4"
            ;;
        list-tasks)
            list_tasks "$2" "$3"
            ;;
        complete-task)
            complete_task "$2"
            ;;
        dashboard)
            log_info "Opening dashboard..."
            cat "$DASHBOARD_FILE"
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            log_error "Unknown command: $1"
            echo
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"