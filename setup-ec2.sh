#!/usr/bin/env bash
# ==============================================================================
# Setup script for AWS EC2 (Ubuntu / Amazon Linux 2023) without Nginx
# ==============================================================================
set -e

echo "==> Detecting OS and installing Docker & Docker Compose..."

if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "Cannot detect OS distribution. Please install Docker manually."
    exit 1
fi

# Configure 2GB swap if RAM is less than 2GB (crucial for t2.micro / t3.micro builds)
TOTAL_RAM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
if [ "$TOTAL_RAM_KB" -lt 2000000 ] && [ ! -f /swapfile ]; then
    echo "==> Low memory detected (<2GB). Setting up 2GB swap file to prevent build OOM..."
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "==> Swap file created successfully."
fi

if [ "$OS" = "ubuntu" ] || [ "$OS" = "debian" ]; then
    echo "==> Detected Ubuntu/Debian"
    sudo apt-get update -y
    sudo apt-get install -y ca-certificates curl gnupg lsb-release git

    # Install Docker official
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    sudo apt-get update -y
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

elif [ "$OS" = "almalinux" ] || [ "$OS" = "rocky" ] || [ "$OS" = "amzn" ] || [ "$OS" = "fedora" ] || [ "$OS" = "rhel" ]; then
    echo "==> Detected Amazon Linux / RHEL family"
    sudo dnf update -y
    sudo dnf install -y docker git
    sudo systemctl enable docker
    sudo systemctl start docker

    # Install Docker Compose Plugin
    DOCKER_CONFIG=${DOCKER_CONFIG:-/usr/local/lib/docker}
    sudo mkdir -p $DOCKER_CONFIG/cli-plugins
    sudo curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m) -o $DOCKER_CONFIG/cli-plugins/docker-compose
    sudo chmod +x $DOCKER_CONFIG/cli-plugins/docker-compose
fi

# Add current user to docker group
sudo usermod -aG docker "$USER"

# Enable and start Docker service
sudo systemctl enable docker
sudo systemctl start docker

echo ""
echo "================================================================="
echo " Docker installation complete!"
echo " IMPORTANT: Run 'newgrp docker' or log out and log back into SSH"
echo " for non-root docker permissions to take effect."
echo " Then, run ./deploy.sh to start your website on Port 80."
echo "================================================================="
