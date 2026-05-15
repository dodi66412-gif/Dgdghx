#!/usr/bin/env bash

clear

echo "================================="
echo " TEMP MAIL GENERATOR"
echo " GITHUB CODESPACES"
echo "================================="
echo

DOMAINS=$(curl -s https://api.mail.tm/domains | \
grep -o '"domain":"[^"]*"' | \
cut -d '"' -f4)

if [ -z "$DOMAINS" ]; then
    echo "Failed to fetch domains"
    exit 1
fi

echo "Available Domains:"
echo

COUNT=1

for DOMAIN in $DOMAINS
do
    echo "$COUNT. $DOMAIN"
    COUNT=$((COUNT + 1))
done

echo
read -p "Select a domain by number: " CHOICE

SELECTED_DOMAIN=$(echo "$DOMAINS" | sed -n "${CHOICE}p")

if [ -z "$SELECTED_DOMAIN" ]; then
    echo "Invalid selection"
    exit 1
fi

RAND=$(date +%s | tail -c 6)

USER="user$RAND"
PASS="pass$RAND"

EMAIL="$USER@$SELECTED_DOMAIN"

echo
echo "Creating temporary email..."
echo

CREATE=$(curl -s -X POST https://api.mail.tm/accounts \
-H "Content-Type: application/json" \
-d "{\"address\":\"$EMAIL\",\"password\":\"$PASS\"}")

CHECK=$(echo "$CREATE" | grep '"id"')

if [ -z "$CHECK" ]; then
    echo "Failed to create email"
    echo "$CREATE"
    exit 1
fi

echo "Your temporary email address is:"
echo "$EMAIL"
echo
echo "Password:"
echo "$PASS"
echo

TOKEN=$(curl -s -X POST https://api.mail.tm/token \
-H "Content-Type: application/json" \
-d "{\"address\":\"$EMAIL\",\"password\":\"$PASS\"}" | \
grep -o '"token":"[^"]*"' | \
cut -d '"' -f4)

if [ -z "$TOKEN" ]; then
    echo "Failed to login"
    exit 1
fi

echo "Inbox checker started..."
echo "Press CTRL+C to stop"
echo

SEEN=""

while true
do
    MSGS=$(curl -s https://api.mail.tm/messages \
    -H "Authorization: Bearer $TOKEN")

    IDS=$(echo "$MSGS" | \
    grep -o '"id":"[^"]*"' | \
    cut -d '"' -f4)

    for ID in $IDS
    do
        echo "$SEEN" | grep "$ID" > /dev/null

        if [ $? != 0 ]; then

            MAIL=$(curl -s https://api.mail.tm/messages/$ID \
            -H "Authorization: Bearer $TOKEN")

            FROM=$(echo "$MAIL" | \
            grep -o '"address":"[^"]*"' | \
            head -n 1 | \
            cut -d '"' -f4)

            SUBJECT=$(echo "$MAIL" | \
            grep -o '"subject":"[^"]*"' | \
            head -n 1 | \
            cut -d '"' -f4)

            TEXT=$(echo "$MAIL" | \
            grep -o '"text":"[^"]*"' | \
            head -n 1 | \
            cut -d '"' -f4 | \
            sed 's/\\r//g' | \
            sed 's/\\n/\n/g')

            echo "================================="
            echo " NEW MESSAGE"
            echo "================================="
            echo "FROM: $FROM"
            echo "SUBJECT: $SUBJECT"
            echo
            echo "$TEXT"
            echo
            echo "================================="
            echo

            SEEN="$SEEN $ID"
        fi
    done

    sleep 5
done
