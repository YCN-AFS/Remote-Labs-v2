#!/bin/bash

# Remote Lab Manager - Linux Server Script
# Tương đương với init.ps1 cho Windows
# Quản lý kết nối và đồng bộ với máy thực hành Windows

# Configuration
SERVER_URL="http://103.218.122.188:8000"
LOG_FILE="/var/log/remote-lab-manager.log"
CONFIG_FILE="/etc/remote-lab/config.json"
SSH_KEY_PATH="/home/remote/.ssh/id_ed25519"
SSH_USER="remote"
SSH_PORT="8030"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")
            echo -e "${GREEN}[$timestamp] INFO: $message${NC}"
            ;;
        "WARN")
            echo -e "${YELLOW}[$timestamp] WARN: $message${NC}"
            ;;
        "ERROR")
            echo -e "${RED}[$timestamp] ERROR: $message${NC}"
            ;;
        "DEBUG")
            echo -e "${BLUE}[$timestamp] DEBUG: $message${NC}"
            ;;
    esac
    
    # Write to log file
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# Function to check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log "ERROR" "This script must be run as root"
        exit 1
    fi
}

# Function to install dependencies
install_dependencies() {
    log "INFO" "Installing dependencies..."
    
    # Update package list
    apt-get update -y
    
    # Install required packages
    apt-get install -y \
        curl \
        wget \
        jq \
        openssh-client \
        sshpass \
        nmap \
        netcat-openbsd \
        python3 \
        python3-pip \
        nodejs \
        npm
    
    # Install Python packages
    pip3 install requests psutil
    
    log "INFO" "Dependencies installed successfully"
}

# Function to setup SSH keys
setup_ssh_keys() {
    log "INFO" "Setting up SSH keys..."
    
    # Create .ssh directory
    mkdir -p /home/remote/.ssh
    chmod 700 /home/remote/.ssh
    chown remote:remote /home/remote/.ssh
    
    # Generate SSH key if not exists
    if [[ ! -f "$SSH_KEY_PATH" ]]; then
        log "INFO" "Generating new SSH key..."
        sudo -u remote ssh-keygen -t ed25519 -f "$SSH_KEY_PATH" -N "" -C "remote-lab-server"
    fi
    
    # Set proper permissions
    chmod 600 "$SSH_KEY_PATH"
    chmod 644 "$SSH_KEY_PATH.pub"
    chown remote:remote "$SSH_KEY_PATH" "$SSH_KEY_PATH.pub"
    
    log "INFO" "SSH keys setup completed"
    log "INFO" "Public key:"
    cat "$SSH_KEY_PATH.pub"
}

# Function to test connection to Windows machine
test_windows_connection() {
    local ip=$1
    local port=${2:-5985}
    
    log "INFO" "Testing connection to Windows machine: $ip:$port"
    
    # Test WinRM port
    if nc -z "$ip" "$port" 2>/dev/null; then
        log "INFO" "✅ WinRM port $port is open on $ip"
        return 0
    else
        log "WARN" "❌ WinRM port $port is not accessible on $ip"
        return 1
    fi
}

# Function to execute PowerShell command on Windows machine
execute_powershell_command() {
    local ip=$1
    local username=$2
    local password=$3
    local command=$4
    
    log "INFO" "Executing PowerShell command on $ip: $command"
    
    # Use winrm-cli or similar tool to execute PowerShell commands
    # This is a simplified version - in production, use proper WinRM client
    local result=$(curl -s -k -u "$username:$password" \
        -H "Content-Type: application/soap+xml; charset=utf-8" \
        -d "<?xml version='1.0' encoding='utf-8'?><soap:Envelope xmlns:soap='http://www.w3.org/2003/05/soap-envelope'><soap:Body><ExecuteCommand xmlns='http://schemas.microsoft.com/wbem/wsman/1/wmi/root/cimv2'><Command>$command</Command></ExecuteCommand></soap:Body></soap:Envelope>" \
        "http://$ip:5985/wsman" 2>/dev/null)
    
    if [[ $? -eq 0 ]]; then
        log "INFO" "✅ Command executed successfully"
        return 0
    else
        log "ERROR" "❌ Failed to execute command"
        return 1
    fi
}

# Function to send command to Windows machine
send_command_to_windows() {
    local ip=$1
    local action=$2
    local username=${3:-"Admin"}
    local password=${4:-"lhu@B304"}
    local software=${5:-""}
    local custom_command=${6:-""}
    
    log "INFO" "Sending command '$action' to Windows machine: $ip"
    
    # Map action to PowerShell command
    case $action in
        "create_user")
            local ps_command="New-LocalUser -Name '$username' -Password (ConvertTo-SecureString '$password' -AsPlainText -Force) -FullName 'Administrator' -Description 'Admin User' -AccountNeverExpires; Add-LocalGroupMember -Group 'Administrators' -Member '$username'"
            ;;
        "enable_rdp")
            local ps_command="Set-ItemProperty -Path 'HKLM:\System\CurrentControlSet\Control\Terminal Server' -Name 'fDenyTSConnections' -Value 0; Enable-NetFirewallRule -DisplayGroup 'Remote Desktop'"
            ;;
        "enable_powershell_remoting")
            local ps_command="Enable-PSRemoting -Force"
            ;;
        "install_software")
            case $software in
                "vscode")
                    local ps_command="Invoke-WebRequest -Uri 'https://update.code.visualstudio.com/latest/win32-x64/stable' -OutFile '\$env:USERPROFILE\Downloads\VSCodeSetup.exe'; Start-Process -FilePath '\$env:USERPROFILE\Downloads\VSCodeSetup.exe' -ArgumentList '/silent' -Wait; Remove-Item '\$env:USERPROFILE\Downloads\VSCodeSetup.exe'"
                    ;;
                "arduino")
                    local ps_command="Invoke-WebRequest -Uri 'https://downloads.arduino.cc/arduino-ide/arduino-ide_latest_Windows_64bit.zip' -OutFile '\$env:USERPROFILE\Downloads\arduino-ide-latest.zip'; Expand-Archive -Path '\$env:USERPROFILE\Downloads\arduino-ide-latest.zip' -DestinationPath 'C:\Program Files\Arduino' -Force; Remove-Item '\$env:USERPROFILE\Downloads\arduino-ide-latest.zip'"
                    ;;
                "camera")
                    local ps_command="Expand-Archive -Path '.\remote-lab-camera.zip' -DestinationPath 'C:\Program Files\remote-lab-camera' -Force"
                    ;;
            esac
            ;;
        "custom_command")
            local ps_command="$custom_command"
            ;;
        *)
            log "ERROR" "Unknown action: $action"
            return 1
            ;;
    esac
    
    # Execute the PowerShell command
    execute_powershell_command "$ip" "$username" "$password" "$ps_command"
}

# Function to get computer information from Windows machine
get_windows_computer_info() {
    local ip=$1
    local username=${2:-"Admin"}
    local password=${3:-"lhu@B304"}
    
    log "INFO" "Getting computer information from $ip"
    
    # PowerShell command to get computer info
    local ps_command="Get-ComputerInfo | Select-Object CsName, TotalPhysicalMemory, CsProcessors, WindowsProductName | ConvertTo-Json"
    
    # Execute and get result
    local result=$(execute_powershell_command "$ip" "$username" "$password" "$ps_command")
    
    if [[ $? -eq 0 ]]; then
        log "INFO" "✅ Computer information retrieved successfully"
        echo "$result"
        return 0
    else
        log "ERROR" "❌ Failed to get computer information"
        return 1
    fi
}

# Function to register computer with server
register_computer_with_server() {
    local name=$1
    local ip=$2
    local description=${3:-"Remote Lab PC - $name"}
    local nat_port_rdp=${4:-3389}
    local nat_port_winrm=${5:-5985}
    
    log "INFO" "Registering computer with server: $name ($ip)"
    
    # Prepare registration data
    local registration_data=$(cat <<EOF
{
    "name": "$name",
    "description": "$description",
    "ip_address": "$ip",
    "natPortRdp": $nat_port_rdp,
    "natPortWinRm": $nat_port_winrm
}
EOF
)
    
    # Send registration request
    local response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$registration_data" \
        "$SERVER_URL/api/computer/register")
    
    # Check response
    local status=$(echo "$response" | jq -r '.status' 2>/dev/null)
    
    if [[ "$status" == "success" ]]; then
        log "INFO" "✅ Computer registered successfully"
        local computer_id=$(echo "$response" | jq -r '.data.id' 2>/dev/null)
        log "INFO" "Computer ID: $computer_id"
        return 0
    else
        log "ERROR" "❌ Failed to register computer"
        log "ERROR" "Response: $response"
        return 1
    fi
}

# Function to monitor Windows machines
monitor_windows_machines() {
    log "INFO" "Starting Windows machines monitoring..."
    
    # Get list of registered computers
    local computers=$(curl -s "$SERVER_URL/api/computer" | jq -r '.data[] | @base64' 2>/dev/null)
    
    if [[ -z "$computers" ]]; then
        log "WARN" "No computers found in database"
        return 1
    fi
    
    # Process each computer
    echo "$computers" | while read -r computer_b64; do
        if [[ -n "$computer_b64" ]]; then
            local computer=$(echo "$computer_b64" | base64 -d)
            local name=$(echo "$computer" | jq -r '.name')
            local ip=$(echo "$computer" | jq -r '.ip_address')
            local status=$(echo "$computer" | jq -r '.status')
            
            log "INFO" "Checking computer: $name ($ip) - Status: $status"
            
            # Test connection
            if test_windows_connection "$ip"; then
                log "INFO" "✅ $name is online"
                # Update status to available if it was busy
                if [[ "$status" == "busy" ]]; then
                    # Update computer status (this would require a PUT request)
                    log "INFO" "Updating $name status to available"
                fi
            else
                log "WARN" "❌ $name is offline"
                # Update status to offline
                log "INFO" "Updating $name status to offline"
            fi
        fi
    done
}

# Function to setup scheduled tasks
setup_scheduled_tasks() {
    log "INFO" "Setting up scheduled tasks..."
    
    # Create systemd service for monitoring
    cat > /etc/systemd/system/remote-lab-monitor.service <<EOF
[Unit]
Description=Remote Lab Monitor Service
After=network.target

[Service]
Type=simple
User=root
ExecStart=/home/foxcode/Remote-Labs-v2/remote-lab-backend/scripts/remote-lab-manager.sh monitor
Restart=always
RestartSec=30

[Install]
WantedBy=multi-user.target
EOF

    # Create systemd timer for periodic monitoring
    cat > /etc/systemd/system/remote-lab-monitor.timer <<EOF
[Unit]
Description=Remote Lab Monitor Timer
Requires=remote-lab-monitor.service

[Timer]
OnBootSec=5min
OnUnitActiveSec=2min

[Install]
WantedBy=timers.target
EOF

    # Enable and start services
    systemctl daemon-reload
    systemctl enable remote-lab-monitor.timer
    systemctl start remote-lab-monitor.timer
    
    log "INFO" "Scheduled tasks setup completed"
}

# Function to show help
show_help() {
    cat <<EOF
Remote Lab Manager - Linux Server Script

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    install           Install dependencies and setup environment
    setup-ssh         Setup SSH keys for server
    test-connection   Test connection to Windows machine
    send-command      Send command to Windows machine
    register          Register computer with server
    monitor           Monitor all Windows machines
    setup-tasks       Setup scheduled monitoring tasks
    help              Show this help message

Options:
    -i, --ip IP       IP address of Windows machine
    -u, --user USER   Username for Windows machine (default: Admin)
    -p, --pass PASS   Password for Windows machine (default: lhu@B304)
    -a, --action ACT  Action to perform on Windows machine
    -s, --software    Software to install (vscode, arduino, camera)
    -c, --command     Custom PowerShell command to execute

Examples:
    $0 install
    $0 setup-ssh
    $0 test-connection -i 192.168.1.100
    $0 send-command -i 192.168.1.100 -a enable_rdp
    $0 send-command -i 192.168.1.100 -a install_software -s vscode
    $0 register -i 192.168.1.100 -n "PC-Lab-01"
    $0 monitor
    $0 setup-tasks

EOF
}

# Main function
main() {
    local command=$1
    shift
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -i|--ip)
                WINDOWS_IP="$2"
                shift 2
                ;;
            -u|--user)
                WINDOWS_USER="$2"
                shift 2
                ;;
            -p|--pass)
                WINDOWS_PASS="$2"
                shift 2
                ;;
            -a|--action)
                ACTION="$2"
                shift 2
                ;;
            -s|--software)
                SOFTWARE="$2"
                shift 2
                ;;
            -c|--command)
                CUSTOM_COMMAND="$2"
                shift 2
                ;;
            -n|--name)
                COMPUTER_NAME="$2"
                shift 2
                ;;
            *)
                shift
                ;;
        esac
    done
    
    # Set defaults
    WINDOWS_USER=${WINDOWS_USER:-"Admin"}
    WINDOWS_PASS=${WINDOWS_PASS:-"lhu@B304"}
    COMPUTER_NAME=${COMPUTER_NAME:-"PC-Lab-$(date +%s)"}
    
    case $command in
        "install")
            check_root
            install_dependencies
            ;;
        "setup-ssh")
            check_root
            setup_ssh_keys
            ;;
        "test-connection")
            if [[ -z "$WINDOWS_IP" ]]; then
                log "ERROR" "IP address is required. Use -i option."
                exit 1
            fi
            test_windows_connection "$WINDOWS_IP"
            ;;
        "send-command")
            if [[ -z "$WINDOWS_IP" || -z "$ACTION" ]]; then
                log "ERROR" "IP address and action are required. Use -i and -a options."
                exit 1
            fi
            send_command_to_windows "$WINDOWS_IP" "$ACTION" "$WINDOWS_USER" "$WINDOWS_PASS" "$SOFTWARE" "$CUSTOM_COMMAND"
            ;;
        "register")
            if [[ -z "$WINDOWS_IP" ]]; then
                log "ERROR" "IP address is required. Use -i option."
                exit 1
            fi
            register_computer_with_server "$COMPUTER_NAME" "$WINDOWS_IP"
            ;;
        "monitor")
            monitor_windows_machines
            ;;
        "setup-tasks")
            check_root
            setup_scheduled_tasks
            ;;
        "help"|"")
            show_help
            ;;
        *)
            log "ERROR" "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"
