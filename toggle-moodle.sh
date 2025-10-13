#!/bin/bash

# Toggle Moodle Integration Script
# Usage: ./toggle-moodle.sh [enable|disable|status]

MODE=${1:-status}
BACKEND_DIR="/home/foxcode/Remote-Labs-v2/remote-lab-backend"

case $MODE in
    "enable")
        echo "🔧 Enabling Moodle integration..."
        cd $BACKEND_DIR
        export MOODLE_DISABLED=false
        echo "✅ Moodle integration enabled"
        echo "💡 Restart the server to apply changes"
        ;;
    "disable")
        echo "🔧 Disabling Moodle integration..."
        cd $BACKEND_DIR
        export MOODLE_DISABLED=true
        echo "✅ Moodle integration disabled"
        echo "💡 Restart the server to apply changes"
        ;;
    "status")
        echo "📊 Current Moodle integration status:"
        if [ "$MOODLE_DISABLED" = "true" ]; then
            echo "❌ DISABLED - Moodle validation will be bypassed"
        else
            echo "✅ ENABLED - Moodle validation is active"
        fi
        ;;
    *)
        echo "Usage: $0 [enable|disable|status]"
        echo ""
        echo "Commands:"
        echo "  enable  - Enable Moodle integration (default)"
        echo "  disable - Disable Moodle integration (bypass validation)"
        echo "  status  - Show current status"
        ;;
esac
