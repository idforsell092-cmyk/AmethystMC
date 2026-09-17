'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ADMIN_EMAIL = "exploiterwhite@gmail.com";

const SERVICES = [
  { id: "01", name: "Short-form editing", desc: "Shorts, Reels and TikTok. Hook-first structure, light sound design and pacing that survives the first swipe.", tag: "SPEED // 01" },
  { id: "02", name: "Long-form editing", desc: "Full episodes and series. Multicam sync, narrative pruning, comedic timing and continuity across a season.", tag: "SERIES // 02" },
  { id: "03", name: "Motion design", desc: "Typography, block wipes, map tracking, camera projection and HUD overlays built to match your channel.", tag: "GRAPHICS // 03" },
  { id: "04", name: "Minecraft animation", desc: "Rigged characters, lit set-pieces, cinematic camera work and server reveal trailers rendered with shaders.", tag: "CINEMATIC // 04" }
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
    <div className="min-h-screen bg-[#07060a] text-zinc-100 font-sans antialiased selection:bg-purple-600 selection:text-white">
      {/* Header / Navbar */}
      <nav className="border-b border-zinc-800/60 bg-[#09070e]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-purple-600 flex items-center justify-center font-bold text-xs text-white glow-button">
            K2
          </div>
          <span className="font-semibold tracking-wider text-xs uppercase text-zinc-200">KYRO PROD</span>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-400 font-mono bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-md">
                {user.email} {isAdmin && <span className="text-purple-400 font-bold">(ADMIN)</span>}
              </span>
              <button onClick={() => supabase.auth.signOut()} className="text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-3 py-1.5 rounded-md border border-zinc-800 transition">
                Sign Out
              </button>
            </div>
          ) : (
            <button onClick={() => setIsAuthModalOpen(true)} className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium px-4 py-1.5 rounded-md glow-button transition">
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16">
        <div className="text-[11px] font-mono tracking-widest text-zinc-500 uppercase mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
          MINECRAFT MEDIA PRODUCTION STUDIO
        </div>
        
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white max-w-2xl leading-tight">
          Edits that keep people <span className="text-purple-400 glow-purple-text">watching.</span>
        </h1>
        
        <p className="text-zinc-400 text-xs md:text-sm max-w-md mt-4 leading-relaxed">
          Short-form, long-form, motion design and cinematics for Minecraft creators, servers and gaming brands.
        </p>

        <div className="flex gap-3 mt-8">
          <button className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-5 py-2.5 rounded-md glow-button transition">
            SEE THE WORK →
          </button>
          <button onClick={() => !user && setIsAuthModalOpen(true)} className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-semibold px-5 py-2.5 rounded-md transition">
            START A PROJECT
          </button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-6 max-w-md mt-16 pt-8 border-t border-zinc-900">
          <div>
            <p className="text-2xl font-bold text-white tracking-tight">5,000,000+</p>
            <p className="text-[10px] text-zinc-500 font-mono mt-1 uppercase">VIEWS GENERATED</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white tracking-tight">3.5+</p>
            <p className="text-[10px] text-zinc-500 font-mono mt-1 uppercase">YEARS EDITING</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white tracking-tight">99+</p>
            <p className="text-[10px] text-zinc-500 font-mono mt-1 uppercase">ZONES DELIVERED</p>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest">DISCIPLINES // 01</p>
          <h2 className="text-3xl font-bold text-white mt-2">
            Four ways we <span className="text-purple-400 glow-purple-text">cut.</span>
          </h2>
          <p className="text-zinc-400 text-xs mt-1">
            Each discipline is its own pipeline, with its own reference library and its own delivery spec.
          </p>
        </div>

        {/* 2x2 Dark Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SERVICES.map((s) => (
            <div 
              key={s.id}
              onClick={() => handleServiceClick(s.name)}
              className="group bg-[#0b0912] border border-zinc-800/80 hover:border-purple-600/50 p-6 rounded-xl cursor-pointer transition-all duration-200 glow-purple-box relative"
            >
              <div className="flex justify-between items-center mb-6">
                <div className="w-8 h-8 rounded bg-purple-950/50 border border-purple-800/50 flex items-center justify-center text-purple-400 text-xs">
                  ⚡
                </div>
                <span className="text-[10px] font-mono text-zinc-600 group-hover:text-purple-400 transition">{s.tag}</span>
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-purple-300 transition">{s.name}</h3>
              <p className="text-zinc-400 text-xs mt-2 leading-relaxed">{s.desc}</p>
              
              {/* Bottom Tags */}
              <div className="flex gap-2 mt-6 pt-4 border-t border-zinc-900/80">
                <span className="text-[9px] font-mono text-zinc-500 bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">SHORTS</span>
                <span className="text-[9px] font-mono text-zinc-500 bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">REELS</span>
                <span className="text-[9px] font-mono text-zinc-500 bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-800">PACING</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Production Stage / Process Timeline */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-zinc-900">
        <div className="mb-10">
          <p className="text-[11px] font-mono text-zinc-500 uppercase tracking-widest">PRODUCTION // 02</p>
          <h2 className="text-3xl font-bold text-white mt-2">
            Footage in, <span className="text-purple-400 glow-purple-text">advancement out.</span>
          </h2>
          <p className="text-zinc-400 text-xs mt-1">Four stages. You always know which one your video is sitting in.</p>
        </div>

        {/* Horizontal Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {[
            { step: "01 // BRIEF", title: "Blueprint", desc: "You send raw files, audio and references. We agree the shape of the video before a single cut is made." },
            { step: "02 // DRAFTING", title: "First cut", desc: "Rough assembly, narrative pruning, sound effects and motion graphics laid straight into the timeline." },
            { step: "03 // PRODUCTION", title: "Polish", desc: "Micro-pacing, colour, audio balance and a final sound pass. Revision notes land here." },
            { step: "04 // DELIVERY", title: "Master out", desc: "4K60 master plus platform-ready exports, handed over on the agreed date with project files on request." }
          ].map((item, i) => (
            <div key={i} className="flex flex-col justify-between bg-[#08070d] border border-zinc-800/60 p-5 rounded-xl">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-5 h-5 rounded border border-purple-500/40 bg-purple-950/30 flex items-center justify-center text-[10px] text-purple-400 font-mono">📄</div>
                  <span className="text-[9px] font-mono text-zinc-500">{item.step}</span>
                </div>
                <h4 className="text-sm font-bold text-white">{item.title}</h4>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Direct Order Ticket Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#0c0a12] border border-zinc-800 rounded-xl w-full max-w-xl h-[520px] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800 bg-[#08070d] flex justify-between items-center">
              <div>
                <h3 className="font-bold text-white text-sm">{selectedCategory}</h3>
                <p className="text-[10px] font-mono text-zinc-500">DIRECT CONSULTATION CHANNEL</p>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button 
                    onClick={toggleCloseChat} 
                    className={`text-[10px] font-mono px-2.5 py-1 rounded border ${isChatClosed ? 'bg-emerald-950 border-emerald-800 text-emerald-400' : 'bg-rose-950 border-rose-800 text-rose-400'}`}
                  >
                    {isChatClosed ? 'REOPEN' : 'CLOSE ORDER'}
                  </button>
                )}
                <button onClick={() => setSelectedCategory(null)} className="text-zinc-500 hover:text-white px-2">✕</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#07060a]">
              {messages.length === 0 ? (
                <div className="text-center text-zinc-600 text-xs font-mono py-12">
                  No messages yet. Send your requirements to start the project.
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_email === user?.email;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-[9px] font-mono text-zinc-500 mb-1">{msg.sender_email}</span>
                      <div className={`p-3 rounded-lg max-w-[85%] text-xs leading-relaxed ${isMe ? 'bg-purple-600 text-white glow-button' : 'bg-zinc-900 border border-zinc-800 text-zinc-200'}`}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 border-t border-zinc-800 bg-[#08070d]">
              {isChatClosed ? (
                <div className="text-center text-xs text-rose-400 py-2 bg-rose-950/20 border border-rose-900/40 rounded">
                  This inquiry ticket is closed.
                </div>
              ) : (
                <form onSubmit={sendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Write your requirement details..."
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-600"
                  />
                  <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-xs font-semibold glow-button">
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#0c0a12] border border-zinc-800 p-6 rounded-xl w-full max-w-sm shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Sign In / Register</h3>
            <p className="text-xs text-zinc-500 mb-4">Login to submit project requests and chat.</p>
            <div className="space-y-3">
              <input 
                type="email" 
                placeholder="Email address" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs text-white focus:outline-none focus:border-purple-600"
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={(e) => setPassword(e.password || e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded p-2.5 text-xs text-white focus:outline-none focus:border-purple-600"
              />
              <div className="flex gap-2 pt-2">
                <button onClick={() => handleAuth('login')} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-2 rounded text-xs font-semibold glow-button">
                  Sign In
                </button>
                <button onClick={() => handleAuth('signup')} className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 py-2 rounded text-xs font-semibold border border-zinc-800">
                  Register
                </button>
              </div>
              <button onClick={() => setIsAuthModalOpen(false)} className="w-full text-xs text-zinc-500 mt-2 hover:text-zinc-300">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
          }
                
