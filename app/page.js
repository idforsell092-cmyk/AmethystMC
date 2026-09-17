'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ADMIN_EMAIL = "exploiterwhite@gmail.com";

const SERVICES = [
  "Paid Minecraft Video Editing",
  "Paid Minecraft Shorts Editing",
  "Paid Thumbnail Making",
  "Paid Minecraft Plugin Making",
  "Paid Minecraft Skript Making",
  "Paid Storytime Making",
  "Paid Minecraft Skin Making",
  "Paid PvP Teaching",
  "Paid Minecraft Skills Teaching",
  "Paid Minecraft Editing Tutorial",
  "Paid Minecraft Thumbnail Tutorials",
  "Paid Builds Making"
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
      if (data.some(m => m.is_closed)) {
        setIsChatClosed(true);
      } else {
        setIsChatClosed(false);
      }
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
    <div className="min-h-screen bg-purple-950 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-purple-800/50 bg-purple-900/40 p-4 flex justify-between items-center backdrop-blur-md">
        <h1 className="text-xl font-bold text-purple-400 tracking-wider">AMETHYST STORE</h1>
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-xs text-purple-300 bg-purple-900 px-3 py-1 rounded-full border border-purple-600">
              {user.email} {isAdmin && "(Admin)"}
            </span>
            <button onClick={() => supabase.auth.signOut()} className="text-sm bg-purple-800 hover:bg-purple-700 px-3 py-1.5 rounded-lg border border-purple-600">
              Sign Out
            </button>
          </div>
        ) : (
          <button onClick={() => setIsAuthModalOpen(true)} className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-lg font-medium shadow-lg shadow-purple-600/30">
            Sign In / Register
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6 flex-1 w-full">
        <div className="text-center my-8">
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300">
            Amethyst Services
          </h2>
          <p className="text-purple-300/70 mt-2">Select a service category below to start a private consultation with our admin.</p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SERVICES.map((service, index) => (
            <div 
              key={index} 
              onClick={() => handleServiceClick(service)}
              className="bg-purple-900/30 hover:bg-purple-800/40 border border-purple-800/60 hover:border-purple-500/80 p-5 rounded-xl cursor-pointer transition-all duration-200 shadow-lg hover:shadow-purple-900/50 backdrop-blur-sm"
            >
              <h3 className="text-lg font-semibold text-purple-200">{service}</h3>
              <p className="text-xs text-purple-400/60 mt-2">Click to open private inquiry chat →</p>
            </div>
          ))}
        </div>
      </main>

      {/* Chat Modal Window */}
      {selectedCategory && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-purple-900 border border-purple-700 rounded-2xl w-full max-w-2xl h-[550px] flex flex-col shadow-2xl">
            {/* Chat Header */}
            <div className="p-4 border-b border-purple-800 flex justify-between items-center bg-purple-950/50 rounded-t-2xl">
              <div>
                <h3 className="font-bold text-purple-200">{selectedCategory}</h3>
                <p className="text-xs text-purple-400">Private Admin Consultation</p>
              </div>
              <div className="flex gap-2">
                {isAdmin && (
                  <button 
                    onClick={toggleCloseChat} 
                    className={`text-xs px-3 py-1.5 rounded-md font-medium border ${isChatClosed ? 'bg-green-600 border-green-500' : 'bg-red-600 border-red-500'}`}
                  >
                    {isChatClosed ? 'Reopen Chat' : 'Close Chat'}
                  </button>
                )}
                <button onClick={() => setSelectedCategory(null)} className="text-purple-400 hover:text-white px-2">✕</button>
              </div>
            </div>

            {/* Chat Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-purple-400/50 py-10">
                  No messages yet. Send a message to start talking with admin!
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender_email === user?.email;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] text-purple-400/70 mb-1">{msg.sender_email}</span>
                      <div className={`p-3 rounded-xl max-w-[80%] text-sm ${isMe ? 'bg-purple-600 text-white' : 'bg-purple-950 border border-purple-800 text-purple-100'}`}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-purple-800 bg-purple-950/30">
              {isChatClosed ? (
                <div className="text-center text-sm text-red-400 py-2 bg-red-950/30 border border-red-900 rounded-lg">
                  This chat has been closed by admin.
                </div>
              ) : (
                <form onSubmit={sendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className="flex-1 bg-purple-950 border border-purple-800 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                  <button type="submit" className="bg-purple-600 hover:bg-purple-500 px-5 py-2 rounded-lg text-sm font-medium">
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
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-purple-900 border border-purple-700 p-6 rounded-2xl w-full max-w-sm shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-purple-200">Account Access</h3>
            <div className="space-y-3">
              <input 
                type="email" 
                placeholder="Email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-purple-950 border border-purple-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              />
              <input 
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-purple-950 border border-purple-800 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              />
              <div className="flex gap-2 pt-2">
                <button onClick={() => handleAuth('login')} className="flex-1 bg-purple-600 hover:bg-purple-500 py-2 rounded-lg text-sm font-medium">
                  Sign In
                </button>
                <button onClick={() => handleAuth('signup')} className="flex-1 bg-purple-800 hover:bg-purple-700 py-2 rounded-lg text-sm font-medium border border-purple-600">
                  Register
                </button>
              </div>
              <button onClick={() => setIsAuthModalOpen(false)} className="w-full text-xs text-purple-400 mt-2 hover:underline">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
    }
                
