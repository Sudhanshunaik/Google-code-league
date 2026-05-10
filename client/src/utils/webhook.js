/**
 * Webhook Utility (Rain-Check Alerts)
 * Triggers an n8n webhook when a rain-risk match is booked.
 */

// Placeholder n8n webhook URL - the user will replace this with their actual n8n URL
const N8N_WEBHOOK_URL = 'https://sudhanshu777.app.n8n.cloud/webhook/rain-alert';

export async function triggerRainAlertWebhook(matchDetails, userDetails, rainProbability) {
  try {
    const payload = {
      event: 'match_booked_high_rain_risk',
      match: {
        id: matchDetails.id,
        sport: matchDetails.sport,
        location: matchDetails.location,
        time: matchDetails.match_time,
        rainProbability: rainProbability
      },
      user: {
        id: userDetails.id,
        email: userDetails.email,
        name: userDetails.name
      },
      timestamp: new Date().toISOString()
    };

    // Send the alert without blocking the UI
    fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => console.error('Background webhook failed:', err));
    
    return true;
  } catch (err) {
    console.error('Failed to construct webhook payload:', err);
    return false;
  }
}

// Placeholder n8n webhook URL for cancellations
const N8N_CANCELLATION_WEBHOOK_URL = 'https://sudhanshu777.app.n8n.cloud/webhook/cancellation';

export async function triggerCancellationWebhook(matchDetails, userDetails, penaltyAmount, refundAmount) {
  try {
    const payload = {
      event: 'match_cancelled',
      match: {
        id: matchDetails.id,
        sport: matchDetails.sport,
        location: matchDetails.location,
        time: matchDetails.match_time,
      },
      user: {
        id: userDetails.id,
        email: userDetails.email,
        name: userDetails.name
      },
      financials: {
        penalty: penaltyAmount,
        refund: refundAmount
      },
      timestamp: new Date().toISOString()
    };

    fetch(N8N_CANCELLATION_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(err => console.error('Background cancellation webhook failed:', err));
    
    return true;
  } catch (err) {
    console.error('Failed to construct cancellation webhook payload:', err);
    return false;
  }
}
