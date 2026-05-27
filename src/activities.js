// src/activities.js
export const DEFAULT_ACTIVITIES = [
  // Learning
  { id: "read", label: "📚 Read for 30 minutes", amount: 2.00, category: "Learning", oneTime: false, sharedMeal: false },
  { id: "online_lesson", label: "💻 Complete an online lesson (Khan Academy, Duolingo, etc.)", amount: 0.50, category: "Learning", oneTime: false, sharedMeal: false },
  { id: "library", label: "📖 Visit the library and check out a book", amount: 1.00, category: "Learning", oneTime: false, sharedMeal: false },
  { id: "write", label: "✏️ Write a story, poem, or journal entry (1 page min)", amount: 1.00, category: "Learning", oneTime: false, sharedMeal: false },
  { id: "memorize", label: "🎤 Memorize something (poem, speech)", amount: 1.00, category: "Learning", oneTime: false, sharedMeal: false },
  { id: "math_class", label: "🔢 Go to a Math Class", amount: 2.00, category: "Learning", oneTime: false, sharedMeal: false },

  // Languages
  { id: "chinese_convo", label: "🀄 Have a full conversation in Chinese", amount: 2.00, category: "Languages", oneTime: false, sharedMeal: false },
  { id: "chinese_phrase", label: "🗣️ Teach someone a phrase in Chinese", amount: 0.50, category: "Languages", oneTime: false, sharedMeal: false },
  { id: "chinese_order", label: "🍜 Order a complete food order in Chinese", amount: 1.00, category: "Languages", oneTime: false, sharedMeal: false },

  // Creative
  { id: "creative", label: "🎨 Creative project for 30 minutes (draw, paint, build)", amount: 2.00, category: "Creative", oneTime: false, sharedMeal: false },
  { id: "perform", label: "🕺 Learn and perform a dance or song", amount: 2.00, category: "Creative", oneTime: false, sharedMeal: false },

  // Physical
  { id: "active", label: "🏃 Be intentionally active for 30 minutes (jog, swim, yoga, etc.)", amount: 2.00, category: "Physical", oneTime: false, sharedMeal: false },
  { id: "hike", label: "🥾 Complete a family walk or hike", amount: 2.00, category: "Physical", oneTime: false, sharedMeal: false },

  // Screen Free
  { id: "screen_free_day", label: "📵 Spend an entire day screen-free", amount: 5.00, category: "Screen Free", oneTime: false, sharedMeal: false },
  { id: "screen_free_morning", label: "🌅 Screen-free morning", amount: 2.50, category: "Screen Free", oneTime: false, sharedMeal: false },
  { id: "screen_free_evening", label: "🌙 Screen-free evening", amount: 2.50, category: "Screen Free", oneTime: false, sharedMeal: false },

  // Life Skills
  { id: "meal", label: "🍳 Make a meal for the family (recipe, budget, shop, cook, clean)", amount: 5.00, category: "Life Skills", oneTime: false, sharedMeal: false },
  { id: "clothes_budget", label: "👗 Create a clothes shopping list with research & budget, present to Mom", amount: 5.00, category: "Life Skills", oneTime: true, sharedMeal: false },
  { id: "google_calendar", label: "📅 Set up Google Calendar on your device with Mom", amount: 1.00, category: "Life Skills", oneTime: true, sharedMeal: false },
  { id: "transit", label: "🚌 Ride all day only on public transit", amount: 2.00, category: "Life Skills", oneTime: false, sharedMeal: false },
  { id: "debit_credit", label: "💳 Create a presentation about debit vs. credit cards", amount: 2.00, category: "Life Skills", oneTime: true, sharedMeal: false },

  // Social & Community
  { id: "museum", label: "🏛️ Visit a museum", amount: 2.00, category: "Social", oneTime: false, sharedMeal: false },
  { id: "research_location", label: "🌍 Research a summer destination & share top 5 facts with the family", amount: 2.00, category: "Social", oneTime: false, sharedMeal: false },
  { id: "playdate", label: "👯 Have an outing or playdate with a friend", amount: 1.00, category: "Social", oneTime: false, sharedMeal: false },
  { id: "teacher_email", label: "📧 Write an email to your teachers thanking them", amount: 1.00, category: "Social", oneTime: true, sharedMeal: false },
  { id: "donate", label: "♻️ Donate or throw away a bag/box of stuff from your room", amount: 2.00, category: "Social", oneTime: false, sharedMeal: false },
  { id: "board_game", label: "🎲 Play a board game", amount: 2.00, category: "Social", oneTime: false, sharedMeal: false },
];

export const CATEGORIES = ["Learning", "Languages", "Creative", "Physical", "Screen Free", "Life Skills", "Social"];
