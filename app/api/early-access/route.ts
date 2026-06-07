import { NextResponse } from 'next/server';
import { createOrUpdateProfile, subscribeProfileToList } from '@/lib/klaviyo';

interface SignupData {
  email: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'signup') {
      const { email } = body as SignupData;

      if (!email) {
        return NextResponse.json(
          { error: 'Email address is required' },
          { status: 400 }
        );
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }

      // Securely pull Klaviyo credentials from environment variables
      const apiKey = process.env.KLAVIYO_API_KEY;
      const listId = process.env.KLAVIYO_LIST_ID;

      if (!apiKey || !listId) {
        console.error('Klaviyo Error: Missing KLAVIYO_API_KEY or KLAVIYO_LIST_ID');
        return NextResponse.json(
          { error: 'Klaviyo configuration error. Please contact the administrator.' },
          { status: 500 }
        );
      }

      // 1. Create or Update Klaviyo Profile
      let profileResult;
      try {
        profileResult = await createOrUpdateProfile(email);
      } catch (error: any) {
        console.error('[Klaviyo] Profile creation/lookup error:', error);
        return NextResponse.json(
          { error: 'Failed to communicate with Klaviyo.' },
          { status: 502 }
        );
      }

      if (profileResult.isNew) {
        console.log('[Klaviyo] Profile created');
      } else {
        console.log('[Klaviyo] Existing profile found');
      }

      // 2. Add Profile to Klaviyo List
      let subscriptionResult;
      try {
        subscriptionResult = await subscribeProfileToList(profileResult.id);
      } catch (error: any) {
        console.error('[Klaviyo] List subscription error:', error);
        return NextResponse.json(
          { error: 'Failed to communicate with Klaviyo.' },
          { status: 502 }
        );
      }

      if (subscriptionResult.alreadySubscribed) {
        console.log('[Klaviyo] Already subscribed');
        return NextResponse.json({
          success: true,
          message: 'Already subscribed',
        });
      }

      console.log('[Klaviyo] Added to Early Access list');
      return NextResponse.json({
        success: true,
        message: 'Successfully joined GodsOwn Early Access',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('Klaviyo Signup Route Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

