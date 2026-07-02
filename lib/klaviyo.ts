const KLAVIYO_API_KEY = process.env.KLAVIYO_API_KEY;
const KLAVIYO_LIST_ID = process.env.KLAVIYO_LIST_ID;
const API_REVISION = '2024-05-15';

export interface ProfileResult {
  id: string;
  isNew: boolean;
}

export interface SubscriptionResult {
  success: boolean;
  alreadySubscribed: boolean;
}

/**
 * Creates a new profile or looks up an existing profile by email.
 * Implementation requirements:
 * - Use Klaviyo REST API
 * - Use Authorization header with KLAVIYO_API_KEY
 * - Use process.env.KLAVIYO_API_KEY
 */
export async function createOrUpdateProfile(email: string, phone?: string): Promise<ProfileResult> {
  if (!KLAVIYO_API_KEY) {
    throw new Error('Missing Klaviyo configuration: KLAVIYO_API_KEY');
  }

  // Format phone number to E.164 format for Klaviyo
  let formattedPhone: string | undefined = undefined;
  if (phone) {
    const cleaned = phone.replace(/[^\d+]/g, '');
    if (cleaned) {
      formattedPhone = cleaned.startsWith('+') ? cleaned : `+91${cleaned}`;
    }
  }

  const url = 'https://a.klaviyo.com/api/profiles/';
  const headers = {
    'Authorization': `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
    'Accept': 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json',
    'Revision': API_REVISION,
  };

  const attributes: Record<string, string> = {
    email: email,
  };

  if (formattedPhone) {
    attributes.phone_number = formattedPhone;
  }

  const body = {
    data: {
      type: 'profile',
      attributes,
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (response.ok) {
    const data = await response.json();
    return {
      id: data.data.id,
      isNew: true,
    };
  }

  if (response.status === 409) {
    // Conflict - Profile already exists
    try {
      const errBody = await response.json();
      const duplicateId = errBody.errors?.[0]?.meta?.duplicate_profile_id;
      if (duplicateId) {
        return {
          id: duplicateId,
          isNew: false,
        };
      }
    } catch (e) {
      // Ignore JSON parse error and fallback to lookup
    }

    // Fallback: search profile by email
    const searchUrl = `https://a.klaviyo.com/api/profiles/?filter=equals(email,"${encodeURIComponent(email)}")`;
    const searchResponse = await fetch(searchUrl, {
      method: 'GET',
      headers,
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      throw new Error(`Klaviyo lookup failed: ${searchResponse.status} - ${errorText}`);
    }

    const searchData = await searchResponse.json();
    const profileId = searchData.data?.[0]?.id;
    if (profileId) {
      return {
        id: profileId,
        isNew: false,
      };
    }

    throw new Error('Klaviyo profile creation conflict, but profile could not be found via lookup');
  }

  const errorText = await response.text();
  throw new Error(`Klaviyo API error: ${response.status} - ${errorText}`);
}

/**
 * Subscribes a profile to the early access list.
 * Checks if already subscribed first to allow appropriate logging and responses.
 * Implementation requirements:
 * - Use Klaviyo REST API
 * - Use Authorization header with KLAVIYO_API_KEY
 * - Use process.env.KLAVIYO_LIST_ID
 */
export async function subscribeProfileToList(profileId: string): Promise<SubscriptionResult> {
  if (!KLAVIYO_API_KEY) {
    throw new Error('Missing Klaviyo configuration: KLAVIYO_API_KEY');
  }
  if (!KLAVIYO_LIST_ID) {
    throw new Error('Missing Klaviyo configuration: KLAVIYO_LIST_ID');
  }

  const headers = {
    'Authorization': `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
    'Accept': 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json',
    'Revision': API_REVISION,
  };

  // 1. Check if profile is already in the list
  const listsUrl = `https://a.klaviyo.com/api/profiles/${profileId}/lists/`;
  const listsResponse = await fetch(listsUrl, {
    method: 'GET',
    headers,
  });

  if (!listsResponse.ok) {
    const errorText = await listsResponse.text();
    throw new Error(`Klaviyo lists check failed: ${listsResponse.status} - ${errorText}`);
  }

  const listsData = await listsResponse.json();
  const isMember = listsData.data?.some((list: any) => list.id === KLAVIYO_LIST_ID);

  if (isMember) {
    return {
      success: true,
      alreadySubscribed: true,
    };
  }

  // 2. Add to list
  const addUrl = `https://a.klaviyo.com/api/lists/${KLAVIYO_LIST_ID}/relationships/profiles/`;
  const addBody = {
    data: [
      {
        type: 'profile',
        id: profileId,
      },
    ],
  };

  const addResponse = await fetch(addUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(addBody),
  });

  if (!addResponse.ok) {
    const errorText = await addResponse.text();
    throw new Error(`Klaviyo add to list failed: ${addResponse.status} - ${errorText}`);
  }

  return {
    success: true,
    alreadySubscribed: false,
  };
}
