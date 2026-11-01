import React, { useState, useEffect } from 'react';
import { Conversation } from '@nudge/shared';
import { useAuth } from './context/AuthContext.js';
import { api } from './services/api.js';
import { wsClient } from './services/websocket.js';
import { Header } from './components/Header.js';
import { NavTabs, TabKey } from './components/NavTabs.js';
import { StoriesTray } from './features/stories/StoriesTray.js';
import { ChatList } from './features/chats/ChatList.js';
import { ChatThread } from './features/chats/ChatThread.js';
import { NearbyModal } from './features/nearby/NearbyModal.js';
import { GamesCenter } from './features/games/GamesCenter.js';
import { StoryViewerModal } from './features/stories/StoryViewerModal.js';
import { CreateStoryModal } from './features/stories/CreateStoryModal.js';
import { CallModal } from './features/calls/CallModal.js';
import { ProfileSettingsModal } from './features/profile/ProfileSettingsModal.js';
import { AddFriendsModal } from './features/friends/AddFriendsModal.js';
import { MessageSquare, Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const { user, loading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('chats');

  // Modals state
  const [showNearby, setShowNearby] = useState(false);
  const [showGames, setShowGames] = useState(false);
  const [activeGameContext, setActiveGameContext] = useState<string | undefined>(undefined);
  const [activeStoryFeed, setActiveStoryFeed] = useState<any | null>(null);
  const [showCreateStory, setShowCreateStory] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAddFriends, setShowAddFriends] = useState(false);
  const [activeCall, setActiveCall] = useState<{ type: 'audio' | 'video'; contactName: string; avatarUrl?: string } | null>(null);

  // Load conversations
  const loadConversations = () => {
    if (!user) return;
    api.getConversations()
      .then((res) => {
        setConversations(res.conversations);
        if (!selectedConversation && res.conversations.length > 0 && window.innerWidth >= 768) {
          setSelectedConversation(res.conversations[0]);
        }
      })
      .catch((err) => console.error('Failed to load conversations:', err));
  };

  useEffect(() => {
    loadConversations();
  }, [user?.id]);

  // Real-time conversation updates
  useEffect(() => {
    const unsubNewMsg = wsClient.on('message.new', (data: any) => {
      setConversations((prev) => {
        return prev.map((c) => {
          if (c.id === data.conversationId) {
            return {
              ...c,
              lastMessage: data.message,
              lastMessageAt: data.message.createdAt,
              lastSeq: data.message.seq,
              unreadCount: c.id === selectedConversation?.id ? 0 : (c.unreadCount || 0) + 1,
            };
          }
          return c;
        });
      });
    });

    const unsubStatus = wsClient.on('message.status', () => {
      loadConversations();
    });

    return () => {
      unsubNewMsg();
      unsubStatus();
    };
  }, [selectedConversation?.id]);

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh', backgroundColor: 'var(--bg)', color: 'var(--ink)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor: 'var(--accent)',
              display: 'grid',
              placeItems: 'center',
              boxShadow: '0 8px 24px rgba(15, 107, 88, 0.3)',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M6.5 5h8A3.5 3.5 0 0 1 18 8.5v4a3.5 3.5 0 0 1-3.5 3.5H11l-3.6 3v-3h-.9A3.5 3.5 0 0 1 3 12.5v-4A3.5 3.5 0 0 1 6.5 5z" />
              <circle cx="19" cy="5" r="2.6" fill="var(--gold-hi)" />
            </svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Connecting to Nudge...</span>
        </div>
      </div>
    );
  }

  const handleSelectTab = (tab: TabKey) => {
    setActiveTab(tab);
    if (tab === 'games') setShowGames(true);
    if (tab === 'nearby') setShowNearby(true);
    if (tab === 'profile') setShowProfile(true);
  };

  const handleStartCall = (type: 'audio' | 'video') => {
    if (!selectedConversation) return;
    setActiveCall({
      type,
      contactName: selectedConversation.title || 'Friend',
      avatarUrl: selectedConversation.avatarUrl,
    });
  };

  const handleLaunchGame = (gameKey: string, convId: string) => {
    setActiveGameContext(convId);
    setShowGames(true);
  };

  return (
    <div className="app-container">
      <div className="app-frame">
        {/* Sidebar / Left Column */}
        <aside
          style={{
            width: selectedConversation && window.innerWidth < 768 ? '0%' : '100%',
            maxWidth: window.innerWidth < 768 ? '100%' : '380px',
            display: selectedConversation && window.innerWidth < 768 ? 'none' : 'flex',
            flexDirection: 'column',
            borderRight: '1px solid var(--line)',
            backgroundColor: 'var(--side)',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          <Header
            onOpenGames={() => setShowGames(true)}
            onOpenAddFriends={() => setShowAddFriends(true)}
            onOpenProfile={() => setShowProfile(true)}
          />

          {/* Stories 24h tray */}
          <StoriesTray
            onOpenStoryViewer={(feed) => setActiveStoryFeed(feed)}
            onOpenCreateStory={() => setShowCreateStory(true)}
          />

          {/* Conversations list */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <ChatList
              conversations={conversations}
              selectedId={selectedConversation?.id}
              onSelectConversation={(conv) => setSelectedConversation(conv)}
              onOpenNearby={() => setShowNearby(true)}
              onNewChat={() => setShowAddFriends(true)}
            />
          </div>

          {/* Navigation tab bar */}
          <NavTabs
            activeTab={activeTab}
            onSelectTab={handleSelectTab}
            unreadMessagesCount={conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0)}
          />
        </aside>

        {/* Chat Thread / Right Column */}
        <main
          style={{
            flex: 1,
            height: '100%',
            display: !selectedConversation && window.innerWidth < 768 ? 'none' : 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--panel)',
            overflow: 'hidden',
          }}
        >
          {selectedConversation ? (
            <ChatThread
              conversation={selectedConversation}
              onBack={() => setSelectedConversation(null)}
              onStartCall={handleStartCall}
              onLaunchGame={handleLaunchGame}
              onUpdateConversation={loadConversations}
            />
          ) : (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 16,
                padding: 32,
                color: 'var(--muted)',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 16,
                  backgroundColor: 'var(--hover)',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--accent)',
                }}
              >
                <MessageSquare size={28} />
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>
                  Your Conversations
                </h3>
                <p style={{ fontSize: 13, maxWidth: 300, lineHeight: 1.4 }}>
                  Select a chat or friend from the list to start messaging, share stories, or duel in games.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modals & Overlays */}
      {showNearby && (
        <NearbyModal
          onClose={() => setShowNearby(false)}
          onSelectPeer={(name) => {
            const match = conversations.find((c) => c.title?.toLowerCase().includes(name.toLowerCase()));
            if (match) setSelectedConversation(match);
          }}
        />
      )}

      {showGames && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 440,
              height: '80vh',
              maxHeight: 640,
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: 'var(--shadow)',
            }}
          >
            <GamesCenter
              onClose={() => {
                setShowGames(false);
                setActiveGameContext(undefined);
              }}
              conversationId={activeGameContext}
            />
          </div>
        </div>
      )}

      {activeStoryFeed && (
        <StoryViewerModal
          feed={activeStoryFeed}
          onClose={() => setActiveStoryFeed(null)}
        />
      )}

      {showCreateStory && (
        <CreateStoryModal
          onClose={() => setShowCreateStory(false)}
          onStoryCreated={() => {}}
        />
      )}

      {showProfile && (
        <ProfileSettingsModal
          onClose={() => setShowProfile(false)}
        />
      )}

      {showAddFriends && (
        <AddFriendsModal
          onClose={() => setShowAddFriends(false)}
          onFriendAdded={() => loadConversations()}
          onConversationCreated={(convId) => {
            loadConversations();
            setTimeout(() => {
              api.getConversations().then(res => {
                setConversations(res.conversations);
                const found = res.conversations.find(c => c.id === convId);
                if (found) setSelectedConversation(found);
              });
            }, 300);
          }}
        />
      )}

      {activeCall && (
        <CallModal
          type={activeCall.type}
          contactName={activeCall.contactName}
          avatarUrl={activeCall.avatarUrl}
          onEndCall={() => setActiveCall(null)}
        />
      )}
    </div>
  );
};
