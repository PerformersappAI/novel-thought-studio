export type ArticleCategory = "Legal" | "Platform News" | "How-To" | "Industry";

export interface ArticleSection {
  heading: string;
  body: string[];
}

export interface ArticleFAQ {
  question: string;
  answer: string;
}

export interface EducationArticle {
  slug: string;
  title: string;
  subtitle: string;
  category: ArticleCategory;
  readTime: string; // e.g. "6 min read"
  author: string;
  publishDate: string; // ISO
  excerpt: string; // 2 sentences
  sections: ArticleSection[];
  faqs: ArticleFAQ[];
  relatedSlugs: string[];
}

export const ARTICLE_CATEGORIES: ("All" | ArticleCategory)[] = [
  "All",
  "Legal",
  "Platform News",
  "How-To",
  "Industry",
];

const AUTHOR = "ClaimMyFace Legal Team";

export const educationArticles: EducationArticle[] = [
  {
    slug: "no-fakes-act-explained",
    title: "What Is the NO FAKES Act and What Does It Mean for Actors?",
    subtitle:
      "A federal answer to AI-generated impersonation — and why every working performer should care.",
    category: "Legal",
    readTime: "7 min read",
    author: AUTHOR,
    publishDate: "2025-02-12",
    excerpt:
      "The NO FAKES Act would create the first federal right of publicity for digital replicas of a person's voice and likeness. For actors, it could finally give a uniform legal pathway to stop unauthorized AI clones.",
    sections: [
      {
        heading: "What the NO FAKES Act Actually Does",
        body: [
          "The Nurture Originals, Foster Art, and Keep Entertainment Safe Act — better known as the NO FAKES Act — proposes a federal right that lets individuals control unauthorized digital replicas of their voice and visual likeness. Unlike state-by-state right of publicity laws, this would apply nationwide.",
          "It targets the entire chain: the person who generates the replica, the platform that hosts it, and the service that materially contributed to its creation. That last piece is the part AI companies are watching closely.",
        ],
      },
      {
        heading: "Why It Matters for Performers",
        body: [
          "If you're a working actor, your face and voice are your business. Today, an unauthorized AI clone can be created in minutes, distributed globally, and monetized before you ever see it. Existing remedies are slow, jurisdiction-specific, and often unavailable to non-celebrities.",
          "The NO FAKES Act would give every performer — union or not, famous or not — a clear federal cause of action with statutory damages. That changes the economics of misuse.",
        ],
      },
      {
        heading: "What's Still Being Debated",
        body: [
          "Safe harbors for platforms, exceptions for parody and news reporting, and how consent is documented are all still in flux. The bill also has to balance First Amendment concerns with meaningful protection.",
          "Performers should pay attention to how 'consent' gets defined — that single word will determine how easy it is for a studio, agent, or AI vendor to lock in long-term rights to your digital self.",
        ],
      },
      {
        heading: "What to Do Now",
        body: [
          "Register your verified likeness in a recognized registry, document every authorized use, and add explicit AI consent language to all new contracts. Don't wait for the law to pass — build the paper trail now so you can enforce whatever rights ultimately exist.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is the NO FAKES Act law yet?",
        answer:
          "Not as of this writing. It has bipartisan support and has been reintroduced in Congress, but it has not been enacted. Track the bill on Congress.gov for the current status.",
      },
      {
        question: "Does it replace state right of publicity laws?",
        answer:
          "No. It would add a federal layer on top of existing state laws like California's and Tennessee's, not preempt them.",
      },
      {
        question: "Would it cover dead performers?",
        answer:
          "Current drafts include post-mortem protection for a defined number of years, similar to several state statutes. Estate planning for likeness rights becomes important.",
      },
      {
        question: "Do I need to be famous to be protected?",
        answer:
          "No. The protection applies to any individual's voice or likeness, not just public figures.",
      },
    ],
    relatedSlugs: [
      "elvis-act-explained",
      "state-right-of-publicity",
      "post-mortem-likeness",
    ],
  },
  {
    slug: "protect-voice-and-likeness-from-ai",
    title: "How to Protect Your Voice and Likeness from AI Cloning",
    subtitle: "A practical playbook for performers in the deepfake era.",
    category: "How-To",
    readTime: "8 min read",
    author: AUTHOR,
    publishDate: "2025-02-05",
    excerpt:
      "AI cloning tools can replicate a recognizable voice from under a minute of audio and a face from a handful of photos. Protection now means combining legal, technical, and operational defenses.",
    sections: [
      {
        heading: "Step 1: Register a Verified Reference",
        body: [
          "Before you can claim something is an unauthorized replica, you need an authoritative reference of the original. A registered, hashed, time-stamped sample of your face and voice gives you that anchor.",
          "ClaimMyFace does this for you: identity-verified upload, cryptographic hash, and a registry record you can point to in any takedown.",
        ],
      },
      {
        heading: "Step 2: Lock Down Your Contracts",
        body: [
          "Every new contract should include an AI/digital replica clause that requires written consent for any synthetic recreation, names the permitted uses, and sets a fee structure. 'Standard riders' from years ago do not cover generative AI.",
          "If a producer refuses to add the clause, that is itself a signal worth heeding.",
        ],
      },
      {
        heading: "Step 3: Limit Your Public Voice and Face Footprint",
        body: [
          "You can't disappear from social media, but you can be intentional. Avoid posting long, clean, single-speaker audio clips that are ideal training material. Mix in background music or noise when possible.",
          "For high-resolution headshots, watermark the version that goes online and reserve clean masters for verified clients.",
        ],
      },
      {
        heading: "Step 4: Monitor Continuously",
        body: [
          "Set up automated likeness scans (image and voice) that check the open web on a recurring schedule. Manual Googling once a month is not enough — by the time a deepfake goes viral, it has already been re-uploaded across dozens of mirrors.",
        ],
      },
      {
        heading: "Step 5: Have a Takedown Workflow Ready",
        body: [
          "When you find misuse, speed matters. Have your DMCA template, your registry certificate, and your legal contact ready to deploy in under an hour. ClaimMyFace's DMCA Assistant pre-fills these for you.",
        ],
      },
    ],
    faqs: [
      {
        question: "How much audio does AI need to clone my voice?",
        answer:
          "Modern voice cloning can produce a recognizable clone from 30 to 60 seconds of clean audio. Higher fidelity models still benefit from more, but the threshold is low.",
      },
      {
        question: "Do watermarks really stop deepfakes?",
        answer:
          "Watermarks don't prevent cloning, but they help prove provenance and identify which leaked source was used to train a model.",
      },
      {
        question: "Should I avoid voice acting work to protect my voice?",
        answer:
          "No — but you should make sure every contract specifies that recordings cannot be used to train AI models without separate compensation.",
      },
      {
        question: "What's the single highest-impact step?",
        answer:
          "Adding a strong AI consent clause to every contract going forward. It costs nothing and prevents the most common 'we already had your permission' defense.",
      },
    ],
    relatedSlugs: [
      "what-is-digital-replica",
      "ai-consent-clause",
      "dmca-takedown-deepfake",
    ],
  },
  {
    slug: "what-is-digital-replica",
    title: "What Is a Digital Replica? A Guide for Performers",
    subtitle:
      "The legal and technical definitions every actor should be able to recognize.",
    category: "Legal",
    readTime: "5 min read",
    author: AUTHOR,
    publishDate: "2025-01-28",
    excerpt:
      "'Digital replica' is becoming a defined legal term in contracts, union agreements, and proposed federal law. Understanding the definition is the first step to negotiating around it.",
    sections: [
      {
        heading: "The Working Definition",
        body: [
          "A digital replica is a computer-generated, electronic representation of a person's voice or visual likeness that is so realistic that a reasonable person would believe it is an authentic performance by that individual.",
          "The key phrase is 'reasonable person.' A cartoon avatar based on you is generally not a digital replica. A photo-real AI version of your face delivering a line you never said almost certainly is.",
        ],
      },
      {
        heading: "Replica vs. Performance vs. Reference",
        body: [
          "A 'performance' is something you actually delivered. A 'reference' is using your image as inspiration for a different character. A 'replica' is the synthetic recreation that substitutes for you.",
          "Each has different contract implications. Make sure your agreements distinguish them clearly.",
        ],
      },
      {
        heading: "Why the Definition Matters in Negotiation",
        body: [
          "If a contract gives a producer the right to create 'derivative works' of your performance, an aggressive interpretation could include training an AI model. Carving 'digital replicas' out of derivative-work language is now standard practice for careful representation.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is a deepfake the same as a digital replica?",
        answer:
          "Most deepfakes meet the definition of a digital replica, but not all digital replicas are deepfakes. The legal term is broader and includes authorized synthetic uses.",
      },
      {
        question: "Does motion-capture create a digital replica?",
        answer:
          "Mocap of your performance applied to a non-human or stylized character usually does not. Mocap used to create a photo-real version of you usually does.",
      },
      {
        question: "Are voice clones digital replicas?",
        answer:
          "Yes. The definition explicitly includes voice as well as visual likeness.",
      },
    ],
    relatedSlugs: [
      "no-fakes-act-explained",
      "ai-consent-clause",
    ],
  },
  {
    slug: "elvis-act-explained",
    title: "The ELVIS Act Explained: How It Protects Your Voice",
    subtitle:
      "Tennessee's landmark voice-rights law and what it signals for the rest of the country.",
    category: "Legal",
    readTime: "6 min read",
    author: AUTHOR,
    publishDate: "2025-01-21",
    excerpt:
      "The Ensuring Likeness Voice and Image Security Act made Tennessee the first state to expressly protect a person's voice as a property right. It's a template other states are already copying.",
    sections: [
      {
        heading: "What ELVIS Changed",
        body: [
          "Before ELVIS, Tennessee's right of publicity law protected name, photograph, and likeness — but voice was ambiguous. The 2024 update made voice an explicit, protectable interest, with civil and criminal penalties for unauthorized AI cloning.",
          "Critically, it also reaches AI tools whose 'primary purpose' is producing unauthorized replicas. That's a structural shift.",
        ],
      },
      {
        heading: "Who's Liable",
        body: [
          "The user who generates the clone, the distributor who publishes it, and — in some cases — the platform or tool maker that knowingly enabled it.",
        ],
      },
      {
        heading: "Why Tennessee First",
        body: [
          "Nashville's music industry is built on recognizable voices, and lobbying pressure pushed the state to act before Washington could. Expect California, New York, and Texas to follow with similar bills.",
        ],
      },
    ],
    faqs: [
      {
        question: "Do I need to live in Tennessee to use ELVIS?",
        answer:
          "No. The law protects against unauthorized use that occurs in or is distributed into Tennessee, regardless of where the rightsholder lives.",
      },
      {
        question: "Does ELVIS cover impressions and parody?",
        answer:
          "Human impressions and clear parody are generally protected speech. The law targets synthetic clones designed to substitute for the real person.",
      },
      {
        question: "How does it interact with the NO FAKES Act?",
        answer:
          "If NO FAKES becomes federal law, ELVIS would remain in force as state law and could provide stronger remedies in some cases.",
      },
    ],
    relatedSlugs: [
      "no-fakes-act-explained",
      "state-right-of-publicity",
      "protect-voice-and-likeness-from-ai",
    ],
  },
  {
    slug: "dmca-takedown-deepfake",
    title: "How to File a DMCA Takedown for a Deepfake of Your Face",
    subtitle: "A step-by-step guide to getting unauthorized content removed quickly.",
    category: "How-To",
    readTime: "9 min read",
    author: AUTHOR,
    publishDate: "2025-01-14",
    excerpt:
      "DMCA takedowns are the fastest way to get a deepfake pulled from a major platform. Done right, most platforms remove flagged content within 24 to 72 hours.",
    sections: [
      {
        heading: "Before You File: Document Everything",
        body: [
          "Capture the URL, a screenshot with visible timestamp, the uploader's username, and any monetization signals (ads, tip jars, paid tiers). Save copies locally — content disappears once a takedown lands.",
        ],
      },
      {
        heading: "Find the Right Designated Agent",
        body: [
          "Every platform that hosts user content is required to publish a DMCA designated agent. The U.S. Copyright Office maintains a public directory. Filing with the wrong address slows everything down.",
        ],
      },
      {
        heading: "What Goes in the Notice",
        body: [
          "Identification of the original work (your registered likeness reference), identification of the infringing material with URL, your contact info, a statement of good-faith belief, a statement under penalty of perjury that you're authorized to act, and your signature.",
          "ClaimMyFace's DMCA Assistant assembles all of this from your registry record automatically.",
        ],
      },
      {
        heading: "After You File",
        body: [
          "The platform notifies the uploader and typically removes the content within 24 to 72 hours. The uploader can file a counter-notice; if they do, you have a limited window to file suit before the content is restored.",
        ],
      },
      {
        heading: "When DMCA Isn't Enough",
        body: [
          "DMCA is a copyright tool. For pure right-of-publicity claims (no copyrighted underlying work), you may need to send a separate cease-and-desist citing state law or, increasingly, the ELVIS Act and similar statutes.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can I file a DMCA against an AI-generated image of my face?",
        answer:
          "DMCA technically protects copyrighted works. If your registered headshot was used as a training reference, you have a stronger DMCA argument. For pure synthetic likenesses, right-of-publicity claims are often more effective.",
      },
      {
        question: "How fast do platforms respond?",
        answer:
          "Major platforms (YouTube, Instagram, TikTok, X) typically act within 24 to 72 hours. Smaller hosts can take longer.",
      },
      {
        question: "Is there a penalty for false takedowns?",
        answer:
          "Yes. Knowingly false notices can result in damages and attorney's fees. Always file in good faith.",
      },
      {
        question: "Do I need a lawyer?",
        answer:
          "Not for the initial notice. You may want one if a counter-notice is filed or if litigation becomes necessary.",
      },
    ],
    relatedSlugs: [
      "protect-voice-and-likeness-from-ai",
      "ai-deepfakes-advertising",
      "personality-theft",
    ],
  },
  {
    slug: "state-right-of-publicity",
    title: "State-by-State Right of Publicity Laws: What Actors Need to Know",
    subtitle: "The patchwork map every performer should understand before signing.",
    category: "Legal",
    readTime: "10 min read",
    author: AUTHOR,
    publishDate: "2025-01-07",
    excerpt:
      "Right of publicity in the U.S. is a state-by-state patchwork, and the differences are significant. Where you live, where you work, and where the misuse happens all matter.",
    sections: [
      {
        heading: "The Big Three: California, New York, Tennessee",
        body: [
          "California has the strongest combined statutory and common-law protection, covering name, voice, signature, photograph, and likeness, with explicit post-mortem rights.",
          "New York modernized its law in 2020 to add protections for digital replicas of deceased performers used in expressive works.",
          "Tennessee, via the ELVIS Act, leads on voice and AI-specific protection.",
        ],
      },
      {
        heading: "States with Limited or No Statutory Protection",
        body: [
          "Several states still rely entirely on common law, which makes enforcement unpredictable. If your work or residence touches one of these jurisdictions, plan accordingly in your contracts.",
        ],
      },
      {
        heading: "Choice of Law in Contracts",
        body: [
          "The 'governing law' clause in your contract determines which state's right-of-publicity rules apply to disputes. Push for the strongest jurisdiction available — usually California or New York.",
        ],
      },
      {
        heading: "Cross-Border Misuse",
        body: [
          "If a deepfake is hosted overseas but viewed in the U.S., U.S. courts have asserted jurisdiction in several recent cases. Don't assume foreign hosting puts the content out of reach.",
        ],
      },
    ],
    faqs: [
      {
        question: "Does federal law cover right of publicity?",
        answer:
          "Not yet broadly. The Lanham Act (false endorsement) and proposed NO FAKES Act provide partial federal hooks.",
      },
      {
        question: "Which state's law applies if I live in one state and work in another?",
        answer:
          "It depends on where the misuse occurred and which state has the most significant relationship. Courts vary, which is why contract choice-of-law clauses matter.",
      },
      {
        question: "Are post-mortem rights universal?",
        answer:
          "No. Some states grant decades of post-mortem protection; others grant none. This is a major estate-planning issue for performers.",
      },
    ],
    relatedSlugs: [
      "post-mortem-likeness",
      "elvis-act-explained",
      "no-fakes-act-explained",
    ],
  },
  {
    slug: "mcconaughey-trademark-strategy",
    title: "Matthew McConaughey's Trademark Strategy: What Actors Can Learn",
    subtitle: "How catchphrase trademarks fit into a broader likeness-protection plan.",
    category: "Industry",
    readTime: "5 min read",
    author: AUTHOR,
    publishDate: "2024-12-30",
    excerpt:
      "Matthew McConaughey famously trademarked 'alright, alright, alright' — but the strategy goes deeper than a single phrase. It's a model for treating personal brand assets as protectable IP.",
    sections: [
      {
        heading: "Why Trademarks Matter for Performers",
        body: [
          "Right of publicity protects who you are. Trademarks protect what you produce as a brand: catchphrases, signature imagery, even distinctive vocal tags. Together they create overlapping layers of protection that are harder to circumvent.",
        ],
      },
      {
        heading: "What Can Be Trademarked",
        body: [
          "Catchphrases, character names you control, signature gestures captured in logo form, and merchandise marks. Pure likeness is generally not trademarked — that's right-of-publicity territory.",
        ],
      },
      {
        heading: "How to Build the Stack",
        body: [
          "Start with what's already commercially associated with you, file in the categories where you actually sell or license, and renew on schedule. Trademarks are a use-it-or-lose-it system.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can I trademark my own name?",
        answer:
          "Yes, if it's used in commerce as a brand. Many actors trademark their stage names for merchandise and production company use.",
      },
      {
        question: "Does a trademark stop AI clones?",
        answer:
          "Indirectly. If a clone uses a trademarked catchphrase or branding, you have a trademark infringement claim layered on top of any likeness claim.",
      },
      {
        question: "How much does this cost?",
        answer:
          "USPTO filing fees per class are modest, but legal fees and ongoing maintenance add up. Budget for a long-term filing program rather than one-off applications.",
      },
    ],
    relatedSlugs: [
      "personality-theft",
      "ai-consent-clause",
    ],
  },
  {
    slug: "ai-deepfakes-advertising",
    title: "AI Deepfakes in Advertising: How to Stop Unauthorized Use of Your Face",
    subtitle:
      "When your likeness shows up in an ad you never agreed to — what to do in the first 48 hours.",
    category: "How-To",
    readTime: "8 min read",
    author: AUTHOR,
    publishDate: "2024-12-12",
    excerpt:
      "Unauthorized AI ads featuring real performers' faces have exploded across social platforms. The good news: false-endorsement claims often have faster, cheaper remedies than pure copyright cases.",
    sections: [
      {
        heading: "Step 1: Preserve the Evidence",
        body: [
          "Screen-record the ad, capture the advertiser's name, the platform, and any landing page. Note whether the ad implies endorsement, partnership, or sponsorship.",
        ],
      },
      {
        heading: "Step 2: Use the Platform's Impersonation Channel",
        body: [
          "Meta, TikTok, YouTube, and X all have dedicated impersonation and likeness-misuse forms. These are usually faster than generic ad reports.",
        ],
      },
      {
        heading: "Step 3: Hit the Advertiser Directly",
        body: [
          "Send a cease-and-desist citing right of publicity and false endorsement under the Lanham Act. Most legitimate advertisers comply quickly to avoid press exposure.",
        ],
      },
      {
        heading: "Step 4: Document for Damages",
        body: [
          "If the ad ran for any length of time, track impressions, click counts, and any sales attributable to the campaign. These figures drive damages calculations.",
        ],
      },
    ],
    faqs: [
      {
        question: "What if the advertiser is overseas?",
        answer:
          "You can still target the platform serving the ad in your jurisdiction. Most major ad networks cooperate with takedowns regardless of advertiser location.",
      },
      {
        question: "Does a disclaimer like 'AI generated' protect the advertiser?",
        answer:
          "Generally no. A disclaimer doesn't cure unauthorized use of an identifiable person's likeness in commercial advertising.",
      },
      {
        question: "Can I sue the AI tool that generated the ad?",
        answer:
          "Increasingly, yes — especially if the tool was marketed for impersonation purposes. This is an active area of litigation.",
      },
    ],
    relatedSlugs: [
      "dmca-takedown-deepfake",
      "personality-theft",
      "protect-voice-and-likeness-from-ai",
    ],
  },
  {
    slug: "personality-theft",
    title: "What Is Personality Theft? The New Digital Identity Crisis for Performers",
    subtitle: "A working definition for a category of harm the law is still catching up to.",
    category: "Industry",
    readTime: "6 min read",
    author: AUTHOR,
    publishDate: "2024-12-04",
    excerpt:
      "Personality theft is the unauthorized appropriation of a recognizable persona — voice, mannerisms, and visual identity combined — to create a substitute that competes with the real person. It's bigger than any single deepfake.",
    sections: [
      {
        heading: "Why 'Personality' and Not Just 'Likeness'",
        body: [
          "A single image misuse is a likeness violation. A coordinated campaign that fakes your voice, copies your style, and builds a fake account that competes with you for opportunities — that's something different. It's appropriation of the whole brand you took years to build.",
        ],
      },
      {
        heading: "The Economic Harm",
        body: [
          "Personality theft doesn't just embarrass you. It diverts opportunities and earnings. Casting directors, brands, and fans can be misled into engaging with the fake instead of the real performer.",
        ],
      },
      {
        heading: "Building a Defense",
        body: [
          "Layer your protection: registered likeness, trademarked catchphrases, verified profile presence on every major platform, and continuous monitoring. No single tool stops personality theft — coordinated layers do.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is personality theft a recognized legal claim?",
        answer:
          "Not as a single named cause of action in most U.S. jurisdictions. But the underlying conduct usually triggers right of publicity, trademark, false endorsement, and sometimes fraud claims.",
      },
      {
        question: "How is it different from identity theft?",
        answer:
          "Identity theft typically involves financial fraud using your personal data. Personality theft targets the public persona that drives your career.",
      },
      {
        question: "What's the single best preventative measure?",
        answer:
          "Verified, claimed profiles on every platform where you have any presence — even ones you don't actively use. Empty space gets filled by impersonators.",
      },
    ],
    relatedSlugs: [
      "ai-deepfakes-advertising",
      "mcconaughey-trademark-strategy",
      "dmca-takedown-deepfake",
    ],
  },
  {
    slug: "ai-consent-clause",
    title: "How to Write an AI Consent Clause in Your Acting Contract",
    subtitle: "The exact language patterns to insist on — and the loopholes to close.",
    category: "How-To",
    readTime: "9 min read",
    author: AUTHOR,
    publishDate: "2024-11-26",
    excerpt:
      "An AI consent clause is now non-negotiable in any modern acting contract. The right language is specific, narrow, and leaves no room for 'we already had your permission.'",
    sections: [
      {
        heading: "The Four Required Elements",
        body: [
          "Definition of 'Digital Replica' that includes voice, image, and any synthetic recreation. Express written consent required for each new use. Separate, itemized compensation for replica use. A reversion clause if the replica is used outside agreed scope.",
        ],
      },
      {
        heading: "Sample Clause Language",
        body: [
          "'No Digital Replica of Performer's voice, image, or likeness shall be created, used, or licensed without Performer's separate, prior, written consent for each specific use, with compensation negotiated in good faith. Any use outside the expressly agreed scope automatically terminates the rights granted herein.'",
          "Adapt to fit your jurisdiction, but keep the four elements intact.",
        ],
      },
      {
        heading: "Common Loopholes to Close",
        body: [
          "Watch for 'derivative works,' 'in any media now known or hereafter devised,' and broad 'training data' grants. Each of these has been used to argue that AI replication was already authorized.",
        ],
      },
      {
        heading: "When the Producer Pushes Back",
        body: [
          "A producer who refuses any AI clause is signaling intent. Decide accordingly. A producer who accepts the structure but pushes on numbers is negotiating in good faith — find a number you can live with.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can I add this to a deal that's already signed?",
        answer:
          "Only via a written amendment signed by both parties. Always do this for ongoing or option deals when AI use becomes a possibility.",
      },
      {
        question: "Does this apply to background work?",
        answer:
          "It should. Background performers are a major target for synthetic crowd generation, so the clause matters even more.",
      },
      {
        question: "Do I need a lawyer to write this?",
        answer:
          "ClaimMyFace's Contract Generator produces an industry-aligned starting point. For high-value deals, have an entertainment attorney review.",
      },
    ],
    relatedSlugs: [
      "what-is-digital-replica",
      "protect-voice-and-likeness-from-ai",
    ],
  },
  {
    slug: "post-mortem-likeness",
    title: "Post-Mortem Likeness Protection: What Happens to Your Digital Identity After Death?",
    subtitle: "Estate planning for a generation of performers who may 'work' for decades after they're gone.",
    category: "Legal",
    readTime: "7 min read",
    author: AUTHOR,
    publishDate: "2024-11-18",
    excerpt:
      "AI has made it commercially viable to keep a performer 'working' indefinitely after death. Whether your estate controls that — or someone else does — depends on the planning you do today.",
    sections: [
      {
        heading: "Why This Wasn't an Issue Before",
        body: [
          "Historically, post-mortem likeness use required body doubles, archival footage, or expensive CGI. AI has reduced the cost to near zero, which means heirs (and unauthorized parties) now have real economic incentive to act.",
        ],
      },
      {
        heading: "What State Law Currently Provides",
        body: [
          "Some states grant post-mortem rights of publicity for 70+ years; others grant none. California and Tennessee are among the strongest; New York added explicit digital-replica protection for deceased performers in 2020.",
        ],
      },
      {
        heading: "Estate Planning Steps",
        body: [
          "Designate a likeness rights holder in your will or trust. Maintain a registered, hashed reference of your authentic likeness. Document approved uses and any licenses. Include AI-specific provisions in any rights-management agreement.",
        ],
      },
      {
        heading: "The Family Conversation",
        body: [
          "Talk to your heirs about what uses you would and wouldn't approve. AI makes 'WWMD — what would Mom do' a real estate-administration question, and clear written guidance prevents painful disputes.",
        ],
      },
    ],
    faqs: [
      {
        question: "How long do post-mortem rights last?",
        answer:
          "Anywhere from zero to 100+ years depending on state. California provides 70 years; Indiana provides 100; some states provide none.",
      },
      {
        question: "Can my estate stop AI uses I would have hated?",
        answer:
          "If your rights are properly registered and assigned, generally yes — within the limits of state law and First Amendment exceptions for newsworthy or expressive uses.",
      },
      {
        question: "What if I don't have heirs?",
        answer:
          "You can assign your post-mortem rights to a trust, foundation, or other entity. Without designation, rights may pass under default succession rules — or in some states, evaporate.",
      },
    ],
    relatedSlugs: [
      "state-right-of-publicity",
      "no-fakes-act-explained",
      "what-is-digital-replica",
    ],
  },
];

export const getArticleBySlug = (slug: string) =>
  educationArticles.find((a) => a.slug === slug);

export const getRelatedArticles = (article: EducationArticle) =>
  article.relatedSlugs
    .map((s) => educationArticles.find((a) => a.slug === s))
    .filter((a): a is EducationArticle => Boolean(a));
