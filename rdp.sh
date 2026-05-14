#!/bin/bash

clear

echo "================================="
echo "      KALI QEMU TCP RDP"
echo "================================="
echo

read -p "Enter your Ngrok auth token: " NGROK_TOKEN
read -p "Enter RAM size: " RAM

echo
echo "================================="
echo "INSTALLING REQUIRED PACKAGES"
echo "================================="
echo

sudo apt-get update

sudo apt-get install -y \
wget \
curl \
qemu-system-x86 \
qemu-utils \
xrdp \
sudo

echo
echo "================================="
echo "DOWNLOADING KALI LINUX ISO"
echo "================================="
echo

wget -O kali.iso \
https://cdimage.kali.org/kali-2026.1/kali-linux-2026.1-installer-amd64.iso

echo
echo "================================="
echo "CREATING QEMU DISK"
echo "================================="
echo

qemu-img create -f qcow2 kali.qcow2 30G

echo
echo "================================="
echo "GENERATING USERNAME PASSWORD"
echo "================================="
echo

USERNAME="kali$(date +%s | tail -c 5)"

PASSWORD=$(tr -dc A-Za-z0-9 </dev/urandom | head -c 20)

sudo useradd -m -s /bin/bash "$USERNAME"

echo "$USERNAME:$PASSWORD" | sudo chpasswd

sudo usermod -aG sudo "$USERNAME"

echo
echo "Username:"
echo "$USERNAME"
echo

echo "Password:"
echo "$PASSWORD"
echo

echo "================================="
echo "STARTING XRDP"
echo "================================="
echo

sudo service xrdp start

sleep 5

echo
echo "================================="
echo "STARTING NGROK TCP TUNNEL"
echo "================================="
echo

chmod +x ngrok

./ngrok authtoken "$NGROK_TOKEN"

./ngrok tcp 3388 > /dev/null 2>&1 &

sleep 10

RDP_ADDR=$(curl -s http://127.0.0.1:4040/api/tunnels | \
grep '"public_url":"tcp://' | \
head -n 1 | \
cut -d '/' -f3 | \
cut -d '"' -f1)

echo
echo "================================="
echo "STARTING QEMU"
echo "================================="
echo

qemu-system-x86_64 \
-m "$RAM" \
-smp 2 \
-hda kali.qcow2 \
-cdrom kali.iso \
-boot d \
-net nic \
-net user,hostfwd=tcp::3388-:3389 \
-vga std \
-daemonize

echo
echo "================================="
echo "KALI LINUX RDP STARTED"
echo "================================="
echo

echo "RDP Address:"
echo "$RDP_ADDR"
echo

echo "TCP Forward:"
echo "tcp::3388-:3389"
echo

echo "RAM Size:"
echo "$RAM"
echo

echo "Username:"
echo "$USERNAME"
echo

echo "Password:"
echo "$PASSWORD"
echo

echo "================================="
echo "KEEP RDP RUNNING"
echo "Press CTRL+C To Stop"
echo "================================="

while true
do
    echo
    echo "QEMU RDP Running..."
    echo "Time: $(date)"
    sleep 60
done
