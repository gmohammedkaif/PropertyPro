import { useState } from 'react'
import {
  Search,
  Send,
  CheckCheck,
  Phone,
  Video,
  Info,
  Circle,
} from 'lucide-react'

import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'

interface ChatThread {
  id: string
  name: string
  role: string
  avatar: string
  lastMessage: string
  time: string
  unreadCount: number
  online: boolean
  messages: Array<{
    id: string
    sender: 'me' | 'them'
    text: string
    time: string
  }>
}

const INITIAL_THREADS: ChatThread[] = [
  {
    id: 'ch_1',
    name: 'Rajesh Kumar',
    role: 'Tenant (Hassan Villa)',
    avatar: 'RK',
    lastMessage: 'Sure, I will make the rent transfer by tomorrow morning.',
    time: '2:15 PM',
    unreadCount: 2,
    online: true,
    messages: [
      { id: '1', sender: 'them', text: 'Hi, I received the invoice for August rent.', time: '11:00 AM' },
      { id: '2', sender: 'me', text: 'Great! Let me know if you face any issues with the payment gateway.', time: '11:15 AM' },
      { id: '3', sender: 'them', text: 'Sure, I will make the rent transfer by tomorrow morning.', time: '2:15 PM' },
    ],
  },
  {
    id: 'ch_2',
    name: 'Priya Sharma',
    role: 'Tenant (Green Park)',
    avatar: 'PS',
    lastMessage: 'The plumber has fixed the leak in the kitchen faucet. Thanks!',
    time: 'Yesterday',
    unreadCount: 0,
    online: false,
    messages: [
      { id: '1', sender: 'them', text: 'The leaking kitchen tap is wasting a lot of water.', time: 'Aug 4, 10:00 AM' },
      { id: '2', sender: 'me', text: 'I have assigned Ravi Plumbing Services. They will visit today.', time: 'Aug 4, 11:30 AM' },
      { id: '3', sender: 'them', text: 'The plumber has fixed the leak in the kitchen faucet. Thanks!', time: 'Aug 4, 4:00 PM' },
    ],
  },
  {
    id: 'ch_3',
    name: 'Ravi Verma',
    role: 'Plumber Vendor',
    avatar: 'RV',
    lastMessage: 'Job is done. Invoiced amount was INR 850.',
    time: '2 days ago',
    unreadCount: 0,
    online: true,
    messages: [
      { id: '1', sender: 'me', text: 'Hi Ravi, please check the tap leak at Green Park B-204.', time: 'Aug 3, 9:00 AM' },
      { id: '2', sender: 'them', text: 'On it. Reaching the site in 30 minutes.', time: 'Aug 3, 10:15 AM' },
      { id: '3', sender: 'them', text: 'Job is done. Invoiced amount was INR 850.', time: 'Aug 3, 1:00 PM' },
    ],
  },
]

export function MessagesPage() {
  const [threads, setThreads] = useState<ChatThread[]>(INITIAL_THREADS)
  const [activeThreadId, setActiveThreadId] = useState('ch_1')
  const [inputText, setInputText] = useState('')
  const [search, setSearch] = useState('')

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0]

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) return

    const newMessage = {
      id: crypto.randomUUID(),
      sender: 'me' as const,
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setThreads((prev) =>
      prev.map((thread) => {
        if (thread.id === activeThreadId) {
          // Clear unreadCount and update messages list
          return {
            ...thread,
            messages: [...thread.messages, newMessage],
            lastMessage: newMessage.text,
            time: 'Just now',
            unreadCount: 0,
          }
        }
        return thread
      }),
    )
    setInputText('')

    // Simulating auto-reply mock trigger
    setTimeout(() => {
      const replyMessage = {
        id: crypto.randomUUID(),
        sender: 'them' as const,
        text: `Got it! Thanks for reaching out. (Automatic mock reply)`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setThreads((prev) =>
        prev.map((thread) => {
          if (thread.id === activeThreadId) {
            return {
              ...thread,
              messages: [...thread.messages, replyMessage],
              lastMessage: replyMessage.text,
              time: 'Just now',
            }
          }
          return thread
        }),
      )
    }, 1500)
  }

  // Filter threads
  const filteredThreads = threads.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.role.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4 overflow-hidden rounded-xl border border-border bg-surface">
      {/* Left panel: Threads list */}
      <div className="flex w-80 flex-col border-r border-border bg-surface/50">
        <div className="p-4 border-b border-border">
          <Input
            placeholder="Search chat..."
            value={search}
            leftIcon={<Search className="h-4 w-4" />}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredThreads.map((thread) => {
            const isActive = thread.id === activeThreadId
            return (
              <button
                key={thread.id}
                onClick={() => {
                  setActiveThreadId(thread.id)
                  // Clear unread count when clicking on chat thread
                  setThreads((prev) =>
                    prev.map((t) => (t.id === thread.id ? { ...t, unreadCount: 0 } : t)),
                  )
                }}
                className={`flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors ${
                  isActive ? 'bg-primary-soft text-primary' : 'hover:bg-surface2'
                }`}
              >
                <div className="relative shrink-0">
                  <Avatar name={thread.name} size="md" />
                  {thread.online && (
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-surface" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-text truncate">{thread.name}</span>
                    <span className="text-[10px] text-muted shrink-0">{thread.time}</span>
                  </div>
                  <p className="text-[11px] text-muted font-medium mb-1">{thread.role}</p>
                  <p className="text-xs text-muted truncate">{thread.lastMessage}</p>
                </div>
                {thread.unreadCount > 0 && (
                  <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
                    {thread.unreadCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Right panel: Active chat window */}
      <div className="flex flex-1 flex-col bg-surface">
        {/* Active header info */}
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-3">
            <Avatar name={activeThread.name} size="md" />
            <div>
              <h2 className="text-sm font-bold text-text">{activeThread.name}</h2>
              <p className="text-xs text-muted flex items-center gap-1.5">
                <Circle className={`h-2 w-2 fill-current ${activeThread.online ? 'text-success' : 'text-muted'}`} />
                {activeThread.role} {activeThread.online ? '• Online' : '• Offline'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="icon-sm" className="rounded-full">
              <Phone className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="icon-sm" className="rounded-full">
              <Video className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="icon-sm" className="rounded-full">
              <Info className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Message logs area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface2/30">
          {activeThread.messages.map((msg) => {
            const isMe = msg.sender === 'me'
            return (
              <div
                key={msg.id}
                className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-xl px-4 py-2 text-sm shadow-sm ${
                    isMe
                      ? 'bg-primary text-white rounded-tr-none'
                      : 'bg-surface border border-border text-text rounded-tl-none'
                  }`}
                >
                  <p className="leading-relaxed break-words">{msg.text}</p>
                  <div className={`mt-1 flex items-center gap-1 text-[9px] justify-end ${isMe ? 'text-white/70' : 'text-muted'}`}>
                    <span>{msg.time}</span>
                    {isMe && <CheckCheck className="h-3.5 w-3.5" />}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Composer section */}
        <form onSubmit={handleSend} className="border-t border-border p-4 flex gap-2 bg-surface">
          <div className="flex-1">
            <Input
              placeholder={`Send message to ${activeThread.name}...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </div>
          <Button type="submit">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
