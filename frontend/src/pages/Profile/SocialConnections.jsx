import React, { useState, useEffect } from 'react';
import { Card, List, Button, message, Modal, Tabs } from 'antd';
import {
  GoogleOutlined,
  FacebookOutlined,
  TikTokOutlined,
  LinkOutlined,
  DisconnectOutlined
} from '@ant-design/icons';
import axios from 'axios';
import api from "/src/config/api";

const SocialConnections = () => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchConnections();
  }, []);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/auth/social/connections/');
      setConnections(response.data);
    } catch (error) {
      message.error('Failed to fetch connections');
    } finally {
      setLoading(false);
    }
  };

  const initiateAuth = (platform) => {
    const AUTH_URLS = {
      google: `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        redirect_uri: import.meta.env.VITE_GOOGLE_REDIRECT_URI,
        response_type: 'code',
        scope: 'profile email',
        access_type: 'offline',
      }).toString()}`,
      
      tiktok: `https://www.tiktok.com/auth/authorize?${new URLSearchParams({
        client_key: import.meta.env.VITE_TIKTOK_CLIENT_KEY,
        redirect_uri: import.meta.env.VITE_TIKTOK_REDIRECT_URI,
        response_type: 'code',
        scope: 'user.info.basic',
      }).toString()}`,
      
      facebook: `https://www.facebook.com/v12.0/dialog/oauth?${new URLSearchParams({
        client_id: import.meta.env.VITE_FACEBOOK_APP_ID,
        redirect_uri: import.meta.env.VITE_FACEBOOK_REDIRECT_URI,
        response_type: 'code',
        scope: 'public_profile,email',
      }).toString()}`,
    };

    window.open(AUTH_URLS[platform], '_blank', 'width=600,height=600');
  };

  const handleDisconnect = async (platform) => {
    try {
      await axios.post(`/api/auth/social/disconnect/${platform}/`);
      message.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} disconnected`);
      fetchConnections();
    } catch (error) {
      message.error('Disconnection failed');
    }
  };

  const handleOAuthCallback = async (platform, code) => {
    try {
      await api.post(`/api/auth/social/connect/${platform}/`, { code });
      message.success(`${platform.charAt(0).toUpperCase() + platform.slice(1)} connected successfully`);
      fetchConnections();
      setModalVisible(false);
    } catch (error) {
      message.error('Connection failed');
    }
  };

  // Listen for OAuth callback (setup in your OAuth redirect page)
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'oauth-callback') {
        handleOAuthCallback(event.data.platform, event.data.code);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const isConnected = (platform) => 
    connections.some(conn => conn.platform === platform);

  const PLATFORM_DATA = {
    google: { name: 'Google', icon: <GoogleOutlined />, color: '#4285F4' },
    tiktok: { name: 'TikTok', icon: <TikTokOutlined />, color: '#000000' },
    facebook: { name: 'Facebook', icon: <FacebookOutlined />, color: '#1877F2' },
  };

  return (
    <Card title="Connected Accounts">
      <List
        loading={loading}
        dataSource={Object.keys(PLATFORM_DATA)}
        renderItem={platform => (
          <List.Item
            actions={[
              isConnected(platform) ? (
                <Button 
                  danger 
                  icon={<DisconnectOutlined />}
                  onClick={() => handleDisconnect(platform)}
                >
                  Disconnect
                </Button>
              ) : (
                <Button 
                  type="primary" 
                  icon={<LinkOutlined />}
                  onClick={() => {
                    initiateAuth(platform)
                  }}
                  style={{ backgroundColor: PLATFORM_DATA[platform].color }}
                >
                  Connect
                </Button>
              )
            ]}
          >
            <List.Item.Meta
              avatar={PLATFORM_DATA[platform].icon}
              title={PLATFORM_DATA[platform].name}
              description={isConnected(platform) ? 'Connected' : 'Not connected'}
            />
          </List.Item>
        )}
      />

    </Card>
  );
};

export default SocialConnections;