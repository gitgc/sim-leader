#!/bin/bash

# Caddy Configuration Helper Script
# Usage: ./caddy-config.sh [http|https-local|https-production]

set -e

ENV_FILE=".env"

case "$1" in
    "http")
        echo "Configuring Caddy for HTTP mode (testing)..."
        cat >> "$ENV_FILE" << EOF

# Caddy HTTP Mode (Testing)
CADDY_HTTPS_MODE=auto_https off
CADDY_SITE_ADDRESS=http://localhost
CADDY_ACME_CONFIG=
CADDY_HSTS_HEADER=
EOF
        echo "✅ Caddy configured for HTTP mode"
        echo "🌐 Access your app at: http://localhost"
        ;;
    
    "https-local")
        echo "Configuring Caddy for HTTPS mode (local development with self-signed certs)..."
        cat >> "$ENV_FILE" << EOF

# Caddy HTTPS Mode (Local Development)
CADDY_HTTPS_MODE=auto_https on
CADDY_SITE_ADDRESS=https://localhost
CADDY_ACME_CONFIG=
CADDY_HSTS_HEADER=
EOF
        echo "✅ Caddy configured for HTTPS mode with self-signed certificates"
        echo "🔒 Access your app at: https://localhost (accept certificate warning)"
        ;;
    
    "https-production")
        echo "Configuring Caddy for HTTPS mode (production with Let's Encrypt)..."
        if [[ -z "$DOMAIN" || -z "$CADDY_EMAIL" || -z "$DIGITALOCEAN_API_TOKEN" ]]; then
            echo "❌ Error: Please set DOMAIN, CADDY_EMAIL, and DIGITALOCEAN_API_TOKEN in your .env file first"
            exit 1
        fi
        cat >> "$ENV_FILE" << EOF

# Caddy HTTPS Mode (Production)
CADDY_HTTPS_MODE=auto_https on
CADDY_SITE_ADDRESS=
CADDY_ACME_CONFIG=acme_dns digitalocean \$DIGITALOCEAN_API_TOKEN
CADDY_HSTS_HEADER=Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
EOF
        echo "✅ Caddy configured for production HTTPS with Let's Encrypt"
        echo "🔒 Access your app at: https://$DOMAIN"
        ;;
    
    *)
        echo "Usage: $0 [http|https-local|https-production]"
        echo ""
        echo "Modes:"
        echo "  http              - HTTP only (testing/development)"
        echo "  https-local       - HTTPS with self-signed certs (local development)"
        echo "  https-production  - HTTPS with Let's Encrypt (production)"
        echo ""
        echo "Example:"
        echo "  $0 http           # For testing"
        echo "  $0 https-production  # For production"
        exit 1
        ;;
esac

echo ""
echo "📝 To apply changes:"
echo "   docker compose down"
echo "   docker compose up --build"
