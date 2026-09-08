import { pushNote } from "./notify.ts";

export type CoachTone =
  | "normal"
  | "humorous"
  | "roasting"
  | "raunchy"
  | "classical"
  | "belittling"
  | "hype"
  | "stoic";

export type CoachEvent =
  | "mealReminder"
  | "workoutReminder"
  | "snackReminder"
  | "skippedWorkout"
  | "missedWorkout"
  | "ateOut"
  | "loggedLift"
  | "cookedDinner";

export type CoachPrefs = {
  on: boolean;
  vocal: boolean;
  tone: CoachTone;
  voiceURI: string;
  pingDay: string;
  pinged: CoachEvent[];
};

export type CoachVoiceId = "british" | "australian" | "american" | "cowboy" | "irish" | "indian";

export type CoachVoice = {
  id: CoachVoiceId;
  label: string;
  hint: string;
  lang: string;
  pitch: number;
  rate: number;
};

export const COACH_VOICES: CoachVoice[] = [
  { id: "british", label: "British", hint: "London, dry", lang: "en-GB", pitch: 1, rate: 0.96 },
  { id: "australian", label: "Australian", hint: "Sydney, easy", lang: "en-AU", pitch: 1.02, rate: 1 },
  { id: "american", label: "American", hint: "Clear US", lang: "en-US", pitch: 1, rate: 0.98 },
  { id: "cowboy", label: "Western Cowboy", hint: "Low and slow", lang: "en-US", pitch: 0.72, rate: 0.82 },
  { id: "irish", label: "Irish", hint: "Dublin warmth", lang: "en-IE", pitch: 1.05, rate: 0.97 },
  { id: "indian", label: "Indian", hint: "Clear English", lang: "en-IN", pitch: 1, rate: 0.95 },
];

export const DEFAULT_COACH: CoachPrefs = {
  on: true,
  vocal: false,
  tone: "normal",
  voiceURI: "american",
  pingDay: "",
  pinged: [],
};

export const COACH_TONES: { id: CoachTone; label: string; hint: string }[] = [
  { id: "normal", label: "Normal", hint: "Straight, useful" },
  { id: "humorous", label: "Humorous", hint: "Dry jokes" },
  { id: "roasting", label: "Roasting", hint: "Friendly fire" },
  { id: "raunchy", label: "Raunchy", hint: "Locker-room" },
  { id: "classical", label: "Classical", hint: "Old-world coach" },
  { id: "belittling", label: "Belittling", hint: "Drill sergeant" },
  { id: "hype", label: "Hype", hint: "Loud and proud" },
  { id: "stoic", label: "Stoic", hint: "Quiet steel" },
];

const BANK: Record<CoachEvent, Record<CoachTone, string[]>> = {
  mealReminder: {
    normal: [
      "Dinner is plated. Sit down and eat it.",
      "Fuel window is open. Eat the meal you planned.",
      "Kitchen is ready. Don't let tonight slip.",
      "Protein is waiting on the plate.",
      "Eat dinner now so tomorrow's training has something to burn.",
      "Tonight's meal is the one you already chose. Eat it.",
    ],
    humorous: [
      "Your fridge is not a museum. Eat the exhibit.",
      "Dinner called. It said stop dating the snack drawer.",
      "The pan did its job. Your turn.",
      "Calories don't clock in if you don't sit down.",
      "The meal is plated. Your willpower is on a smoke break.",
      "Eat it before the cat files a claim.",
    ],
    roasting: [
      "You planned dinner and now you're staring at it like a stranger.",
      "The plate is ready. Your excuses are not invited.",
      "You can scroll later. Eat the food you already cooked a plan for.",
      "Champion of planning. Amateur of chewing. Fix that.",
      "The meal isn't going to eat itself, legend.",
      "You spent the week building this kitchen. Don't ghost it at 6.",
    ],
    raunchy: [
      "Sit down, wrap your mouth around that protein, and stop teasing the plate.",
      "Dinner's dressed. Don't leave it hanging.",
      "That plate wants commitment. Give it 12 minutes.",
      "Fuel up. You can't PR on fumes and vibes.",
      "Eat the damn dinner. Your muscles are not running on gossip.",
      "Put the phone down and take the meal like you mean it.",
    ],
    classical: [
      "The table is set. A trained body is fed with intention.",
      "Supper waits. Honour the work of the day.",
      "Take the meal as a craftsman takes a tool — fully, without delay.",
      "Nourishment is the quiet half of strength.",
      "Sit. Eat. Let tomorrow's labour find you ready.",
      "The hearth is lit. Do not leave the plate untouched.",
    ],
    belittling: [
      "You can't even sit down for a meal you already chose. Impressive.",
      "Dinner is plated. If that's too hard, the gym will eat you tomorrow.",
      "Stop hovering. Eat. This is the easy part.",
      "You wanted a goal. Goals eat dinner. You are currently a tourist.",
      "The plate is not optional. Neither is follow-through.",
      "If you skip this, don't act surprised when the scale shrugs.",
    ],
    hype: [
      "DINNER TIME. HIT THE PLATE. LET'S GO.",
      "Fuel the machine. Eat now. Win later.",
      "This is the meal. This is the moment. Sit down.",
      "Protein in. Excuses out. Eat.",
      "The kitchen showed up. You show up.",
      "CHOW. Then we get after tomorrow.",
    ],
    stoic: [
      "Eat.",
      "The meal is ready. Take it.",
      "Fuel is part of the work.",
      "Sit. Chew. Done.",
      "Hunger is information. Answer it with the plate.",
      "Dinner is the next task. Complete it.",
    ],
  },
  workoutReminder: {
    normal: [
      "Today's session is still open. Start it.",
      "The lift is on the card. Get to it.",
      "Training window. Don't let it close empty.",
      "Your program is waiting. Open Train and start.",
      "Work today or explain tomorrow. Start the session.",
      "The bar doesn't care how you feel. The plan does. Start.",
    ],
    humorous: [
      "The dumbbells have filed a missing-person report.",
      "Your program just refreshed the page. Still you. Still not lifting.",
      "The gym called. It said bring your body, leave the thesis.",
      "You can stretch this into tomorrow, or you can just start.",
      "The session is short. Your stall is not.",
      "Even the rest day is judging you, and it isn't today.",
    ],
    roasting: [
      "The program is on the screen. Your body is on the couch. Cute.",
      "You asked for a goal and then hid from a warm-up.",
      "Start the session. The mirror already knows.",
      "You can't out-plan a workout you won't do.",
      "The card says lift. You said later. Later is a coward's brand.",
      "Open Train. Pretend you're the person who set this goal.",
    ],
    raunchy: [
      "Get under something heavy before your excuses get under you.",
      "The session wants you sweaty, not theoretical.",
      "Go lift. Leave the pretty thoughts in the locker.",
      "Put your hands on the bar and stop flirting with skip.",
      "Work. Sweat. Then you can be charming.",
      "The floor is waiting. Drop into the work.",
    ],
    classical: [
      "The hour of labour has come. Take up the work.",
      "Strength is a daily treaty. Sign it with this session.",
      "Do not leave the prescribed labour undone.",
      "A quiet start still counts. Begin.",
      "The body learns only what the day repeats. Repeat.",
      "Rise and complete the training written for you.",
    ],
    belittling: [
      "It's a workout, not a thesis. Start it.",
      "You scheduled this and now you're negotiating with a timer. Pathetic.",
      "The session is still easier than the story you'll tell if you skip.",
      "Move. Nobody is coming to lift it for you.",
      "You wanted advanced. Advanced people start on time.",
      "Stop browsing the card. Do the work on the card.",
    ],
    hype: [
      "LET'S TRAIN. CLOCK IS LIVE. GO.",
      "This is your set. Take it.",
      "Warm up. Load it. Earn the rest of the day.",
      "NO EMPTY SESSIONS. START NOW.",
      "The HUD is lit. You are the operator. Execute.",
      "One session. Full send. Then dinner tastes honest.",
    ],
    stoic: [
      "Train.",
      "The work is listed. Begin.",
      "Do the session. Talk after.",
      "Start. The rest is noise.",
      "Today's labour is named. Perform it.",
      "Open the session. Finish what you wrote.",
    ],
  },
  snackReminder: {
    normal: [
      "You're short on protein. Grab the planned snack.",
      "A snack now keeps dinner from turning into a raid.",
      "Fuel gap. Eat something with protein.",
      "Don't wait until you're ravenous. Snack on plan.",
      "The goal still needs a hit of protein this afternoon.",
      "Small plate, right now, beats a binge later.",
    ],
    humorous: [
      "Your blood sugar just sent a passive-aggressive email.",
      "Snack like an adult, not like a raccoon at 11pm.",
      "Protein is not a personality, but today it would help.",
      "The cupboard has options that are not chips. Allegedly.",
      "A snack now is cheaper than the story you'll tell at midnight.",
      "Feed the machine a little so it doesn't eat the kitchen later.",
    ],
    roasting: [
      "You skipped the snack and you're surprised you're hunting leftovers. Sure.",
      "Protein gap. This is the easy win you're ignoring.",
      "The plan had a snack. You had vibes. Vibes don't repair muscle.",
      "Eat the snack. Stop performing hunger like it's mysterious.",
      "This is a banana and yogurt problem, not a destiny problem.",
      "You can nail macros or you can keep improvising. Pick.",
    ],
    raunchy: [
      "Put some protein in you before you get sloppy at dinner.",
      "Snack now. Don't show up to supper running on fumes and spite.",
      "Feed the hole. Politely. With protein.",
      "A snack is not a crime. Leaving yourself empty is.",
      "Grab the snack. Your future self is already annoyed.",
      "Don't make dinner do all the dirty work.",
    ],
    classical: [
      "A small provision now steadies the evening.",
      "Take a modest portion. Strength is paced.",
      "Do not arrive at supper hollowed out.",
      "A craftsman oils the tool before the late hour.",
      "Eat a little, as planned.",
      "The afternoon asks for fuel, not theatre.",
    ],
    belittling: [
      "It's a snack. If this is the hard part, the goal is already laughing.",
      "Protein. Now. This is not advanced strategy.",
      "You can follow a snack or you can keep failing dinner. Choose.",
      "Hungry and heroic is still just hungry. Eat.",
      "The plan included a snack because you are not a camel.",
      "Stop waiting for permission. Eat the protein.",
    ],
    hype: [
      "SNACK HIT. PROTEIN IN. KEEP THE STREAK ALIVE.",
      "Mini fuel. Big day. Do it.",
      "Don't dip. Snack. Stay in the fight.",
      "Quick plate. Full power. GO.",
      "This snack is a set. Complete it.",
      "Top up. Then we hunt dinner properly.",
    ],
    stoic: [
      "Snack.",
      "Protein now. That is all.",
      "Eat a little. Continue.",
      "The gap is protein. Fill it.",
      "A small meal. On time.",
      "Do not arrive empty at evening.",
    ],
  },
  skippedWorkout: {
    normal: [
      "Skipped. Dinner dropped the training carbs. Rest is honest if you mean it.",
      "Session skipped. The week still counts. Don't stack two.",
      "You skipped. Fuel adjusted. Tomorrow is still on the card.",
      "Skip logged. One skip is a choice. Two is a habit.",
      "Rest noted. Keep tonight's plate smaller. Be back tomorrow.",
      "Skipped. The program doesn't vanish. It waits.",
    ],
    humorous: [
      "Skipped. The dumbbells will write about this in their memoirs.",
      "You pressed skip like it was a podcast ad. Cute.",
      "Rest day cosplay. Fine. Don't make it a trilogy.",
      "The session packed a bag. It'll be back tomorrow, less polite.",
      "Skipped. Your future self just put you on a watchlist.",
      "Even the rest-day icon looked disappointed, and it's a circle.",
    ],
    roasting: [
      "Skipped. Bold of you to keep the goal on the profile.",
      "You didn't rest. You flinched. Call it what it is.",
      "One skip. The program already knows your tell.",
      "The bar didn't get heavy. You got optional.",
      "Skipped. Tomorrow you can prove this was strategy, not weather.",
      "You tapped skip faster than you tap start. Working on that, or…",
    ],
    raunchy: [
      "You bailed. Fine. Don't romance the couch like it earned you.",
      "Skipped. Keep the plate honest and your mouth shut about grind.",
      "You left the session hanging. Tomorrow you show up or you don't talk PR.",
      "Rest if you need it. Don't dress a flake as recovery.",
      "The work didn't get done. That's the whole review.",
      "Skip logged. Sweat tomorrow or stop talking like a closer.",
    ],
    classical: [
      "The labour was set aside. Let the reason be worthy.",
      "A day unused is not a sin if the next is kept.",
      "You declined the work. See that tomorrow does not decline you.",
      "Rest, if honest. Idleness, if not. Know which you chose.",
      "The program remains. Return to it.",
      "One omitted session. Do not let it become a pattern.",
    ],
    belittling: [
      "Skipped. Of course you did.",
      "The session was right there. You still found a way out. Talent.",
      "Skip is a button for people who like goals as decoration.",
      "You didn't earn rest. You took it. Don't confuse the two.",
      "Tomorrow the weight will still be the weight. You will still be you unless you work.",
      "Logged as skip. Logged as soft. Fix it tomorrow.",
    ],
    hype: [
      "SKIPPED. RESET. TOMORROW WE GO FULL.",
      "One down day. Not the story. Show up next.",
      "Fine. Recover like a pro, not like a ghost.",
      "The week isn't over. Load it tomorrow.",
      "Shake it off. The HUD still has days left.",
      "Missed this one. Hunt the next one.",
    ],
    stoic: [
      "Skipped. Noted.",
      "The work was not done.",
      "Tomorrow remains.",
      "Do not narrate. Return.",
      "One omission. No speech.",
      "The plan continues without this session.",
    ],
  },
  missedWorkout: {
    normal: [
      "Yesterday's session went missed. Don't let today copy it.",
      "Missed workout. Fuel already adjusted. Start today's if it's there.",
      "The program marked it missed. That's data. Use it.",
      "A miss is a blank. Fill the next one.",
      "You missed it. The week can still be honest if today isn't.",
      "Missed. No speech. Open Train.",
    ],
    humorous: [
      "That session expired like milk. Don't sniff today's.",
      "Missed. The calendar is not a suggestion box.",
      "You ghosted a workout. It's not texting back. You go first.",
      "Yesterday left a voicemail. It was just a barbell clanging.",
      "Missed workouts don't do cardio on their own. Weird design.",
      "The miss is logged. Your alibi is not.",
    ],
    roasting: [
      "Missed. The goal is still in the app, which is generous.",
      "You let a date pass with a program on it. That's the whole crime.",
      "Missed session. Today you either work or you collect another souvenir.",
      "The HUD marked you absent. Cute look on nobody.",
      "You didn't get busy. You got optional. Fix today's.",
      "A miss is loud. Doing today's session is how you shut it up.",
    ],
    raunchy: [
      "You left yesterday unfinished. Don't make a habit of leaving things hanging.",
      "Missed. Get in there today and actually work.",
      "The session died of neglect. Today's still breathing. Show up.",
      "You flaked. Sweat is the apology.",
      "Missed it. Now go earn the right to talk about grind again.",
      "Yesterday slipped. Today you put your back into it.",
    ],
    classical: [
      "The appointed labour passed unused.",
      "A missed day is a debt. Pay today's in full.",
      "Do not mourn the missed hour. Keep the next.",
      "Absence was recorded. Presence is the remedy.",
      "The work remains, even when the date does not.",
      "Return to the discipline that yesterday declined.",
    ],
    belittling: [
      "You missed a workout you could see coming from a week away. Brilliant.",
      "Missed. If consistency was a lift, you'd still be warming up.",
      "The program didn't miss you. You missed it. That's the ranking.",
      "A child can follow a calendar. Try today's session.",
      "Missed. Don't ask the kitchen to cover for a body that didn't show.",
      "You want advanced programming and you can't keep a date. Start there.",
    ],
    hype: [
      "MISS LOGGED. TODAY IS THE REDEMPTION SET. GO.",
      "Yesterday's gone. This hour isn't. TAKE IT.",
      "No funerals for missed sessions. Just work.",
      "Shake the miss. Load today.",
      "The streak wants a witness. Be it.",
      "GET IN. THE HUD STILL HAS A GREEN LIGHT.",
    ],
    stoic: [
      "Missed. Do today's.",
      "The date passed. The work did not vanish — it moved.",
      "No explanation required. Train.",
      "Absence noted. Presence now.",
      "One miss. Begin.",
      "Continue.",
    ],
  },
  ateOut: {
    normal: [
      "Takeout logged. The plan flexed. Get back on the plate tomorrow.",
      "Ate out. Fine. Don't make it the new default.",
      "Outside food is in. Macros are a guess. Keep the next meal honest.",
      "Takeout. Enjoy it. Tomorrow the kitchen runs again.",
      "Logged as out. The week can absorb one. Not four.",
      "You ate out. Fuel will live. The grocery list still matters.",
    ],
    humorous: [
      "Takeout. The fridge just updated its will.",
      "You left the kitchen for a menu. Respect the hustle, mourn the Tupperware.",
      "Ate out. The meal plan is in the corner doing crossword puzzles.",
      "Somebody else's kitchen did tonight. Ours will want custody tomorrow.",
      "Takeout logged. Your spices are filing a complaint.",
      "The restaurant got the gig. Spoonful still has the residency.",
    ],
    roasting: [
      "Ate out. The plan you built watched you walk past it.",
      "Takeout is a treat. You treat yourself like it's a salary.",
      "Logged. If this is 'once', prove it tomorrow at your own stove.",
      "You had a plated dinner and chose a paper bag. Character development.",
      "Outside food. Inside accountability. Don't mix them up.",
      "The kitchen didn't fail. You outsourced. Own it.",
    ],
    raunchy: [
      "You cheated with a restaurant. Fine. Come home tomorrow.",
      "Takeout scratched an itch. Don't move in with it.",
      "Ate out. Keep it messy once, not all week.",
      "Somebody else cooked. You still own the macros tomorrow.",
      "Menu night. Cute. The plate at home still wants you back.",
      "You went out. Don't ghost the grocery list after.",
    ],
    classical: [
      "A meal abroad. Let it be feast, not habit.",
      "You dined away from the house. Return with discipline.",
      "One supper beyond the plan. The next belongs at home.",
      "Hospitality has its place. So does the hearth.",
      "Enjoy the table you chose. Keep tomorrow's as written.",
      "A departure. Not a new road.",
    ],
    belittling: [
      "Takeout. Shocking plot twist nobody saw coming.",
      "You couldn't last one night in your own kitchen. Noted.",
      "Ate out. Don't post about meal prep in the morning.",
      "The plan is only as strong as the night you got bored. Tonight you got bored.",
      "Outside food, inside excuses. Classic.",
      "You outsourced dinner and still want a coach. Here: cook tomorrow.",
    ],
    hype: [
      "MENU NIGHT. ENJOY. TOMORROW WE'RE BACK ON THE STOVE.",
      "Eat the thing. Then we lock back in.",
      "One night out. Not the season. RESET TOMORROW.",
      "Live a little. Train a lot. Kitchen at dawn.",
      "Takeout done. Program still hungry. Feed it tomorrow.",
      "CHEERS. Then back to the plate that builds you.",
    ],
    stoic: [
      "Ate out. Logged.",
      "One meal away. Next meal home.",
      "No drama. Resume.",
      "The plan yields once. Then it resumes.",
      "Enjoy. Return.",
      "Departure noted. Course unchanged.",
    ],
  },
  loggedLift: {
    normal: [
      "Lift saved. Fuel updated. That's the day working.",
      "Session in the log. Dinner can follow it.",
      "Work is recorded. Eat like you lifted.",
      "Logged. Volume is in. Recover on purpose.",
      "The HUD took the session. Nice work.",
      "Lift closed. Tomorrow's weights already know.",
    ],
    humorous: [
      "Logged. The bar has agreed to see you again.",
      "Sweat: filed. Ego: pending review.",
      "You did the thing. The couch can have you back, briefly.",
      "Session saved. Your future sore is in the mail.",
      "The program just unclenched a tiny bit.",
      "Lift in the books. Go be a person with protein.",
    ],
    roasting: [
      "Logged. Don't let this be the only evidence you exist this week.",
      "Good. You can follow a card. Do it again tomorrow.",
      "Session saved. Try not to spend the rest of the day undoing it.",
      "You worked. Amazing. That's the job.",
      "Logged. The skip button is crying in the corner. Keep it there.",
      "One honest session. Don't get sentimental. Repeat it.",
    ],
    raunchy: [
      "That's a session. Now go eat like you earned the salt.",
      "Logged. Sweaty looks better on you than skipped.",
      "You put in the work. Don't waste it on junk tonight unless you mean it.",
      "Bar down. Fuel up. That's the whole romance.",
      "Session in. Keep the rest of the day from getting sloppy.",
      "You showed up. That's hotter than the plan on paper.",
    ],
    classical: [
      "The labour is complete. Let recovery be as deliberate.",
      "A session kept. This is how strength is made.",
      "Well done. Eat, sleep, return.",
      "The work was honest. Honour it at the table.",
      "Logged in the ledger of the body.",
      "You kept the hour. Keep the next.",
    ],
    belittling: [
      "You did the minimum the card asked. Don't throw a parade.",
      "Logged. That's the baseline, not a personality.",
      "Good. Now don't skip the easy parts like dinner.",
      "A finished session. Finally, something that matches the goal talk.",
      "Saved. Repeat until it's boring. Boring is the point.",
      "You lifted. Congratulations on doing the thing you scheduled.",
    ],
    hype: [
      "SESSION IN THE BOOKS. THAT'S HOW WE BUILD.",
      "YES. LOGGED. FUEL UP. WE GO AGAIN.",
      "WORK DONE. EAT. SLEEP. HUNT TOMORROW.",
      "THAT'S A CLOSE. HUD IS PROUD. BE PROUD.",
      "VOLUME BANKED. LET'S EAT LIKE IT MATTERED.",
      "CLOSED THE SESSION. KEEP THE STREAK FERAL.",
    ],
    stoic: [
      "Logged.",
      "The work is done.",
      "Eat. Sleep.",
      "Session complete.",
      "Continue tomorrow.",
      "Recorded. Next.",
    ],
  },
  cookedDinner: {
    normal: [
      "Dinner cooked. That's the plan becoming a body.",
      "Logged as cooked. Fuel counts it.",
      "You cooked. Tomorrow's grocery list just got smarter.",
      "Plate done. That's how streaks are built.",
      "Cooked. The kitchen did its job with you in it.",
      "Tonight is in the log. Well done.",
    ],
    humorous: [
      "You cooked. The delivery apps just lost a customer for one night.",
      "Pan: 1. Excuses: 0.",
      "The dish is done. You may now pretend this was easy.",
      "Cooked. The leftovers will try to become breakfast. Let them.",
      "You used the stove on purpose. Growth.",
      "Dinner happened at home. The plot thickens — with sauce.",
    ],
    roasting: [
      "You cooked. See? The kitchen works when you do.",
      "Logged. Don't act like takeout was inevitable now.",
      "One home meal. Protect it from your next 'quick stop'.",
      "Cooked. That's the standard, not a holiday.",
      "You followed through. Try it on the workout too.",
      "The plate is real. Keep being the person who makes those.",
    ],
    raunchy: [
      "You fed yourself like an adult. Sexy, in a boring, rich way.",
      "Dinner's done. That's care. Don't waste it on midnight junk.",
      "Home cooked. Keep that energy in the rest of the night.",
      "You put food in you that you chose. Stay loyal to it.",
      "Kitchen win. Don't cheat on it at 10pm.",
      "Cooked. Now sit down and actually eat the thing.",
    ],
    classical: [
      "The meal is made. This is household strength.",
      "You kept the hearth. Well done.",
      "Supper from your own hand. Let it nourish without apology.",
      "A duty completed at the table.",
      "Cooked, as planned. Continue thus.",
      "The evening is fed. Rest is earned.",
    ],
    belittling: [
      "You cooked dinner. Basic competence. Don't spend it.",
      "Logged. This is what the plan assumed you'd do anyway.",
      "Home meal. Shocking that the stove still works.",
      "You can follow a recipe. Follow the training card with the same energy.",
      "Cooked. That's one night. The week is the test.",
      "Congratulations on using the kitchen you opened the app for.",
    ],
    hype: [
      "DINNER COOKED. THAT'S A WIN. LOCK IT IN.",
      "HOME PLATE. STREAK ALIVE. LET'S GO.",
      "YOU COOKED. THE GOAL FELT THAT.",
      "KITCHEN W. NOW RECOVER LIKE A PRO.",
      "PLATED AND EATEN. THAT'S THE STANDARD.",
      "YES. HOME FUEL. TOMORROW WE DO IT AGAIN.",
    ],
    stoic: [
      "Cooked.",
      "The meal is done.",
      "Logged. Continue.",
      "Home supper. Sufficient.",
      "Duty complete.",
      "Eat. Then rest.",
    ],
  },
};

export function isCoachTone(value: unknown): value is CoachTone {
  return typeof value === "string" && COACH_TONES.some((t) => t.id === value);
}

export function normalizeCoach(raw: unknown): CoachPrefs {
  const r = raw && typeof raw === "object" ? (raw as Partial<CoachPrefs>) : {};
  const pinged = Array.isArray(r.pinged)
    ? r.pinged.filter((e): e is CoachEvent => typeof e === "string" && e in BANK)
    : [];
  return {
    on: r.on !== false,
    vocal: r.vocal === true,
    tone: isCoachTone(r.tone) ? r.tone : "normal",
    voiceURI: typeof r.voiceURI === "string" && r.voiceURI ? r.voiceURI : "american",
    pingDay: typeof r.pingDay === "string" ? r.pingDay : "",
    pinged,
  };
}

export function coachLine(event: CoachEvent, tone: CoachTone, salt = Date.now()): string {
  const pool = BANK[event][tone];
  return pool[Math.abs(salt) % pool.length] ?? pool[0]!;
}

export function coachVoiceById(id: string): CoachVoice | undefined {
  return COACH_VOICES.find((v) => v.id === id);
}

export function preferredVoices(list: SpeechSynthesisVoice[], locale = "en"): SpeechSynthesisVoice[] {
  const loc = locale.slice(0, 2).toLowerCase();
  const scored = list
    .filter((v) => v.lang && v.lang.toLowerCase().startsWith(loc))
    .map((v) => {
      const n = v.name.toLowerCase();
      let score = 0;
      if (/natural|neural|premium|enhanced|wavenet|studio/.test(n)) score += 8;
      if (/samantha|karen|daniel|moira|fred|tessa|serena|gordon|martha|google/.test(n)) score += 5;
      if (/compact|eloquence|novelty/.test(n)) score -= 6;
      if (v.localService) score += 1;
      return { v, score };
    })
    .sort((a, b) => b.score - a.score);
  return scored.map((s) => s.v);
}

function pickWebVoice(voices: SpeechSynthesisVoice[], lang: string, id = ""): SpeechSynthesisVoice | undefined {
  if (!voices.length) return undefined;
  const want = lang.toLowerCase();
  const key = id.toLowerCase();
  const named: Record<string, RegExp> = {
    british: /gb|uk|british|daniel|serena|giles|libby|hazel/,
    australian: /au|australian|karen|lee|nicole|russell|catherine/,
    cowboy: /us|en-us|fred|guy|davis|aaron|male|tom|james/,
    irish: /ie|irish|moira/,
    indian: /en-in|indian|ravi|heera|veena/,
    american: /us|en-us|samantha|alex|aaron|zira|david/,
  };
  const rx = named[key];
  const scored = voices.map((v) => {
    const loc = (v.lang || "").toLowerCase();
    const n = v.name.toLowerCase();
    let score = 0;
    if (loc === want) score += 12;
    if (loc.startsWith(want.slice(0, 2))) score += 4;
    if (rx && (rx.test(n) || rx.test(loc))) score += 18;
    if (/natural|neural|premium|enhanced|wavenet|studio/.test(n)) score += 6;
    if (/compact|eloquence|novelty/.test(n)) score -= 8;
    if (v.localService) score += 2;
    return { v, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0]?.v;
}

export function speakCoach(text: string, voiceURI = "", locale = "en"): boolean {
  const voice = coachVoiceById(voiceURI);
  const lang = voice?.lang ?? (locale === "fr" ? "fr-CA" : locale === "es" ? "es-MX" : "en-CA");
  const pitch = voice?.pitch ?? 1;
  const rate = voice?.rate ?? 0.96;
  if (typeof window !== "undefined") {
    try {
      const api = window.SpoonfulHealth;
      if (api?.speak) {
        api.speak(text, JSON.stringify({ lang, pitch, rate, voice: voice?.id ?? voiceURI }));
        return true;
      }
    } catch {
      // Native TTS missing on this build — fall through to the browser.
    }
  }
  if (typeof window === "undefined" || !window.speechSynthesis) return false;
  const speakWeb = () => {
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = rate;
      u.pitch = pitch;
      u.lang = lang;
      const voices = window.speechSynthesis.getVoices();
      const pick =
        voices.find((v) => v.voiceURI === voiceURI) ||
        pickWebVoice(voices, lang, voiceURI) ||
        preferredVoices(voices, lang)[0];
      if (pick) u.voice = pick;
      window.speechSynthesis.speak(u);
    } catch {
      // Engine missing.
    }
  };
  try {
    const now = window.speechSynthesis.getVoices();
    if (!now.length) {
      window.speechSynthesis.addEventListener("voiceschanged", speakWeb, { once: true });
      window.setTimeout(speakWeb, 250);
    }
    speakWeb();
    return true;
  } catch {
    return false;
  }
}

export function coachSay(
  event: CoachEvent,
  prefs: CoachPrefs,
  opts?: { locale?: string; salt?: number },
): string | undefined {
  if (!prefs.on) return undefined;
  const line = coachLine(event, prefs.tone, opts?.salt);
  pushNote("Coach", line);
  if (prefs.vocal) speakCoach(line, prefs.voiceURI, opts?.locale);
  return line;
}

export function markCoachPing(prefs: CoachPrefs, event: CoachEvent, day: string): CoachPrefs {
  const pinged = prefs.pingDay === day ? prefs.pinged : [];
  if (pinged.includes(event)) return { ...prefs, pingDay: day, pinged };
  return { ...prefs, pingDay: day, pinged: [...pinged, event] };
}

/** Which scheduled nudge is due right now. One event per call so we never stack speeches. */
export function coachPulse(input: {
  prefs: CoachPrefs;
  day: string;
  hour: number;
  dinnerHour: number;
  todayStatus?: "planned" | "done" | "skipped" | "missed" | "none";
  hasDinner: boolean;
  hasSnack: boolean;
}): CoachEvent | null {
  if (!input.prefs.on) return null;
  const pinged = input.prefs.pingDay === input.day ? input.prefs.pinged : [];
  const unused = (event: CoachEvent) => !pinged.includes(event);
  if (input.hasDinner && unused("mealReminder") && input.hour === input.dinnerHour) return "mealReminder";
  if (input.todayStatus === "planned" && unused("workoutReminder") && input.hour >= 9 && input.hour <= 19) {
    return "workoutReminder";
  }
  if (input.hasSnack && unused("snackReminder") && input.hour === 15) return "snackReminder";
  if (input.todayStatus === "planned" && unused("missedWorkout") && input.hour >= 21) return "missedWorkout";
  return null;
}
