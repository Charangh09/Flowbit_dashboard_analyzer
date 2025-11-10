#!/usr/bin/env bash
set -euo pipefail

API_KEY="${RENDER_API_KEY:-}"
API_SERVICE_ID="${RENDER_API_SERVICE_ID:-}"
VANNA_SERVICE_ID="${RENDER_VANNA_SERVICE_ID:-}"
TIMEOUT=${1:-600}
POLL_INTERVAL=5

if [ -z "$API_KEY" ]; then
  read -p "Render API key: " API_KEY
fi
if [ -z "$API_SERVICE_ID" ]; then
  read -p "API Service ID: " API_SERVICE_ID
fi

trigger_deploy() {
  service_id="$1"
  echo "Triggering deploy for $service_id"
  resp=$(curl -s -X POST "https://api.render.com/v1/services/$service_id/deploys" \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d '{"clearCache": true}')
  echo "$resp"
  echo "$resp" | jq -r '.id'
}

wait_for_deploy() {
  service_id="$1"
  deploy_id="$2"
  end=$((SECONDS + TIMEOUT))
  while [ $SECONDS -lt $end ]; do
    status=$(curl -s -H "Authorization: Bearer $API_KEY" "https://api.render.com/v1/services/$service_id/deploys/$deploy_id")
    state=$(echo "$status" | jq -r '.state')
    echo "Deploy $deploy_id state: $state"
    if [ "$state" = "live" ] || [ "$state" = "failed" ] || [ "$state" = "cancelled" ]; then
      echo "$status"
      return 0
    fi
    sleep $POLL_INTERVAL
  done
  echo "Timed out waiting for deploy $deploy_id"
  return 2
}

api_deploy_id=$(trigger_deploy "$API_SERVICE_ID")
echo "API deploy id: $api_deploy_id"
wait_for_deploy "$API_SERVICE_ID" "$api_deploy_id"

if [ -n "$VANNA_SERVICE_ID" ]; then
  vanna_deploy_id=$(trigger_deploy "$VANNA_SERVICE_ID")
  echo "Vanna deploy id: $vanna_deploy_id"
  wait_for_deploy "$VANNA_SERVICE_ID" "$vanna_deploy_id"
fi

echo "Done. Check Render logs if builds failed."
