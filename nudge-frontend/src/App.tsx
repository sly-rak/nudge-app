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
import { LiveSetup } from './features/live/LiveSetup.js';
import { LiveHost } from './features/live/LiveHost.js';
import { LiveEndSheet } from './features/live/LiveEndSheet.js';
import { LiveWatchDemo } from './features/live/LiveWatchDemo.js';
import { LiveReplaysModal } from './features/live/LiveReplaysModal.js';
import { MessageSquare } from 'lucide-react';

export const App: React.FC = () => {
  const { user, loading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('chats');
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Stories viewer state
  const [allStoryFeeds, setAllStoryFeeds] = useState<any[]>([]);
  const [activeFeedIndex, setActiveFeedIndex] = useState<number | null>(null);
  const [showCreateStory, setShowCreateStory] = useState(false);

  // New Chat / Add Friends modal state
  const [showAddFriends, setShowAddFriends] = useState(false);

  // Calls state
  const [activeCall, setActiveCall] = useState<{
    type: 'audio' | 'video';
    contactName: string;
    avatarUrl?: string;
    conversationId?: string;
    isIncoming?: boolean;
  } | null>(null);

  // Live broadcast & watch state
  const [showLiveSetup, setShowLiveSetup] = useState(false);
  const [liveBroadcastConfig, setLiveBroadcastConfig] = useState<{
    stream: MediaStream;
    title: string;
    facingMode: 'user' | 'environment';
    isCamOn: boolean;
    isMicOn: boolean;
    notifyFriends: boolean;
    simulatedViewers: boolean;
  } | null>(null);
  const [liveEndSummary, setLiveEndSummary] = useState<{
    title: string;
    durationSeconds: number;
    peakViewers: number;
    recordedBlob: Blob | null;
  } | null>(null);
  const [showWatchDemo, setShowWatchDemo] = useState(false);
  const [showLiveReplays, setShowLiveReplays] = useState(false);

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
              lastMessageAt: data.message.createdAt || data.message.created_at,
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
      conversationId: selectedConversation.id,
      isIncoming: false,
    });
  };

  const handleSimulateCall = (type: 'audio' | 'video' = 'video') => {
    const tola = conversations.find((c) => c.title?.toLowerCase().includes('tola')) || conversations[0];
    setActiveCall({
      type,
      contactName: tola ? (tola.title || 'Tola') : 'Tola',
      avatarUrl: tola?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      conversationId: tola?.id,
      isIncoming: true,
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

  const selectedOpponent = (selectedConversation as any)?.otherUser
    ? {
        id: (selectedConversation as any).otherUser.id,
        username: (selectedConversation as any).otherUser.username,
        displayName: (selectedConversation as any).otherUser.displayName,
        avatarUrl: (selectedConversation as any).otherUser.avatarUrl,
        bio: (selectedConversation as any).otherUser.bio,
        isBot: (selectedConversation as any).otherUser.isBot,
        botPersona: (selectedConversation as any).otherUser.botPersona,
      }
    : selectedConversation?.title
    ? {
        id: selectedConversation.id,
        username: selectedConversation.title.toLowerCase(),
        displayName: selectedConversation.title,
        avatarUrl: selectedConversation.avatarUrl,
      }
    : undefined;

  return (
    <div className="app-container">
      <div className="app-frame" style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
        {/* Content Area */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', position: 'relative', overflow: 'hidden' }}>
          {/* TAB 1: CHATS */}
          {activeTab === 'chats' && (
            isMobile && selectedConversation ? (
              <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <ChatThread
                  conversation={selectedConversation}
                  onBack={() => setSelectedConversation(null)}
                  onStartCall={handleStartCall}
                  onLaunchGame={() => setActiveTab('games')}
                  onUpdateConversation={loadConversations}
                />
              </div>
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex' }}>
                {/* Left Column: Chat List */}
                <div
                  style={{
                    width: isMobile ? '100%' : '380px',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRight: isMobile ? 'none' : '1px solid var(--line)',
                    backgroundColor: 'var(--side)',
                    height: '100%',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  <Header
                    onOpenGames={() => setActiveTab('games')}
                    onOpenAddFriends={() => setShowAddFriends(true)}
                    onOpenProfile={() => setActiveTab('profile')}
                  />
                  <StoriesTray
                    onOpenStoryViewer={(idx, feeds) => handleOpenStoryViewerWithFeeds(idx, feeds)}
                    onOpenCreateStory={() => setShowCreateStory(true)}
                    onOpenLiveSetup={() => setShowLiveSetup(true)}
                    onOpenWatchDemo={() => setShowWatchDemo(true)}
                  />
                  <div style={{ flex: 1, minHeight: 0 }}>
                    <ChatList
                      conversations={conversations}
                      selectedId={selectedConversation?.id}
                      onSelectConversation={(conv) => {
                        setSelectedConversation(conv);
                      }}
                      onOpenNearby={() => setActiveTab('nearby')}
                      onNewChat={() => setShowAddFriends(true)}
                    />
                  </div>
                </div>

                {/* Right Column (Desktop): Active Chat Thread */}
                {!isMobile && (
                  <main
                    style={{
                      flex: 1,
                      height: '100%',
                      display: 'flex',
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
                            Select a chat or friend from the list to start messaging, share stories, or challenge to games.
                          </p>
                        </div>
                      </div>
                    )}
                  </main>
                )}
              </div>
            )
          )}

          {/* TAB 2: STORIES / SOCIAL FEED */}
          {activeTab === 'stories' && (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--panel)', overflow: 'hidden' }}>
              <StoryFeedView
                onOpenStoryViewer={(idx, feeds) => handleOpenStoryViewerWithFeeds(idx, feeds || allStoryFeeds)}
                onOpenCreateStory={() => setShowCreateStory(true)}
                onSelectUserChat={(username) => handleOpenPeerChat(username)}
                onOpenLiveSetup={() => setShowLiveSetup(true)}
                onOpenWatchDemo={() => setShowWatchDemo(true)}
              />
            </div>
          )}

          {/* TAB 3: PLAY / GAMES */}
          {activeTab === 'games' && (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--wall)', overflowY: 'auto' }}>
              <GamesCenter
                isEmbedded={true}
                conversationId={selectedConversation?.id}
                initialOpponent={selectedOpponent}
              />
            </div>
          )}

          {/* TAB 4: NEARBY RADAR */}
          {activeTab === 'nearby' && (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--sir-bg)', overflowY: 'auto' }}>
              <NearbyModal
                isEmbedded={true}
                onSelectPeer={handleOpenPeerChat}
              />
            </div>
          )}

          {/* TAB 5: PROFILE */}
          {activeTab === 'profile' && (
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--wall)', overflowY: 'auto' }}>
              <ProfileSettingsModal
                isEmbedded={true}
                onSimulateCall={handleSimulateCall}
              />
            </div>
          )}
        </div>

        {/* Permanent, rock-solid Native Bottom Navbar across all tabs */}
        <NavTabs
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          unreadMessagesCount={conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0)}
        />
      </div>

      {/* FULL IMMERSIVE STORY VIEWER */}
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
          conversationId={activeCall.conversationId}
          isIncoming={activeCall.isIncoming}
          onEndCall={() => setActiveCall(null)}
        />
      )}

      {/* LIVE BROADCAST SETUP MODAL */}
      {showLiveSetup && (
        <LiveSetup
          onClose={() => setShowLiveSetup(false)}
          onStartBroadcast={(config) => {
            setShowLiveSetup(false);
            setLiveBroadcastConfig(config);
          }}
          onOpenReplays={() => setShowLiveReplays(true)}
        />
      )}

      {/* LIVE BROADCAST HOST SCREEN */}
      {liveBroadcastConfig && (
        <LiveHost
          stream={liveBroadcastConfig.stream}
          title={liveBroadcastConfig.title}
          initialFacingMode={liveBroadcastConfig.facingMode}
          initialCam={liveBroadcastConfig.isCamOn}
          initialMic={liveBroadcastConfig.isMicOn}
          simulatedViewers={liveBroadcastConfig.simulatedViewers}
          onEndBroadcast={(summary) => {
            setLiveBroadcastConfig(null);
            setLiveEndSummary(summary);
          }}
        />
      )}

      {/* LIVE END SUMMARY & SAVE SHEET */}
      {liveEndSummary && (
        <LiveEndSheet
          title={liveEndSummary.title}
          durationSeconds={liveEndSummary.durationSeconds}
          peakViewers={liveEndSummary.peakViewers}
          recordedBlob={liveEndSummary.recordedBlob}
          onDone={() => {
            setLiveEndSummary(null);
            loadStoryFeeds();
          }}
        />
      )}

      {/* WATCH TOLA DEMO LIVE BROADCAST */}
      {showWatchDemo && (
        <LiveWatchDemo onClose={() => setShowWatchDemo(false)} />
      )}

      {/* SAVED LIVE REPLAYS MODAL */}
      {showLiveReplays && (
        <LiveReplaysModal onClose={() => setShowLiveReplays(false)} />
      )}
    </div>
  );
};
