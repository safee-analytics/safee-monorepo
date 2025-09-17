# Safee Analytics Task Manager

A comprehensive markdown-based task management system designed specifically for the Safee Analytics project development.

## 🚀 Quick Start

### 1. Basic Setup
```bash
# Make the script executable
chmod +x task-manager.sh

# Show help
./task-manager.sh help
```

### 2. Start Your First Session
```bash
# Start a development session
./task-manager.sh start-session "Phase 1 Sprint 1" "Backend Development"

# Check session status
./task-manager.sh session-status
```

### 3. Add and Manage Tasks
```bash
# Add a new task
./task-manager.sh add-task "Setup NestJS backend project" P0 Infrastructure

# List all tasks
./task-manager.sh list-tasks

# Mark task as completed
./task-manager.sh complete-task 1
```

### 4. End Your Session
```bash
# Stop the session
./task-manager.sh stop-session "Completed backend setup"
```

---

## 📁 File Structure

```
safee/
├── TASK_MANAGER.md          # Main task manager interface
├── TASKS.md                 # Task database and history
├── SESSIONS.md              # Session management and history
├── DASHBOARD.md             # Project dashboard and analytics
├── TIME_TRACKING.md         # Time tracking and reports
├── task-manager.sh          # Main CLI script
├── .task-config             # Configuration file (auto-generated)
├── PRD.md                   # Product Requirements Document
├── TECHNICAL_SPEC.md        # Technical Specifications
└── IMPLEMENTATION_ROADMAP.md # Implementation Roadmap
```

---

## 🎯 Core Features

### ✅ Session Management
- **Start/Stop Sessions**: Track development sessions with timestamps
- **Session Focus**: Set focus areas and sprint goals
- **Session History**: Maintain detailed session logs
- **Time Tracking**: Automatic session duration tracking

### 📋 Task Management
- **CRUD Operations**: Create, read, update, and delete tasks
- **Status Tracking**: TODO, IN_PROGRESS, BLOCKED, REVIEW, TESTING, DONE
- **Priority Levels**: P0 (Critical) to P4 (Backlog)
- **Module Organization**: Infrastructure, Hisabiq, Kanz, Nisbah, Frontend, Testing
- **Task Dependencies**: Track task relationships and blockers

### 📊 Reporting & Analytics
- **Dashboard View**: Real-time project overview
- **Time Reports**: Daily, weekly, and monthly time summaries
- **Progress Tracking**: Sprint progress and milestone tracking
- **Task Statistics**: Comprehensive task analytics

### 🔍 Filtering & Search
- **Status Filtering**: View tasks by status
- **Priority Filtering**: Focus on high-priority items
- **Module Filtering**: Organize by project modules
- **Sprint Filtering**: View sprint-specific tasks

---

## 📚 Command Reference

### Session Commands

#### Start Session
```bash
./task-manager.sh start-session [sprint-name] [focus-area]

# Examples:
./task-manager.sh start-session "Phase 1 Sprint 1"
./task-manager.sh start-session "Backend Development" "Authentication Module"
```

#### Stop Session
```bash
./task-manager.sh stop-session [notes]

# Examples:
./task-manager.sh stop-session
./task-manager.sh stop-session "Completed JWT implementation"
```

#### Session Status
```bash
./task-manager.sh session-status

# Shows:
# - Current session status (ACTIVE/IDLE)
# - Session start time
# - Current sprint
# - Active tasks count
```

### Task Commands

#### Add Task
```bash
./task-manager.sh add-task "description" [priority] [module]

# Examples:
./task-manager.sh add-task "Setup database schema" P0 Infrastructure
./task-manager.sh add-task "Implement invoice PDF generation" P1 Hisabiq
./task-manager.sh add-task "Create employee management UI" P2 Frontend
```

#### List Tasks
```bash
./task-manager.sh list-tasks [filter] [value]

# Examples:
./task-manager.sh list-tasks                    # All tasks
./task-manager.sh list-tasks --status TODO      # Only TODO tasks
./task-manager.sh list-tasks --priority P0      # Only critical tasks
./task-manager.sh list-tasks --module Hisabiq   # Only Hisabiq tasks
```

#### Complete Task
```bash
./task-manager.sh complete-task [task-id]

# Examples:
./task-manager.sh complete-task 1
./task-manager.sh complete-task 005
```

### Utility Commands

#### Dashboard
```bash
./task-manager.sh dashboard

# Shows comprehensive project dashboard with:
# - Project overview
# - Current sprint status
# - Task statistics
# - High priority tasks
# - Progress charts
```

#### Help
```bash
./task-manager.sh help
./task-manager.sh --help
./task-manager.sh -h
```

---

## 🏗️ Task Categories & Modules

### 🏗️ Infrastructure & Setup
Core platform setup, architecture, and DevOps
- Backend architecture
- Database configuration
- API Gateway setup
- CI/CD pipeline
- Development environment

### 💰 Hisabiq Module (Accounting)
Accounting and financial management features
- Invoice management
- Customer management
- Financial reporting
- PDF generation
- Payment tracking

### 👥 Kanz Module (HR & Payroll)
Human resources and payroll management
- Employee management
- Payroll processing
- HR analytics
- Performance tracking
- Attendance management

### 📞 Nisbah Module (CRM)
Customer relationship management
- Lead management
- Contact management
- Sales pipeline
- CRM analytics
- Customer interactions

### 🎨 Frontend Development
User interface and experience
- React components
- UI/UX implementation
- State management
- Responsive design
- Internationalization

### 🧪 Testing & Quality
Quality assurance and testing
- Unit tests
- Integration tests
- Performance testing
- Security testing
- Code quality

---

## 📈 Priority Levels

| Priority | Description | Usage |
|----------|-------------|-------|
| **P0** | Critical/Blocker | Must be done immediately, blocks other work |
| **P1** | High Priority | Should be done this sprint, important features |
| **P2** | Medium Priority | Can be done this sprint, standard features |
| **P3** | Low Priority | Nice to have, enhancement features |
| **P4** | Backlog | Future consideration, ideas and improvements |

---

## 📊 Task Status Workflow

```
TODO → IN_PROGRESS → [REVIEW] → [TESTING] → DONE
  ↓         ↓            ↓          ↓
BLOCKED   BLOCKED    BLOCKED    BLOCKED
  ↓         ↓            ↓          ↓
CANCELLED CANCELLED  CANCELLED  CANCELLED
```

### Status Descriptions
- **TODO**: Ready to be worked on
- **IN_PROGRESS**: Currently being developed
- **BLOCKED**: Cannot proceed due to dependencies
- **REVIEW**: Ready for code review
- **TESTING**: In testing/QA phase
- **DONE**: Completed and verified
- **CANCELLED**: No longer needed

---

## ⚙️ Configuration

### Configuration File (.task-config)
```
last_task_id=3
current_session_id=SES_20250825_103000
session_start_time=2025-08-25 10:30:00
```

### Customization
You can modify the following in `task-manager.sh`:
- **File paths**: Change markdown file locations
- **Colors**: Modify console output colors
- **Task ID format**: Change task numbering scheme
- **Default values**: Set default priority/module values

---

## 🔗 Integration

### With Git
```bash
# Add task files to git
git add TASK*.md SESSIONS.md DASHBOARD.md
git commit -m "Update task management files"

# Create aliases in .gitconfig
git config alias.tm '!./task-manager.sh'
```

### With VS Code
Add to your `settings.json`:
```json
{
  "files.watcherExclude": {
    "**/.task-config": true
  },
  "markdown.preview.breaks": true
}
```

### With Cron (Auto-updates)
```bash
# Add to crontab for daily dashboard updates
0 9 * * * cd /path/to/safee && ./update-dashboard.sh
```

---

## 📱 Shortcuts & Aliases

Add these to your `.bashrc` or `.zshrc`:

```bash
# Task manager aliases
alias tm='./task-manager.sh'
alias start-work='./task-manager.sh start-session'
alias stop-work='./task-manager.sh stop-session'
alias add-task='./task-manager.sh add-task'
alias done-task='./task-manager.sh complete-task'
alias tasks='./task-manager.sh list-tasks'
alias dash='./task-manager.sh dashboard'

# Quick task operations
alias todo='./task-manager.sh list-tasks --status TODO'
alias doing='./task-manager.sh list-tasks --status IN_PROGRESS'
alias done='./task-manager.sh list-tasks --status DONE'
alias blocked='./task-manager.sh list-tasks --status BLOCKED'

# Priority-based views
alias critical='./task-manager.sh list-tasks --priority P0'
alias high='./task-manager.sh list-tasks --priority P1'

# Module-specific views
alias backend='./task-manager.sh list-tasks --module Infrastructure'
alias frontend='./task-manager.sh list-tasks --module Frontend'
```

---

## 🚨 Troubleshooting

### Common Issues

#### "Permission denied" error
```bash
chmod +x task-manager.sh
```

#### Tasks not showing up
Check if the TASKS.md file exists and has proper formatting.

#### Session won't start
Ensure no active session is running. Use `session-status` to check.

#### Time tracking issues
Verify the .task-config file permissions and format.

### File Recovery
If markdown files get corrupted:
```bash
# Restore from git (if versioned)
git checkout HEAD -- TASKS.md SESSIONS.md

# Or restore from backup
cp TASKS.md.bak TASKS.md
```

---

## 🤝 Contributing

### Adding New Features
1. Edit `task-manager.sh` for new commands
2. Update help text in `show_help()` function
3. Add documentation to this README
4. Test thoroughly with different scenarios

### File Format Guidelines
- Use consistent markdown formatting
- Maintain proper heading hierarchy
- Include timestamps in ISO format
- Use standardized task templates

---

## 📄 License

This task management system is part of the Safee Analytics project and is intended for internal development use.

---

## 📞 Support

For issues or questions about the task manager:
1. Check the troubleshooting section above
2. Review the command reference
3. Examine the generated markdown files for data integrity
4. Test with minimal examples first

---

*Version: 1.0*  
*Last Updated: 2025-08-25*  
*Maintained by: Safee Analytics Development Team*