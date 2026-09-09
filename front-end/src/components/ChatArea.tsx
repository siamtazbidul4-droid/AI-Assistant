import React, { useRef, useEffect, useState } from 'react';
import { Sparkles, ArrowDown, RefreshCw, AlertCircle, Bot, Zap, Languages, Code2 } from 'lucide-react';
import { Message, Conversation } from '../types';
import { ChatMessage } from './ChatMessage';

interface ChatAreaProps {
  messages: Message[];
  streamingMessageId: string | null;
  isSending: boolean;
  error: string | null;
  onRetry: () => void;
  onClearError: () => void;
  onSelectStarter: (prompt: string) => void;
  currentConversation: Conversation | null;
}

const STARTER_PROMPTS = [
{
  icon: <Sparkles className="h-4 w-4 text-indigo-500" />,
  title: 'একাডেমিক শিক্ষা থেকে সেল্ফ-এডুকেশন কেন বেশি জরুরি?',
  desc: 'একাডেমিক শিক্ষা জ্ঞান দেয়, কিন্তু সেল্ফ-এডুকেশন কি আমাদের প্রকৃত মানুষ হিসেবে গড়ে তোলে?',
  prompt: 'একাডেমিক শিক্ষা আমাদের কতটা জ্ঞানী করে এবং সেল্ফ-এডুকেশন আমাদের কতটা পরিণত ও স্বাধীন মানুষ হিসেবে গড়ে তোলে—বিষয়টি গভীরভাবে বিশ্লেষণ করুন। প্রচলিত একাডেমিক শিক্ষা কীভাবে অনেক সময় পরীক্ষার ফল, ডিগ্রি, চাকরি এবং নির্দিষ্ট ক্যারিয়ারকেন্দ্রিক চিন্তার মধ্যে মানুষকে সীমাবদ্ধ করে রাখতে পারে, আর সেল্ফ-এডুকেশন কীভাবে কৌতূহল, স্বাধীন চিন্তা, আত্মনির্ভরতা, বাস্তব দক্ষতা, সৃজনশীলতা ও জীবনের প্রকৃত সমস্যা সমাধানের ক্ষমতা তৈরি করতে পারে তা ব্যাখ্যা করুন। একই সঙ্গে একাডেমিক শিক্ষার গুরুত্বপূর্ণ ভূমিকা স্বীকার করুন এবং দেখান কীভাবে একাডেমিক শিক্ষার পাশাপাশি সেল্ফ-এডুকেশন একজন মানুষকে আরও দক্ষ, সচেতন ও আত্মনির্ভর করে তুলতে পারে।',
},
{
  icon: <Sparkles className="h-4 w-4 text-indigo-500" />,
  title: 'ডিগ্রি কি মানুষকে সফল করে, নাকি দক্ষতা?',
  desc: 'একাডেমিক ডিগ্রির চেয়ে বাস্তব দক্ষতা, অভিজ্ঞতা ও সমস্যা সমাধানের ক্ষমতা কেন বেশি গুরুত্বপূর্ণ হতে পারে?',
  prompt: 'একজন মানুষের জীবনে সাফল্যের জন্য একাডেমিক ডিগ্রি কতটা গুরুত্বপূর্ণ এবং বাস্তব দক্ষতা কতটা গুরুত্বপূর্ণ—বিষয়টি সমালোচনামূলকভাবে বিশ্লেষণ করুন। কেন অনেক শিক্ষাব্যবস্থা ডিগ্রি ও পরীক্ষার ফলকে যোগ্যতার প্রধান মাপকাঠি হিসেবে দেখে, অথচ বাস্তব জীবনে সমস্যা সমাধান, যোগাযোগ, প্রযুক্তিগত দক্ষতা, সৃজনশীলতা, নেতৃত্ব ও বাস্তব অভিজ্ঞতার প্রয়োজন হয়? ডিগ্রিনির্ভর মানসিকতার সীমাবদ্ধতা এবং দক্ষতাভিত্তিক শিক্ষার সুবিধাগুলো উদাহরণসহ ব্যাখ্যা করুন। একই সঙ্গে কোন ক্ষেত্রে একাডেমিক ডিগ্রি অপরিহার্য হতে পারে সেটিও নিরপেক্ষভাবে তুলে ধরুন।',
},
{
  icon: <Sparkles className="h-4 w-4 text-indigo-500" />,
  title: 'পরীক্ষার নম্বর কি প্রকৃত মেধার মাপকাঠি?',
  desc: 'নম্বর ও GPA কি একজন শিক্ষার্থীর প্রকৃত বুদ্ধিমত্তা, সৃজনশীলতা ও যোগ্যতাকে প্রকাশ করে?',
  prompt: 'পরীক্ষার নম্বর, GPA এবং একাডেমিক ফলাফল কি একজন শিক্ষার্থীর প্রকৃত মেধা ও যোগ্যতা পরিমাপ করতে পারে? পরীক্ষাকেন্দ্রিক শিক্ষাব্যবস্থা কীভাবে মুখস্থ করা, নির্দিষ্ট উত্তর অনুসরণ করা এবং পরীক্ষায় ভালো করার দক্ষতাকে বেশি গুরুত্ব দিতে পারে—তা বিশ্লেষণ করুন। এর বিপরীতে কৌতূহল, সৃজনশীল চিন্তা, বাস্তব সমস্যা সমাধান, ব্যর্থতা থেকে শেখা, উদ্যোগ নেওয়া এবং নতুন কিছু তৈরি করার ক্ষমতা কীভাবে একজন মানুষের প্রকৃত সক্ষমতা প্রকাশ করতে পারে তা ব্যাখ্যা করুন। একাডেমিক ফলাফল ও প্রকৃত দক্ষতার মধ্যে পার্থক্যটি বাস্তব উদাহরণসহ তুলে ধরুন।',
},
{
  icon: <Sparkles className="h-4 w-4 text-indigo-500" />,
  title: 'স্কুল কি আমাদের চাকরি খুঁজতে শেখায়, নাকি জীবন গড়তে?',
  desc: 'প্রচলিত শিক্ষা কি জীবনের জন্য প্রস্তুত করে, নাকি শুধু চাকরির বাজারের জন্য?',
  prompt: 'প্রচলিত একাডেমিক শিক্ষাব্যবস্থার মূল উদ্দেশ্য কী হওয়া উচিত—চাকরির জন্য প্রস্তুত করা, নাকি একজন মানুষকে বাস্তব জীবনের জন্য প্রস্তুত করা? শিক্ষাব্যবস্থা কীভাবে ক্যারিয়ার, চাকরি, পরীক্ষা ও ডিগ্রিকে কেন্দ্র করে গড়ে উঠতে পারে এবং এর ফলে অর্থব্যবস্থা, বিনিয়োগ, উদ্যোক্তা হওয়া, যোগাযোগ, আত্মনির্ভরতা, মানসিক দৃঢ়তা, সিদ্ধান্ত গ্রহণ ও বাস্তব জীবন পরিচালনার মতো গুরুত্বপূর্ণ দক্ষতা উপেক্ষিত হতে পারে কি না তা বিশ্লেষণ করুন। একজন শিক্ষার্থী কীভাবে একাডেমিক শিক্ষার পাশাপাশি নিজে শেখার মাধ্যমে জীবনের প্রয়োজনীয় দক্ষতা অর্জন করতে পারে এবং নিজের ভবিষ্যৎ নিজে তৈরি করার সক্ষমতা গড়ে তুলতে পারে তা ব্যাখ্যা করুন।',
},
{
  icon: <Sparkles className="h-4 w-4 text-indigo-500" />,
  title: 'একাডেমিক শিক্ষা কি আমাদের শ্রমিক বানাচ্ছে?',
  desc: 'প্রচলিত শিক্ষাব্যবস্থা কীভাবে চিন্তার স্বাধীনতার বদলে চাকরিমুখী মানসিকতা তৈরি করে',
  prompt: 'একাডেমিক শিক্ষা কি সত্যিই আমাদের স্বাধীনভাবে চিন্তা করতে শেখাচ্ছে, নাকি শুধু চাকরির বাজারের জন্য প্রস্তুত করছে? একজন নিরপেক্ষ ও সমালোচনামূলক বিশ্লেষকের মতো বিষয়টি বিশ্লেষণ করুন। প্রচলিত শিক্ষাব্যবস্থার উদ্দেশ্য, মুখস্থনির্ভর শিক্ষা, পরীক্ষাকেন্দ্রিক মানসিকতা, চাকরিমুখী প্রস্তুতি এবং সৃজনশীলতা ও উদ্যোক্তা মানসিকতার ওপর এর প্রভাব সহজ ভাষায় উদাহরণসহ ব্যাখ্যা করুন। একই সঙ্গে একাডেমিক শিক্ষার ইতিবাচক দিকগুলোও তুলে ধরুন এবং কীভাবে একজন শিক্ষার্থী প্রাতিষ্ঠানিক শিক্ষার পাশাপাশি স্বাধীন চিন্তা, বাস্তব দক্ষতা ও সৃজনশীলতা বিকাশ করতে পারে তা দেখান।',
},
{
  icon: <Sparkles className="h-4 w-4 text-indigo-500" />,
  title: 'বাংলাদেশে শিক্ষিত বেকার বেশি, নাকি অশিক্ষিত বেকার?',
  desc: 'শিক্ষার স্তর অনুযায়ী বাংলাদেশের বেকারত্বের হার, কারণ ও বাস্তব চিত্র বিশ্লেষণ করুন',
  prompt: 'বাংলাদেশে শিক্ষিত ও অশিক্ষিত মানুষের মধ্যে বেকারত্বের বাস্তব চিত্র কী? সর্বশেষ নির্ভরযোগ্য সরকারি পরিসংখ্যানের ভিত্তিতে শিক্ষার বিভিন্ন স্তরে বেকারত্বের হার ও বেকারের সংখ্যা বিশ্লেষণ করুন। বিশেষভাবে কোনো প্রাতিষ্ঠানিক শিক্ষা নেই, প্রাথমিক, মাধ্যমিক, উচ্চমাধ্যমিক এবং বিশ্ববিদ্যালয় বা তৃতীয় স্তরের শিক্ষিত মানুষের বেকারত্ব তুলনা করুন। কেন বাংলাদেশে উচ্চশিক্ষিতদের মধ্যেও বেকারত্বের হার তুলনামূলকভাবে বেশি—এর পেছনে শিক্ষাব্যবস্থা, দক্ষতার ঘাটতি, চাকরির বাজার, অভিজ্ঞতার অভাব ও শিক্ষা-চাকরির অসামঞ্জস্যের ভূমিকা ব্যাখ্যা করুন। তথ্য ও মতামত আলাদা করে উপস্থাপন করুন এবং সহজ ভাষায় বাস্তব উদাহরণসহ একটি নিরপেক্ষ বিশ্লেষণ দিন।',
},
{
  icon: <Sparkles className="h-4 w-4 text-indigo-500" />,
  title: 'শিক্ষা জাতির মেরুদণ্ড, নাকি জাতির মৃত্যুদণ্ড?',
  desc: 'বাংলাদেশের প্রচলিত একাডেমিক শিক্ষা কি জাতিকে গড়ছে, নাকি সম্ভাবনাকে ধ্বংস করছে?',
  prompt: 'শিক্ষাকে বলা হয় জাতির মেরুদণ্ড, কিন্তু বাংলাদেশের বর্তমান একাডেমিক শিক্ষাব্যবস্থা কি সত্যিই জাতিকে শক্তিশালী করছে? নাকি পরীক্ষার ফল, মুখস্থবিদ্যা, সার্টিফিকেট এবং চাকরিনির্ভর মানসিকতার মাধ্যমে একটি প্রজন্মের সৃজনশীলতা, স্বাধীন চিন্তা ও বাস্তব দক্ষতা নষ্ট করছে? একজন নিরপেক্ষ ও সমালোচনামূলক বিশ্লেষকের মতো বিষয়টি বিশ্লেষণ করুন। প্রচলিত শিক্ষাব্যবস্থার ইতিবাচক ও নেতিবাচক উভয় দিক তুলে ধরুন এবং কীভাবে শিক্ষাব্যবস্থাকে বাস্তব দক্ষতা, সৃজনশীলতা, সমস্যা সমাধান ও স্বাধীন চিন্তাকেন্দ্রিক করা যায় তা ব্যাখ্যা করুন।',
},
{
  icon: <Sparkles className="h-4 w-4 text-indigo-500" />,
  title: 'সার্টিফিকেট কি সত্যিই শিক্ষার প্রমাণ?',
  desc: 'ডিগ্রি ও সার্টিফিকেটের বাইরে প্রকৃত জ্ঞান, দক্ষতা ও যোগ্যতার মূল্য কতটা?',
  prompt: 'একজন মানুষের হাতে বিশ্ববিদ্যালয়ের ডিগ্রি বা অসংখ্য সার্টিফিকেট থাকলেই কি তাকে প্রকৃত অর্থে শিক্ষিত বলা যায়? বাংলাদেশের প্রচলিত শিক্ষাব্যবস্থায় সার্টিফিকেট অর্জন এবং বাস্তব জ্ঞান ও দক্ষতার মধ্যে পার্থক্য বিশ্লেষণ করুন। মুখস্থ করে পরীক্ষায় ভালো ফল করা, ডিগ্রি অর্জন এবং বাস্তব জীবনে সমস্যা সমাধান করার সক্ষমতার মধ্যে পার্থক্য দেখান। শিক্ষা কীভাবে একজন মানুষকে চিন্তাশীল, দক্ষ, সৃজনশীল ও দায়িত্বশীল করে তুলতে পারে তা উদাহরণসহ ব্যাখ্যা করুন।',
},
{
  icon: <Sparkles className="h-4 w-4 text-indigo-500" />,
  title: 'মুখস্থ শিক্ষা কি চিন্তাশক্তির শত্রু?',
  desc: 'পরীক্ষাকেন্দ্রিক মুখস্থবিদ্যা কীভাবে শিক্ষার্থীর স্বাধীন চিন্তা ও সৃজনশীলতাকে প্রভাবিত করে',
  prompt: 'বাংলাদেশের শিক্ষাব্যবস্থায় মুখস্থনির্ভরতা ও পরীক্ষাকেন্দ্রিক শিক্ষার প্রভাব গভীরভাবে বিশ্লেষণ করুন। শিক্ষার্থীরা কেন অনেক সময় বিষয় বুঝে শেখার পরিবর্তে পরীক্ষায় নম্বর পাওয়ার জন্য তথ্য মুখস্থ করে? এই পদ্ধতি তাদের স্বাধীন চিন্তা, প্রশ্ন করার ক্ষমতা, সৃজনশীলতা, সমস্যা সমাধান এবং বাস্তব জীবনের দক্ষতার ওপর কী প্রভাব ফেলে? একই সঙ্গে মুখস্থবিদ্যার কোথায় প্রয়োজন রয়েছে তা স্বীকার করে একটি ভারসাম্যপূর্ণ ও নিরপেক্ষ বিশ্লেষণ দিন।',
},
{
  icon: <Sparkles className="h-4 w-4 text-indigo-500" />,
  title: 'ডিগ্রি আছে, দক্ষতা নেই—সমস্যাটা কোথায়?',
  desc: 'উচ্চশিক্ষা, চাকরির বাজার ও বাস্তব দক্ষতার মধ্যে তৈরি হওয়া ব্যবধান বিশ্লেষণ করুন',
  prompt: 'কেন একজন শিক্ষার্থী বছরের পর বছর পড়াশোনা করে বিশ্ববিদ্যালয়ের ডিগ্রি অর্জন করার পরও চাকরির বাজারে প্রয়োজনীয় দক্ষতার অভাবে পিছিয়ে পড়তে পারে? বাংলাদেশের একাডেমিক শিক্ষা ও বাস্তব কর্মক্ষেত্রের চাহিদার মধ্যে সম্ভাব্য ব্যবধান বিশ্লেষণ করুন। কারিকুলাম, প্রযুক্তিগত দক্ষতা, যোগাযোগ দক্ষতা, সমস্যা সমাধান, অভিজ্ঞতা এবং ব্যবহারিক শিক্ষার ভূমিকা ব্যাখ্যা করুন। শিক্ষার্থীরা কীভাবে ডিগ্রির পাশাপাশি বাস্তব দক্ষতা অর্জন করে নিজেদের কর্মজীবনের জন্য প্রস্তুত করতে পারে তার একটি বাস্তবসম্মত পথ দেখান।',
},
  {
    icon: <Languages className="h-4 w-4 text-emerald-500" />,
    title: 'বাংলায় প্রশ্নোত্তর',
    desc: 'বাংলা সাহিত্যের ইতিহাস বা বিজ্ঞান নিয়ে প্রশ্ন করুন',
    prompt: 'বাংলা ভাষার উৎপত্তি ও ক্রমবিকাশ সংক্ষেপে সহজ ভাষায় বুঝিয়ে দাও।',
  },
  {
    icon: <Code2 className="h-4 w-4 text-sky-500" />,
    title: 'Full-Stack Architecture',
    desc: 'TypeScript, React & Node.js scalable patterns',
    prompt: 'Explain the principles of clean architecture in a Node.js and Express backend with examples.',
  },
  {
    icon: <Zap className="h-4 w-4 text-amber-500" />,
    title: 'Code Review & Refactor',
    desc: 'Attach files or paste algorithms for analysis',
    prompt: 'How do I optimize database indexing and query performance in MongoDB with Mongoose?',
  },
  {
    icon: <Sparkles className="h-4 w-4 text-indigo-500" />,
    title: 'Creative Bilingual Writing',
    desc: 'Poetry, translation & essays in English or Bengali',
    prompt: 'Write an inspiring short poem in Bengali about modern technology and human curiosity.',
  }
];

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  streamingMessageId,
  isSending,
  error,
  onRetry,
  onClearError,
  onSelectStarter,
  currentConversation,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Auto-scroll when new messages or chunks arrive
  useEffect(() => {
    if (bottomRef.current && !showScrollBottom) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showScrollBottom]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isUp = scrollHeight - scrollTop - clientHeight > 180;
    setShowScrollBottom(isUp);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    setShowScrollBottom(false);
  };

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      id="chat-messages-container"
      className="relative flex-1 overflow-y-auto scrollbar-thin"
    >
      {/* If conversation is empty, show luxurious welcome state */}
      {messages.length === 0 ? (
        <div className="flex min-h-full flex-col items-center justify-center p-6 text-center max-w-2xl mx-auto my-auto animate-in fade-in duration-300">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-zinc-900 to-zinc-700 dark:from-zinc-100 dark:to-zinc-300 text-white dark:text-zinc-900 shadow-xl mb-6">
            <Sparkles className="h-8 w-8" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Welcome to AI Assistant
          </h2>
          <p className="mt-1 text-base font-medium text-zinc-500 dark:text-zinc-400">
            বুদ্ধিমত্তা, বিশ্লেষণ ও সৃজনশীলতার সম্পূর্ণ নতুন অভিজ্ঞতা
          </p>

          <p className="mt-3 max-w-md text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
           Powered by Advanced AI & Next-Generation Intelligence. Native bilingual support for Bengali and English with real-time streaming, voice conversations, and intelligent file analysis.

          </p>

          {/* Starter suggestions */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left">
            {STARTER_PROMPTS.map((starter, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSelectStarter(starter.prompt)}
                className="group flex flex-col justify-between rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/60 p-4 transition-all hover:border-zinc-400 dark:hover:border-zinc-600 hover:shadow-md active:scale-[0.99]"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800">
                    {starter.icon}
                  </div>
                  <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    {starter.title}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 line-clamp-2">
                  {starter.desc}
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Render messages */
        <div className="flex flex-col py-4">
          {messages.map(msg => (
            <ChatMessage
              key={msg._id}
              message={msg}
              isStreaming={msg._id === streamingMessageId}
            />
          ))}

          {/* Error Banner */}
          {error && (
            <div className="mx-auto my-4 flex w-full max-w-2xl items-center justify-between rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/40 p-4 text-xs text-rose-700 dark:text-rose-300 shadow-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-500 flex-shrink-0" />
                <span>{error}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onRetry}
                  className="flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 font-semibold text-white hover:bg-rose-700 transition-colors"
                >
                  <RefreshCw className="h-3 w-3" />
                  Retry
                </button>
                <button
                  type="button"
                  onClick={onClearError}
                  className="rounded-lg p-1 text-rose-500 hover:text-rose-700"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          <div ref={bottomRef} className="h-4" />
        </div>
      )}

      {/* Floating scroll to bottom button */}
      {showScrollBottom && (
        <button
          type="button"
          id="scroll-to-bottom-button"
          onClick={scrollToBottom}
          className="fixed bottom-24 right-8 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-200 shadow-lg hover:scale-105 active:scale-95 transition-all"
          title="Scroll to bottom"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
