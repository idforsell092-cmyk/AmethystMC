'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ADMIN_EMAIL = "exploiterwhite@gmail.com";

const SERVICES = [
  { id: "01", name: "Short-form editing", desc: "Shorts, Reels and TikTok. Hook-first structure, light sound design and pacing that survives the first swipe.", tag: "SPEED // 01", badges: ["SHORTS", "REELS", "PACING"] },
  { id: "02", name: "Long-form editing", desc: "Full episodes and series. Multicam sync, narrative pruning, comedic timing and continuity across a season.", tag: "SERIES // 02", badges: ["EPISODES", "EDITING", "TIMING"] },
  { id: "03", name: "Motion design", desc: "Typography, block wipes, map tracking, camera projection and HUD overlays built to match your channel.", tag: "GRAPHICS // 03", badges: ["OVERLAYS", "EFFECTS", "TRACKING"] },
  { id: "04", name: "Minecraft animation", desc: "Rigged characters, lit set-pieces, cinematic camera work and server reveal trailers rendered with shaders.", tag: "CINEMATIC // 04", badges: ["SHADERS", "TRAILERS", "3D RIGS"] }
];

export default function Home() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChatClosed, setIsChatClosed] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user?.email === ADMIN_EMAIL) setIsAdmin(true);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setIsAdmin(currentUser?.email === ADMIN_EMAIL);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedCategory && user) {
      fetchMessages();
      const channel = supabase
        .channel('public:chat_messages')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, () => {
          fetchMessages();
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [selectedCategory, user]);

  const fetchMessages = async () => {
    let query = supabase
      .from('chat_messages')
      .select('*')
      .eq('category', selectedCategory)
      .order('created_at', { ascending: true });

    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    }

    const { data } = await query;
    if (data) {
      setMessages(data);
      setIsChatClosed(data.some(m => m.is_closed));
    }
  };

  const handleAuth = async (type) => {
    let error;
    if (type === 'signup') {
      const res = await supabase.auth.signUp({ email, password });
      error = res.error;
      if (!error && res.data.user) {
        await supabase.from('profiles').insert([{ 
          id: res.data.user.id, 
          email, 
          is_admin: email === ADMIN_EMAIL 
        }]);
      }
    } else {
      const res = await supabase.auth.signInWithPassword({ email, password });
      error = res.error;
    }
    if (error) alert(error.message);
    else setIsAuthModalOpen(false);
  };

  const handleServiceClick = (category) => {
    if (!user) {
      setIsAuthModalOpen(true);
    } else {
      setSelectedCategory(category);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || isChatClosed) return;

    await supabase.from('chat_messages').insert([{
      user_id: user.id,
      category: selectedCategory,
      sender_email: user.email,
      message: newMessage
    }]);

    setNewMessage('');
    fetchMessages();
  };

  const toggleCloseChat = async () => {
    const newStatus = !isChatClosed;
    await supabase
      .from('chat_messages')
      .update({ is_closed: newStatus })
      .eq('category', selectedCategory);
    
    setIsChatClosed(newStatus);
    fetchMessages();
  };

  return (
    <div style={{ backgroundColor: '#07060a', color: '#f4f4f5', minHeight: '100vh', paddingBottom: '60px' }}>
      
      {/* Top Navbar */}
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #1f1b2e', backgroundColor: '#09070e', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ backgroundColor: '#9333ea', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px', color: '#fff', boxShadow: '0 0 12px rgba(147, 51, 234, 0.6)' }}>
            K2
          </div>
          <span style={{ fontWeight: '700', fontSize: '12px', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#e4e4e7' }}>KYRO PROD</span>
        </div>

        <div>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '11px', color: '#a1a1aa', fontFamily: 'monospace', backgroundColor: '#18181b', padding: '6px 12px', borderRadius: '6px', border: '1px solid #27272a' }}>
                {user.email} {isAdmin && <span style={{ color: '#c084fc', fontWeight: 'bold' }}>(ADMIN)</span>}
              </span>
              <button onClick={() => supabase.auth.signOut()} style={{ fontSize: '11px', backgroundColor: '#18181b', color: '#d4d4d8', padding: '6px 12px', borderRadius: '6px', border: '1px solid #27272a', cursor: 'pointer' }}>
                Sign Out
              </button>
            </div>
          ) : (
            <button onClick={() => setIsAuthModalOpen(true)} style={{ backgroundColor: '#9333ea', color: '#fff', fontSize: '12px', fontWeight: '600', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', boxShadow: '0 0 15px rgba(147, 51, 234, 0.5)' }}>
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Hero Header */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '60px 24px 40px 24px' }}>
        <p style={{ fontSize: '11px', fontFamily: 'monospace', letterSpacing: '2px', color: '#71717a', textTransform: 'uppercase', marginBottom: '12px' }}>
          MINECRAFT MEDIA PRODUCTION STUDIO
        </p>
        
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: '800', lineHeight: '1.1', maxWidth: '650px', margin: 0 }}>
          Edits that keep people <span className="glow-purple" style={{ color: '#c084fc' }}>watching.</span>
        </h1>
        
        <p style={{ fontSize: '13px', color: '#a1a1aa', maxWidth: '450px', marginTop: '16px', lineHeight: '1.6' }}>
          Short-form, long-form, motion design and cinematics for Minecraft creators, servers and gaming brands.
        </p>

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button style={{ backgroundColor: '#9333ea', color: '#fff', fontSize: '12px', fontWeight: '600', padding: '10px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', boxShadow: '0 0 15px rgba(147, 51, 234, 0.4)' }}>
            SEE THE WORK →
          </button>
          <button onClick={() => !user && setIsAuthModalOpen(true)} style={{ backgroundColor: '#120f1d', color: '#d4d4d8', fontSize: '12px', fontWeight: '600', padding: '10px 20px', borderRadius: '6px', border: '1px solid #27272a', cursor: 'pointer' }}>
            START A PROJECT
          </button>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', maxWidth: '450px', marginTop: '50px', paddingTop: '30px', borderTop: '1px solid #18181b' }}>
          <div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#fff' }}>5,000,000+</div>
            <div style={{ fontSize: '9px', fontFamily: 'monospace', color: '#71717a', marginTop: '4px' }}>VIEWS GENERATED</div>
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#fff' }}>3.5+</div>
            <div style={{ fontSize: '9px', fontFamily: 'monospace', color: '#71717a', marginTop: '4px' }}>YEARS EDITING</div>
          </div>
          <div>
            <div style={{ fontSize: '22px', fontWeight: '800', color: '#fff' }}>99+</div>
            <div style={{ fontSize: '9px', fontFamily: 'monospace', color: '#71717a', marginTop: '4px' }}>ZONES DELIVERED</div>
          </div>
        </div>
      </div>

      {/* Services Grid (Four ways we cut) */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px 24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '10px', fontFamily: 'monospace', color: '#a1a1aa', letterSpacing: '2px', margin: 0 }}>DISCIPLINES // 01</p>
          <h2 style={{ fontSize: '28px', fontWeight: '800', margin: '6px 0' }}>
            Four ways we <span className="glow-purple" style={{ color: '#c084fc' }}>cut.</span>
          </h2>
          <p style={{ fontSize: '12px', color: '#a1a1aa', margin: 0 }}>
            Each discipline is its own pipeline, with its own reference library and its own delivery spec.
          </p>
        </div>

        {/* 2x2 Dark Grid Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {SERVICES.map((s) => (
            <div 
              key={s.id}
              onClick={() => handleServiceClick(s.name)}
              style={{
                backgroundColor: '#0c0a14',
                border: '1px solid #221c35',
                borderRadius: '12px',
                padding: '24px',
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: '#1e1438', border: '1px solid #3b2768', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#c084fc', fontSize: '12px' }}>
                  ⚡
                </div>
                <span style={{ fontSize: '10px', fontFamily: 'monospace', color: '#71717a' }}>{s.tag}</span>
              </div>
              
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', margin: '0 0 8px 0' }}>{s.name}</h3>
              <p style={{ fontSize: '12px', color: '#a1a1aa', lineHeight: '1.6', margin: 0 }}>{s.desc}</p>
              
              <div style={{ display: 'flex', gap: '6px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #161224' }}>
                {s.badges.map((b, i) => (
                  <span key={i} style={{ fontSize: '8px', fontFamily: 'monospace', color: '#71717a', backgroundColor: '#120f1d', padding: '4px 8px', borderRadius: '4px', border: '1px solid #1f1b2e' }}>
                    {b}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Production Stage / Process Timeline */}
      <div style={{ maxWidth: '1000px', margin: '40px auto 0 auto', padding: '40px 24px 0 24px', borderTop: '1px solid #18181b' }}>
        <div style={{ marginBottom: '30px' }}>
          <p style={{ fontSize: '10px', fontFamily: 'monospace', color: '#a1a1aa', letterSpacing: '2px', margin: 0 }}>PRODUCTION // 02</p>
          <h2 style={{ fontSize: '28px', fontWeight: '800', margin: '6px 0' }}>
            Footage in, <span className="glow-purple" style={{ color: '#c084fc' }}>advancement out.</span>
          </h2>
          <p style={{ fontSize: '12px', color: '#a1a1aa', margin: 0 }}>Four stages. You always know which one your video is sitting in.</p>
        </div>

        {/* Timeline Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {[
            { step: "01 // BRIEF", title: "Blueprint", desc: "You send raw files, audio and references. We agree the shape of the video before a single cut is made." },
            { step: "02 // DRAFTING", title: "First cut", desc: "Rough assembly, narrative pruning, sound effects and motion graphics laid straight into the timeline." },
            { step: "03 // PRODUCTION", title: "Polish", desc: "Micro-pacing, colour, audio balance and a final sound pass. Revision notes land here." },
            { step: "04 // DELIVERY", title: "Master out", desc: "4K60 master plus platform-ready exports, handed over on the agreed date with project files on request." }
          ].map((item, i) => (
            <div key={i} style={{ backgroundColor: '#09070f', border: '1px solid #1d182b', padding: '16px', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <div style={{ width: '18px', height: '18px', borderRadius: '4px', backgroundColor: '#1e1438', border: '1px solid #3b2768', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', color: '#c084fc' }}>📄</div>
                <span style={{ fontSize: '9px', fontFamily: 'monospace', color: '#71717a' }}>{item.step}</span>
              </div>
              <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#fff', margin: '0 0 6px 0' }}>{item.title}</h4>
              <p style={{ fontSize: '11px', color: '#a1a1aa', lineHeight: '1.5', margin: 0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Direct Order Ticket Modal */}
      {selectedCategory && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 100 }}>
          <div style={{ backgroundColor: '#0c0a12', border: '1px solid #27272a', borderRadius: '12px', width: '100%', maxWidth: '550px', height: '500px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #27272a', backgroundColor: '#08070d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', margin: 0 }}>{selectedCategory}</h3>
                <p style={{ fontSize: '10px', fontFamily: 'monospace', color: '#71717a', margin: 0 }}>DIRECT CONSULTATION CHANNEL</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isAdmin && (
                  <button 
                    onClick={toggleCloseChat} 
                    style={{ fontSize: '10px', fontFamily: 'monospace', padding: '4px 8px', borderRadius: '4px', border: '1px solid #3f3f46', backgroundColor: isChatClosed ? '#064e3b' : '#881337', color: '#fff', cursor: 'pointer' }}
                  >
                    {isChatClosed ? 'REOPEN' : 'CLOSE ORDER'}
                  </button>
                )}
                <button onClick={() => setSelectedCategory(null)} style={{ background: 'none', border: 'none', color: '#71717a', fontSize: '16px', cursor: 'pointer' }}>✕</button>
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', backgroundColor: '#07060a', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#52525b', fontSize: '12px', fontFamily: 'monospace', paddingTop: '40px' }}>
                  No messages yet. Send your requirements to start the project.
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_email === user?.email;
                  return (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      <span style={{ fontSize: '9px', fontFamily: 'monospace', color: '#52525b', marginBottom: '2px' }}>{msg.sender_email}</span>
                      <div style={{ padding: '10px 14px', borderRadius: '8px', maxWidth: '80%', fontSize: '12px', backgroundColor: isMe ? '#9333ea' : '#18181b', color: '#fff', border: isMe ? 'none' : '1px solid #27272a' }}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ padding: '12px', borderTop: '1px solid #27272a', backgroundColor: '#08070d' }}>
              {isChatClosed ? (
                <div style={{ textAlign: 'center', fontSize: '12px', color: '#f43f5e', padding: '8px', backgroundColor: '#4c0519', border: '1px solid #881337', borderRadius: '6px' }}>
                  This inquiry ticket is closed.
                </div>
              ) : (
                <form onSubmit={sendMessage} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Write your requirement details..."
                    style={{ flex: 1, backgroundColor: '#07060a', border: '1px solid #27272a', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', color: '#fff', outline: 'none' }}
                  />
                  <button type="submit" style={{ backgroundColor: '#9333ea', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                    Send
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {isAuthModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', zIndex: 100 }}>
          <div style={{ backgroundColor: '#0c0a12', border: '1px solid #27272a', borderRadius: '12px', width: '100%', maxWidth: '350px', padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#fff', margin: '0 0 4px 0' }}>Sign In / Register</h3>
            <p style={{ fontSize: '11px', color: '#71717a', margin: '0 0 16px 0' }}>Login to submit project requests and chat.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input 
                type="email" 
                placeholder="Email address" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                style={{ backgroundColor: '#07060a', border: '1px solid #27272a', borderRadius: '6px', padding: '10px', fontSize: '12px', color: '#fff', outline: 'none' }}
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                style={{ backgroundColor: '#07060a', border: '1px solid #27272a', borderRadius: '6px', padding: '10px', fontSize: '12px', color: '#fff', outline: 'none' }}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button onClick={() => handleAuth('login')} style={{ flex: 1, backgroundColor: '#9333ea', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                  Sign In
                </button>
                <button onClick={() => handleAuth('signup')} style={{ flex: 1, backgroundColor: '#18181b', color: '#d4d4d8', border: '1px solid #27272a', padding: '8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}>
                  Register
                </button>
              </div>
              <button onClick={() => setIsAuthModalOpen(false)} style={{ background: 'none', border: 'none', color: '#71717a', fontSize: '11px', marginTop: '8px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
