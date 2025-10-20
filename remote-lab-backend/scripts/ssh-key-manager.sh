#!/bin/bash

# SSH Key Manager for Remote Lab Server
# Quản lý SSH keys để kết nối với máy thực hành Windows

# Configuration
SSH_USER="remote"
SSH_HOME="/home/$SSH_USER"
SSH_DIR="$SSH_HOME/.ssh"
KEY_NAME="remote-lab-server"
KEY_TYPE="ed25519"
SERVER_IP="103.218.122.188"
SERVER_SSH_PORT="8030"

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
}

# Function to check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log "ERROR" "This script must be run as root"
        exit 1
    fi
}

# Function to create SSH user if not exists
create_ssh_user() {
    log "INFO" "Creating SSH user: $SSH_USER"
    
    if id "$SSH_USER" &>/dev/null; then
        log "INFO" "User $SSH_USER already exists"
    else
        useradd -m -s /bin/bash "$SSH_USER"
        log "INFO" "User $SSH_USER created successfully"
    fi
    
    # Add user to sudo group
    usermod -aG sudo "$SSH_USER"
    log "INFO" "User $SSH_USER added to sudo group"
}

# Function to setup SSH directory
setup_ssh_directory() {
    log "INFO" "Setting up SSH directory: $SSH_DIR"
    
    # Create .ssh directory
    mkdir -p "$SSH_DIR"
    chmod 700 "$SSH_DIR"
    chown "$SSH_USER:$SSH_USER" "$SSH_DIR"
    
    # Create authorized_keys file
    touch "$SSH_DIR/authorized_keys"
    chmod 600 "$SSH_DIR/authorized_keys"
    chown "$SSH_USER:$SSH_USER" "$SSH_DIR/authorized_keys"
    
    log "INFO" "SSH directory setup completed"
}

# Function to generate SSH key pair
generate_ssh_key() {
    local key_path="$SSH_DIR/$KEY_NAME"
    
    log "INFO" "Generating SSH key pair: $KEY_NAME"
    
    if [[ -f "$key_path" ]]; then
        log "WARN" "SSH key already exists: $key_path"
        read -p "Do you want to regenerate? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log "INFO" "Keeping existing key"
            return 0
        fi
    fi
    
    # Generate new key pair
    sudo -u "$SSH_USER" ssh-keygen -t "$KEY_TYPE" -f "$key_path" -N "" -C "$KEY_NAME-key"
    
    if [[ $? -eq 0 ]]; then
        log "INFO" "SSH key pair generated successfully"
        log "INFO" "Private key: $key_path"
        log "INFO" "Public key: $key_path.pub"
        
        # Set proper permissions
        chmod 600 "$key_path"
        chmod 644 "$key_path.pub"
        chown "$SSH_USER:$SSH_USER" "$key_path" "$key_path.pub"
        
        return 0
    else
        log "ERROR" "Failed to generate SSH key pair"
        return 1
    fi
}

# Function to display public key
display_public_key() {
    local key_path="$SSH_DIR/$KEY_NAME.pub"
    
    if [[ -f "$key_path" ]]; then
        log "INFO" "Public key for $KEY_NAME:"
        echo "========================================"
        cat "$key_path"
        echo "========================================"
        return 0
    else
        log "ERROR" "Public key not found: $key_path"
        return 1
    fi
}

# Function to add public key to authorized_keys
add_to_authorized_keys() {
    local key_path="$SSH_DIR/$KEY_NAME.pub"
    local authorized_keys_path="$SSH_DIR/authorized_keys"
    
    if [[ ! -f "$key_path" ]]; then
        log "ERROR" "Public key not found: $key_path"
        return 1
    fi
    
    log "INFO" "Adding public key to authorized_keys"
    
    # Check if key already exists
    if grep -q "$(cat "$key_path")" "$authorized_keys_path" 2>/dev/null; then
        log "WARN" "Public key already exists in authorized_keys"
        return 0
    fi
    
    # Add key to authorized_keys
    cat "$key_path" >> "$authorized_keys_path"
    chmod 600 "$authorized_keys_path"
    chown "$SSH_USER:$SSH_USER" "$authorized_keys_path"
    
    log "INFO" "Public key added to authorized_keys successfully"
    return 0
}

# Function to test SSH connection
test_ssh_connection() {
    local target_host=$1
    local target_port=${2:-22}
    local target_user=${3:-"$SSH_USER"}
    
    log "INFO" "Testing SSH connection to $target_user@$target_host:$target_port"
    
    # Test connection
    if sudo -u "$SSH_USER" ssh -o ConnectTimeout=10 -o BatchMode=yes -p "$target_port" "$target_user@$target_host" "echo 'SSH connection successful'" 2>/dev/null; then
        log "INFO" "✅ SSH connection successful"
        return 0
    else
        log "ERROR" "❌ SSH connection failed"
        return 1
    fi
}

# Function to copy public key to remote host
copy_public_key() {
    local target_host=$1
    local target_port=${2:-22}
    local target_user=${3:-"$SSH_USER"}
    local key_path="$SSH_DIR/$KEY_NAME.pub"
    
    if [[ ! -f "$key_path" ]]; then
        log "ERROR" "Public key not found: $key_path"
        return 1
    fi
    
    log "INFO" "Copying public key to $target_user@$target_host:$target_port"
    
    # Use ssh-copy-id if available
    if command -v ssh-copy-id &> /dev/null; then
        sudo -u "$SSH_USER" ssh-copy-id -i "$key_path" -p "$target_port" "$target_user@$target_host"
    else
        # Manual method
        local temp_file=$(mktemp)
        cat "$key_path" > "$temp_file"
        
        sudo -u "$SSH_USER" scp -P "$target_port" "$temp_file" "$target_user@$target_host:~/temp_key.pub"
        sudo -u "$SSH_USER" ssh -p "$target_port" "$target_user@$target_host" "mkdir -p ~/.ssh && cat ~/temp_key.pub >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && rm ~/temp_key.pub"
        
        rm "$temp_file"
    fi
    
    if [[ $? -eq 0 ]]; then
        log "INFO" "✅ Public key copied successfully"
        return 0
    else
        log "ERROR" "❌ Failed to copy public key"
        return 1
    fi
}

# Function to setup SSH config
setup_ssh_config() {
    local config_path="$SSH_DIR/config"
    
    log "INFO" "Setting up SSH config: $config_path"
    
    # Create SSH config
    cat > "$config_path" <<EOF
# Remote Lab Server SSH Configuration

# Default settings
Host *
    ServerAliveInterval 60
    ServerAliveCountMax 3
    TCPKeepAlive yes
    Compression yes
    ForwardAgent yes

# Windows Lab Machines
Host lab-*
    User $SSH_USER
    Port $SERVER_SSH_PORT
    IdentityFile $SSH_DIR/$KEY_NAME
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null

# Server connection
Host server
    HostName $SERVER_IP
    User $SSH_USER
    Port $SERVER_SSH_PORT
    IdentityFile $SSH_DIR/$KEY_NAME
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
EOF

    chmod 600 "$config_path"
    chown "$SSH_USER:$SSH_USER" "$config_path"
    
    log "INFO" "SSH config created successfully"
}

# Function to create SSH tunnel script
create_ssh_tunnel_script() {
    local script_path="/usr/local/bin/remote-lab-tunnel"
    
    log "INFO" "Creating SSH tunnel script: $script_path"
    
    cat > "$script_path" <<EOF
#!/bin/bash

# Remote Lab SSH Tunnel Script
# Creates SSH tunnels to Windows lab machines

# Configuration
SERVER_HOST="$SERVER_IP"
SERVER_PORT="$SERVER_SSH_PORT"
SSH_USER="$SSH_USER"
SSH_KEY="$SSH_DIR/$KEY_NAME"

# Function to show help
show_help() {
    cat <<HELP
Remote Lab SSH Tunnel Manager

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    start TUNNEL_NAME LOCAL_PORT REMOTE_HOST REMOTE_PORT
        Start SSH tunnel
    stop TUNNEL_NAME
        Stop SSH tunnel
    list
        List active tunnels
    status
        Show tunnel status

Examples:
    $0 start rdp-01 13389 192.168.1.100 3389
    $0 start winrm-01 15985 192.168.1.100 5985
    $0 stop rdp-01
    $0 list
    $0 status

HELP
}

# Function to start tunnel
start_tunnel() {
    local tunnel_name=\$1
    local local_port=\$2
    local remote_host=\$3
    local remote_port=\$4
    
    if [[ -z "\$tunnel_name" || -z "\$local_port" || -z "\$remote_host" || -z "\$remote_port" ]]; then
        echo "Error: Missing required parameters"
        show_help
        exit 1
    fi
    
    # Check if tunnel already exists
    if pgrep -f "ssh.*$tunnel_name" > /dev/null; then
        echo "Tunnel \$tunnel_name is already running"
        exit 1
    fi
    
    # Start SSH tunnel
    ssh -f -N -L \$local_port:\$remote_host:\$remote_port -i "\$SSH_KEY" "\$SSH_USER@\$SERVER_HOST" -p "\$SERVER_PORT" -o ServerAliveInterval=60 -o ServerAliveCountMax=3
    
    if [[ \$? -eq 0 ]]; then
        echo "✅ Tunnel \$tunnel_name started: localhost:\$local_port -> \$remote_host:\$remote_port"
    else
        echo "❌ Failed to start tunnel \$tunnel_name"
        exit 1
    fi
}

# Function to stop tunnel
stop_tunnel() {
    local tunnel_name=\$1
    
    if [[ -z "\$tunnel_name" ]]; then
        echo "Error: Tunnel name required"
        show_help
        exit 1
    fi
    
    # Find and kill tunnel process
    local pids=\$(pgrep -f "ssh.*$tunnel_name")
    
    if [[ -n "\$pids" ]]; then
        echo "\$pids" | xargs kill
        echo "✅ Tunnel \$tunnel_name stopped"
    else
        echo "❌ Tunnel \$tunnel_name not found"
        exit 1
    fi
}

# Function to list tunnels
list_tunnels() {
    echo "Active SSH Tunnels:"
    echo "==================="
    ps aux | grep "ssh.*-L" | grep -v grep | while read line; do
        echo "\$line"
    done
}

# Function to show status
show_status() {
    echo "SSH Tunnel Status:"
    echo "=================="
    echo "Server: \$SSH_USER@\$SERVER_HOST:\$SERVER_PORT"
    echo "Key: \$SSH_KEY"
    echo ""
    list_tunnels
}

# Main function
case "\$1" in
    "start")
        start_tunnel "\$2" "\$3" "\$4" "\$5"
        ;;
    "stop")
        stop_tunnel "\$2"
        ;;
    "list")
        list_tunnels
        ;;
    "status")
        show_status
        ;;
    "help"|"")
        show_help
        ;;
    *)
        echo "Unknown command: \$1"
        show_help
        exit 1
        ;;
esac
EOF

    chmod +x "$script_path"
    chown "$SSH_USER:$SSH_USER" "$script_path"
    
    log "INFO" "SSH tunnel script created successfully"
}

# Function to setup SSH service
setup_ssh_service() {
    log "INFO" "Setting up SSH service"
    
    # Enable SSH service
    systemctl enable ssh
    systemctl start ssh
    
    # Configure SSH daemon
    cat > /etc/ssh/sshd_config.d/remote-lab.conf <<EOF
# Remote Lab SSH Configuration

# Allow password authentication (for initial setup)
PasswordAuthentication yes

# Allow public key authentication
PubkeyAuthentication yes

# Allow specific user
AllowUsers $SSH_USER

# Disable root login
PermitRootLogin no

# Enable X11 forwarding
X11Forwarding yes

# Enable agent forwarding
AllowAgentForwarding yes

# Enable TCP forwarding
AllowTcpForwarding yes

# Enable gateway ports
GatewayPorts yes
EOF

    # Restart SSH service
    systemctl restart ssh
    
    log "INFO" "SSH service configured and started"
}

# Function to create key distribution script
create_key_distribution_script() {
    local script_path="/usr/local/bin/distribute-ssh-keys"
    
    log "INFO" "Creating key distribution script: $script_path"
    
    cat > "$script_path" <<EOF
#!/bin/bash

# SSH Key Distribution Script
# Distributes SSH keys to Windows lab machines

# Configuration
KEY_PATH="$SSH_DIR/$KEY_NAME.pub"
WINDOWS_USER="Admin"
WINDOWS_PASS="lhu@B304"

# Function to distribute key to Windows machine
distribute_to_windows() {
    local ip=\$1
    local port=\${2:-5985}
    
    echo "Distributing SSH key to Windows machine: \$ip:\$port"
    
    # Use PowerShell to add SSH key to authorized_keys
    local ps_command="
        \$keyContent = @'
$(cat "$SSH_DIR/$KEY_NAME.pub")
'@
        \$sshDir = \"C:\\Users\\$WINDOWS_USER\\.ssh\"
        if (!(Test-Path \$sshDir)) {
            New-Item -ItemType Directory -Path \$sshDir -Force
        }
        \$keyFile = \"\$sshDir\\authorized_keys\"
        if (!(Test-Path \$keyFile)) {
            New-Item -ItemType File -Path \$keyFile -Force
        }
        Add-Content -Path \$keyFile -Value \$keyContent
        Write-Host 'SSH key added successfully'
    "
    
    # Execute PowerShell command via WinRM
    curl -s -k -u "\$WINDOWS_USER:\$WINDOWS_PASS" \\
        -H "Content-Type: application/soap+xml; charset=utf-8" \\
        -d "<?xml version='1.0' encoding='utf-8'?><soap:Envelope xmlns:soap='http://www.w3.org/2003/05/soap-envelope'><soap:Body><ExecuteCommand xmlns='http://schemas.microsoft.com/wbem/wsman/1/wmi/root/cimv2'><Command>\$ps_command</Command></ExecuteCommand></soap:Body></soap:Envelope>" \\
        "http://\$ip:\$port/wsman" 2>/dev/null
    
    if [[ \$? -eq 0 ]]; then
        echo "✅ SSH key distributed to \$ip"
    else
        echo "❌ Failed to distribute SSH key to \$ip"
    fi
}

# Main function
if [[ \$# -eq 0 ]]; then
    echo "Usage: \$0 <IP1> [IP2] [IP3] ..."
    echo "Example: \$0 192.168.1.100 192.168.1.101 192.168.1.102"
    exit 1
fi

for ip in "\$@"; do
    distribute_to_windows "\$ip"
done
EOF

    chmod +x "$script_path"
    chown "$SSH_USER:$SSH_USER" "$script_path"
    
    log "INFO" "Key distribution script created successfully"
}

# Function to show help
show_help() {
    cat <<EOF
SSH Key Manager for Remote Lab Server

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    setup           Complete setup (user, keys, config)
    create-user     Create SSH user
    generate-key    Generate SSH key pair
    show-key        Display public key
    add-key         Add public key to authorized_keys
    test-connection Test SSH connection
    copy-key        Copy public key to remote host
    setup-config    Setup SSH configuration
    setup-service   Setup SSH service
    create-tunnel   Create SSH tunnel script
    distribute      Create key distribution script
    help            Show this help message

Options:
    -h, --host HOST     Target host for connection/key copy
    -p, --port PORT     Target port (default: 22)
    -u, --user USER     Target user (default: $SSH_USER)

Examples:
    $0 setup
    $0 generate-key
    $0 show-key
    $0 test-connection -h 192.168.1.100
    $0 copy-key -h 192.168.1.100 -u admin
    $0 setup-config
    $0 create-tunnel
    $0 distribute

EOF
}

# Main function
main() {
    local command=$1
    shift
    
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--host)
                TARGET_HOST="$2"
                shift 2
                ;;
            -p|--port)
                TARGET_PORT="$2"
                shift 2
                ;;
            -u|--user)
                TARGET_USER="$2"
                shift 2
                ;;
            *)
                shift
                ;;
        esac
    done
    
    # Set defaults
    TARGET_PORT=${TARGET_PORT:-22}
    TARGET_USER=${TARGET_USER:-"$SSH_USER"}
    
    case $command in
        "setup")
            check_root
            create_ssh_user
            setup_ssh_directory
            generate_ssh_key
            add_to_authorized_keys
            setup_ssh_config
            setup_ssh_service
            create_ssh_tunnel_script
            create_key_distribution_script
            log "INFO" "✅ SSH setup completed successfully"
            display_public_key
            ;;
        "create-user")
            check_root
            create_ssh_user
            ;;
        "generate-key")
            check_root
            create_ssh_user
            setup_ssh_directory
            generate_ssh_key
            ;;
        "show-key")
            display_public_key
            ;;
        "add-key")
            check_root
            add_to_authorized_keys
            ;;
        "test-connection")
            if [[ -z "$TARGET_HOST" ]]; then
                log "ERROR" "Target host is required. Use -h option."
                exit 1
            fi
            test_ssh_connection "$TARGET_HOST" "$TARGET_PORT" "$TARGET_USER"
            ;;
        "copy-key")
            if [[ -z "$TARGET_HOST" ]]; then
                log "ERROR" "Target host is required. Use -h option."
                exit 1
            fi
            copy_public_key "$TARGET_HOST" "$TARGET_PORT" "$TARGET_USER"
            ;;
        "setup-config")
            check_root
            setup_ssh_config
            ;;
        "setup-service")
            check_root
            setup_ssh_service
            ;;
        "create-tunnel")
            check_root
            create_ssh_tunnel_script
            ;;
        "distribute")
            check_root
            create_key_distribution_script
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
