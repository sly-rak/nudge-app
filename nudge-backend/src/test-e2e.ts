/**
 * Comprehensive End-to-End Test Suite for Nudge
 * Tests every API route, bot AI engine, game duels, stories, rooms & temporary groups
 */

const BASE_URL = 'http://localhost:3001/v1';

async function runTests() {
  console.log('=== STARTING COMPREHENSIVE NUDGE E2E TESTS ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: any) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`, detail || '');
      failed++;
    }
  }

  try {
    // 1. Health check
    const healthRes = await fetch('http://localhost:3001/health');
    const health = await healthRes.json();
    assert(health.status === 'ok', 'Server health check returns ok');

    // 2. Demo accounts
    const demoRes = await fetch(`${BASE_URL}/auth/demo-accounts`);
    const demoData = await demoRes.json();
    assert(demoData.accounts.length >= 10, 'Lists demo accounts (bots + contacts)');
    const tolaUser = demoData.accounts.find((a: any) => a.username === 'tola');
    assert(tolaUser?.isBot === true, 'Tola account is properly marked as bot');

    // 3. Login as Dayo
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'dayo@nudge.app', password: 'password123' }),
    });
    const loginData = await loginRes.json();
    assert(!!loginData.accessToken, 'User authentication (Dayo login) returns JWT');
    const token = loginData.accessToken;
    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    // 4. Get Current User profile & status
    const meRes = await fetch(`${BASE_URL}/auth/me`, { headers: authHeaders });
    const meData = await meRes.json();
    assert(meData.user.username === 'dayo', 'Get /auth/me returns current user info');

    // 5. Update Status ("Down for...")
    const statusRes = await fetch(`${BASE_URL}/users/me/status`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ downFor: 'play', text: 'Ready for FIFA duels!' }),
    });
    const statusData = await statusRes.json();
    assert(statusData.status.downFor === 'play', 'Update "Down for..." status works');

    // 6. User search
    const searchRes = await fetch(`${BASE_URL}/users/search?q=Tola`, { headers: authHeaders });
    const searchData = await searchRes.json();
    assert(searchData.users.some((u: any) => u.username === 'tola'), 'User search finds contacts/bots');

    // 7. Conversations list (verifying rooms & temporary group expiration)
    const convsRes = await fetch(`${BASE_URL}/conversations`, { headers: authHeaders });
    const convsData = await convsRes.json();
    assert(convsData.conversations.length > 0, 'Retrieves conversations list');

    const abuadGroup = convsData.conversations.find((c: any) => c.title?.includes('ABUAD Friends'));
    assert(!!abuadGroup && abuadGroup.rooms.length >= 5, 'ABUAD Friends group has sub-rooms (General, School, Events, etc.)');

    const lekkiTrip = convsData.conversations.find((c: any) => c.title?.includes('Lekki Trip'));
    assert(!!lekkiTrip?.endsAt, 'Temporary group (Lekki Trip) has expiration endsAt timestamp');

    // 8. Room-filtered messages
    const generalRoom = abuadGroup.rooms.find((r: any) => r.name === 'General');
    const msgsRoomRes = await fetch(`${BASE_URL}/conversations/${abuadGroup.id}/messages?roomId=${generalRoom.id}`, { headers: authHeaders });
    const msgsRoomData = await msgsRoomRes.json();
    assert(msgsRoomData.messages.length > 0, 'Fetches messages filtered by room');

    // 9. Send message to a room
    const sendRoomRes = await fetch(`${BASE_URL}/conversations/${abuadGroup.id}/messages`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ body: 'Testing room messaging!', roomId: generalRoom.id }),
    });
    const sendRoomData = await sendRoomRes.json();
    assert(sendRoomData.message.roomId === generalRoom.id, 'Sends message tagged with roomId');

    // 10. Add reaction
    const reactRes = await fetch(`${BASE_URL}/conversations/messages/${sendRoomData.message.id}/reaction`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ emoji: '🔥' }),
    });
    const reactData = await reactRes.json();
    assert(reactData.success === true, 'Adds reaction to message');

    // 11. Create a New Group with custom expiration and rooms
    const createGroupRes = await fetch(`${BASE_URL}/conversations`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        type: 'group',
        title: 'E2E Test Squad 🚀',
        endsAt: new Date(Date.now() + 24 * 3600000).toISOString(),
        rooms: [
          { name: 'General', emoji: '💬' },
          { name: 'Devs', emoji: '💻' },
        ],
        memberIds: [tolaUser.id],
      }),
    });
    const createGroupData = await createGroupRes.json();
    assert(!!createGroupData.conversationId, 'Creates group with expiration and custom rooms');

    // 12. Add room to group
    const addRoomRes = await fetch(`${BASE_URL}/conversations/${createGroupData.conversationId}/rooms`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ name: 'ChitChat', emoji: '☕' }),
    });
    const addRoomData = await addRoomRes.json();
    assert(addRoomData.room.name === 'ChitChat', 'Adds new room to existing group');

    // 13. Update Group Expiration
    const expUpdateRes = await fetch(`${BASE_URL}/conversations/${createGroupData.conversationId}/expiration`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ endsAt: new Date(Date.now() + 7 * 24 * 3600000).toISOString() }),
    });
    const expUpdateData = await expUpdateRes.json();
    assert(!!expUpdateData.conversation.endsAt, 'Updates group expiration');

    // 14. Archive and Reopen Conversation
    const archRes = await fetch(`${BASE_URL}/conversations/${createGroupData.conversationId}/archive`, {
      method: 'POST',
      headers: authHeaders,
    });
    assert(archRes.ok, 'Archives temporary group');

    const reopenRes = await fetch(`${BASE_URL}/conversations/${createGroupData.conversationId}/reopen`, {
      method: 'POST',
      headers: authHeaders,
    });
    assert(reopenRes.ok, 'Reopens archived group');

    // 15. Stories Feed
    const feedRes = await fetch(`${BASE_URL}/stories/feed`, { headers: authHeaders });
    const feedData = await feedRes.json();
    assert(feedData.feeds.length > 0, 'Retrieves active 24h stories feed');

    const pollStory = feedData.feeds.flatMap((f: any) => f.stories).find((s: any) => s.type === 'poll' || s.data?.poll);
    assert(!!pollStory, 'Poll story exists in stories feed');

    // 16. Vote on Poll Story
    if (pollStory) {
      const voteRes = await fetch(`${BASE_URL}/stories/${pollStory.id}/poll-vote`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ optionIndex: 0 }),
      });
      const voteData = await voteRes.json();
      assert(voteData.poll.opts[0].v.includes(meData.user.id), 'Records vote on story poll');
    }

    // 17. Answer Q&A Story
    const qaStory = feedData.feeds.flatMap((f: any) => f.stories).find((s: any) => s.type === 'qa' || s.data?.qa);
    if (qaStory) {
      const qaRes = await fetch(`${BASE_URL}/stories/${qaStory.id}/qa-answer`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ text: 'Automated test answer for zero-downtime DB migrations!' }),
      });
      const qaData = await qaRes.json();
      assert(qaData.qa.answers.length > 0, 'Submits answer to Q&A story');
    }

    // 18. Create New Story
    const newStoryRes = await fetch(`${BASE_URL}/stories`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        type: 'text',
        text: 'Automated test story from Dayo! ✨',
        background: 'linear-gradient(135deg, #0F6B58, #18C8FF)',
        audience: 'friends',
      }),
    });
    const newStoryData = await newStoryRes.json();
    assert(!!newStoryData.story.id, 'Creates new 24h story');

    // 19. Games Catalog
    const gamesRes = await fetch(`${BASE_URL}/games`, { headers: authHeaders });
    const gamesData = await gamesRes.json();
    assert(gamesData.games.length >= 2, 'Retrieves games catalog (Tic-Tac-Toe, Word Guess, etc.)');

    // 20. Tic-Tac-Toe Game Session & AI Bot Turn Duel
    const tolaConv = convsData.conversations.find((c: any) => c.title === 'Tola');
    const gameSessionRes = await fetch(`${BASE_URL}/games/sessions`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ gameKey: 'tictactoe', conversationId: tolaConv.id, opponentId: tolaUser.id }),
    });
    const gameSessionData = await gameSessionRes.json();
    assert(!!gameSessionData.session.id, 'Creates Tic-Tac-Toe game session against Tola Bot');

    const sessionId = gameSessionData.session.id;

    // Human makes move at index 4 (center)
    const moveRes = await fetch(`${BASE_URL}/games/sessions/${sessionId}/move`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ move: { index: 4 } }),
    });
    const moveData = await moveRes.json();
    assert(moveData.session.state.board[4] === 'X', 'Human move recorded on board');

    // Wait for Bot AI to play its turn (poll up to 3.5s for remote DB latency)
    let botPlayed = false;
    for (let i = 0; i < 7; i++) {
      await new Promise((r) => setTimeout(r, 500));
      const checkSessionRes = await fetch(`${BASE_URL}/games/sessions/${sessionId}`, { headers: authHeaders });
      const checkSessionData = await checkSessionRes.json();
      if (checkSessionData.session?.state?.board?.includes('O')) {
        botPlayed = true;
        break;
      }
    }
    assert(botPlayed, 'Tola AI Bot automatically computed and played its counter-move (O)!');

    console.log(`\n=== TEST RESULTS: ${passed} PASSED, ${failed} FAILED ===`);
  } catch (err) {
    console.error('Test execution error:', err);
  }
}

runTests();
