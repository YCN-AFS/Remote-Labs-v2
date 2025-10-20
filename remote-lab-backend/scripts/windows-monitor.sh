#!/bin/bash

# Windows Lab Machine Monitor
# Kiểm tra kết nối và trạng thái máy thực hành Windows

# Configuration
SERVER_URL="http://103.218.122.188:8000"
LOG_FILE="/var/log/windows-monitor.log"
CONFIG_FILE="/etc/remote-lab/windows-monitor.conf"
CHECK_INTERVAL=30
TIMEOUT=10

# Default Windows machine settings
DEFAULT_WINRM_PORT=5985
DEFAULT_RDP_PORT=3389
DEFAULT_USER="Admin"
DEFAULT_PASS="lhu@B304"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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
        "STATUS")
            echo -e "${CYAN}[$timestamp] STATUS: $message${NC}"
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
    log "INFO" "Installing monitoring dependencies..."
    
    # Update package list
    apt-get update -y
    
    # Install required packages
    apt-get install -y \
        curl \
        wget \
        jq \
        nmap \
        netcat-openbsd \
        python3 \
        python3-pip \
        python3-requests \
        python3-psutil \
        expect \
        telnet
    
    # Install Python packages
    pip3 install requests psutil ping3
    
    log "INFO" "Dependencies installed successfully"
}

# Function to test network connectivity
test_network_connectivity() {
    local ip=$1
    local timeout=${2:-$TIMEOUT}
    
    log "DEBUG" "Testing network connectivity to $ip"
    
    # Use ping to test basic connectivity
    if ping -c 1 -W "$timeout" "$ip" >/dev/null 2>&1; then
        log "DEBUG" "✅ Ping successful to $ip"
        return 0
    else
        log "DEBUG" "❌ Ping failed to $ip"
        return 1
    fi
}

# Function to test port connectivity
test_port_connectivity() {
    local ip=$1
    local port=$2
    local timeout=${3:-$TIMEOUT}
    
    log "DEBUG" "Testing port connectivity to $ip:$port"
    
    # Use nc (netcat) to test port
    if timeout "$timeout" nc -z "$ip" "$port" 2>/dev/null; then
        log "DEBUG" "✅ Port $port is open on $ip"
        return 0
    else
        log "DEBUG" "❌ Port $port is closed on $ip"
        return 1
    fi
}

# Function to test WinRM connectivity
test_winrm_connectivity() {
    local ip=$1
    local port=${2:-$DEFAULT_WINRM_PORT}
    local username=${3:-$DEFAULT_USER}
    local password=${4:-$DEFAULT_PASS}
    
    log "DEBUG" "Testing WinRM connectivity to $ip:$port"
    
    # Test WinRM port first
    if ! test_port_connectivity "$ip" "$port"; then
        return 1
    fi
    
    # Test WinRM service with a simple SOAP request
    local soap_request='<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
    <soap:Header>
        <wsa:To xmlns:wsa="http://schemas.xmlsoap.org/ws/2004/08/addressing">http://'$ip':'$port'/wsman</wsa:To>
        <wsa:Action xmlns:wsa="http://schemas.xmlsoap.org/ws/2004/08/addressing">http://schemas.xmlsoap.org/ws/2004/09/enumeration/Enumerate</wsa:Action>
    </soap:Header>
    <soap:Body>
        <n:Enumerate xmlns:n="http://schemas.xmlsoap.org/ws/2004/09/enumeration"/>
    </soap:Body>
</soap:Envelope>'
    
    local response=$(curl -s -k -u "$username:$password" \
        -H "Content-Type: application/soap+xml; charset=utf-8" \
        -d "$soap_request" \
        "http://$ip:$port/wsman" 2>/dev/null)
    
    if echo "$response" | grep -q "EnumerateResponse"; then
        log "DEBUG" "✅ WinRM service is responding on $ip:$port"
        return 0
    else
        log "DEBUG" "❌ WinRM service is not responding on $ip:$port"
        return 1
    fi
}

# Function to test RDP connectivity
test_rdp_connectivity() {
    local ip=$1
    local port=${2:-$DEFAULT_RDP_PORT}
    
    log "DEBUG" "Testing RDP connectivity to $ip:$port"
    
    # Test RDP port
    if test_port_connectivity "$ip" "$port"; then
        log "DEBUG" "✅ RDP port $port is open on $ip"
        return 0
    else
        log "DEBUG" "❌ RDP port $port is closed on $ip"
        return 1
    fi
}

# Function to get Windows machine status
get_windows_status() {
    local ip=$1
    local username=${2:-$DEFAULT_USER}
    local password=${3:-$DEFAULT_PASS}
    
    log "DEBUG" "Getting Windows machine status from $ip"
    
    # PowerShell command to get system status
    local ps_command="
        \$status = @{
            ComputerName = \$env:COMPUTERNAME
            Uptime = (Get-Date) - (Get-CimInstance -ClassName Win32_OperatingSystem).LastBootUpTime
            TotalMemory = [math]::Round((Get-CimInstance -ClassName Win32_ComputerSystem).TotalPhysicalMemory / 1GB, 2)
            FreeMemory = [math]::Round((Get-CimInstance -ClassName Win32_OperatingSystem).FreePhysicalMemory / 1MB, 2)
            CPUUsage = [math]::Round((Get-Counter -Counter '\\Processor(_Total)\\% Processor Time' -SampleInterval 1 -MaxSamples 1).CounterSamples[0].CookedValue, 2)
            DiskUsage = Get-CimInstance -ClassName Win32_LogicalDisk | Where-Object {\$_.DriveType -eq 3} | Select-Object DeviceID, @{Name='Size(GB)';Expression={\$_.Size/1GB}}, @{Name='FreeSpace(GB)';Expression={\$_.FreeSpace/1GB}}
            Services = Get-Service | Where-Object {\$_.Status -eq 'Running'} | Measure-Object | Select-Object -ExpandProperty Count
            Processes = Get-Process | Measure-Object | Select-Object -ExpandProperty Count
            LastBoot = (Get-CimInstance -ClassName Win32_OperatingSystem).LastBootUpTime
            OSVersion = (Get-CimInstance -ClassName Win32_OperatingSystem).Caption
        }
        \$status | ConvertTo-Json -Depth 3
    "
    
    # Execute PowerShell command via WinRM
    local result=$(curl -s -k -u "$username:$password" \
        -H "Content-Type: application/soap+xml; charset=utf-8" \
        -d "<?xml version='1.0' encoding='utf-8'?><soap:Envelope xmlns:soap='http://www.w3.org/2003/05/soap-envelope'><soap:Body><ExecuteCommand xmlns='http://schemas.microsoft.com/wbem/wsman/1/wmi/root/cimv2'><Command>$ps_command</Command></ExecuteCommand></soap:Body></soap:Envelope>" \
        "http://$ip:$DEFAULT_WINRM_PORT/wsman" 2>/dev/null)
    
    if [[ $? -eq 0 ]] && echo "$result" | grep -q "ComputerName"; then
        log "DEBUG" "✅ Windows status retrieved successfully from $ip"
        echo "$result" | grep -o '{"ComputerName".*}' | jq . 2>/dev/null || echo "$result"
        return 0
    else
        log "DEBUG" "❌ Failed to get Windows status from $ip"
        return 1
    fi
}

# Function to check Windows services
check_windows_services() {
    local ip=$1
    local username=${2:-$DEFAULT_USER}
    local password=${3:-$DEFAULT_PASS}
    
    log "DEBUG" "Checking Windows services on $ip"
    
    # PowerShell command to check critical services
    local ps_command="
        \$services = @('Remote Desktop Services', 'Windows Remote Management (WS-Management)', 'OpenSSH Server', 'Windows Update')
        \$status = @{}
        foreach (\$service in \$services) {
            try {
                \$svc = Get-Service -Name \$service -ErrorAction SilentlyContinue
                if (\$svc) {
                    \$status[\$service] = @{
                        Status = \$svc.Status
                        StartType = \$svc.StartType
                    }
                } else {
                    \$status[\$service] = @{
                        Status = 'Not Found'
                        StartType = 'N/A'
                    }
                }
            } catch {
                \$status[\$service] = @{
                    Status = 'Error'
                    StartType = 'N/A'
                    Error = \$_.Exception.Message
                }
            }
        }
        \$status | ConvertTo-Json -Depth 3
    "
    
    # Execute PowerShell command via WinRM
    local result=$(curl -s -k -u "$username:$password" \
        -H "Content-Type: application/soap+xml; charset=utf-8" \
        -d "<?xml version='1.0' encoding='utf-8'?><soap:Envelope xmlns:soap='http://www.w3.org/2003/05/soap-envelope'><soap:Body><ExecuteCommand xmlns='http://schemas.microsoft.com/wbem/wsman/1/wmi/root/cimv2'><Command>$ps_command</Command></ExecuteCommand></soap:Body></soap:Envelope>" \
        "http://$ip:$DEFAULT_WINRM_PORT/wsman" 2>/dev/null)
    
    if [[ $? -eq 0 ]]; then
        log "DEBUG" "✅ Windows services status retrieved from $ip"
        echo "$result" | grep -o '{.*}' | jq . 2>/dev/null || echo "$result"
        return 0
    else
        log "DEBUG" "❌ Failed to get Windows services status from $ip"
        return 1
    fi
}

# Function to perform comprehensive check
comprehensive_check() {
    local ip=$1
    local name=${2:-"Unknown"}
    local username=${3:-$DEFAULT_USER}
    local password=${4:-$DEFAULT_PASS}
    
    log "STATUS" "Performing comprehensive check on $name ($ip)"
    
    local status="offline"
    local details=""
    
    # Test network connectivity
    if test_network_connectivity "$ip"; then
        details+="Network: ✅ "
        
        # Test WinRM
        if test_winrm_connectivity "$ip" "$DEFAULT_WINRM_PORT" "$username" "$password"; then
            details+="WinRM: ✅ "
            status="online"
            
            # Get detailed status
            local windows_status=$(get_windows_status "$ip" "$username" "$password")
            if [[ $? -eq 0 ]]; then
                details+="Status: ✅ "
                log "STATUS" "Windows Status: $windows_status"
            else
                details+="Status: ❌ "
            fi
            
            # Check services
            local services_status=$(check_windows_services "$ip" "$username" "$password")
            if [[ $? -eq 0 ]]; then
                details+="Services: ✅ "
                log "STATUS" "Services Status: $services_status"
            else
                details+="Services: ❌ "
            fi
        else
            details+="WinRM: ❌ "
        fi
        
        # Test RDP
        if test_rdp_connectivity "$ip"; then
            details+="RDP: ✅ "
        else
            details+="RDP: ❌ "
        fi
    else
        details+="Network: ❌ "
    fi
    
    log "STATUS" "$name ($ip): $status - $details"
    
    # Update server with status
    update_server_status "$ip" "$name" "$status" "$details"
    
    return 0
}

# Function to update server with machine status
update_server_status() {
    local ip=$1
    local name=$2
    local status=$3
    local details=$4
    
    log "DEBUG" "Updating server with status: $name ($ip) - $status"
    
    # Prepare status data
    local status_data=$(cat <<EOF
{
    "computer": "$name",
    "ip_address": "$ip",
    "status": "$status",
    "details": "$details",
    "timestamp": "$(date -Iseconds)",
    "last_check": "$(date -Iseconds)"
}
EOF
)
    
    # Send status to server
    local response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$status_data" \
        "$SERVER_URL/api/commands/status" 2>/dev/null)
    
    if [[ $? -eq 0 ]]; then
        log "DEBUG" "✅ Status updated on server"
    else
        log "WARN" "❌ Failed to update status on server"
    fi
}

# Function to get computers from server
get_computers_from_server() {
    log "DEBUG" "Getting computers list from server"
    
    local response=$(curl -s "$SERVER_URL/api/computer" 2>/dev/null)
    
    if [[ $? -eq 0 ]]; then
        echo "$response" | jq -r '.data[] | "\(.name)|\(.ip_address)|\(.description)"' 2>/dev/null
        return 0
    else
        log "ERROR" "Failed to get computers from server"
        return 1
    fi
}

# Function to monitor all computers
monitor_all_computers() {
    log "INFO" "Starting monitoring of all computers"
    
    # Get computers from server
    local computers=$(get_computers_from_server)
    
    if [[ -z "$computers" ]]; then
        log "WARN" "No computers found in server database"
        return 1
    fi
    
    # Process each computer
    echo "$computers" | while IFS='|' read -r name ip description; do
        if [[ -n "$name" && -n "$ip" ]]; then
            comprehensive_check "$ip" "$name"
        fi
    done
    
    log "INFO" "Monitoring cycle completed"
}

# Function to monitor specific computer
monitor_computer() {
    local ip=$1
    local name=${2:-"Unknown"}
    local username=${3:-$DEFAULT_USER}
    local password=${4:-$DEFAULT_PASS}
    
    log "INFO" "Monitoring computer: $name ($ip)"
    
    comprehensive_check "$ip" "$name" "$username" "$password"
}

# Function to start continuous monitoring
start_continuous_monitoring() {
    local interval=${1:-$CHECK_INTERVAL}
    
    log "INFO" "Starting continuous monitoring (interval: ${interval}s)"
    log "INFO" "Press Ctrl+C to stop"
    
    while true; do
        monitor_all_computers
        log "INFO" "Waiting ${interval} seconds before next check..."
        sleep "$interval"
    done
}

# Function to setup monitoring service
setup_monitoring_service() {
    log "INFO" "Setting up monitoring service"
    
    # Create systemd service
    cat > /etc/systemd/system/windows-monitor.service <<EOF
[Unit]
Description=Windows Lab Machine Monitor
After=network.target

[Service]
Type=simple
User=root
ExecStart=/home/foxcode/Remote-Labs-v2/remote-lab-backend/scripts/windows-monitor.sh monitor-continuous
Restart=always
RestartSec=30
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

    # Create systemd timer for periodic monitoring
    cat > /etc/systemd/system/windows-monitor.timer <<EOF
[Unit]
Description=Windows Lab Machine Monitor Timer
Requires=windows-monitor.service

[Timer]
OnBootSec=2min
OnUnitActiveSec=2min

[Install]
WantedBy=timers.target
EOF

    # Enable and start services
    systemctl daemon-reload
    systemctl enable windows-monitor.timer
    systemctl start windows-monitor.timer
    
    log "INFO" "Monitoring service setup completed"
}

# Function to show help
show_help() {
    cat <<EOF
Windows Lab Machine Monitor

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    install           Install dependencies
    check IP          Check specific computer
    monitor           Monitor all computers once
    monitor-continuous [INTERVAL]
                      Start continuous monitoring
    setup-service     Setup monitoring service
    test-network IP   Test network connectivity
    test-winrm IP     Test WinRM connectivity
    test-rdp IP       Test RDP connectivity
    get-status IP     Get Windows machine status
    check-services IP Check Windows services
    help              Show this help message

Options:
    -n, --name NAME   Computer name
    -u, --user USER   Username (default: $DEFAULT_USER)
    -p, --pass PASS   Password (default: $DEFAULT_PASS)
    -i, --interval SEC
                      Check interval in seconds (default: $CHECK_INTERVAL)

Examples:
    $0 install
    $0 check 192.168.1.100
    $0 check 192.168.1.100 -n "PC-Lab-01"
    $0 monitor
    $0 monitor-continuous 60
    $0 test-winrm 192.168.1.100
    $0 get-status 192.168.1.100
    $0 setup-service

EOF
}

# Main function
main() {
    local command=$1
    shift
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -n|--name)
                COMPUTER_NAME="$2"
                shift 2
                ;;
            -u|--user)
                USERNAME="$2"
                shift 2
                ;;
            -p|--pass)
                PASSWORD="$2"
                shift 2
                ;;
            -i|--interval)
                CHECK_INTERVAL="$2"
                shift 2
                ;;
            *)
                if [[ -z "$TARGET_IP" ]]; then
                    TARGET_IP="$1"
                fi
                shift
                ;;
        esac
    done
    
    # Set defaults
    USERNAME=${USERNAME:-$DEFAULT_USER}
    PASSWORD=${PASSWORD:-$DEFAULT_PASS}
    COMPUTER_NAME=${COMPUTER_NAME:-"Unknown"}
    
    case $command in
        "install")
            check_root
            install_dependencies
            ;;
        "check")
            if [[ -z "$TARGET_IP" ]]; then
                log "ERROR" "IP address is required"
                exit 1
            fi
            monitor_computer "$TARGET_IP" "$COMPUTER_NAME" "$USERNAME" "$PASSWORD"
            ;;
        "monitor")
            monitor_all_computers
            ;;
        "monitor-continuous")
            start_continuous_monitoring "$CHECK_INTERVAL"
            ;;
        "setup-service")
            check_root
            setup_monitoring_service
            ;;
        "test-network")
            if [[ -z "$TARGET_IP" ]]; then
                log "ERROR" "IP address is required"
                exit 1
            fi
            test_network_connectivity "$TARGET_IP"
            ;;
        "test-winrm")
            if [[ -z "$TARGET_IP" ]]; then
                log "ERROR" "IP address is required"
                exit 1
            fi
            test_winrm_connectivity "$TARGET_IP" "$DEFAULT_WINRM_PORT" "$USERNAME" "$PASSWORD"
            ;;
        "test-rdp")
            if [[ -z "$TARGET_IP" ]]; then
                log "ERROR" "IP address is required"
                exit 1
            fi
            test_rdp_connectivity "$TARGET_IP"
            ;;
        "get-status")
            if [[ -z "$TARGET_IP" ]]; then
                log "ERROR" "IP address is required"
                exit 1
            fi
            get_windows_status "$TARGET_IP" "$USERNAME" "$PASSWORD"
            ;;
        "check-services")
            if [[ -z "$TARGET_IP" ]]; then
                log "ERROR" "IP address is required"
                exit 1
            fi
            check_windows_services "$TARGET_IP" "$USERNAME" "$PASSWORD"
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
