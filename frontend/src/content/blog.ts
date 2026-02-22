import type { Locale } from "@/lib/i18n";

type Localized<T> = Record<Locale, T>;
type LocalizedString = Localized<string>;
type LocalizedStringArray = Localized<string[]>;

export type BlogBlock =
  | { type: "h2"; text: LocalizedString }
  | { type: "h3"; text: LocalizedString }
  | { type: "p"; text: LocalizedString }
  | { type: "ul"; items: LocalizedStringArray }
  | { type: "quote"; text: LocalizedString };

export interface BlogContent {
  title: string;
  description: string;
  excerpt: string;
  readingTime: string;
  tags: string[];
  blocks: BlogBlock[];
}

export interface BlogPost {
  slug: string;
  date: string;
  content: Localized<BlogContent>;
}

export interface LocalizedBlogPost extends BlogContent {
  slug: string;
  date: string;
}

const blogPosts: BlogPost[] = [
  {
    slug: "mimthehuman-origin-story",
    date: "2026-02-02",
    content: {
      en: {
        title: "Meet @mimthehuman and the Origin of Spot This",
        description:
          "How a musician's fit-check DMs inspired a tool that finds every item from short videos and photos.",
        excerpt:
          "The idea started with one creator's inbox and grew into a platform that turns fits you love into pieces in your closet.",
        readingTime: "3 min read",
        tags: ["origin story", "creators", "tiktok", "reels"],
        blocks: [
          {
            type: "p",
            text: {
              en: "Meet @mimthehuman — a musician, producer, and influencer who constantly gets asked where his fits are from when posting fit-check videos.",
              fr: "Voici @mimthehuman — musicien, producteur et influenceur qui se fait constamment demander d'ou viennent ses tenues lorsqu'il publie des videos de fit-check.",
            },
          },
          {
            type: "quote",
            text: {
              en: "“Omg I love your [insert shoes or shirt]. Where is it from?”",
              fr: "« Omg j'adore tes [chaussures ou t-shirt]. Ca vient d'ou ? »",
            },
          },
          {
            type: "p",
            text: {
              en: "After doing some digging, it became clear he isn't the only one on the internet getting these questions.",
              fr: "En creusant un peu, c'est vite devenu clair qu'il n'etait pas le seul sur Internet a recevoir ce genre de questions.",
            },
          },
          {
            type: "p",
            text: {
              en: "That sparked an idea: what if there was a bot or account where you could simply DM your fit and get back every item shown in that short video? Not only would this make things easier for viewers, but it could also help content creators make extra income while showing off their amazing fits.",
              fr: "Cela a lance une idee : et si un bot ou un compte permettait de simplement envoyer un DM avec ta tenue pour recevoir chaque article vu dans la video ? Non seulement ce serait plus simple pour les viewers, mais cela pourrait aussi aider les createurs a gagner un revenu en montrant leurs looks.",
            },
          },
          {
            type: "p",
            text: {
              en: "From there, the idea for Spot This was born.",
              fr: "C'est comme ca que l'idee de Spot This est nee.",
            },
          },
          {
            type: "p",
            text: {
              en: "At first, we wanted to build an Instagram-specific automated account that would DM you the best deals once you sent it a video. But then we thought — why not make it even easier for users? Instead of limiting it to Instagram, why not let people paste a link to a video or simply upload a screenshot?",
              fr: "Au debut, on voulait creer un compte Instagram automatise qui t'enverrait les meilleurs deals des que tu envoyais une video. Mais ensuite, on s'est dit : pourquoi ne pas rendre ca encore plus simple ? Plutot que de limiter a Instagram, pourquoi ne pas laisser les gens coller un lien video ou televerser une capture d'ecran ?",
            },
          },
          {
            type: "p",
            text: {
              en: "That thinking led to the creation of spotthis.fit.",
              fr: "Cette reflexion a mene a la creation de spotthis.fit.",
            },
          },
          {
            type: "p",
            text: {
              en: "Spot This allows users to find the exact fit they're looking for while aggregating the same product from multiple sellers, helping them find the best possible deals. It's the ultimate tool for turning the fits you love into pieces in your closet.",
              fr: "Spot This permet de retrouver le look exact tout en regroupant le meme produit chez plusieurs vendeurs pour trouver le meilleur prix. C'est l'outil ultime pour transformer les looks que tu aimes en pieces dans ton dressing.",
            },
          },
        ],
      },
      fr: {
        title: "Rencontrez @mimthehuman et l'origine de Spot This",
        description:
          "Comment les DM de fit-check d'un musicien ont inspire un outil qui retrouve chaque article depuis des videos courtes et des photos.",
        excerpt:
          "L'idee a commence dans la boite de reception d'un createur et est devenue une plateforme qui transforme vos fits preferes en pieces a porter.",
        readingTime: "3 min de lecture",
        tags: ["origine", "createurs", "tiktok", "reels"],
        blocks: [
          {
            type: "p",
            text: {
              en: "Meet @mimthehuman — a musician, producer, and influencer who constantly gets asked where his fits are from when posting fit-check videos.",
              fr: "Voici @mimthehuman — musicien, producteur et influenceur qui se fait constamment demander d'ou viennent ses tenues lorsqu'il publie des videos de fit-check.",
            },
          },
          {
            type: "quote",
            text: {
              en: "“Omg I love your [insert shoes or shirt]. Where is it from?”",
              fr: "« Omg j'adore tes [chaussures ou t-shirt]. Ca vient d'ou ? »",
            },
          },
          {
            type: "p",
            text: {
              en: "After doing some digging, it became clear he isn't the only one on the internet getting these questions.",
              fr: "En creusant un peu, c'est vite devenu clair qu'il n'etait pas le seul sur Internet a recevoir ce genre de questions.",
            },
          },
          {
            type: "p",
            text: {
              en: "That sparked an idea: what if there was a bot or account where you could simply DM your fit and get back every item shown in that short video? Not only would this make things easier for viewers, but it could also help content creators make extra income while showing off their amazing fits.",
              fr: "Cela a lance une idee : et si un bot ou un compte permettait de simplement envoyer un DM avec ta tenue pour recevoir chaque article vu dans la video ? Non seulement ce serait plus simple pour les viewers, mais cela pourrait aussi aider les createurs a gagner un revenu en montrant leurs looks.",
            },
          },
          {
            type: "p",
            text: {
              en: "From there, the idea for Spot This was born.",
              fr: "C'est comme ca que l'idee de Spot This est nee.",
            },
          },
          {
            type: "p",
            text: {
              en: "At first, we wanted to build an Instagram-specific automated account that would DM you the best deals once you sent it a video. But then we thought — why not make it even easier for users? Instead of limiting it to Instagram, why not let people paste a link to a video or simply upload a screenshot?",
              fr: "Au debut, on voulait creer un compte Instagram automatise qui t'enverrait les meilleurs deals des que tu envoyais une video. Mais ensuite, on s'est dit : pourquoi ne pas rendre ca encore plus simple ? Plutot que de limiter a Instagram, pourquoi ne pas laisser les gens coller un lien video ou televerser une capture d'ecran ?",
            },
          },
          {
            type: "p",
            text: {
              en: "That thinking led to the creation of spotthis.fit.",
              fr: "Cette reflexion a mene a la creation de spotthis.fit.",
            },
          },
          {
            type: "p",
            text: {
              en: "Spot This allows users to find the exact fit they're looking for while aggregating the same product from multiple sellers, helping them find the best possible deals. It's the ultimate tool for turning the fits you love into pieces in your closet.",
              fr: "Spot This permet de retrouver le look exact tout en regroupant le meme produit chez plusieurs vendeurs pour trouver le meilleur prix. C'est l'outil ultime pour transformer les looks que tu aimes en pieces dans ton dressing.",
            },
          },
        ],
      },
    },
  },
  {
    slug: "find-clothes-from-tiktok-reels-shorts",
    date: "2026-02-01",
    content: {
      en: {
        title: "Find Clothes From TikTok, Reels, and Shorts in Minutes",
        description:
          "A simple workflow to identify outfits from short videos and shop the exact items or close alternatives.",
        excerpt:
          "Stop losing outfits to the endless scroll. Use one frame, one query, and a clear description to find the exact pieces.",
        readingTime: "4 min read",
        tags: ["tiktok", "reels", "shorts", "how-to"],
        blocks: [
          {
            type: "p",
            text: {
              en: "Short videos move fast. The best way to shop a look is to pause on the clearest frame, focus on the main item, and describe it with one or two strong details.",
              fr: "Les videos courtes vont vite. La meilleure facon de shopper un look est de mettre pause sur l'image la plus claire, de se concentrer sur la piece principale et de la decrire avec un ou deux details forts.",
            },
          },
          {
            type: "h2",
            text: {
              en: "The 60-second workflow",
              fr: "Le workflow en 60 secondes",
            },
          },
          {
            type: "ul",
            items: {
              en: [
                "Pause on the cleanest frame and capture the outfit.",
                "Highlight the main item (jacket, shoes, bag) so the AI prioritizes it.",
                "Add a short description: color, material, and standout detail.",
                "Run the search and scan the top results first.",
              ],
              fr: [
                "Mets pause sur l'image la plus nette et capture la tenue.",
                "Surligne la piece principale (veste, chaussures, sac) pour prioriser l'IA.",
                "Ajoute une courte description : couleur, matiere, detail marquant.",
                "Lance la recherche et regarde d'abord les premiers resultats.",
              ],
            },
          },
          {
            type: "h2",
            text: {
              en: "What to write in the description",
              fr: "Quoi ecrire dans la description",
            },
          },
          {
            type: "p",
            text: {
              en: "Be specific: 'black leather moto jacket' works better than 'cool jacket'. Mention unique shapes, patterns, or hardware. If you know the brand, include it.",
              fr: "Sois precis : « blouson moto en cuir noir » fonctionne mieux que « veste stylée ». Mentionne les formes uniques, motifs ou details. Si tu connais la marque, ajoute-la.",
            },
          },
          {
            type: "quote",
            text: {
              en: "If the first results are close but not exact, add one extra detail and search again.",
              fr: "Si les premiers resultats sont proches mais pas exacts, ajoute un detail et relance la recherche.",
            },
          },
          {
            type: "h2",
            text: {
              en: "Exact match vs. smart alternatives",
              fr: "Match exact vs alternatives intelligentes",
            },
          },
          {
            type: "p",
            text: {
              en: "When an exact match is hard to find, the fastest path is a close alternative. You still get the same silhouette and vibe, often at a better price.",
              fr: "Quand le match exact est difficile, l'alternative proche est souvent la meilleure voie. Tu gardes la meme silhouette et le meme mood, souvent a meilleur prix.",
            },
          },
        ],
      },
      fr: {
        title: "Trouver des vetements depuis TikTok, Reels et Shorts en quelques minutes",
        description:
          "Un workflow simple pour identifier des tenues depuis des videos courtes et acheter les pieces exactes ou des alternatives proches.",
        excerpt:
          "Ne perds plus les tenues dans le scroll. Utilise une image claire, une requete et une description precise.",
        readingTime: "4 min de lecture",
        tags: ["tiktok", "reels", "shorts", "guide"],
        blocks: [
          {
            type: "p",
            text: {
              en: "Short videos move fast. The best way to shop a look is to pause on the clearest frame, focus on the main item, and describe it with one or two strong details.",
              fr: "Les videos courtes vont vite. La meilleure facon de shopper un look est de mettre pause sur l'image la plus claire, de se concentrer sur la piece principale et de la decrire avec un ou deux details forts.",
            },
          },
          {
            type: "h2",
            text: {
              en: "The 60-second workflow",
              fr: "Le workflow en 60 secondes",
            },
          },
          {
            type: "ul",
            items: {
              en: [
                "Pause on the cleanest frame and capture the outfit.",
                "Highlight the main item (jacket, shoes, bag) so the AI prioritizes it.",
                "Add a short description: color, material, and standout detail.",
                "Run the search and scan the top results first.",
              ],
              fr: [
                "Mets pause sur l'image la plus nette et capture la tenue.",
                "Surligne la piece principale (veste, chaussures, sac) pour prioriser l'IA.",
                "Ajoute une courte description : couleur, matiere, detail marquant.",
                "Lance la recherche et regarde d'abord les premiers resultats.",
              ],
            },
          },
          {
            type: "h2",
            text: {
              en: "What to write in the description",
              fr: "Quoi ecrire dans la description",
            },
          },
          {
            type: "p",
            text: {
              en: "Be specific: 'black leather moto jacket' works better than 'cool jacket'. Mention unique shapes, patterns, or hardware. If you know the brand, include it.",
              fr: "Sois precis : « blouson moto en cuir noir » fonctionne mieux que « veste stylée ». Mentionne les formes uniques, motifs ou details. Si tu connais la marque, ajoute-la.",
            },
          },
          {
            type: "quote",
            text: {
              en: "If the first results are close but not exact, add one extra detail and search again.",
              fr: "Si les premiers resultats sont proches mais pas exacts, ajoute un detail et relance la recherche.",
            },
          },
          {
            type: "h2",
            text: {
              en: "Exact match vs. smart alternatives",
              fr: "Match exact vs alternatives intelligentes",
            },
          },
          {
            type: "p",
            text: {
              en: "When an exact match is hard to find, the fastest path is a close alternative. You still get the same silhouette and vibe, often at a better price.",
              fr: "Quand le match exact est difficile, l'alternative proche est souvent la meilleure voie. Tu gardes la meme silhouette et le meme mood, souvent a meilleur prix.",
            },
          },
        ],
      },
    },
  },
  {
    slug: "how-to-find-outfits-from-photos",
    date: "2026-01-21",
    content: {
      en: {
        title: "How to Find Outfits From Photos Without Guessing",
        description:
          "A step-by-step guide to identify clothing from photos, screenshots, and inspo pins.",
        excerpt:
          "From saved screenshots to moodboards, use a focused crop and smart keywords to get accurate results.",
        readingTime: "5 min read",
        tags: ["photos", "outfits", "style tips"],
        blocks: [
          {
            type: "p",
            text: {
              en: "Photos give you more time to inspect the details. The trick is to give the AI clean visual signals and a simple description.",
              fr: "Les photos te laissent plus de temps pour observer les details. L'astuce est de donner a l'IA des signaux visuels clairs et une description simple.",
            },
          },
          {
            type: "h2",
            text: {
              en: "Choose the right crop",
              fr: "Choisir le bon cadrage",
            },
          },
          {
            type: "p",
            text: {
              en: "Crop the image to focus on the item you want. Clean edges and fewer distractions lead to better matches.",
              fr: "Recadre l'image pour te concentrer sur la piece voulue. Un cadrage propre et moins de distractions donnent de meilleurs matchs.",
            },
          },
          {
            type: "h2",
            text: {
              en: "Use clear naming",
              fr: "Utiliser des noms clairs",
            },
          },
          {
            type: "ul",
            items: {
              en: [
                "Name the category: trench coat, slingback heel, crossbody bag.",
                "Add color and material: olive suede, white linen, black patent.",
                "Mention a feature: puff sleeves, wide-leg, square toe.",
              ],
              fr: [
                "Nomme la categorie : trench, slingback, sac bandouliere.",
                "Ajoute la couleur et la matiere : suede olive, lin blanc, cuir verni noir.",
                "Mentionne un detail : manches bouffantes, jambe large, bout carre.",
              ],
            },
          },
          {
            type: "h2",
            text: {
              en: "When the AI returns too many options",
              fr: "Quand l'IA renvoie trop d'options",
            },
          },
          {
            type: "p",
            text: {
              en: "Refine with one more detail. The goal is to reduce ambiguity, not write an essay.",
              fr: "Affine avec un detail en plus. L'objectif est de reduire l'ambiguite, pas d'ecrire un roman.",
            },
          },
        ],
      },
      fr: {
        title: "Trouver des tenues depuis des photos sans deviner",
        description:
          "Un guide pas a pas pour identifier des vetements depuis des photos, captures et moodboards.",
        excerpt:
          "Des captures d'ecran aux inspirations, utilise un bon cadrage et des mots-cles precis.",
        readingTime: "5 min de lecture",
        tags: ["photos", "tenues", "conseils style"],
        blocks: [
          {
            type: "p",
            text: {
              en: "Photos give you more time to inspect the details. The trick is to give the AI clean visual signals and a simple description.",
              fr: "Les photos te laissent plus de temps pour observer les details. L'astuce est de donner a l'IA des signaux visuels clairs et une description simple.",
            },
          },
          {
            type: "h2",
            text: {
              en: "Choose the right crop",
              fr: "Choisir le bon cadrage",
            },
          },
          {
            type: "p",
            text: {
              en: "Crop the image to focus on the item you want. Clean edges and fewer distractions lead to better matches.",
              fr: "Recadre l'image pour te concentrer sur la piece voulue. Un cadrage propre et moins de distractions donnent de meilleurs matchs.",
            },
          },
          {
            type: "h2",
            text: {
              en: "Use clear naming",
              fr: "Utiliser des noms clairs",
            },
          },
          {
            type: "ul",
            items: {
              en: [
                "Name the category: trench coat, slingback heel, crossbody bag.",
                "Add color and material: olive suede, white linen, black patent.",
                "Mention a feature: puff sleeves, wide-leg, square toe.",
              ],
              fr: [
                "Nomme la categorie : trench, slingback, sac bandouliere.",
                "Ajoute la couleur et la matiere : suede olive, lin blanc, cuir verni noir.",
                "Mentionne un detail : manches bouffantes, jambe large, bout carre.",
              ],
            },
          },
          {
            type: "h2",
            text: {
              en: "When the AI returns too many options",
              fr: "Quand l'IA renvoie trop d'options",
            },
          },
          {
            type: "p",
            text: {
              en: "Refine with one more detail. The goal is to reduce ambiguity, not write an essay.",
              fr: "Affiner avec un detail en plus. L'objectif est de reduire l'ambiguite, pas d'ecrire un roman.",
            },
          },
        ],
      },
    },
  },
  {
    slug: "shop-the-look-guide",
    date: "2026-01-10",
    content: {
      en: {
        title: "Shop the Look: A Practical Guide for Building a Full Outfit",
        description:
          "Use one statement piece to build a complete outfit you can actually buy today.",
        excerpt:
          "Start with the hero item, then match shape, fabric, and tone to find the supporting pieces.",
        readingTime: "6 min read",
        tags: ["shop the look", "wardrobe", "styling"],
        blocks: [
          {
            type: "p",
            text: {
              en: "A great outfit usually has one hero item: a jacket, a bag, or a pair of shoes. Start there, then build around it.",
              fr: "Une bonne tenue a souvent une piece hero : une veste, un sac ou des chaussures. Commence par la, puis construis autour.",
            },
          },
          {
            type: "h2",
            text: {
              en: "Pick the hero item",
              fr: "Choisir la piece hero",
            },
          },
          {
            type: "p",
            text: {
              en: "Find the main piece first. Once you have it, matching the rest is easier and more affordable.",
              fr: "Trouve la piece principale d'abord. Une fois acquise, le reste devient plus simple et souvent plus accessible.",
            },
          },
          {
            type: "h2",
            text: {
              en: "Match shape before color",
              fr: "Matcher la forme avant la couleur",
            },
          },
          {
            type: "p",
            text: {
              en: "Silhouette creates the vibe. Nail the shape first, then pick colors that fit your palette.",
              fr: "La silhouette donne le vibe. Trouve la bonne forme, puis choisis les couleurs qui matchent ta palette.",
            },
          },
          {
            type: "h2",
            text: {
              en: "Use accessories to lock in the vibe",
              fr: "Utiliser les accessoires pour verrouiller le style",
            },
          },
          {
            type: "ul",
            items: {
              en: [
                "Belt or bag to echo the hero color.",
                "Shoes to balance proportions.",
                "Jewelry to finish the look without overdoing it.",
              ],
              fr: [
                "Ceinture ou sac pour rappeler la couleur principale.",
                "Chaussures pour equilibrer les proportions.",
                "Bijoux pour finir le look sans en faire trop.",
              ],
            },
          },
        ],
      },
      fr: {
        title: "Shop the look : guide pratique pour creer une tenue complete",
        description:
          "Utilise une piece forte pour construire une tenue complete que tu peux acheter aujourd'hui.",
        excerpt:
          "Commence par la piece hero, puis matche la forme, la matiere et le ton.",
        readingTime: "6 min de lecture",
        tags: ["shop the look", "garde-robe", "styling"],
        blocks: [
          {
            type: "p",
            text: {
              en: "A great outfit usually has one hero item: a jacket, a bag, or a pair of shoes. Start there, then build around it.",
              fr: "Une bonne tenue a souvent une piece hero : une veste, un sac ou des chaussures. Commence par la, puis construis autour.",
            },
          },
          {
            type: "h2",
            text: {
              en: "Pick the hero item",
              fr: "Choisir la piece hero",
            },
          },
          {
            type: "p",
            text: {
              en: "Find the main piece first. Once you have it, matching the rest is easier and more affordable.",
              fr: "Trouve la piece principale d'abord. Une fois acquise, le reste devient plus simple et souvent plus accessible.",
            },
          },
          {
            type: "h2",
            text: {
              en: "Match shape before color",
              fr: "Matcher la forme avant la couleur",
            },
          },
          {
            type: "p",
            text: {
              en: "Silhouette creates the vibe. Nail the shape first, then pick colors that fit your palette.",
              fr: "La silhouette donne le vibe. Trouve la bonne forme, puis choisis les couleurs qui matchent ta palette.",
            },
          },
          {
            type: "h2",
            text: {
              en: "Use accessories to lock in the vibe",
              fr: "Utiliser les accessoires pour verrouiller le style",
            },
          },
          {
            type: "ul",
            items: {
              en: [
                "Belt or bag to echo the hero color.",
                "Shoes to balance proportions.",
                "Jewelry to finish the look without overdoing it.",
              ],
              fr: [
                "Ceinture ou sac pour rappeler la couleur principale.",
                "Chaussures pour equilibrer les proportions.",
                "Bijoux pour finir le look sans en faire trop.",
              ],
            },
          },
        ],
      },
    },
  },
];

function getLocalizedContent(
  post: BlogPost,
  locale: Locale
): BlogContent {
  return post.content[locale] ?? post.content.en;
}

export function getBlogPostByLocale(
  slug: string,
  locale: Locale
): LocalizedBlogPost | undefined {
  const post = blogPosts.find((item) => item.slug === slug);
  if (!post) return undefined;
  return { slug: post.slug, date: post.date, ...getLocalizedContent(post, locale) };
}

export function getAllBlogPosts(locale: Locale): LocalizedBlogPost[] {
  return [...blogPosts]
    .map((post) => ({
      slug: post.slug,
      date: post.date,
      ...getLocalizedContent(post, locale),
    }))
    .sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
}

export function getBlogPostSlugs(): string[] {
  return blogPosts.map((post) => post.slug);
}

export function getBlogPostEntries(): Array<{ slug: string; date: string }> {
  return blogPosts
    .map((post) => ({ slug: post.slug, date: post.date }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
