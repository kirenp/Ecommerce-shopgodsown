/**
 * Unified Logistics & Shipment Tracking Engine
 * 
 * Supports:
 * - Shopify GraphQL Fulfillment data (displayStatus, inTransitAt, deliveredAt, events)
 * - Nimbus Post Public Tracking API (real-time live scans, locations & courier info)
 * - Shiprocket Tracking API (fallback when configured)
 * 
 * Normalizes all courier events and determines accurate delivery stages (1 - 5):
 * 1: Order Placed (Confirmed / Label Generated / Awaiting Courier Pickup)
 * 2: Dispatched (Picked Up by Courier)
 * 3: In Transit (On the Way / In Hub Network)
 * 4: Out for Delivery (Nearby Hub / Out with Delivery Agent)
 * 5: Delivered (Handed Over to Customer)
 */

import { trackByAWB, isShiprocketConfigured } from "@/lib/shiprocket";

export interface TrackingActivity {
  date: string;
  location: string;
  activity: string;
  scanType: string;      // "DL" | "OFD" | "IT" | "PU" | "OP" | "RTO" | "NDR" | "CANCELED" | "EXCEPTION"
  scanTypeLabel: string; // "Delivered" | "Out for Delivery" | "In Transit" | "Picked Up" | "Pickup Pending" ...
}

export interface UnifiedTrackingData {
  currentStatus: string;       // e.g. "In Transit", "Awaiting Pickup", "Delivered"
  currentStatusCode: string;   // "IT", "PU", "OP", "OFD", "DL", "RTO", etc.
  estimatedDelivery: string | null;
  courierName: string | null;
  awbNumber: string | null;
  trackingUrl: string | null;
  pickupDate: string | null;
  deliveredDate: string | null;
  currentStep: number;         // 1 to 5
  activities: TrackingActivity[];
}

/**
 * Normalizes status strings and messages from various couriers (Delhivery, BlueDart, Nimbus, Shiprocket)
 */
export function normalizeScanStatus(statusStr?: string | null, messageStr?: string | null): {
  code: string;
  label: string;
  step: number;
} {
  const s = (statusStr || "").toLowerCase().trim();
  const m = (messageStr || "").toLowerCase().trim();

  // 1. Delivered
  if (s.includes("deliver") || m.includes("delivered") || s === "dl") {
    return { code: "DL", label: "Delivered", step: 5 };
  }

  // 2. Out for delivery
  if (
    s.includes("out_for_delivery") ||
    s.includes("out for delivery") ||
    m.includes("out for delivery") ||
    s.includes("reached_at_destination") ||
    s === "ofd"
  ) {
    return { code: "OFD", label: "Out for Delivery", step: 4 };
  }

  // 3. In transit
  if (
    s.includes("in_transit") ||
    s.includes("in transit") ||
    m.includes("in transit") ||
    m.includes("departed") ||
    m.includes("arrived") ||
    m.includes("trip") ||
    m.includes("bag") ||
    m.includes("received at facility") ||
    s === "it"
  ) {
    return { code: "IT", label: "In Transit", step: 3 };
  }

  // 4. Picked up / Dispatched
  if (
    s.includes("picked") ||
    m.includes("picked up") ||
    m.includes("origin center") ||
    m.includes("shipment picked up") ||
    s === "pu"
  ) {
    return { code: "PU", label: "Picked Up", step: 2 };
  }

  // 5. Pickup Failed / Rescheduled at Origin (Warehouse stage)
  if (
    (s.includes("pickup") || m.includes("pickup")) &&
    (s.includes("fail") || m.includes("fail") || s.includes("exception") || m.includes("exception") || s.includes("resched") || m.includes("resched"))
  ) {
    return { code: "OP", label: "Pickup Rescheduled", step: 1 };
  }

  // 6. Return to Origin (RTO)
  if (s.includes("rto") || m.includes("rto") || s.includes("return to origin") || s.includes("returned")) {
    return { code: "RTO", label: "Return to Origin", step: 3 };
  }
  if (s.includes("cancel") || m.includes("cancel")) {
    return { code: "CANCELED", label: "Cancelled", step: 1 };
  }

  // 7. Delivery Exceptions (NDR / Failed Delivery Attempt at Customer Destination)
  if (
    s.includes("ndr") ||
    s.includes("undelivered") ||
    m.includes("undelivered") ||
    s.includes("delivery failed") ||
    m.includes("delivery failed") ||
    s.includes("delivery exception") ||
    m.includes("delivery exception") ||
    s.includes("delivery_attempt_failed") ||
    m.includes("delivery attempt failed") ||
    s.includes("delivery attempted") ||
    m.includes("delivery attempted") ||
    ((s.includes("exception") || m.includes("exception")) && !s.includes("pickup") && !m.includes("pickup"))
  ) {
    return { code: "EXCEPTION", label: "Delivery Exception", step: 3 };
  }

  // 6. Pickup Pending / Manifested / Order Placed
  if (
    s.includes("pending") ||
    s.includes("manifested") ||
    s.includes("booked") ||
    m.includes("pending pickup") ||
    m.includes("pickup pending") ||
    s === "op" ||
    s === "ppf" ||
    s === "ofp"
  ) {
    return { code: "OP", label: "Pickup Pending", step: 1 };
  }

  return { code: "OP", label: messageStr || statusStr || "Order Placed", step: 1 };
}

/**
 * Format raw carrier location identifiers into clean, human-readable places
 * e.g. "Malappuram_InkelCity_H (Kerala)" -> "Malappuram (Inkel City), Kerala"
 */
export function formatLocationName(loc?: string | null): string {
  if (!loc) return "";
  let clean = loc.trim();
  clean = clean.replace(/\(([^)]+)\)$/, ", $1");
  clean = clean.replace(/_([A-Za-z0-9]+)(?:_[A-Za-z0-9]+)?/g, (_match, p1) => {
    const unCamel = p1.replace(/([a-z])([A-Z])/g, "$1 $2");
    return ` (${unCamel})`;
  });
  clean = clean.replace(/_/g, " ").replace(/\s+,/g, ",").trim();
  return clean;
}

/**
 * Clean courier partner names removing internal carrier weight codes
 * e.g. "Delhivery Surface DS 1 Kg" -> "Delhivery Surface"
 */
export function cleanCourierName(name?: string | null): string | null {
  if (!name) return null;
  return name
    .replace(/\s+DS\s+\d+\s*Kg/i, "")
    .replace(/\s+Surface\s+DS\b/i, " Surface")
    .trim();
}

/**
 * Resolves informative, real event titles by merging Shopify event stream with carrier status codes
 */
function resolveActivityMessage(
  nEv: any,
  shopifyEvents: any[],
  usedShopifyIndexes: Set<number>
): string {
  const nTime = new Date(nEv.eventTime).getTime();

  // Find closest Shopify event within 120s that hasn't been matched yet
  let bestMatch: any = null;
  let bestDiff = Infinity;
  let bestIdx = -1;

  for (let i = 0; i < shopifyEvents.length; i++) {
    if (usedShopifyIndexes.has(i)) continue;
    const sEv = shopifyEvents[i];
    const sTime = new Date(sEv.happenedAt).getTime();
    const diff = Math.abs(nTime - sTime);
    if (diff <= 120000 && diff < bestDiff) {
      bestDiff = diff;
      bestMatch = sEv;
      bestIdx = i;
    }
  }

  if (bestMatch && bestMatch.message) {
    usedShopifyIndexes.add(bestIdx);
    return bestMatch.message;
  }

  // If raw message is already informative (not just "In Transit" or "Pickup Pending")
  const rawMsg = (nEv.message || "").trim();
  const rawLower = rawMsg.toLowerCase();
  if (
    rawLower &&
    rawLower !== "in transit" &&
    rawLower !== "pending pickup" &&
    rawLower !== "pickup pending" &&
    rawLower !== "picked up"
  ) {
    return rawMsg;
  }

  // Fallback to intelligent code resolution from carrier internal codes
  const code = (nEv.statusCode || "").toLowerCase();
  if (code.includes("ill1")) return "Bag Received at Facility";
  if (code.includes("ill2") || code.includes("ill")) return "Trip Arrived at Facility";
  if (code.includes("oll")) return "Vehicle Departed from Facility";
  if (code.includes("dll")) return "Bag Added to Trip";
  if (code.includes("dbl")) return "Package Bagged for Transit";
  if (code.includes("piom")) return "Shipment Received at Origin Center";
  if (code.includes("ppom")) return "Shipment Picked Up";
  if (code.includes("fmofp")) return "Shipment Manifested & Awaiting Pickup";
  if (code.includes("fmpur")) return "Pickup Request Registered with Courier";
  if (code.includes("ofd")) return "Out for Delivery";
  if (code.includes("dl")) return "Shipment Delivered";

  return rawMsg || "Package In Transit to Destination";
}

/**
 * Fetch public tracking from Nimbus Post
 */
async function fetchNimbusTracking(awb: string) {
  if (!awb || awb.length < 5) return null;
  try {
    const res = await fetch(
      `https://api-v2.nimbuspost.com/tracking/api/v1/public/tracking/${encodeURIComponent(awb)}`,
      {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(3500),
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json.success && json.data ? json.data : null;
  } catch {
    return null;
  }
}

/**
 * Calculate expected courier transit days based on origin (Kerala) and destination state / pincode.
 * - Intra-Kerala: 2 days
 * - South Zone (TN, KA, AP, TS, PY): 3 days
 * - West & Central (MH, GA, GJ, MP): 4 - 5 days
 * - North & East (DL, HR, PB, UP, RJ, WB, BR, etc.): 5 - 6 days
 * - Far / North-East / Islands / J&K: 7 - 8 days
 */
export function getTransitDaysForDestination(
  destinationState?: string | null,
  destinationZip?: string | null
): number {
  const s = (destinationState || "").toLowerCase().replace(/[^a-z]/g, "");

  // 1. Intra-State: Kerala
  if (s.includes("kerala") || s === "kl") {
    return 2;
  }

  // 2. South Zone: Tamil Nadu, Karnataka, Andhra Pradesh, Telangana, Puducherry
  if (
    s.includes("tamilnadu") || s === "tn" ||
    s.includes("karnataka") || s === "ka" ||
    s.includes("andhra") || s === "ap" ||
    s.includes("telangana") || s === "ts" || s === "tg" ||
    s.includes("puducherry") || s.includes("pondicherry") || s === "py"
  ) {
    return 3;
  }

  // 3. West & Central Zone (MH, Goa: 4 days; Gujarat, MP: 5 days)
  if (
    s.includes("maharashtra") || s === "mh" ||
    s.includes("goa") || s === "ga"
  ) {
    return 4;
  }
  if (
    s.includes("gujarat") || s === "gj" ||
    s.includes("madhyapradesh") || s === "mp" ||
    s.includes("daman") || s.includes("diu") || s.includes("dadra") || s === "dn" || s === "dd"
  ) {
    return 5;
  }

  // 4. North & East Zones (Delhi, Haryana, Punjab, UP, Rajasthan, West Bengal, Bihar, etc.)
  if (
    s.includes("delhi") || s === "dl" ||
    s.includes("haryana") || s === "hr" ||
    s.includes("punjab") || s === "pb" ||
    s.includes("uttarpradesh") || s === "up" ||
    s.includes("rajasthan") || s === "rj" ||
    s.includes("uttarakhand") || s.includes("uttaranchal") || s === "uk" ||
    s.includes("chandigarh") || s === "ch" ||
    s.includes("westbengal") || s === "wb" ||
    s.includes("bihar") || s === "br" ||
    s.includes("jharkhand") || s === "jh" ||
    s.includes("odisha") || s.includes("orissa") || s === "or" || s === "od" ||
    s.includes("chhattisgarh") || s === "cg" || s === "ct"
  ) {
    return 6;
  }

  // 5. Special / Far / North-East / Islands / J&K
  if (
    s.includes("assam") || s === "as" ||
    s.includes("meghalaya") || s === "ml" ||
    s.includes("manipur") || s === "mn" ||
    s.includes("mizoram") || s === "mz" ||
    s.includes("nagaland") || s === "nl" ||
    s.includes("tripura") || s === "tr" ||
    s.includes("arunachal") || s === "ar" ||
    s.includes("sikkim") || s === "sk" ||
    s.includes("jammu") || s.includes("kashmir") || s === "jk" ||
    s.includes("ladakh") || s === "la" ||
    s.includes("himachal") || s === "hp" ||
    s.includes("andaman") || s.includes("nicobar") || s === "an" ||
    s.includes("lakshadweep") || s === "ld"
  ) {
    return 7;
  }

  // Fallback using Indian Pincode prefix
  if (destinationZip) {
    const cleanZip = String(destinationZip).replace(/\D/g, "");
    if (cleanZip.length >= 2) {
      const p2 = parseInt(cleanZip.substring(0, 2), 10);
      if (p2 >= 67 && p2 <= 69) return 2; // Kerala
      if (p2 >= 60 && p2 <= 64) return 3; // Tamil Nadu
      const p1 = cleanZip.charAt(0);
      if (p1 === "5") return 3; // South (Karnataka, AP, Telangana)
      if (p1 === "4") return 4; // Maharashtra, Goa
      if (p1 === "3") return 5; // Gujarat, Rajasthan
      if (p1 === "1" || p1 === "2") return 6; // North
      if (p1 === "7" || p1 === "8") return 6; // East / NE
    }
  }

  // Default standard surface transit
  return 5;
}

/**
 * Direct consumer carrier tracking URL generator
 * Routes users directly to official carrier tracking pages (e.g. Delhivery, BlueDart)
 * bypassing internal aggregator portals like Nimbus Post or Shiprocket login walls.
 */
export function resolveDirectCourierTrackingUrl(
  carrierName?: string | null,
  trackingNumber?: string | null,
  fallbackUrl?: string | null
): string | null {
  if (!trackingNumber) return fallbackUrl || null;

  const courier = (carrierName || "").toLowerCase();
  const awb = trackingNumber.trim();

  // Delhivery (either named Delhivery or standard 14/15-digit waybill starting with 23 or 10 or 30)
  if (
    courier.includes("delhivery") ||
    /^(236|237|238|239|10\d{10}|30\d{10})/i.test(awb)
  ) {
    return `https://www.delhivery.com/track/package/${encodeURIComponent(awb)}`;
  }

  // Blue Dart
  if (courier.includes("bluedart") || courier.includes("blue dart")) {
    return `https://www.bluedart.com/tracking?handler=tnt&action=custtrack&trackid=${encodeURIComponent(awb)}`;
  }

  // DTDC
  if (courier.includes("dtdc")) {
    return `https://www.dtdc.in/tracking/shipment-tracking.asp?awbNo=${encodeURIComponent(awb)}`;
  }

  // Xpressbees
  if (courier.includes("xpressbees")) {
    return `https://www.xpressbees.com/track?awb=${encodeURIComponent(awb)}`;
  }

  // Shadowfax
  if (courier.includes("shadowfax")) {
    return `https://tracker.shadowfax.in/#/track/${encodeURIComponent(awb)}`;
  }

  // Ecom Express
  if (courier.includes("ecom")) {
    return `https://ecomexpress.in/tracking/?awb_field=${encodeURIComponent(awb)}`;
  }

  // Fallback to provided tracking URL
  return fallbackUrl || null;
}

/**
 * Compute realistic ETA based on pickup date or order processed date and destination
 */
export function calculateEstimatedDelivery(
  pickupDateStr?: string | null,
  orderDateStr?: string | null,
  destinationState?: string | null,
  destinationZip?: string | null
): string | null {
  const isPickedUp = Boolean(pickupDateStr);
  const baseDate = pickupDateStr
    ? new Date(pickupDateStr)
    : orderDateStr
    ? new Date(orderDateStr)
    : null;

  if (!baseDate || isNaN(baseDate.getTime())) return null;

  const transitDays = getTransitDaysForDestination(destinationState, destinationZip);
  
  // If not yet picked up, add 1 day dispatch preparation buffer
  const totalDays = isPickedUp ? transitDays : transitDays + 1;

  const eta = new Date(baseDate.getTime());
  eta.setDate(eta.getDate() + totalDays);
  return eta.toISOString();
}

/**
 * Main resolver: Unifies Shopify fulfillment, Nimbus Post, and Shiprocket into an accurate status & timeline
 */
export async function resolveOrderLogistics(params: {
  orderNode: any;
  activeFulfillment?: any;
  realTrackingNumber?: string | null;
  realTrackingCompany?: string | null;
  realTrackingUrl?: string | null;
}): Promise<UnifiedTrackingData> {
  const { orderNode, activeFulfillment, realTrackingNumber, realTrackingCompany } = params;

  // 1. Attempt Nimbus Post tracking if AWB exists
  let nimbusData: any = null;
  if (realTrackingNumber) {
    nimbusData = await fetchNimbusTracking(realTrackingNumber);
  }

  // 2. Attempt Shiprocket tracking if Nimbus didn't return data and Shiprocket is configured
  let shiprocketData: any = null;
  if (!nimbusData && realTrackingNumber && isShiprocketConfigured()) {
    try {
      shiprocketData = await trackByAWB(realTrackingNumber);
    } catch (err) {
      console.warn("Shiprocket tracking lookup error:", err);
    }
  }

  // Extract raw Shopify fulfillment events
  const rawShopifyEvents = (activeFulfillment?.events?.edges || []).map((e: any) => e.node);

  // 3. Extract and normalize activities
  let activities: TrackingActivity[] = [];
  let pickupDate: string | null = null;
  let deliveredDate: string | null = null;

  if (nimbusData?.events && nimbusData.events.length > 0) {
    const usedShopify = new Set<number>();
    activities = nimbusData.events.map((ev: any) => {
      const mapped = normalizeScanStatus(ev.shipStatus, ev.message);
      const activityText = resolveActivityMessage(ev, rawShopifyEvents, usedShopify);
      const locText = formatLocationName(ev.location);

      return {
        date: ev.eventTime,
        location: locText,
        activity: activityText,
        scanType: mapped.code,
        scanTypeLabel: mapped.label,
      };
    });

    const pickupEv = nimbusData.events.find((ev: any) =>
      (ev.shipStatus || "").toLowerCase().includes("picked") ||
      (ev.message || "").toLowerCase().includes("picked up")
    );
    if (pickupEv) pickupDate = pickupEv.eventTime;

    const delivEv = nimbusData.events.find((ev: any) =>
      (ev.shipStatus || "").toLowerCase().includes("deliver")
    );
    if (delivEv) deliveredDate = delivEv.eventTime;
  } else if (shiprocketData?.activities && shiprocketData.activities.length > 0) {
    activities = shiprocketData.activities;
    pickupDate = shiprocketData.pickupDate;
    deliveredDate = shiprocketData.deliveredDate;
  } else if (rawShopifyEvents.length > 0) {
    // Fallback directly to Shopify fulfillment events
    activities = rawShopifyEvents
      .map((ev: any) => {
        const mapped = normalizeScanStatus(ev.status, ev.message);
        return {
          date: ev.happenedAt,
          location: formatLocationName([ev.city, ev.province].filter(Boolean).join(", ")),
          activity: ev.message || mapped.label,
          scanType: mapped.code,
          scanTypeLabel: mapped.label,
        };
      })
      .reverse(); // Newest first

    const pickupEv = activities.find(
      (a) => a.scanType === "PU" || a.activity.toLowerCase().includes("picked up")
    );
    if (pickupEv) pickupDate = pickupEv.date;
  }

  // Fallback dates from Shopify fulfillment timestamps
  if (!pickupDate && activeFulfillment?.inTransitAt) {
    pickupDate = activeFulfillment.inTransitAt;
  }
  if (!deliveredDate && activeFulfillment?.deliveredAt) {
    deliveredDate = activeFulfillment.deliveredAt;
  }

  // 4. Determine Step & Status
  const fDisplay = (activeFulfillment?.displayStatus || "").toUpperCase();
  const nimbusStatusRaw = (nimbusData?.currentStatus?.shipStatus || "").toLowerCase();
  const srStatusCode = shiprocketData?.currentStatusCode || "";

  let step = 1;
  let currentStatus = "Order Confirmed";
  let currentStatusCode = "OP";

  // Check Delivered (Step 5)
  if (
    fDisplay === "DELIVERED" ||
    Boolean(deliveredDate) ||
    nimbusStatusRaw.includes("deliver") ||
    srStatusCode === "DL" ||
    activities[0]?.scanType === "DL"
  ) {
    step = 5;
    currentStatus = "Delivered";
    currentStatusCode = "DL";
  }
  // Check Out for Delivery (Step 4)
  else if (
    fDisplay === "OUT_FOR_DELIVERY" ||
    nimbusStatusRaw.includes("out_for_delivery") ||
    nimbusStatusRaw.includes("out for delivery") ||
    srStatusCode === "OFD" ||
    activities[0]?.scanType === "OFD"
  ) {
    step = 4;
    currentStatus = "Out for Delivery";
    currentStatusCode = "OFD";
  }
  // Check In Transit (Step 3)
  else if (
    fDisplay === "IN_TRANSIT" ||
    Boolean(activeFulfillment?.inTransitAt) ||
    nimbusStatusRaw.includes("in transit") ||
    nimbusStatusRaw.includes("in_transit") ||
    srStatusCode === "IT" ||
    activities.some((a) => a.scanType === "IT")
  ) {
    step = 3;
    currentStatus = "In Transit";
    currentStatusCode = "IT";
  }
  // Check Dispatched / Picked Up (Step 2)
  else if (
    fDisplay === "PICKED_UP" ||
    fDisplay === "CARRIER_PICKED_UP" ||
    Boolean(pickupDate) ||
    nimbusStatusRaw.includes("picked") ||
    srStatusCode === "PU" ||
    activities.some((a) => a.scanType === "PU")
  ) {
    step = 2;
    currentStatus = "Dispatched";
    currentStatusCode = "PU";
  }
  // Check Awaiting Courier Pickup / Tracking Added (Step 1)
  else if (realTrackingNumber) {
    step = 1;
    currentStatus = "Awaiting Pickup";
    currentStatusCode = "OP";
  }
  // Unfulfilled Order (Step 1)
  else {
    step = 1;
    currentStatus = "Order Confirmed";
    currentStatusCode = "OP";
  }

  // Handle Special Status Exceptions (RTO, Cancellation, NDR)
  // Only apply if the current active status or latest scan activity is genuinely an exception/RTO/cancellation.
  // Past historical events must NOT override an active In-Transit, Out-for-Delivery, or Delivered status.
  const isLatestException = activities[0]?.scanType === "EXCEPTION";
  const isLatestRTO = activities[0]?.scanType === "RTO";
  const isLatestCanceled = activities[0]?.scanType === "CANCELED";

  if (
    step !== 5 &&
    (fDisplay.includes("RETURN") || nimbusStatusRaw.includes("rto") || srStatusCode === "RTO" || isLatestRTO)
  ) {
    currentStatusCode = "RTO";
    currentStatus = "Return to Origin";
  } else if (
    fDisplay.includes("CANCEL") || nimbusStatusRaw.includes("cancel") || srStatusCode === "CANCELED" || isLatestCanceled
  ) {
    currentStatusCode = "CANCELED";
    currentStatus = "Order Cancelled";
  } else if (
    step !== 5 &&
    (nimbusStatusRaw.includes("ndr") || nimbusStatusRaw.includes("undelivered") || srStatusCode === "NDR" || isLatestException)
  ) {
    currentStatusCode = "NDR";
    currentStatus = "Delivery Exception";
  }

  // 5. Courier Name & Estimated Delivery & Direct Carrier URL
  const finalCourierName = cleanCourierName(
    nimbusData?.courier?.courierName ||
    shiprocketData?.courierName ||
    realTrackingCompany ||
    null
  );

  const directTrackingUrl = resolveDirectCourierTrackingUrl(
    finalCourierName,
    realTrackingNumber,
    params.realTrackingUrl
  );

  const destinationState =
    orderNode?.shippingAddress?.province ||
    orderNode?.shippingAddress?.provinceCode ||
    null;
  const destinationZip = orderNode?.shippingAddress?.zip || null;

  const estimatedDelivery =
    activeFulfillment?.estimatedDeliveryAt ||
    shiprocketData?.estimatedDelivery ||
    calculateEstimatedDelivery(
      pickupDate,
      orderNode?.processedAt,
      destinationState,
      destinationZip
    ) ||
    null;

  return {
    currentStatus,
    currentStatusCode,
    estimatedDelivery,
    courierName: finalCourierName || null,
    awbNumber: realTrackingNumber || null,
    trackingUrl: directTrackingUrl || null,
    pickupDate: pickupDate || null,
    deliveredDate: deliveredDate || null,
    currentStep: step,
    activities,
  };
}
