/**
 * Shiprocket API client for shipment tracking.
 * 
 * Handles JWT authentication with auto-refresh (tokens valid ~10 days,
 * we refresh after 9 to avoid edge cases). Provides AWB-based tracking
 * that returns structured scan activities for the frontend timeline.
 * 
 * All methods return null on failure for graceful fallback.
 */

const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in/v1/external";

// In-memory token cache (survives across requests in the same server instance)
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

// Token validity: 10 days from Shiprocket, we refresh at 9 days
const TOKEN_TTL_MS = 9 * 24 * 60 * 60 * 1000;

/**
 * Authenticate with Shiprocket and get a JWT bearer token.
 * Cached in-memory with TTL-based expiry.
 */
async function getAuthToken(): Promise<string | null> {
  const email = process.env.SHIPROCKET_API_EMAIL;
  const password = process.env.SHIPROCKET_API_PASSWORD;

  if (!email || !password) {
    return null;
  }

  // Return cached token if still valid
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  try {
    const res = await fetch(`${SHIPROCKET_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      console.error(`Shiprocket auth failed: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    if (!data.token) {
      console.error("Shiprocket auth response missing token");
      return null;
    }

    cachedToken = data.token;
    tokenExpiresAt = Date.now() + TOKEN_TTL_MS;
    console.log("Shiprocket auth token acquired successfully");
    return cachedToken;
  } catch (err) {
    console.error("Shiprocket auth error:", err);
    return null;
  }
}

/** Scan type code to human-readable label mapping */
const SCAN_TYPE_LABELS: Record<string, string> = {
  "PU": "Picked Up",
  "PPF": "Pickup Pending",
  "OFP": "Out for Pickup",
  "OP": "Order Placed",
  "IT": "In Transit",
  "OFD": "Out for Delivery",
  "DL": "Delivered",
  "RTO": "Return to Origin",
  "NDR": "Non-Delivery Report",
  "CANCELED": "Cancelled",
  "EXCEPTION": "Exception",
};

export interface ShiprocketActivity {
  date: string;
  location: string;
  activity: string;
  scanType: string;
  scanTypeLabel: string;
}

export interface ShiprocketTrackingData {
  currentStatus: string;
  currentStatusCode: string;
  estimatedDelivery: string | null;
  courierName: string;
  awbNumber: string;
  pickupDate: string | null;
  deliveredDate: string | null;
  activities: ShiprocketActivity[];
}

/**
 * Track a shipment by AWB (Air Waybill) number.
 * Returns structured tracking data or null if unavailable.
 */
export async function trackByAWB(awbNumber: string): Promise<ShiprocketTrackingData | null> {
  if (!awbNumber) return null;

  const token = await getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch(
      `${SHIPROCKET_BASE_URL}/courier/track/awb/${encodeURIComponent(awbNumber)}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) {
      console.warn(`Shiprocket tracking failed for AWB ${awbNumber}: ${res.status}`);
      // If 401/403, invalidate cached token so next request re-auths
      if (res.status === 401 || res.status === 403) {
        cachedToken = null;
        tokenExpiresAt = 0;
      }
      return null;
    }

    const data = await res.json();
    
    // Shiprocket response structure can vary; handle both formats
    const trackingData = data?.tracking_data || data?.data || data;
    
    if (!trackingData) {
      console.warn("Shiprocket tracking response has no tracking_data");
      return null;
    }

    // Extract shipment track info
    const shipmentTrack = trackingData.shipment_track;
    const trackActivities = trackingData.shipment_track_activities || 
                            trackingData.track_activities || 
                            [];

    // Current status from the tracking data
    const currentStatus = trackingData.shipment_status?.toString() || 
                         shipmentTrack?.[0]?.current_status || 
                         "Unknown";
    
    const currentStatusCode = deriveStatusCode(currentStatus, trackActivities);

    // Extract estimated delivery
    const etd = trackingData.etd || 
                trackingData.estimated_delivery_date || 
                shipmentTrack?.[0]?.edd || 
                null;

    // Extract courier name
    const courierName = trackingData.courier_name || 
                       shipmentTrack?.[0]?.courier_name || 
                       "Courier Partner";

    // Extract pickup and delivery dates
    const pickupDate = trackingData.pickup_date || 
                      shipmentTrack?.[0]?.pickup_date || 
                      null;

    const deliveredDate = trackingData.delivered_date || 
                         shipmentTrack?.[0]?.delivered_date || 
                         null;

    // Parse scan activities into our format
    const activities: ShiprocketActivity[] = trackActivities
      .map((act: any) => {
        const scanType = (act["sr-status-label"] || act.scan_type || act.status || "").toUpperCase();
        return {
          date: act.date || act.activity_time || act.timestamp || "",
          location: act.location || act.city || act.activity_location || "",
          activity: act.activity || act.description || act["sr-status"] || act.status_description || "",
          scanType,
          scanTypeLabel: SCAN_TYPE_LABELS[scanType] || scanType || "Update",
        };
      })
      .sort((a: ShiprocketActivity, b: ShiprocketActivity) => {
        // Sort newest first
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

    return {
      currentStatus,
      currentStatusCode,
      estimatedDelivery: etd,
      courierName,
      awbNumber,
      pickupDate,
      deliveredDate,
      activities,
    };
  } catch (err) {
    console.error("Shiprocket tracking error:", err);
    return null;
  }
}

/**
 * Derive a normalized status code from Shiprocket status text and activities.
 */
function deriveStatusCode(status: string, activities: any[]): string {
  const normalized = status.toUpperCase().replace(/[\s-_]/g, "");
  
  if (normalized.includes("DELIVERED") || normalized === "DL" || normalized === "7") return "DL";
  if (normalized.includes("OUTFORDELIVERY") || normalized === "OFD" || normalized === "6") return "OFD";
  if (normalized.includes("INTRANSIT") || normalized === "IT" || normalized === "5" || normalized === "18") return "IT";
  if (normalized.includes("PICKEDUP") || normalized === "PU" || normalized === "6") return "PU";
  if (normalized.includes("SHIPPED")) return "IT";
  if (normalized.includes("RTO") || normalized.includes("RETURN")) return "RTO";
  if (normalized.includes("CANCEL")) return "CANCELED";
  if (normalized.includes("NDR") || normalized.includes("NONDELIVERY")) return "NDR";

  // Try to derive from latest activity
  if (activities?.length > 0) {
    const latest = activities[0];
    const scanType = (latest["sr-status-label"] || latest.scan_type || "").toUpperCase();
    if (scanType && SCAN_TYPE_LABELS[scanType]) return scanType;
  }

  return "IT"; // Default to In Transit
}

/**
 * Check if Shiprocket integration is configured.
 */
export function isShiprocketConfigured(): boolean {
  return !!(process.env.SHIPROCKET_API_EMAIL && process.env.SHIPROCKET_API_PASSWORD);
}
