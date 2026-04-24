#!/bin/bash
# Helper script for initial configuration

echo "======================================"
echo "thin-edge.io Initial Configuration"
echo "======================================"
echo ""

# Check if running inside snap
SNAP_NAME="${SNAP_INSTANCE_NAME:-ctrlx-cumulocity-thin-edge-io}"
if [ -z "$SNAP" ]; then
    TEDGE_CMD="tedge"
else
    TEDGE_CMD="${SNAP_NAME}.tedge"
fi

echo "Select cloud platform:"
echo "1) Cumulocity IoT"
echo "2) AWS IoT Core"
echo "3) Azure IoT Hub"
read -p "Enter choice [1-3]: " CLOUD_CHOICE

case $CLOUD_CHOICE in
    1)
        read -p "Enter Cumulocity tenant URL (e.g., your-tenant.cumulocity.com): " C8Y_URL
        read -p "Enter device ID: " DEVICE_ID
        
        $TEDGE_CMD config set c8y.url "$C8Y_URL"
        $TEDGE_CMD config set device.id "$DEVICE_ID"
        
        echo ""
        echo "Creating device certificate..."
        $TEDGE_CMD cert create --device-id "$DEVICE_ID"
        
        echo ""
        echo "Certificate created. Thumbprint:"
        $TEDGE_CMD cert show
        
        echo ""
        echo "Next steps:"
        echo "1. Register device in Cumulocity with the certificate thumbprint above"
        echo "2. Run: $TEDGE_CMD connect c8y"
        ;;
        
    2)
        read -p "Enter AWS IoT endpoint (e.g., xxxx.iot.region.amazonaws.com): " AWS_URL
        read -p "Enter device ID: " DEVICE_ID
        
        $TEDGE_CMD config set aws.url "$AWS_URL"
        $TEDGE_CMD config set device.id "$DEVICE_ID"
        
        echo ""
        echo "Creating device certificate..."
        $TEDGE_CMD cert create --device-id "$DEVICE_ID"
        
        echo ""
        echo "Certificate created."
        $TEDGE_CMD cert show
        
        echo ""
        echo "Next steps:"
        echo "1. Upload certificate to AWS IoT Core"
        echo "2. Create and attach IoT policy"
        echo "3. Run: $TEDGE_CMD connect aws"
        ;;
        
    3)
        read -p "Enter Azure IoT Hub hostname (e.g., your-hub.azure-devices.net): " AZ_URL
        read -p "Enter device ID: " DEVICE_ID
        
        $TEDGE_CMD config set az.url "$AZ_URL"
        $TEDGE_CMD config set device.id "$DEVICE_ID"
        
        echo ""
        echo "Creating device certificate..."
        $TEDGE_CMD cert create --device-id "$DEVICE_ID"
        
        echo ""
        echo "Certificate created."
        $TEDGE_CMD cert show
        
        echo ""
        echo "Next steps:"
        echo "1. Register device in Azure IoT Hub with X.509 authentication"
        echo "2. Upload certificate"
        echo "3. Run: $TEDGE_CMD connect az"
        ;;
        
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "======================================"
echo "Configuration complete!"
echo "======================================"
