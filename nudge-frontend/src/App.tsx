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
import { StoryFeedView } from './features/stories/StoryFeedView.js';
import { NearbyModal } from './features/nearby/NearbyModal.js';
import { GamesCenter } from './features/games/GamesCenter.js';
import { StoryViewerModal } from './features/stories/StoryViewerModal.js';
import { CreateStoryModal } from './features/stories/CreateStoryModal.js';
import { CallModal } from './features/calls/CallModal.js';
import { ProfileSettingsModal } from './features/profile/ProfileSettingsModal.js';
import { AddFriendsModal } from './features/friends/AddFriendsModal.js';
import { MessageSquare } from 'lucide-react';

export const App: React.FC = () => {
  const { user, loading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('chats');

  // Stories viewer state
  const [allStoryFeeds, setAllStoryFeeds] = useState<any[]>([]);
  const [activeFeedIndex, setActiveFeedIndex] = useState<number | null>(null);
  const [showCreateStory, setShowCreateStory] = useState(false);

  // New Chat / Add Friends modal state
  const [showAddFriends, setShowAddFriends] = useState(false);

  // Calls state
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

  const loadStoryFeeds = () => {
    api.getStoriesFeed()
      .then((res) => {
        setAllStoryFeeds(res.feeds || []);
      })
      .catch((err) => console.error('Failed to load stories:', err));
  };

  useEffect(() => {
    loadConversations();
    loadStoryFeeds();
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
  };

  const handleStartCall = (type: 'audio' | 'video') => {
    if (!selectedConversation) return;
    setActiveCall({
      type,
      contactName: selectedConversation.title || 'Friend',
      avatarUrl: selectedConversation.avatarUrl,
    });
  };

  const handleOpenPeerChat = (peerName: string) => {
    const match = conversations.find((c) =>
      c.title?.toLowerCase().includes(peerName.toLowerCase()) ||
      (c as any).otherUser?.displayName?.toLowerCase().includes(peerName.toLowerCase())
    );
    if (match) {
      setSelectedConversation(match);
    }
    setActiveTab('chats');
  };

  const handleOpenStoryViewerWithFeeds = (feedIndex: number, feedsList?: any[]) => {
    if (feedsList && feedsList.length > 0) {
      setAllStoryFeeds(feedsList);
    }
    setActiveFeedIndex(feedIndex);
  };

  return (
    <div className="app-container">
      <div className="app-frame">
        {/* TAB 1: CHATS VIEW (Split Messenger Layout) */}
        {activeTab === 'chats' ? (
          <>
            {/* Left Column / Sidebar */}
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
                onOpenGames={() => setActiveTab('games')}
                onOpenAddFriends={() => setShowAddFriends(true)}
                onOpenProfile={() => setActiveTab('profile')}
              />

              {/* Stories 24h tray */}
              <StoriesTray
                onOpenStoryViewer={(idx, feeds) => handleOpenStoryViewerWithFeeds(idx, feeds)}
                onOpenCreateStory={() => setShowCreateStory(true)}
              />

              {/* Conversations list */}
              <div style={{ flex: 1, minHeight: 0 }}>
                <ChatList
                  conversations={conversations}
                  selectedId={selectedConversation?.id}
                  onSelectConversation={(conv) => {
                    setSelectedConversation(conv);
                    setActiveTab('chats');
                  }}
                  onOpenNearby={() => setActiveTab('nearby')}
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

            {/* Right Column: Chat Thread or Empty Placeholder */}
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
                  onLaunchGame={() => setActiveTab('games')}
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
          </>
        ) : (
          /* EMBEDDED DEDICATED TAB VIEW (Story, Play, Nearby, Profile) - NO POPUPS! */
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              height: '100%',
              backgroundColor: 'var(--panel)',
              overflow: 'hidden',
            }}
          >
            {/* Top Header Bar for Dedicated Tab */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                borderBottom: '1px solid var(--line)',
                backgroundColor: 'var(--side)',
                flexShrink: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-ink)',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  N
                </span>
                <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>
                  {activeTab === 'stories' && 'Story & Social Feed'}
                  {activeTab === 'games' && 'Games Arena'}
                  {activeTab === 'nearby' && 'Nearby Radar'}
                  {activeTab === 'profile' && 'Profile & Settings'}
                </h1>
              </div>

              <button
                onClick={() => setActiveTab('chats')}
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: 'var(--accent)',
                  padding: '5px 12px',
                  borderRadius: 10,
                  backgroundColor: 'var(--hover)',
                  transition: 'background 0.15s ease',
                }}
              >
                Back to Chats
              </button>
            </div>

            {/* Scrollable View Content */}
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
              {activeTab === 'stories' && (
                <StoryFeedView
                  onOpenStoryViewer={(idx, feeds) => handleOpenStoryViewerWithFeeds(idx, feeds || allStoryFeeds)}
                  onOpenCreateStory={() => setShowCreateStory(true)}
                  onSelectUserChat={(username) => handleOpenPeerChat(username)}
                />
              )}

              {activeTab === 'games' && (
                <GamesCenter
                  isEmbedded={true}
                  conversationId={selectedConversation?.id}
                />
              )}

              {activeTab === 'nearby' && (
                <NearbyModal
                  isEmbedded={true}
                  onSelectPeer={handleOpenPeerChat}
                />
              )}

              {activeTab === 'profile' && (
                <ProfileSettingsModal
                  isEmbedded={true}
                />
              )}
            </div>

            {/* Navigation tab bar (Always accessible at bottom!) */}
            <NavTabs
              activeTab={activeTab}
              onSelectTab={handleSelectTab}
              unreadMessagesCount={conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0)}
            />
          </div>
        )}
      </div>

      {/* FULL IMMERSIVE STORY VIEWER (Tap through all friends' stories) */}
      {activeFeedIndex !== null && allStoryFeeds.length > 0 && (
        <StoryViewerModal
          feeds={allStoryFeeds}
          initialFeedIndex={activeFeedIndex}
          onClose={() => {
            setActiveFeedIndex(null);
            loadStoryFeeds();
          }}
        />
      )}

      {/* CREATE STORY MODAL */}
      {showCreateStory && (
        <CreateStoryModal
          onClose={() => setShowCreateStory(false)}
          onStoryCreated={() => loadStoryFeeds()}
        />
      )}

      {/* NEW CHAT / GROUP MODAL */}
      {showAddFriends && (
        <AddFriendsModal
          onClose={() => setShowAddFriends(false)}
          onFriendAdded={() => loadConversations()}
          onConversationCreated={(convId) => {
            loadConversations();
            setTimeout(() => {
              api.getConversations().then((res) => {
                setConversations(res.conversations);
                const found = res.conversations.find((c) => c.id === convId);
                if (found) {
                  setSelectedConversation(found);
                  setActiveTab('chats');
                }
              });
            }, 300);
          }}
        />
      )}

      {/* VOICE & VIDEO CALL MODAL */}
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
