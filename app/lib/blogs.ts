export interface BlogPost {
  id: number;
  slug: string;
  titleEn: string;
  titleAr: string;
  image: string;
  contentEn: string;
  contentAr: string;
}

export const blogPosts: BlogPost[] = [
  {
    id: 1,
    slug: "crunchy-peanut-butter",
    titleEn: "The Art of Crunchy Peanut Butter",
    titleAr: "فن زبدة الفول السوداني الكرنشي",
    image: "/products/crunchy.jpg",
    contentEn: `There's something undeniably satisfying about biting into a spoonful of crunchy peanut butter. The way those perfectly roasted peanut pieces break apart between your teeth, releasing waves of toasted, nutty flavor — it's an experience that creamy simply can't replicate.

At Mood, our Crunchy Peanut Butter is crafted from hand-selected, premium-grade peanuts sourced from the finest farms. Each batch is slow-roasted at precisely controlled temperatures to bring out the deepest, most complex flavors. We then blend the smooth base with generously sized peanut chunks, creating that signature Mood crunch that our customers have come to love.

What sets Mood's crunchy apart from the competition? It starts with our commitment to quality. We use no artificial preservatives, no hydrogenated oils, and no unnecessary fillers. Every jar contains nothing but real peanuts, a touch of salt, and that irresistible texture. The result is a product that tastes homemade — because in many ways, it is.

Crunchy peanut butter isn't just a spread; it's a lifestyle choice. Health-conscious consumers appreciate its higher fiber content compared to creamy varieties, thanks to those whole peanut pieces. Each serving delivers a powerful punch of plant-based protein, healthy fats, and essential vitamins and minerals including Vitamin E, magnesium, and potassium.

Whether you're spreading it on warm toast in the morning, blending it into a post-workout smoothie, or using it as the base for a rich satay sauce, Mood Crunchy Peanut Butter elevates every dish it touches. It's the perfect companion for athletes, busy professionals, and anyone who refuses to compromise on taste or nutrition.

Our 300g jar is designed for convenience without sacrificing freshness. The resealable lid locks in flavor and aroma, ensuring that every spoonful is as perfect as the first. And with Mood's distinctive premium packaging, it looks just as good on your kitchen shelf as it tastes on your plate.

Join the thousands of satisfied customers who have made Mood Crunchy their go-to peanut butter. Once you try it, there's no going back.`,
    contentAr: `هناك شيء مُرضٍ بشكل لا يمكن إنكاره في تذوق ملعقة من زبدة الفول السوداني الكرنشي. الطريقة التي تتفتت بها قطع الفول السوداني المحمصة بشكل مثالي بين أسنانك، مطلقةً موجات من النكهة المحمصة الغنية — إنها تجربة لا يمكن لزبدة الفول السوداني الكريمي أن تكررها.

في موود، يتم تصنيع زبدة الفول السوداني الكرنشي من فول سوداني مختار يدويًا من أفضل المزارع. يتم تحميص كل دفعة ببطء عند درجات حرارة مضبوطة بدقة لاستخراج أعمق وأغنى النكهات. ثم نمزج القاعدة الناعمة مع قطع فول سوداني كبيرة بسخاء، مما يخلق تلك القرمشة المميزة من موود التي أحبها عملاؤنا.

ما الذي يميز كرنشي موود عن المنافسين؟ يبدأ الأمر بالتزامنا بالجودة. لا نستخدم مواد حافظة اصطناعية، ولا زيوت مهدرجة، ولا حشوات غير ضرورية. كل برطمان يحتوي فقط على فول سوداني حقيقي، ولمسة من الملح، وتلك القوام الذي لا يقاوم. النتيجة هي منتج يبدو محلي الصنع — لأنه في كثير من النواحي، كذلك فعلاً.

زبدة الفول السوداني الكرنشي ليست مجرد دهان؛ إنها أسلوب حياة. يقدّر المستهلكون المهتمون بصحتهم محتواها العالي من الألياف مقارنة بالأنواع الكريمية، بفضل قطع الفول السوداني الكاملة. كل حصة تقدم جرعة قوية من البروتين النباتي والدهون الصحية والفيتامينات والمعادن الأساسية بما في ذلك فيتامين E والمغنيسيوم والبوتاسيوم.

سواء كنت تدهنها على خبز محمص دافئ في الصباح، أو تمزجها في سموذي بعد التمرين، أو تستخدمها كقاعدة لصلصة ساتيه غنية، فإن زبدة فول سوداني كرنشي من موود ترتقي بكل طبق تلمسه. إنها الرفيق المثالي للرياضيين والمحترفين المشغولين وأي شخص يرفض التنازل عن الطعم أو التغذية.

برطمان 300 جرام مصمم للراحة دون التضحية بالنضارة. الغطاء القابل لإعادة الإغلاق يحافظ على النكهة والرائحة، مما يضمن أن كل ملعقة مثالية مثل الأولى. ومع عبوة موود الفاخرة المميزة، يبدو رائعًا على رف مطبخك كما يبدو على طبقك.

انضم إلى آلاف العملاء الراضين الذين جعلوا موود كرنشي زبدة الفول السوداني المفضلة لديهم. بمجرد أن تجربها، لن تعود إلى غيرها.`,
  },
  {
    id: 2,
    slug: "creamy-peanut-butter",
    titleEn: "Creamy Peanut Butter: Smooth Perfection",
    titleAr: "زبدة الفول السوداني الكريمي: نعومة مثالية",
    image: "/products/creamy.jpg",
    contentEn: `Smooth, velvety, and utterly irresistible — Mood Creamy Peanut Butter is the gold standard of what premium peanut butter should be. From the moment you twist open the jar, the rich, toasted aroma tells you this is something special.

Our creamy variety starts with the same meticulously sourced peanuts that define all Mood products. But the magic lies in our proprietary grinding process. We mill the roasted peanuts through multiple stages, each one refining the texture further until we achieve that signature silk-smooth consistency. No graininess, no oil separation — just pure, spreadable perfection.

The versatility of Mood Creamy is truly unmatched. It glides effortlessly across bread, melts beautifully into warm oatmeal, and blends seamlessly into smoothies and shakes. Bakers love it for its consistent texture in cookies, brownies, and energy balls. Home chefs rely on it for everything from Asian-inspired noodle sauces to decadent dessert drizzles.

But Mood Creamy isn't just about taste — it's about nutrition that you can feel good about. Each serving packs 7 grams of plant-based protein and a healthy dose of monounsaturated fats, the same heart-friendly fats found in olive oil and avocados. It's naturally gluten-free and contains no added sugars, making it suitable for a wide range of dietary preferences.

We believe that premium quality shouldn't come with a premium price tag that puts it out of reach. Mood Creamy Peanut Butter delivers world-class quality at a price that makes it an everyday staple, not an occasional luxury. Our 300g jar is the perfect size for individuals and couples, while our larger Family Jar caters to households that go through peanut butter like there's no tomorrow.

The packaging itself reflects the Mood philosophy: clean, modern, and unapologetically premium. When you place a jar of Mood on your table, you're making a statement about the quality you expect from the food you eat.

Discover why Mood Creamy has become the preferred choice for peanut butter lovers across Egypt and beyond. Your taste buds will thank you.`,
    contentAr: `ناعمة، مخملية، ولا تقاوم تمامًا — زبدة الفول السوداني الكريمي من موود هي المعيار الذهبي لما يجب أن تكون عليه زبدة الفول السوداني الفاخرة. من لحظة فتح البرطمان، تخبرك الرائحة الغنية المحمصة أن هذا شيء مميز.

تبدأ نوعيتنا الكريمية بنفس الفول السوداني المختار بعناية الذي يحدد جميع منتجات موود. لكن السحر يكمن في عملية الطحن الخاصة بنا. نطحن الفول السوداني المحمص عبر مراحل متعددة، كل منها ينقّح القوام أكثر حتى نحقق تلك النعومة الحريرية المميزة. لا حبيبات، لا انفصال للزيت — فقط كمال خالص قابل للدهن.

تعدد استخدامات موود كريمي لا مثيل له حقًا. تنزلق بسهولة على الخبز، وتذوب بشكل جميل في الشوفان الدافئ، وتمتزج بسلاسة في السموذي والميلك شيك. يحبها الخبازون لقوامها المتسق في الكوكيز والبراونيز وكرات الطاقة. يعتمد عليها الطهاة المنزليون في كل شيء من صلصات النودلز الآسيوية إلى تزيين الحلويات الفاخرة.

لكن موود كريمي لا تتعلق فقط بالطعم — إنها تتعلق بالتغذية التي يمكنك أن تشعر بالرضا تجاهها. كل حصة تحتوي على 7 جرامات من البروتين النباتي وجرعة صحية من الدهون الأحادية غير المشبعة، نفس الدهون الصديقة للقلب الموجودة في زيت الزيتون والأفوكادو. خالية من الغلوتين بشكل طبيعي ولا تحتوي على سكريات مضافة، مما يجعلها مناسبة لمجموعة واسعة من التفضيلات الغذائية.

نؤمن بأن الجودة الفاخرة لا يجب أن تأتي بسعر فاخر يضعها بعيدًا عن المتناول. زبدة الفول السوداني الكريمي من موود تقدم جودة عالمية بسعر يجعلها عنصرًا أساسيًا يوميًا وليس رفاهية عرضية. برطمان 300 جرام هو الحجم المثالي للأفراد والأزواج، بينما العبوة العائلية الأكبر تلبي احتياجات المنازل التي تستهلك زبدة الفول السوداني بكثرة.

العبوة نفسها تعكس فلسفة موود: نظيفة، عصرية، وفاخرة بلا اعتذار. عندما تضع برطمان موود على طاولتك، فأنت تعبر عن الجودة التي تتوقعها من الطعام الذي تأكله.

اكتشف لماذا أصبحت موود كريمي الخيار المفضل لمحبي زبدة الفول السوداني في مصر وخارجها. براعم تذوقك ستشكرك.`,
  },
  {
    id: 3,
    slug: "chocolate-peanut-butter",
    titleEn: "Chocolate Peanut Butter: A Richer Indulgence",
    titleAr: "زبدة الفول السوداني بالشوكولاتة: متعة أغنى",
    image: "/products/chocolate.jpg",
    contentEn: `What happens when you combine the rich, roasted depth of premium peanut butter with the luxurious sweetness of real chocolate? You get Mood Chocolate Peanut Butter — a jar of pure indulgence that proves healthy eating doesn't have to be boring.

This isn't your average chocolate-flavored spread. We start with our signature slow-roasted peanut base, then fold in high-quality cocoa that adds layers of deep, bittersweet complexity. The balance is deliberate: enough chocolate to satisfy your sweet tooth, but not so much that it overwhelms the natural peanut flavor. It's a harmony of two beloved flavors, each one enhancing the other.

The result is a spread that works brilliantly in ways you might not expect. Spread it on banana slices for a quick, nutritious snack. Swirl it into Greek yogurt for a dessert-like breakfast that's actually good for you. Use it as a dip for apple slices or celery sticks. Or simply enjoy it straight from the jar — we won't judge.

From a nutritional standpoint, Mood Chocolate Peanut Butter holds its own against any competitor. We use real cocoa, not artificial chocolate flavoring. The natural antioxidants in cocoa, combined with the protein and healthy fats from peanuts, create a genuinely nutritious indulgence. Each serving delivers substantial protein along with iron, magnesium, and a satisfying dose of mood-boosting compounds naturally present in cocoa.

Our customers tell us that Mood Chocolate is their secret weapon for getting kids to eat healthier. When it looks and tastes like a treat but delivers real nutrition, everybody wins. Parents love that they can spread it on whole-wheat toast or mix it into overnight oats, knowing their children are getting quality fuel for their day.

The 300g jar features the same premium packaging and resealable freshness lock as all Mood products. It's trending among our customers for good reason — once you discover this flavor, it quickly becomes a pantry essential.

Mood Chocolate Peanut Butter: because the best things in life are meant to be savored.`,
    contentAr: `ماذا يحدث عندما تجمع بين العمق الغني المحمص لزبدة الفول السوداني الفاخرة وحلاوة الشوكولاتة الحقيقية الفاخرة؟ تحصل على زبدة الفول السوداني بالشوكولاتة من موود — برطمان من المتعة الخالصة يثبت أن الأكل الصحي لا يجب أن يكون مملاً.

هذا ليس دهان شوكولاتة عادي. نبدأ بقاعدة الفول السوداني المحمص ببطء المميزة لدينا، ثم نضيف كاكاو عالي الجودة يضيف طبقات من التعقيد العميق والمرّ الحلو. التوازن مقصود: شوكولاتة كافية لإرضاء رغبتك في الحلو، لكن ليس بالقدر الذي يطغى على نكهة الفول السوداني الطبيعية. إنه تناغم بين نكهتين محبوبتين، كل واحدة تعزز الأخرى.

النتيجة هي دهان يعمل بشكل رائع بطرق قد لا تتوقعها. ادهنه على شرائح الموز لوجبة خفيفة سريعة ومغذية. اخلطه مع الزبادي اليوناني لفطور يشبه الحلوى لكنه مفيد لك فعلاً. استخدمه كغموس لشرائح التفاح أو أعواد الكرفس. أو ببساطة استمتع به مباشرة من البرطمان — لن نحكم عليك.

من الناحية الغذائية، زبدة الفول السوداني بالشوكولاتة من موود تصمد أمام أي منافس. نستخدم كاكاو حقيقي وليس نكهة شوكولاتة اصطناعية. مضادات الأكسدة الطبيعية في الكاكاو، مع البروتين والدهون الصحية من الفول السوداني، تخلق متعة مغذية حقًا. كل حصة تقدم بروتين كبير مع الحديد والمغنيسيوم وجرعة مرضية من المركبات المعززة للمزاج الموجودة طبيعيًا في الكاكاو.

يخبرنا عملاؤنا أن موود شوكولاتة هي سلاحهم السري لجعل الأطفال يأكلون بشكل أصح. عندما يبدو ويتذوق كحلوى لكنه يقدم تغذية حقيقية، الجميع يفوز. يحب الآباء أنهم يمكنهم دهنه على خبز القمح الكامل أو خلطه في الشوفان، مع علمهم أن أطفالهم يحصلون على وقود عالي الجودة ليومهم.

برطمان 300 جرام يتميز بنفس العبوة الفاخرة وقفل النضارة القابل لإعادة الإغلاق مثل جميع منتجات موود. إنه رائج بين عملائنا لسبب وجيه — بمجرد أن تكتشف هذه النكهة، تصبح بسرعة عنصرًا أساسيًا في مخزنك.

زبدة الفول السوداني بالشوكولاتة من موود: لأن أفضل الأشياء في الحياة يجب أن تُستمتع بها.`,
  },
  {
    id: 4,
    slug: "family-jar",
    titleEn: "The Family Jar: Made for Daily Moments",
    titleAr: "العبوة العائلية: صُنعت للحظات اليومية",
    image: "/products/family.jpg",
    contentEn: `In every Egyptian household, there are certain staples that never run out — and Mood's Family Jar is designed to be one of them. At a generous 1 kilogram, this jar is built for families who know that great peanut butter is more than a spread; it's the foundation of countless meals, snacks, and shared moments.

The Family Jar contains the same premium creamy peanut butter that has made Mood a trusted name, just in a size that keeps up with your family's appetite. No more rationing spoonfuls or worrying about running out mid-week. With a full kilogram at your disposal, you're free to be generous — generous with your toast, generous with your recipes, and generous with your kids' lunchboxes.

Think about a typical week in a busy household. Monday morning: thick peanut butter on warm bread with sliced bananas. Tuesday's after-school snack: apple slices with a big scoop of Mood. Wednesday dinner: a stir-fry with peanut sauce that the whole family loves. Thursday: energy balls for the gym bag. Friday: weekend pancakes drizzled with melted peanut butter. The Family Jar handles all of it without breaking a sweat.

From an economic perspective, the Family Jar represents exceptional value. The per-gram cost is significantly lower than our 300g jars, making it the smart choice for regular consumers. Why pay more for less when you can stock up with Mood's most popular family size?

Quality never takes a backseat to quantity at Mood. The 1kg Family Jar undergoes the same rigorous quality controls as every other product in our range. The same premium peanuts, the same careful roasting process, the same commitment to zero artificial additives. The only difference is that there's more of it to enjoy.

The jar itself is designed with families in mind. The wide mouth makes it easy to scoop out generous portions, and the sturdy construction means it can handle the daily open-close cycle of a busy kitchen. The resealable lid ensures freshness from the first scoop to the last.

Make Mood's Family Jar a permanent fixture in your kitchen. Your family deserves it.`,
    contentAr: `في كل بيت مصري، هناك أساسيات معينة لا تنفد أبدًا — وعبوة موود العائلية مصممة لتكون واحدة منها. بوزن سخي يبلغ كيلوغرام واحد، هذا البرطمان مصنوع للعائلات التي تعرف أن زبدة الفول السوداني الرائعة هي أكثر من مجرد دهان؛ إنها أساس وجبات لا حصر لها ووجبات خفيفة ولحظات مشتركة.

تحتوي العبوة العائلية على نفس زبدة الفول السوداني الكريمية الفاخرة التي جعلت موود اسمًا موثوقًا، فقط بحجم يواكب شهية عائلتك. لا مزيد من تقنين الملاعق أو القلق من نفاد المنتج في منتصف الأسبوع. مع كيلوغرام كامل تحت تصرفك، أنت حر في أن تكون سخيًا — سخيًا مع خبزك المحمص، سخيًا مع وصفاتك، وسخيًا مع علب غداء أطفالك.

فكر في أسبوع عادي في منزل مشغول. صباح الإثنين: زبدة فول سوداني كثيفة على خبز دافئ مع شرائح الموز. وجبة الثلاثاء بعد المدرسة: شرائح تفاح مع مغرفة كبيرة من موود. عشاء الأربعاء: ستير فراي بصلصة الفول السوداني التي تحبها العائلة كلها. الخميس: كرات الطاقة لحقيبة الجيم. الجمعة: بانكيك عطلة نهاية الأسبوع مع زبدة فول سوداني ذائبة. العبوة العائلية تتعامل مع كل هذا بسهولة.

من الناحية الاقتصادية، تمثل العبوة العائلية قيمة استثنائية. تكلفة الجرام أقل بشكل ملحوظ من برطمانات 300 جرام، مما يجعلها الخيار الذكي للمستهلكين المنتظمين. لماذا تدفع أكثر مقابل أقل عندما يمكنك التخزين بحجم موود العائلي الأكثر شعبية؟

الجودة لا تأخذ المقعد الخلفي أبدًا أمام الكمية في موود. تخضع العبوة العائلية بوزن كيلو لنفس ضوابط الجودة الصارمة مثل كل منتج آخر في مجموعتنا. نفس الفول السوداني الفاخر، نفس عملية التحميص الدقيقة، نفس الالتزام بعدم وجود إضافات اصطناعية. الفرق الوحيد هو أن هناك المزيد منه للاستمتاع.

البرطمان نفسه مصمم مع مراعاة العائلات. الفتحة الواسعة تسهل غرف حصص سخية، والبناء المتين يعني أنه يمكنه التعامل مع دورة الفتح والإغلاق اليومية لمطبخ مشغول. الغطاء القابل لإعادة الإغلاق يضمن النضارة من أول مغرفة حتى آخرها.

اجعل عبوة موود العائلية عنصرًا دائمًا في مطبخك. عائلتك تستحق ذلك.`,
  },
  {
    id: 5,
    slug: "diet-peanut-butter",
    titleEn: "Diet Peanut Butter: Fuel Your Goals",
    titleAr: "زبدة الفول السوداني دايت: وقود لأهدافك",
    image: "/products/diet.jpg",
    contentEn: `Fitness enthusiasts and health-conscious eaters, rejoice. Mood Diet Peanut Butter was created specifically for you — a product that delivers maximum nutrition with minimum compromise. Low in sugar, high in protein, and packed with the clean energy your body craves.

The fitness community has long recognized peanut butter as a nutritional powerhouse, but not all peanut butters are created equal. Many commercial brands load their products with added sugars, palm oil, and unnecessary additives that counteract the natural benefits. Mood Diet takes the opposite approach: we strip away everything your body doesn't need and amplify everything it does.

Each serving of Mood Diet Peanut Butter delivers a concentrated dose of plant-based protein — the building blocks your muscles need for recovery and growth. The healthy fats provide sustained energy that won't spike your blood sugar, making it an ideal pre-workout fuel or post-workout recovery food. And because it's naturally low in carbohydrates, it fits seamlessly into keto, paleo, and low-carb dietary frameworks.

But here's what truly sets Mood Diet apart: it actually tastes good. Too many "diet" products sacrifice flavor on the altar of nutrition, leaving you with something that feels like a punishment rather than a reward. We refused to make that tradeoff. Mood Diet Peanut Butter is rich, satisfying, and genuinely delicious — proof that eating well doesn't mean eating boring.

Our customers include competitive athletes, weekend warriors, fitness influencers, and everyday people who simply want to make better food choices. They all share one thing in common: once they've tried Mood Diet, they never go back to sugar-laden alternatives.

The 300g jar is perfectly portioned for meal prep. Many of our customers measure out their daily servings at the start of the week, incorporating Mood Diet into their macro-tracking routines. The consistent nutritional profile makes it easy to plan your intake with precision.

Whether you're cutting, bulking, or maintaining, Mood Diet Peanut Butter is the smart, delicious choice that supports your goals without asking you to sacrifice the foods you love. Fuel your ambition with every spoonful.`,
    contentAr: `عشاق اللياقة والمهتمون بصحتهم، ابتهجوا. زبدة الفول السوداني دايت من موود صُنعت خصيصًا لكم — منتج يقدم أقصى تغذية بأقل تنازل. قليلة السكر، عالية البروتين، ومليئة بالطاقة النظيفة التي يحتاجها جسمك.

لطالما اعترف مجتمع اللياقة البدنية بزبدة الفول السوداني كقوة غذائية، لكن ليست كل أنواع زبدة الفول السوداني متساوية. العديد من العلامات التجارية تحشو منتجاتها بالسكريات المضافة وزيت النخيل والإضافات غير الضرورية التي تلغي الفوائد الطبيعية. موود دايت تتبع النهج المعاكس: نزيل كل ما لا يحتاجه جسمك ونعزز كل ما يحتاجه.

كل حصة من زبدة الفول السوداني دايت من موود تقدم جرعة مركزة من البروتين النباتي — اللبنات الأساسية التي تحتاجها عضلاتك للتعافي والنمو. الدهون الصحية توفر طاقة مستدامة لن ترفع مستوى السكر في الدم، مما يجعلها وقودًا مثاليًا قبل التمرين أو طعام تعافي بعد التمرين. ولأنها منخفضة الكربوهيدرات بشكل طبيعي، فهي تندمج بسلاسة في أنظمة الكيتو والباليو والأنظمة منخفضة الكربوهيدرات.

لكن ما يميز موود دايت حقًا: إنها لذيذة فعلاً. الكثير من منتجات "الدايت" تضحي بالنكهة على مذبح التغذية، تاركة إياك مع شيء يبدو كعقاب بدلاً من مكافأة. رفضنا إجراء تلك المقايضة. زبدة الفول السوداني دايت من موود غنية ومشبعة ولذيذة حقًا — دليل على أن الأكل الجيد لا يعني الأكل الممل.

عملاؤنا يشملون رياضيين تنافسيين ومحاربي عطلات نهاية الأسبوع ومؤثري اللياقة البدنية وأشخاص عاديين يريدون ببساطة اتخاذ خيارات غذائية أفضل. جميعهم يشتركون في شيء واحد: بمجرد أن جربوا موود دايت، لم يعودوا أبدًا للبدائل المحملة بالسكر.

برطمان 300 جرام مقسم بشكل مثالي لتحضير الوجبات. العديد من عملائنا يقيسون حصصهم اليومية في بداية الأسبوع، مدمجين موود دايت في روتين تتبع الماكرو الخاص بهم. الملف الغذائي المتسق يجعل من السهل تخطيط استهلاكك بدقة.

سواء كنت في مرحلة التنشيف أو التضخيم أو الحفاظ، زبدة الفول السوداني دايت من موود هي الخيار الذكي واللذيذ الذي يدعم أهدافك دون أن يطلب منك التضحية بالأطعمة التي تحبها. غذِّ طموحك مع كل ملعقة.`,
  },
  {
    id: 6,
    slug: "honey-roasted",
    titleEn: "Honey Roasted: Nature's Perfect Pairing",
    titleAr: "محمص بالعسل: التناغم المثالي من الطبيعة",
    image: "/products/honey.jpg",
    contentEn: `Some flavor combinations are so natural, so inherently perfect, that they feel like they were always meant to exist together. Peanut butter and honey is one of those combinations, and Mood Honey Roasted takes it to an entirely new level of sophistication.

We begin with our premium peanuts, already exceptional on their own, and introduce them to pure, natural honey during the roasting process. This isn't a post-production drizzle or an artificial honey flavoring — the honey actually participates in the roasting itself, caramelizing around each peanut and creating a depth of flavor that simply cannot be replicated any other way.

The result is extraordinary. The first thing you'll notice is the aroma: warm, sweet, and deeply inviting, with notes of caramel and toasted nuts that fill your kitchen the moment you open the jar. Then comes the taste — a perfect wave that starts with the familiar richness of roasted peanuts, transitions through a golden honey sweetness, and finishes with a subtle complexity that keeps you reaching for more.

Mood Honey Roasted occupies a unique position in our range. It's indulgent enough to satisfy a sweet craving, yet natural enough to remain a genuinely healthy choice. The honey provides natural sweetness without the blood sugar spike of refined sugars, while also contributing its own impressive nutritional profile including natural enzymes, antioxidants, and antibacterial properties.

This variety has become a particular favorite among our customers who enjoy peanut butter as a breakfast staple. Paired with warm, freshly baked bread or drizzled over a stack of fluffy pancakes, Mood Honey Roasted transforms an ordinary morning into something memorable. It's also exceptional when paired with cheese boards — the sweet-savory combination is a revelation.

At 300g, each jar is crafted to deliver consistent flavor from first to last. Our premium packaging protects the delicate honey-roasted notes, ensuring that every experience matches the one before it.

Mood Honey Roasted: where premium peanut butter meets the golden gift of nature. Taste the difference that real honey makes.`,
    contentAr: `بعض تركيبات النكهات طبيعية جدًا، مثالية بطبيعتها، لدرجة أنها تبدو وكأنها كانت مقدرة دائمًا أن تكون معًا. زبدة الفول السوداني والعسل هي واحدة من تلك التركيبات، وموود محمص بالعسل يأخذها إلى مستوى جديد تمامًا من الرقي.

نبدأ بفول سوداني فاخر، استثنائي بالفعل بمفرده، ونقدمه للعسل الطبيعي النقي أثناء عملية التحميص. هذا ليس رذاذ عسل بعد الإنتاج أو نكهة عسل اصطناعية — العسل يشارك فعليًا في التحميص نفسه، يتكرمل حول كل حبة فول سوداني ويخلق عمقًا في النكهة لا يمكن ببساطة تكراره بأي طريقة أخرى.

النتيجة استثنائية. أول شيء ستلاحظه هو الرائحة: دافئة، حلوة، وجذابة بعمق، مع نوتات الكراميل والمكسرات المحمصة التي تملأ مطبخك لحظة فتح البرطمان. ثم يأتي الطعم — موجة مثالية تبدأ بالغنى المألوف للفول السوداني المحمص، وتنتقل عبر حلاوة العسل الذهبية، وتنتهي بتعقيد خفي يجعلك تمد يدك للمزيد.

يحتل موود محمص بالعسل موقعًا فريدًا في مجموعتنا. إنه ممتع بما يكفي لإرضاء الرغبة في الحلو، ومع ذلك طبيعي بما يكفي ليبقى خيارًا صحيًا حقيقيًا. العسل يوفر حلاوة طبيعية دون ارتفاع السكر في الدم الذي تسببه السكريات المكررة، بينما يساهم أيضًا بملفه الغذائي الرائع بما في ذلك الإنزيمات الطبيعية ومضادات الأكسدة والخصائص المضادة للبكتيريا.

أصبح هذا النوع المفضل بشكل خاص بين عملائنا الذين يستمتعون بزبدة الفول السوداني كعنصر أساسي في الإفطار. مقترنة بالخبز الدافئ الطازج أو مرشوشة فوق كومة من البانكيك الهش، تحول موود محمص بالعسل صباحًا عاديًا إلى شيء لا يُنسى. كما أنها استثنائية عند مقارنتها بأطباق الجبن — المزيج الحلو-المالح هو اكتشاف.

بوزن 300 جرام، كل برطمان مصنوع لتقديم نكهة متسقة من الأول إلى الآخر. عبوتنا الفاخرة تحمي نوتات العسل المحمص الرقيقة، مما يضمن أن كل تجربة تطابق التي قبلها.

موود محمص بالعسل: حيث تلتقي زبدة الفول السوداني الفاخرة مع هدية الطبيعة الذهبية. تذوق الفرق الذي يصنعه العسل الحقيقي.`,
  },
  {
    id: 7,
    slug: "chocolate-hazelnut-spread",
    titleEn: "Chocolate Hazelnut Spread: Beyond Ordinary",
    titleAr: "شوكولاتة بالبندق: أبعد من العادي",
    image: "/products/chocolate-350g.jpg",
    contentEn: `The world didn't need another chocolate hazelnut spread. It needed a better one. Enter Mood Chocolate Hazelnut Spread — a 350g jar of pure excellence that redefines what this beloved category can be.

While other brands rely heavily on sugar and palm oil to create their spreads, Mood takes the road less traveled. Our recipe starts with real hazelnuts, carefully roasted to bring out their natural sweetness and distinctive aroma. We then combine them with premium cocoa and a measured amount of natural sweeteners, creating a spread that tastes like it was made in a European chocolatier's workshop.

The texture is where Mood Chocolate Hazelnut truly shines. It's impossibly smooth — a velvety ribbon of chocolate and hazelnut that melts on contact with warm bread. Yet it's substantial enough to hold its shape when used as a filling for pastries, a topping for ice cream, or a core ingredient in chocolate truffles. This versatility is what makes it a favorite among both casual consumers and serious home bakers.

Let's talk about what's NOT in our spread. No palm oil. No artificial flavors. No excessive sugar. We believe that when you use quality ingredients, you don't need to mask them with additives. The natural flavors of roasted hazelnuts and real cocoa speak for themselves, creating a taste experience that's richer and more complex than anything you'll find in a mass-market spread.

At 350g, the jar size hits a sweet spot — generous enough for regular use, yet perfectly sized to ensure you always enjoy it at its freshest. The slightly larger format compared to our standard 300g reflects the premium positioning of this product: it's a little extra of something extraordinary.

Mood Chocolate Hazelnut Spread has become a breakfast table staple for families across Egypt. Children love it on crepes and toast, while parents appreciate knowing they're serving a product made with real ingredients and genuine care.

Elevate your spread game. Mood Chocolate Hazelnut is waiting.`,
    contentAr: `العالم لم يكن بحاجة إلى شوكولاتة بندق أخرى. كان بحاجة إلى واحدة أفضل. تقدم شوكولاتة موود بالبندق — برطمان 350 جرام من التميز الخالص يعيد تعريف ما يمكن أن تكونه هذه الفئة المحبوبة.

بينما تعتمد العلامات التجارية الأخرى بشكل كبير على السكر وزيت النخيل لصنع منتجاتها، تسلك موود الطريق الأقل سلوكًا. وصفتنا تبدأ ببندق حقيقي، محمص بعناية لإبراز حلاوته الطبيعية ورائحته المميزة. ثم نجمعها مع كاكاو فاخر وكمية محسوبة من المحليات الطبيعية، مما يخلق منتجًا يبدو وكأنه صُنع في ورشة صانع شوكولاتة أوروبي.

القوام هو حيث تتألق شوكولاتة موود بالبندق حقًا. ناعمة بشكل لا يصدق — شريط مخملي من الشوكولاتة والبندق يذوب عند ملامسة الخبز الدافئ. ومع ذلك فهي متماسكة بما يكفي للحفاظ على شكلها عند استخدامها كحشوة للمعجنات، أو توبينج للآيس كريم، أو مكون أساسي في ترافل الشوكولاتة. هذا التنوع هو ما يجعلها المفضلة بين المستهلكين العاديين والخبازين المنزليين الجادين.

دعونا نتحدث عما ليس في منتجنا. لا زيت نخيل. لا نكهات اصطناعية. لا سكر مفرط. نؤمن بأنه عندما تستخدم مكونات عالية الجودة، لا تحتاج إلى إخفائها بالإضافات. النكهات الطبيعية للبندق المحمص والكاكاو الحقيقي تتحدث عن نفسها، مما يخلق تجربة طعم أغنى وأكثر تعقيدًا من أي شيء ستجده في منتج سوقي.

بوزن 350 جرام، حجم البرطمان يصيب المكان المثالي — سخي بما يكفي للاستخدام المنتظم، ومع ذلك بحجم مثالي لضمان أنك تستمتع به دائمًا في أطزج حالاته. الحجم الأكبر قليلاً مقارنة بمعيارنا 300 جرام يعكس التموضع الفاخر لهذا المنتج: إنه قليل من الإضافي من شيء استثنائي.

أصبحت شوكولاتة موود بالبندق عنصرًا أساسيًا على طاولة الإفطار للعائلات في مصر. يحبها الأطفال على الكريب والتوست، بينما يقدر الآباء معرفتهم أنهم يقدمون منتجًا مصنوعًا بمكونات حقيقية وعناية حقيقية.

ارتقِ بمستوى الدهان الخاص بك. شوكولاتة موود بالبندق في انتظارك.`,
  },
];

export function getBlogBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((b) => b.slug === slug);
}
