'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ADMIN_EMAIL = "exploiterwhite@gmail.com";

const SERVICES = [
  { id: "01", name: "Short-form Editing", desc: "Shorts, Reels & TikTok. Hook-first structure, tight sound design and pacing.", tag: "SPEED" },
  { id: "02", name: "Long-form Editing", desc: "Full episodes and series. Multicam sync, narrative pruning and comedic timing.", tag: "SERIES" },
  { id: "03", name: "Thumbnail Design", desc: "High CTR custom thumbnails, 3D renders, face expressions and eye-catching glow.", tag: "CLICK-THROUGH" },
  { id: "04", name: "Plugin & Skript Dev", desc: "Custom server plugins, Skript automation, optimized code and zero lag.", tag: "MINECRAFT" },
  { id: "05", name: "PvP & Skill Coaching", desc: "1v1 PvP mechanical teaching, movement techniques and competitive practice.", tag: "COACHING" },
  { id: "06", name: "Custom Builds & Skins", desc: "High quality Minecraft skins, spawn builds, arena maps and detailed models.", tag: "CREATIVE" }
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
    <div className="min-h-screen bg-[#07060a] text-zinc-100 font-sans selection:bg-purple-500 selection:text-white">
      {/* Top Navbar */}
      <nav className="border-b border-zinc-800/80 bg-[#0a0810]/80 backdrop-blur-xl sticky top-0 z-40 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center font-black text-xs tracking-tighter text-white shadow-lg shadow-purple-900/40">
            AM
          </div>
          <span className="font-bold tracking-widest text-sm uppercase text-zinc-200">AMETHYST PROD</span>
        </div>

        <div>
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1.5 rounded-full">
                {user.email} {isAdmin && <span className="text-purple-400 font-semibold">(Admin)</span>}
              </span>
              <button onClick={() => supabase.auth.signOut()} className="text-xs bg-zinc-900 hover:bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg border border-zinc-800 transition">
                Sign Out
              </button>
            </div>
          ) : (
            <button onClick={() => setIsAuthModalOpen(true)} className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold px-5 py-2.5 rounded-lg shadow-lg shadow-purple-600/20 transition">
              Sign In
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-left relative">
        <div className="inline-flex items-center gap-2 bg-purple-950/40 border border-purple-800/50 text-purple-300 text-[11px] font-mono px-3 py-1 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"></span>
          MINECRAFT MEDIA PRODUCTION STUDIO
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white max-w-3xl leading-[1.1]">
          Edits that keep people <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">watching.</span>
        </h1>
        
        <p className="text-zinc-400 text-base max-w-xl mt-6 leading-relaxed">
          Short-form, long-form, motion design, plugins and custom builds for Minecraft creators, servers, and gaming brands.
        </p>

        {/* Stats Row */}
        <div className="flex flex-wrap gap-12 mt-12 pt-8 border-t border-zinc-900">
          <div>
            <p className="text-3xl font-extrabold text-white">5,000,000+</p>
            <p className="text-xs text-zinc-500 font-mono mt-1 uppercase">Views Generated</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white">3.5+</p>
            <p className="text-xs text-zinc-500 font-mono mt-1 uppercase">Years Editing</p>
          </div>
          <div>
            <p className="text-3xl font-extrabold text-white">99+</p>
            <p className="text-xs text-zinc-500 font-mono mt-1 uppercase">Orders Delivered</p>
          </div>
        </div>
      </section>

      {/* Services Grid (Four ways we cut style) */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <p className="text-xs font-mono text-purple-400 uppercase tracking-widest">DISCIPLINES // 01</p>
          <h2 className="text-3xl font-extrabold text-white mt-2">Six ways we elevate.</h2>
          <p className="text-zinc-400 text-sm mt-1">Select any service to initiate a direct consultation pipeline.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SERVICES.map((s) => (
            <div 
              key={s.id}
              onClick={() => handleServiceClick(s.name)}
              className="group bg-[#0d0a14] border border-zinc-800/80 hover:border-purple-600/60 p-6 rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-mono text-zinc-600 group-hover:text-purple-400 transition">{s.id} // {s.tag}</span>
                <span className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-xs text-zinc-400 group-hover:bg-purple-600 group-hover:text-white transition">↗</span>
              </div>
              <h3 className="text-xl font-bold text-zinc-100 group-hover:text-purple-300 transition">{s.name}</h3>
              <p className="text-zinc-400 text-sm mt-2 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow Timeline Section */}
      <section className="max-w-6xl mx-auto px-6 py-16 border-t border-zinc-900">
        <div className="mb-10">
          <p className="text-xs font-mono text-purple-400 uppercase tracking-widest">PRODUCTION // 02</p>
          <h2 className="text-3xl font-extrabold text-white mt-2">Footage in, <span className="text-purple-400">advancement out.</span></h2>
          <p className="text-zinc-400 text-sm mt-1">Four stages. You always know where your project is sitting.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { step: "01", title: "Blueprint", desc: "Brief, references and raw assets agreed upon." },
            { step: "02", title: "First Cut", desc: "Rough assembly, sound design, and main pacing." },
            { step: "03", title: "Polish", desc: "Color grading, micro-pacing, and effect pass." },
            { step: "04", title: "Master Out", desc: "Final 4K export delivered on schedule." }
          ].map((item, i) => (
            <div key={i} className="bg-[#0b0910] border border-zinc-900 p-5 rounded-xl">
              <span className="text-xs font-mono text-purple-500 font-bold">{item.step}</span>
              <h4 className="text-base font-bold text-white mt-2">{item.title}</h4>
              <p className="text-xs text-zinc-500 mt-1 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Chat / Inquiry Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#0e0c15] border border-zinc-800 rounded-2xl w-full max-w-2xl h-[580px] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800/80 flex justify-between items-center bg-[#08070d]">
              <div>
                <h3 className="font-bold text-white text-base">{selectedCategory}</h3>
                <p className="text-xs text-zinc-500 font-mono">DIRECT INQUIRY CHANNEL</p>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button 
                    onClick={toggleCloseChat} 
                    className={`text-xs px-3 py-1 rounded-md font-medium border ${isChatClosed ? 'bg-emerald-950 border-emerald-800 text-emerald-400' : 'bg-rose-950 border-rose-800 text-rose-400'}`}
                  >
                    {isChatClosed ? 'Reopen' : 'Close Order'}
                  </button>
                )}
                <button onClick={() => setSelectedCategory(null)} className="text-zinc-500 hover:text-white px-2 text-lg">✕</button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#07060a]">
              {messages.length === 0 ? (
                <div className="text-center text-zinc-600 text-xs font-mono py-16">
                  No messages yet. Send a message to start your project discussion!
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_email === user?.email;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] font-mono text-zinc-500 mb-1">{msg.sender_email}</span>
                      <div className={`p-3 rounded-xl max-w-[80%] text-xs leading-relaxed ${isMe ? 'bg-purple-600 text-white' : 'bg-zinc-900 border border-zinc-800 text-zinc-200'}`}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-4 border-t border-zinc-800/80 bg-[#08070d]">
              {isChatClosed ? (
                <div className="text-center text-xs text-rose-400 py-2 bg-rose-950/30 border border-rose-900/50 rounded-lg">
                  This inquiry has been closed by admin.
                </div>
              ) : (
                <form onSubmit={sendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Describe your requirements..."
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-600"
                  />
                  <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-lg text-xs font-semibold">
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
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-[#0e0c15] border border-zinc-800 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1">Access Studio</h3>
            <p className="text-xs text-zinc-500 mb-4">Login or register to open order tickets.</p>
            <div className="space-y-3">
              <input 
                type="email" 
                placeholder="Email address" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-purple-600"
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-purple-600"
              />
              <div className="flex gap-2 pt-2">
                <button onClick={() => handleAuth('login')} className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-2.5 rounded-lg text-xs font-semibold">
                  Sign In
                </button>
                <button onClick={() => handleAuth('signup')} className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 py-2.5 rounded-lg text-xs font-semibold border border-zinc-800">
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
                
