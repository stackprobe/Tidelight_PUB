# 和風ファンタジー版・画像生成指示

制作方法はすべて内蔵 ImageGen。立ち絵は透過指定。通常絵は各1点、表情差分はミオの通常絵を編集する形で生成。以下は使用した最終プロンプト。生成元は Codex の当該チャットの generated_images に残し、ゲームには規格寸法に整えた画像のみ配置する。

## ミオ・通常

参照画像なし。保存先 `DocRoot/images/mio-normal.png`。

```text
Use case: illustration-story. Final transparent PNG full-body visual-novel sprite, one character, Japanese coastal fantasy. MIO, 20 year old female apprentice keeper of the return-fire shrine beacon, gentle determined neutral expression, short dark brown bob, brown eyes. Japanese kosode ivory kimono, muted sea-green short haori, dark indigo hakama skirt, plain tabi and straw sandals, brass beacon key on a cord at waist. Soft watercolor and fine textured pencil linework, restrained anime face, warm muted natural colors, polished storybook rendering. STRICT anatomy: natural SEVEN AND A HALF HEADS tall, modest head size, slender young adult proportions, no chibi, entire body from crown to sandals visible. Standing upright, shoulders relaxed, hands lightly together at waist, almost frontal view. Narrow portrait canvas, character centered, crown at 3% of canvas height, sandal soles at 98%, complete silhouette and hands, nothing cropped. Genuine transparent background, NO painted background, no gradient, no floor, no glow, no cast shadow beyond character, no lettering. This is a redesigned game character for a Japanese fantasy port, not European costume. Output large portrait at least 1024 pixels tall.
```

## レン・通常

新ミオを画風・体格の参照に使用。保存先 `DocRoot/images/ren-normal.png`。

```text
Use case illustration-story. Generate one NEW full-body transparent visual novel sprite of REN, a young adult male tide-chart surveyor in a Japanese coastal fantasy. Supplied Mio sprite is STYLE, SCALE AND PROPORTIONS REFERENCE: match exactly watercolor pencil rendering, adult head-to-body ratio about 7 to 7.5 heads, same head size at same image height, crown and feet alignment. Do not copy female face or outfit. Ren, 22, slim young man with short slightly tousled ash brown hair, gentle observant gray brown eyes, calm neutral expression. Cream Japanese kosode, sleeveless indigo haori, practical brown hakama trousers, tied tabi and straw sandals. Closed washi chart folio under left arm, small brass compass tied to obi, free hand relaxed. Entire body head to sandals, near frontal standing, crown at 3% height soles at 98%, centered with transparent side margins. Restrained detailed watercolor fantasy illustration. Genuine transparent alpha, NO background, NO floor, NO gradients, NO glow, no letters, no European shirt/vest/trousers/boots. Match reference's anatomical scale rather than making a smaller head or a taller elongated body.
```

## サヨ・通常

新ミオ・新レンを参照。保存先 `DocRoot/images/sayo-normal.png`。

```text
Use case illustration-story. Create new full-body transparent game sprite, SAYO, female 23-year-old keeper of a coastal shrine's homecoming-message registry in a Japanese fantasy port. The two supplied images are style and proportion references only. Same watercolor and pencil style, subdued warm palette, EXACT same adult head size and head-to-body ratio (about seven heads tall) and same crown and sandal baseline. Distinct identity: long charcoal-black hair tied into a single low braid over right shoulder, muted plum eyes, composed friendly expression with a hint of dry humor. Wears pale cream Japanese kosode, muted dusty plum haori, charcoal hakama skirt, tabi and straw sandals. Carries a small bundle of wooden NAME TAGS tied with pale red thread, tiny bell at obi, no readable text. Hands calmly holding tags at waist. Full-body almost front standing silhouette, crown at 3% of canvas height and sandal soles at 98%, centered. No enormous sleeves, no weapons, no extravagant ornamentation. GENUINELY TRANSPARENT alpha background, no backdrop, no gradient, no floor, no outer glow or painted shadow, no typography. Match the references' rendering and natural young adult proportions, not chibi.
```

## ミオ・笑顔

新ミオ通常を編集対象として使用。保存先 `DocRoot/images/mio-smile.png`。

```text
Use case: identity-preserve. Edit the supplied MIO reference into a NEW full-body smiling POSE VARIANT for the same Japanese coastal fantasy visual novel. Preserve her identity, short dark brown bob with rust-red hair ribbon, brown eyes, adult proportions about seven to seven-and-a-half heads tall, watercolor and fine textured pencil style, ivory kosode with pale wave design, muted sea-green wave-pattern haori, dark indigo hakama skirt, tabi and straw sandals, brass key at obi. Requested expressive change: warm visible gentle smile, lift one relaxed hand lightly toward the corner of her mouth, fingers naturally curved and not covering her smile; turn her torso and shoulders slightly to a three-quarter angle and give her head a tiny friendly tilt toward viewer, while maintaining eye contact. Other hand rests loosely near waist. A natural affectionate smiling gesture, subtle rather than theatrical, no exaggerated laugh. Redraw the WHOLE character for this pose, including sleeves, fabric folds, arms and silhouette. Do not merely patch facial pixels or keep hands together at waist. Keep the same overall standing scale, head size and ground baseline, complete figure from crown to sandal soles, canvas 1024x1536 portrait with centered figure inside middle 68% width; crown near y=15, soles near y=1520. No cropped elbows, fingers or feet. Genuine transparent alpha background. No scenery, floor, shadow, glow, gradient, text, watermark, duplicated limbs or extra fingers.
```

笑顔に合う仕草を付けるため、片手を軽く口元へ寄せ、体と肩を少し斜めに向けた全身差分を制作。袖・腕・衣服のひだ・輪郭もポーズに合わせて描き直す。生成画像全体を縦横比と透過を保って規格寸法へ整え、ゲームの `smile` 画像として差し替える。顔だけを合成した旧差分は置き換える。

## 朝霧の港

参照画像なし。保存先 `DocRoot/images/town-morning.jpg`。

```text
Use case illustration-story. Final background painting for a Japanese coastal fantasy visual novel, vertical 9:16 composition, no people, no text. Dawn mist over a small sheltered harbor named Shiomachi. Foreground broad worn stone steps descend toward water at low tide, a very small star-shaped tidal mark incised on one lower step, rope safety boundary higher on bank. Wooden Japanese houses with gray tiled roofs, small roadside tide shrine with paper shide and wooden message tags on the left, moored wooden sailing boats and fishing nets, distant stone-based Japanese timber beacon tower on headland across the inlet. Gentle real magical quality in pale gold mist, subtle not spectacular. Soft hand-painted watercolor, fine textured pencil outlines, muted sea greens, cream and warm browns, detailed charming lived-in setting. Upper half holds buildings, harbor and headland; lower quarter simple stone pavement and steps suitable behind a dialogue window. Natural perspective, no European village buildings, no cars, no electric fixtures, no modern ships. Portrait background at least 1422px tall.
```

## 夕暮れの入江と灯楼

参照画像なし。保存先 `DocRoot/images/lighthouse-dusk.jpg`。

```text
Use case illustration-story. Vertical 9:16 watercolor and pencil background painting for a gentle Japanese coastal fantasy visual novel. No people, no letters. Evening at the harbor of Shiomachi: wide stone quayside foreground, white rope marking waiting boundary, wooden baskets and mooring rope unobtrusively at edge, calm inlet reflecting amber lamps. A returning wooden sailing ship at middle distance entering safe harbor, tiled Japanese wooden village roofs on left, on rocky headland to right a tall traditional Japanese timber beacon tower on a stone foundation with open glazed lantern chamber and golden magical return beacon, turning mirror light softly reaching across subtle mist. Same world as a peaceful old Japanese fishing port, not a shrine battle or European lighthouse. Soft textured watercolor, fine pencil detail, warm cream twilight, indigo blue sea and muted sea green, dusky pink sky. Upper half includes beacon, ship and port so key landmarks remain visible above dialogue; lower quarter calm stone pavement. Natural grounded architecture, restrained magic, no electric lights or steamships. Portrait at least 1422px high.
```
