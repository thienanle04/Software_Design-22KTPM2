import React, { useEffect } from 'react';
import { useLocation, useSearchParams, useParams } from 'react-router-dom';
import { Spin, message } from 'antd';

// OAuthCallback component
const OAuthCallback = () => {
  const { platform } = useParams(); // Gets the platform from URL
  const [searchParams] = useSearchParams(); // Gets query parameters
  
  // Get OAuth response parameters
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const state = searchParams.get('state');
  const storedState = sessionStorage.getItem('oauth_state');

  useEffect(() => {
    // 1. Validate state parameter
    // if (!state || state !== storedState) {
    //   handleError('Invalid state parameter - possible CSRF attack');
    //   return;
    // }

    // 2. Handle OAuth errors
    if (error) {
      handleError(`OAuth error: ${error}`);
      return;
    }

    // 3. Verify required parameters
    if (!code) {
      handleError('Missing authorization code');
      return;
    }

    // 4. Process successful auth
    processAuthorization(platform, code);
    
    // Cleanup
    return () => {
      sessionStorage.removeItem('oauth_state');
    };
  }, [platform, code, error, state, storedState]);

  const processAuthorization = (platform, code) => {
    console.log(`Received ${platform} auth code:`, code);
    
    // Here you would typically:
    // 1. Send code to your backend for token exchange
    // 2. Handle the response (store tokens, redirect user, etc.)
    
    // Example using window.opener for popup flow:
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({
        type: 'oauth-callback',
        platform,
        code,
        success: true
      }, window.location.origin);
      window.close();
    } else {
      // Alternative for non-popup flow
      window.location.href = `/dashboard?platform=${platform}`;
    }
  };

  const handleError = (errorMsg) => {
    console.error('OAuth Error:', errorMsg);
    message.error(errorMsg);
    
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({
        type: 'oauth-callback',
        success: false,
        error: errorMsg
      }, window.location.origin);
    }
    
    setTimeout(() => {
      window.close();
    }, 2000);
  };

  return (
    <div style={{ 
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh'
    }}>
      <Spin size="large" tip="Processing authentication..." />
    </div>
  );
};

export default OAuthCallback;